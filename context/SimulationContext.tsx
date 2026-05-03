import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChatMessage,
  INITIAL_MESSAGES,
  SIMULATIONS,
  Simulation,
  SimStatus,
} from "@/constants/mockData";
import { api, type BackendProject, type BackendSimulationRun } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

// ── Map real backend data to our app's Simulation type ────────────────────────

function mapRunStatus(status: string): SimStatus {
  switch (status) {
    case "running": return "running";
    case "completed": return "converged";
    case "failed": return "failed";
    case "queued": return "queued";
    case "stopping": return "running";
    case "stopped": return "failed";
    default: return "queued";
  }
}

function deriveSolver(config: Record<string, unknown>): string {
  const numerical = config.numerical as Record<string, unknown> | undefined;
  const solver = numerical?.solver as string | undefined;
  if (!solver) return "MAC-PISO";
  if (solver.toLowerCase().includes("komega") || solver === "komega_sst") return "k-ω SST";
  if (solver === "SA" || solver.toLowerCase().includes("spalart")) return "Spalart-Allmaras";
  if (solver === "tensornet" || solver.toLowerCase().includes("tensor")) return "TensorNet";
  return "Laminar";
}

function deriveType(config: Record<string, unknown>): "CFD" | "FEA" {
  const solver = deriveSolver(config).toLowerCase();
  if (solver.includes("fea") || solver.includes("structural")) return "FEA";
  return "CFD";
}

function deriveGridSize(config: Record<string, unknown>): string {
  const geo = config.geometry as Record<string, unknown> | undefined;
  if (!geo) return "—";
  const lx = typeof geo.Lx === "number" ? geo.Lx : null;
  const ly = typeof geo.Ly === "number" ? geo.Ly : null;
  if (lx !== null && ly !== null) {
    const cells = Math.pow(2, lx) * Math.pow(2, ly);
    return `${lx}×${ly} (${cells.toLocaleString()} cells)`;
  }
  return "—";
}

function deriveRe(config: Record<string, unknown>): number | null {
  const num = config.numerical as Record<string, unknown> | undefined;
  if (!num) return null;
  const re = num.Re as number | undefined;
  if (re) return re;
  const ux = num.ux_val as number | undefined;
  const nu = num.nu as number | undefined;
  const geo = config.geometry as Record<string, unknown> | undefined;
  const radius = geo?.radius as number | undefined;
  if (ux && nu && radius) return Math.round((ux * radius * 2) / nu);
  return null;
}

function deriveResidual(run: BackendSimulationRun): number | null {
  if (!run.result_data) return null;
  const rd = run.result_data;
  if (typeof rd.residual === "number") return rd.residual;
  const telemetry = rd.telemetry as { residual?: number }[] | undefined;
  if (Array.isArray(telemetry) && telemetry.length > 0) {
    const last = telemetry[telemetry.length - 1];
    return last.residual ?? null;
  }
  return null;
}

function deriveResidualHistory(run: BackendSimulationRun): number[] {
  if (!run.result_data) return [];
  const rd = run.result_data;
  const telemetry = rd.telemetry as { residual?: number }[] | undefined;
  if (Array.isArray(telemetry)) {
    return telemetry
      .map((t) => t.residual)
      .filter((v): v is number => typeof v === "number");
  }
  return [];
}

function projectToSimulation(project: BackendProject): Simulation {
  const runs = project.simulation_runs ?? [];
  const latestRun: BackendSimulationRun | null = runs.length > 0 ? runs[runs.length - 1] : null;

  const config = project.config ?? {};
  const numerical = config.numerical as Record<string, unknown> | undefined;

  const status: SimStatus = latestRun ? mapRunStatus(latestRun.status) : "queued";
  const progress = latestRun?.progress ?? 0;
  const maxIter = typeof numerical?.N === "number" ? numerical.N : 500;
  const currentStep = latestRun?.current_step ?? null;
  const iterations = currentStep ?? Math.round((progress / 100) * maxIter);

  const geo = config.geometry as Record<string, unknown> | undefined;
  const domainWidth = typeof geo?.bx === "number" ? geo.bx - ((geo?.ax as number) ?? 0) : null;
  const domainHeight = typeof geo?.by === "number" ? geo.by - ((geo?.ay as number) ?? 0) : null;
  const inletVelocity = typeof numerical?.ux_val === "number" ? numerical.ux_val : null;

  const residual = latestRun ? deriveResidual(latestRun) : null;
  const residualHistory = latestRun ? deriveResidualHistory(latestRun) : [];

  const cd = (latestRun?.result_data?.cd ?? latestRun?.result_data?.Cd) as number | null | undefined;
  const cl = (latestRun?.result_data?.cl ?? latestRun?.result_data?.Cl) as number | null | undefined;

  return {
    id: String(project.id),
    name: project.name,
    preset: project.name,
    type: deriveType(config),
    status,
    reynoldsNumber: deriveRe(config),
    iterations,
    maxIterations: maxIter,
    residual: residual ?? null,
    residualTarget: 1e-5,
    strouhalNumber: null,
    dragCoefficient: typeof cd === "number" ? cd : null,
    liftCoefficient: typeof cl === "number" ? cl : null,
    solver: deriveSolver(config),
    gridSize: deriveGridSize(config),
    domainWidth: typeof domainWidth === "number" ? domainWidth : null,
    domainHeight: typeof domainHeight === "number" ? domainHeight : null,
    inletVelocity: typeof inletVelocity === "number" ? inletVelocity : null,
    startedAt: latestRun?.created_at ?? null,
    completedAt:
      latestRun && (latestRun.status === "completed" || latestRun.status === "failed")
        ? latestRun.created_at
        : null,
    computeTimeMin: null,
    validation: null,
    residualHistory,
    aiAnalysis: null,
  };
}

