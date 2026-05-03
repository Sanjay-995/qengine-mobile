// Real dev backend
export const REAL_API_BASE = "https://api.dev.demo.qengine.ai/api/v1";
export const REAL_HEALTH_URL = "https://api.dev.demo.qengine.ai/health";

// Local API server (Replit, used only for BACKEND chip status)
const domain = process.env.EXPO_PUBLIC_DOMAIN;
export const LOCAL_API_BASE = domain ? `https://${domain}/api` : null;

type FetchOptions = {
  method?: string;
  body?: unknown;
  formBody?: string;
  token?: string | null;
  timeoutMs?: number;
};

async function apiFetch<T>(base: string, path: string, opts: FetchOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10000);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  if (opts.formBody) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (opts.body != null) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(`${base}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.formBody ?? (opts.body != null ? JSON.stringify(opts.body) : undefined),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let detail = text;
      try { detail = JSON.parse(text).detail ?? text; } catch { /* */ }
      throw new Error(`HTTP ${res.status}: ${detail}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

const real = <T>(path: string, opts?: FetchOptions) => apiFetch<T>(REAL_API_BASE, path, opts);
const local = <T>(path: string, opts?: FetchOptions) => {
  if (!LOCAL_API_BASE) throw new Error("LOCAL_API_BASE not set");
  return apiFetch<T>(LOCAL_API_BASE, path, opts);
};

// ── Real backend types (matching entangle-backend schemas) ─────────────────────

export interface BackendUser {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export interface BackendSimulationRun {
  id: number;
  status: string;
  progress: number;
  result_data: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  project_id: number;
  current_step: number | null;
  last_checkpoint_step: number | null;
  resumed_count: number;
}

export interface BackendProject {
  id: number;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  owner_id: number;
  created_at: string;
  updated_at: string | null;
  simulation_runs: BackendSimulationRun[];
}

export interface BackendAIMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  patch: unknown | null;
  attachments: unknown[] | null;
  timestamp: string;
  project_id: number | null;
  run_id: number | null;
}

// Local backend status (our own API server)
export interface BackendStatus {
  connected: boolean;
  type: string;
  load: number;
  uptimeSec: number;
  version: string;
  cores: number;
  memoryMb: number;
}

// ── API surface ────────────────────────────────────────────────────────────────

export const api = {
  // ── Real backend ─────────────────────────────────────────────────────────────

  /** Check if the real dev backend is reachable */
  devHealth: async (): Promise<{ status: string }> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(REAL_HEALTH_URL, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json() as { status: string };
    } finally {
      clearTimeout(t);
    }
  },

  /** OAuth2 login — returns JWT access token */
  login: (username: string, password: string) =>
    real<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      formBody: new URLSearchParams({ username, password }).toString(),
      timeoutMs: 12000,
    }),

  /** Get current user info */
  me: (token: string) => real<BackendUser>("/auth/me", { token }),

  /** List all projects for the authenticated user */
  listProjects: (token: string) => real<BackendProject[]>("/projects/", { token }),

  /** Get a single project */
  getProject: (token: string, id: number) =>
    real<BackendProject>(`/projects/${id}`, { token }),

  /** Create a new project */
  createProject: (
    token: string,
    data: { name: string; description?: string; config: Record<string, unknown> }
  ) => real<BackendProject>("/projects/", { method: "POST", token, body: data }),

  /** Get AI chat messages for a project */
  getAIMessages: (token: string, projectId: number) =>
    real<BackendAIMessage[]>(`/ai/messages?project_id=${projectId}`, { token }),

  /** Send a message to the AI copilot and collect the full streamed response */
  aiChat: async (
    token: string,
    message: string,
    projectId?: number
  ): Promise<{ reply: string }> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch(`${REAL_API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, project_id: projectId ?? null }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const text = await res.text();
      // Try plain JSON first
      try {
        const j = JSON.parse(text) as Record<string, unknown>;
        const reply = (j.reply ?? j.content ?? j.message ?? text) as string;
        return { reply };
      } catch { /* */ }
      // Parse SSE stream: "data: {...}\n"
      let content = "";
      for (const line of text.split("\n")) {
        const chunk = line.startsWith("data: ") ? line.slice(6).trim() : null;
        if (!chunk || chunk === "[DONE]") continue;
        try {
          const parsed = JSON.parse(chunk) as Record<string, unknown>;
          const delta = (parsed as { choices?: { delta?: { content?: string } }[] })
            .choices?.[0]?.delta?.content;
          if (delta) { content += delta; continue; }
          if (typeof parsed.content === "string") { content += parsed.content; continue; }
          if (typeof parsed.reply === "string") { content += parsed.reply; continue; }
        } catch { content += chunk; }
      }
      return { reply: content.trim() || text.trim() };
    } finally {
      clearTimeout(t);
    }
  },

  // ── Local API server (BACKEND chip status only) ───────────────────────────

  health: () => local<{ status: string }>("/healthz", { timeoutMs: 4000 }),

  backendStatus: () => local<BackendStatus>("/backend/status"),
};
