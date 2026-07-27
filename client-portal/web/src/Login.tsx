import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";

export function Login() {
  const { loginClient, client, staff } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("import@pearlchem.demo");
  const [password, setPassword] = useState("neo-demo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [demos, setDemos] = useState<Array<{ email: string; password: string; company: string }>>([]);

  useEffect(() => {
    if (client) nav("/dashboard", { replace: true });
    if (staff) nav("/ops", { replace: true });
  }, [client, staff, nav]);

  useEffect(() => {
    api<{ clients?: typeof demos; accounts?: typeof demos }>("/demo-accounts", { auth: false })
      .then((d) => setDemos(d.clients ?? d.accounts ?? []))
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginClient(email.trim(), password);
      nav("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neo-blue">Client access</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-neo">Sign in to your shipments</h1>
        <p className="mt-2 text-sm text-neo-700/70">
          Password for demo clients: <code className="rounded bg-neo-50 px-1">neo-demo</code>
        </p>
      </div>
      <form onSubmit={onSubmit} className="panel space-y-4 p-6">
        <div>
          <label className="label" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Signing in…" : "Client sign in"}
        </button>
      </form>
      {demos.length > 0 && (
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neo-700/60">
            Tap a demo client
          </p>
          <ul className="mt-2 space-y-2">
            {demos.map((d) => (
              <li key={d.email}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-neo-50 px-3 py-2 text-left text-sm hover:border-neo-blue"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(d.password);
                  }}
                >
                  <span className="font-medium text-neo">{d.company}</span>
                  <span className="mt-0.5 block text-xs text-neo-700/60">
                    {d.email} · {d.password}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="panel border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Neo employee?</p>
        <p className="mt-1">Use the Ops Console — separate login for Cochin / Chennai desk staff.</p>
        <Link to="/ops/login" className="mt-3 inline-flex font-semibold text-neo underline">
          Neo staff / Ops login →
        </Link>
      </div>
      <Link to="/" className="block text-center text-sm font-semibold text-neo-blue hover:underline">
        ← Back to public track
      </Link>
    </div>
  );
}
