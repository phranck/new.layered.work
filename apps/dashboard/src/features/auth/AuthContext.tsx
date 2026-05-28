import type { AdminUser, SetupInput } from "@layered/contracts";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as api from "../../lib/api";

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  needsSetup: boolean;
  error: string;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setup: (input: SetupInput) => Promise<void>;
  setUser: (user: AdminUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const currentUser = await api.me();
      setUser(currentUser);
      setNeedsSetup(false);
    } catch {
      setUser(null);
      try {
        const state = await api.authSetupState();
        setNeedsSetup(state.needsSetup);
      } catch (stateError) {
        setError(stateError instanceof Error ? stateError.message : "Authentication check failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (loginValue: string, password: string) => {
    const currentUser = await api.login({ login: loginValue, password });
    setUser(currentUser);
    setNeedsSetup(false);
  }, []);

  const setup = useCallback(async (input: SetupInput) => {
    const currentUser = await api.setup(input);
    setUser(currentUser);
    setNeedsSetup(false);
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setUser(null);
    setNeedsSetup(false);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, needsSetup, error, login, logout, refresh, setup, setUser }),
    [user, isLoading, needsSetup, error, login, logout, refresh, setup],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
