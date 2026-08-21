import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { PB_URL } from "@/lib/pb";
import { COLLECTIONS } from "@/lib/schema";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-edge bg-panel md:flex">
        <div className="border-b border-edge px-4 py-4">
          <NavLink to="/" className="text-lg font-semibold text-white">
            SysB <span className="text-slate-500">admin</span>
          </NavLink>
          <p className="mt-1 truncate text-xs text-slate-500" title={PB_URL}>
            {PB_URL.replace(/^https?:\/\//, "")}
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {COLLECTIONS.map((collection) => (
            <NavLink
              key={collection.id}
              to={`/c/${collection.name}`}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-accent/15 text-white" : "text-slate-300 hover:bg-ink hover:text-white"
                }`
              }
            >
              {collection.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-edge p-3 text-xs">
          <p className="truncate text-slate-300" title={String(user?.email ?? "")}>
            {String(user?.pseudo || user?.email || "admin")}
          </p>
          <p className="text-slate-500">rôle admin</p>
          <button
            className="mt-2 text-slate-400 hover:text-red-400"
            onClick={() => {
              signOut();
              navigate("/");
            }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="border-b border-edge bg-panel p-3 md:hidden">
          <select
            className="input"
            onChange={(e) => e.target.value && navigate(`/c/${e.target.value}`)}
            defaultValue=""
          >
            <option value="">Choisir une collection…</option>
            {COLLECTIONS.map((collection) => (
              <option key={collection.id} value={collection.name}>
                {collection.label}
              </option>
            ))}
          </select>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
