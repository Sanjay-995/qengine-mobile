const domain = process.env.EXPO_PUBLIC_DOMAIN;
export const API_BASE = domain ? `https://${domain}/api` : null;

type FetchOptions = {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
};

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  if (!API_BASE) throw new Error("No API base URL — EXPO_PUBLIC_DOMAIN is not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 6000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export interface BackendStatus {
  connected: boolean;
  type: string;
  load: number;
  uptimeSec: number;
  version: string;
  cores: number;
  memoryMb: number;
}

export interface ApiSimulation {
  id: string;
  name: string;
  preset: string;
  type: "CFD" | "FEA";
  status: "running" | "converged" | "failed" | "queued";
  reynoldsNumber: number | null;
  iterations: number;
  maxIterations: number;
  residual: number | null;
  residualTarget: number;
  strouhalNumber: number | null;
  dragCoefficient: number | null;
  liftCoefficient: number | null;
  solver: string;
  gridSize: string;
  domainWidth: number | null;
  domainHeight: number | null;
  inletVelocity: number | null;
  startedAt: string | null;
  completedAt: string | null;
  computeTimeMin: number | null;
  validation: {
    meshTopology: boolean;
    boundaryConditions: boolean;
    cflStable: boolean;
    solverCompatible: boolean;
    memoryOk: boolean;
  } | null;
  residualHistory: number[];
  aiAnalysis: string | null;
}

export const api = {
  health: () => apiFetch<{ status: string }>("/healthz", { timeoutMs: 4000 }),

  backendStatus: () => apiFetch<BackendStatus>("/backend/status"),

  listSimulations: () =>
    apiFetch<{ simulations: ApiSimulation[]; total: number }>("/simulations"),

  getSimulation: (id: string) => apiFetch<ApiSimulation>(`/simulations/${id}`),

  createSimulation: (data: {
    name: string;
    type: string;
    solver: string;
    preset: string;
    maxIterations: number;
    inletVelocity: number;
    meshLX: number;
    meshLY: number;
  }) => apiFetch<ApiSimulation>("/simulations", { method: "POST", body: data }),

  patchSimulation: (id: string, data: Partial<ApiSimulation>) =>
    apiFetch<ApiSimulation>(`/simulations/${id}`, { method: "PATCH", body: data }),

  aiChat: (message: string) =>
    apiFetch<{ reply: string; timestamp: string }>("/ai/chat", {
      method: "POST",
      body: { message },
    }),
};
