import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/services/api";

export type BackendConnectionState = "checking" | "connected" | "offline";

interface BackendContextValue {
  connectionState: BackendConnectionState;
  latencyMs: number | null;
  lastCheckedAt: Date | null;
  refresh: () => void;
}

const BackendContext = createContext<BackendContextValue>({
  connectionState: "checking",
  latencyMs: null,
  lastCheckedAt: null,
  refresh: () => {},
});

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [connectionState, setConnectionState] = useState<BackendConnectionState>("checking");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    try {
      const t0 = Date.now();
      await api.devHealth();
      setLatencyMs(Date.now() - t0);
      setConnectionState("connected");
    } catch {
      setConnectionState("offline");
      setLatencyMs(null);
    } finally {
      setLastCheckedAt(new Date());
    }
  }, []);

  useEffect(() => {
    check();
    timerRef.current = setInterval(check, 15_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [check]);

  return (
    <BackendContext.Provider value={{ connectionState, latencyMs, lastCheckedAt, refresh: check }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  return useContext(BackendContext);
}
