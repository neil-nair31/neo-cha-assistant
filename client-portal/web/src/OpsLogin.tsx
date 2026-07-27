import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";

type StaffDemo = {
  email: string;
  password: string;
  name: string;
  port: string;
  role: string;
};

export function OpsLogin() {
  const { loginStaff, staff, client } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("desk.cochin@neologistics.demo");
  const [password, setPassword] = useState("neo-ops");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [demos, setDemos] = useState<StaffDemo[]>([]);

  useEffect(() => {
    if (staff) nav("/ops", { replace: true });
    if (client) nav("/dashboard", { replace: true });
  }, [staff, client, nav]);

  useEffect(() => {
    api<{ staff?: StaffDemo[] }>("/demo-accounts", { auth: false })
      .then((d) => setDemos(d.staff ?? []))
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginStaff(email.trim(), password);
      nav("/ops");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          Neo Logistics · internal
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-neo">Ops console sign-in</h1>
        <p className="mt-2 text-sm text-neo-700/70">
          For Cochin / Chennai desk staff only. Password:{" "}
          <code className="rounded bg-neo-50 px-1">neo-ops</code>
        </p>
      </div>
      <form onSubmit={onSubmit} className="panel space-y-4 border-amber-200 p-6">
        <div>
          <label className="label" htmlFor="ops-email">
            Neo desk email
          </label>
          <input
            id="ops-email"
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="ops-password">
            Password
          </label>
          <input
            id="ops-password"
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="btn-primary w-full bg-amber-700 hover:bg-amber-800" disabled={busy}>
          {busy ? "Signing in…" : "Sign in as Neo staff"}
        </button>
      </form>
      {demos.length > 0 && (
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neo-700/60">
            Tap a Neo desk account
          </p>
          <ul className="mt-2 space-y-2">
            {demos.map((d) => (
              <li key={d.email}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-neo-50 px-3 py-2 text-left text-sm hover:border-amber-500"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(d.password);
                  }}
                >
                  <span className="font-medium text-neo">{d.name}</span>
                  <span className="mt-0.5 block text-xs text-neo-700/60">
                    {d.port} · {d.email} · {d.password}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link to="/login" className="block text-center text-sm font-semibold text-neo-blue hover:underline">
        ← Client login instead
      </Link>
    </div>
  );
}
