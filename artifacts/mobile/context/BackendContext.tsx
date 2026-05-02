import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, type BackendStatus } from "@/services/api";

export type BackendConnectionState = "checking" | "connected" | "offline";

interface BackendContextValue {
  connectionState: BackendConnectionState;
  backendStatus: BackendStatus | null;
  latencyMs: number | null;
  lastCheckedAt: Date | null;
  refresh: () => void;
}

const BackendContext = createContext<BackendContextValue>({
  connectionState: "checking",
  backendStatus: null,
  latencyMs: null,
  lastCheckedAt: null,
  refresh: () => {},
});

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [connectionState, setConnectionState] = useState<BackendConnectionState>("checking");
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    try {
      const t0 = Date.now();
      await api.health();
      const ping = Date.now() - t0;
      setLatencyMs(ping);

      const status = await api.backendStatus();
      setBackendStatus(status);
      setConnectionState("connected");
    } catch {
      setConnectionState("offline");
      setBackendStatus(null);
    } finally {
      setLastCheckedAt(new Date());
    }
  }, []);

  useEffect(() => {
    check();
    timerRef.current = setInterval(check, 10_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [check]);

  return (
    <BackendContext.Provider value={{ connectionState, backendStatus, latencyMs, lastCheckedAt, refresh: check }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  return useContext(BackendContext);
}
