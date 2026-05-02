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
} from "@/constants/mockData";
import { api } from "@/services/api";
import { useBackend } from "@/context/BackendContext";

interface SimulationContextValue {
  simulations: Simulation[];
  messages: ChatMessage[];
  isAiTyping: boolean;
  sendMessage: (text: string) => void;
  getSimulation: (id: string) => Simulation | undefined;
  refreshSimulations: () => Promise<void>;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const { connectionState } = useBackend();
  const [simulations, setSimulations] = useState<Simulation[]>(SIMULATIONS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const msgIdRef = useRef(100);

  const refreshSimulations = useCallback(async () => {
    if (connectionState !== "connected") return;
    try {
      const { simulations: apiSims } = await api.listSimulations();
      setSimulations(apiSims as unknown as Simulation[]);
    } catch {
      // fall back silently — local state remains
    }
  }, [connectionState]);

  useEffect(() => {
    refreshSimulations();
  }, [refreshSimulations]);

  useEffect(() => {
    AsyncStorage.getItem("chat_messages").then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as ChatMessage[];
          if (parsed.length > 0) setMessages(parsed);
        } catch {
          // ignore
        }
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);

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
        const aiMsg: ChatMessage = {
          id: `msg_${++msgIdRef.current}`,
          role: "assistant",
          text: replyText,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsAiTyping(false);
      };

      if (connectionState === "connected") {
        api.aiChat(text)
          .then(({ reply }) => addReply(reply))
          .catch(() => addReply("I couldn't reach the AI backend. Please try again."));
      } else {
        const delay = 1200 + Math.random() * 800;
        setTimeout(() => {
          const lower = text.toLowerCase();
          let reply = "I'm monitoring your simulation workspace. What would you like to know?";
          if (lower.includes("converg")) reply = "Based on residual decay, I estimate convergence in ~380 more iterations.";
          else if (lower.includes("residual")) reply = "The residual is 2.3e-3 and decreasing. Target is 1e-5 — 2-3 orders of magnitude remaining.";
          else if (lower.includes("mesh")) reply = "Mesh topology is valid. Boundary layer y+ is within acceptable range for RANS k-ω SST.";
          addReply(reply);
        }, delay);
      }
    },
    [connectionState]
  );

  return (
    <SimulationContext.Provider
      value={{ simulations, messages, isAiTyping, sendMessage, getSimulation, refreshSimulations }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulations() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulations must be used within SimulationProvider");
  return ctx;
}
