const TOKEN_KEY = "neo_portal_token";
const CLIENT_KEY = "neo_portal_client";
const STAFF_KEY = "neo_portal_staff";
const ROLE_KEY = "neo_portal_role";

export type PortalClient = {
  id: string;
  company: string;
  email: string;
  contactName: string;
  phone: string;
  ports: string[];
};

export type PortalStaff = {
  id: string;
  name: string;
  email: string;
  role: "ops" | "admin";
  port: string;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): "client" | "staff" | null {
  const r = localStorage.getItem(ROLE_KEY);
  return r === "client" || r === "staff" ? r : null;
}

export function setClientSession(token: string, client: PortalClient) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, "client");
  localStorage.setItem(CLIENT_KEY, JSON.stringify(client));
  localStorage.removeItem(STAFF_KEY);
}

export function setStaffSession(token: string, staff: PortalStaff) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, "staff");
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
  localStorage.removeItem(CLIENT_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CLIENT_KEY);
  localStorage.removeItem(STAFF_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getStoredClient(): PortalClient | null {
  const raw = localStorage.getItem(CLIENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalClient;
  } catch {
    return null;
  }
}

export function getStoredStaff(): PortalStaff | null {
  const raw = localStorage.getItem(STAFF_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalStaff;
  } catch {
    return null;
  }
}

export async function api<T>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(opts.headers);
  if (!headers.has("Content-Type") && opts.body) headers.set("Content-Type", "application/json");
  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`/api${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}
