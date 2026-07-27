import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  api,
  clearSession,
  getStoredClient,
  getStoredStaff,
  getToken,
  setClientSession,
  setStaffSession,
  type PortalClient,
  type PortalStaff,
} from "./api";

type AuthState = {
  client: PortalClient | null;
  staff: PortalStaff | null;
  token: string | null;
  loginClient: (email: string, password: string) => Promise<void>;
  loginStaff: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<PortalClient | null>(() => getStoredClient());
  const [staff, setStaff] = useState<PortalStaff | null>(() => getStoredStaff());
  const [token, setToken] = useState<string | null>(() => getToken());

  const value = useMemo<AuthState>(
    () => ({
      client,
      staff,
      token,
      async loginClient(email, password) {
        const data = await api<{ token: string; client: PortalClient }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
          auth: false,
        });
        setClientSession(data.token, data.client);
        setToken(data.token);
        setClient(data.client);
        setStaff(null);
      },
      async loginStaff(email, password) {
        const data = await api<{ token: string; staff: PortalStaff }>("/ops/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
          auth: false,
        });
        setStaffSession(data.token, data.staff);
        setToken(data.token);
        setStaff(data.staff);
        setClient(null);
      },
      async logout() {
        try {
          await api("/auth/logout", { method: "POST" });
        } catch {
          /* ignore */
        }
        clearSession();
        setToken(null);
        setClient(null);
        setStaff(null);
      },
    }),
    [client, staff, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
