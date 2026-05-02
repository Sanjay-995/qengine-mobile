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
  AI_RESPONSES,
  ChatMessage,
  INITIAL_MESSAGES,
  SIMULATIONS,
  Simulation,
} from "@/constants/mockData";

interface SimulationContextValue {
  simulations: Simulation[];
  messages: ChatMessage[];
  isAiTyping: boolean;
  sendMessage: (text: string) => void;
  getSimulation: (id: string) => Simulation | undefined;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [simulations] = useState<Simulation[]>(SIMULATIONS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const msgIdRef = useRef(100);

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

  const pickAiResponse = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes("converg")) return AI_RESPONSES["converge"] ?? AI_RESPONSES["default"] ?? "";
    if (lower.includes("residual")) return AI_RESPONSES["residual"] ?? AI_RESPONSES["default"] ?? "";
    if (lower.includes("mesh")) return AI_RESPONSES["mesh"] ?? AI_RESPONSES["default"] ?? "";
    if (lower.includes("ahmed") || lower.includes("drag")) return AI_RESPONSES["ahmed"] ?? AI_RESPONSES["default"] ?? "";
    if (lower.includes("help") || lower.includes("what can")) return AI_RESPONSES["help"] ?? AI_RESPONSES["default"] ?? "";
    return AI_RESPONSES["default"] ?? "";
  };

  const sendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${++msgIdRef.current}`,
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    const delay = 1200 + Math.random() * 800;
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `msg_${++msgIdRef.current}`,
        role: "assistant",
        text: pickAiResponse(text),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsAiTyping(false);
    }, delay);
  }, []);

  return (
    <SimulationContext.Provider
      value={{ simulations, messages, isAiTyping, sendMessage, getSimulation }}
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
