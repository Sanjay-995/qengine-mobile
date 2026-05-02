import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextValue {
  isLoggedIn: boolean;
  isLoading: boolean;
  username: string;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "qengine_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val) as { username: string };
          setUsername(parsed.username);
          setIsLoggedIn(true);
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    });
  }, []);

  const signIn = useCallback(
    async (user: string, password: string): Promise<{ error?: string }> => {
      if (!user.trim()) return { error: "Username is required." };
      if (!password.trim()) return { error: "Password is required." };
      // Demo: accept any credentials
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ username: user.trim() }));
      setUsername(user.trim());
      setIsLoggedIn(true);
      return {};
    },
    []
  );

  const signOut = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY);
    setIsLoggedIn(false);
    setUsername("");
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, username, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
