import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { ECRANS_PUBLICS } from "@/lib/acces";

/**
 * Le cadre d'un visiteur NON CONNECTÉ (15/09) : une bande en haut avec les
 * écrans publics et « Se connecter ». Pas de barre latérale — il n'a que deux
 * pages, et c'est la même bande sur ordinateur et sur téléphone.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const lien = ({ isActive }: { isActive: boolean }) =>
    `rounded px-2.5 py-1.5 text-sm transition-colors ${
      isActive ? "bg-accent/15 text-white" : "text-slate-300 hover:bg-ink hover:text-white"
    }`;

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-2 border-b border-edge bg-panel px-3 py-2 sm:px-6">
        <NavLink to="/news" className="mr-2 text-lg font-semibold text-white">
          SysB
        </NavLink>
        <nav className="flex min-w-0 flex-1 gap-1">
          {ECRANS_PUBLICS.map((p) => (
            <NavLink key={p.to} to={p.to} className={lien}>
              {p.label}
            </NavLink>
          ))}
        </nav>
        {pathname !== "/connexion" && (
          <NavLink to="/connexion" className="btn-primary shrink-0">
            Se connecter
          </NavLink>
        )}
      </header>
      <main className="mx-auto max-w-4xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
