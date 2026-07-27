import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./auth";

export function Shell() {
  const { client, staff, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className={`border-b text-white ${staff ? "border-amber-900/40 bg-amber-950" : "border-neo-100/80 bg-neo-950"}`}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to={staff ? "/ops" : "/"} className="group">
            <p className="font-display text-xl font-bold tracking-tight">
              Neo{" "}
              <span className={staff ? "text-amber-300" : "text-neo-blue-accent"}>
                {staff ? "Ops Console" : "Client Portal"}
              </span>
            </p>
            <p className="text-xs text-white/55">
              {staff
                ? "Internal · update milestones · Cochin & Chennai"
                : "Cochin & Chennai · CHA · tracking · documents"}
            </p>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {!staff && (
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 ${isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white"}`
                }
                end
              >
                Track
              </NavLink>
            )}
            {client && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 ${isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white"}`
                }
              >
                My shipments
              </NavLink>
            )}
            {staff && (
              <NavLink
                to="/ops"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 ${isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white"}`
                }
                end
              >
                Desk board
              </NavLink>
            )}
            {!client && !staff && (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 ${isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white"}`
                  }
                >
                  Client login
                </NavLink>
                <NavLink
                  to="/ops/login"
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 ${
                      isActive ? "bg-amber-600 text-white" : "bg-amber-700/80 text-white hover:bg-amber-600"
                    }`
                  }
                >
                  Neo staff login
                </NavLink>
              </>
            )}
            {(client || staff) && (
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-white/70 hover:text-white"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
        {(client || staff) && (
          <div className={`border-t border-white/10 ${staff ? "bg-amber-900/80" : "bg-neo-900/80"}`}>
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-white/70">
              {client && (
                <span>
                  Client: <strong className="text-white">{client.contactName}</strong> · {client.company}
                </span>
              )}
              {staff && (
                <span>
                  Staff: <strong className="text-white">{staff.name}</strong> · {staff.port} desk
                </span>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-neo-100 py-8 text-center text-xs text-neo-700/60">
        Neo Logistics · Client Portal + Ops Console · Cochin & Chennai
      </footer>
    </div>
  );
}
