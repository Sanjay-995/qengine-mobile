import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { api, type BackendUser } from "@/services/api";

interface AuthContextValue {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: BackendUser | null;
  token: string | null;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "qengine_jwt";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<BackendUser | null>(null);

  // On mount: restore stored JWT and validate it via /auth/me
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          const me = await api.me(stored);
          setToken(stored);
          setUser(me);
        }
      } catch {
        // Token invalid or expired — clear it
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(
    async (username: string, password: string): Promise<{ error?: string }> => {
      if (!username.trim()) return { error: "Username is required." };
      if (!password.trim()) return { error: "Password is required." };
      try {
        const { access_token } = await api.login(username.trim(), password);
        const me = await api.me(access_token);
        await AsyncStorage.setItem(TOKEN_KEY, access_token);
        setToken(access_token);
        setUser(me);
        return {};
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("401") || msg.includes("Incorrect")) {
          return { error: "Incorrect email, username or password." };
        }
        if (msg.includes("400") || msg.includes("Inactive")) {
          return { error: "This account is inactive." };
        }
        if (msg.includes("fetch") || msg.includes("abort") || msg.includes("network")) {
          return { error: "Could not reach the server. Check your connection." };
        }
        return { error: "Sign in failed. Please try again." };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!user,
        isLoading,
        user,
        token,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