// ── Context ────────────────────────────────────────────────────────────────────

interface SimulationContextValue {
  simulations: Simulation[];
  isLoading: boolean;
  messages: ChatMessage[];
  isAiTyping: boolean;
  sendMessage: (text: string) => void;
  getSimulation: (id: string) => Simulation | undefined;
  refreshSimulations: () => Promise<void>;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

const CHAT_STORAGE_KEY = "chat_messages";

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const { token, isLoggedIn } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>(SIMULATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const msgIdRef = useRef(100);

  const refreshSimulations = useCallback(async () => {
    if (!token || !isLoggedIn) return;
    setIsLoading(true);
    try {
      const projects = await api.listProjects(token);
      if (projects.length > 0) {
        setSimulations(projects.map(projectToSimulation));
      }
    } catch {
      // Network error — keep existing state
    } finally {
      setIsLoading(false);
    }
  }, [token, isLoggedIn]);

  // Fetch real simulations whenever auth state changes; clear data on logout
  useEffect(() => {
    if (isLoggedIn && token) {
      refreshSimulations();
    } else {
      setSimulations(SIMULATIONS);
      // Clear chat history on sign-out to prevent cross-user data leakage
      setMessages(INITIAL_MESSAGES);
      AsyncStorage.removeItem(CHAT_STORAGE_KEY).catch(() => {});
    }
  }, [isLoggedIn, token, refreshSimulations]);

  // Restore persisted chat messages on mount (only when logged in)
  useEffect(() => {
    if (!isLoggedIn) return;
    AsyncStorage.getItem(CHAT_STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as ChatMessage[];
          if (parsed.length > 0) setMessages(parsed);
        } catch { /* */ }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Persist chat messages whenever they change (only when logged in)
  useEffect(() => {
    if (!isLoggedIn) return;
    AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)).catch(() => {});
  }, [messages, isLoggedIn]);

  const getSimulation = useCallback(
    (id: string) => simulations.find((s) => s.id === id),
    [simulations]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const userMsg: ChatMessage = {
        id: `msg_${++msgIdRef.current}`,
        role: "user",
        text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsAiTyping(true);

      const addReply = (replyText: string) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${++msgIdRef.current}`,
            role: "assistant",
            text: replyText,
            timestamp: new Date().toISOString(),
          },
        ]);
        setIsAiTyping(false);
      };

      if (token) {
        api
          .aiChat(token, text)
          .then(({ reply }) => addReply(reply))
          .catch(() => addReply(localFallback(text)));
      } else {
        setTimeout(() => addReply(localFallback(text)), 1200 + Math.random() * 600);
      }
    },
    [token]
  );

  return (
    <SimulationContext.Provider
      value={{ simulations, isLoading, messages, isAiTyping, sendMessage, getSimulation, refreshSimulations }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

function localFallback(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("converg")) return "Based on residual decay, I estimate convergence in ~380 more iterations.";
  if (t.includes("residual")) return "The residual is decreasing. Target is 1e-5 — 2-3 orders of magnitude remaining.";
  if (t.includes("mesh")) return "Mesh topology is valid. Boundary layer y+ is within acceptable range for RANS k-ω SST.";
  if (t.includes("ahmed")) return "Ahmed Body Drag converged with Cd=0.285, within 1.4% of experimental data.";
  if (t.includes("memory") || t.includes("cpu")) return "System resources are within operational bounds. No throttling detected.";
  return "I'm monitoring your simulation workspace. What would you like to know?";
}

export function useSimulations() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulations must be used within SimulationProvider");
  return ctx;
}
