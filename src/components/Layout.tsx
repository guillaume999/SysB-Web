import { NavLink, useLocation, useNavigate } from "react-router-dom";
import IconeGenerique from "@/components/IconeGenerique";
import { accueil, ecransVisibles, type Lien } from "@/lib/acces";
import { useAuth } from "@/lib/auth";
import { libelleRole } from "@/lib/joueurs";
import { PB_URL } from "@/lib/pb";
import type { ReactNode } from "react";

/**
 * La barre latérale ne décide rien : elle affiche ce que `lib/acces.ts` donne
 * pour le rôle en cours. Un joueur connecté n'y voit que « Conception » — les
 * neuf écrans de contenu ne sont pas seulement masqués ici, leur route n'existe
 * pas non plus (voir `App.tsx`).
 *
 * Il n'y a plus d'écran générique piloté par un schéma : chaque collection a le
 * sien, taillé pour son contenu. Le schéma en dur et les écrans `CollectionPage`
 * / `RecordForm` / `JsonField` ont été retirés le 2026-08-22.
 */
const lienClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
    isActive ? "bg-accent/15 text-white" : "text-slate-300 hover:bg-ink hover:text-white"
  }`;

export default function Layout({ children }: { children: ReactNode }) {
  const { user, estAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { contenu, communaute, documents, compte } = ecransVisibles(estAdmin);
  const tous = [...contenu, ...communaute, ...documents, ...compte];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-edge bg-panel md:flex">
        <div className="border-b border-edge px-4 py-4">
          <NavLink to={accueil(estAdmin)} className="text-lg font-semibold text-white">
            SysB {estAdmin && <span className="text-slate-500">admin</span>}
          </NavLink>
          <p className="mt-1 truncate text-xs text-slate-500" title={PB_URL}>
            {PB_URL.replace(/^https?:\/\//, "")}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-0.5">
            {contenu.map((page) => (
              <NavLink key={page.to} to={page.to} className={lienClasses}>
                <IconeGenerique />
                {page.label}
              </NavLink>
            ))}
          </div>

          <Groupe titre="Communauté" liens={communaute} filet={contenu.length > 0} />

          {/*
            Depuis le 15/09 le joueur a deux groupes (Communauté, Documentation) :
            les titres séparent toujours quelque chose. Seul le filet au-dessus
            de « Communauté » disparaît quand il n'y a pas d'écran de contenu
            au-dessus.
          */}
          <Groupe titre="Documentation" liens={documents} filet />
          <Groupe titre="Compte" liens={compte} filet />
        </nav>

        <div className="border-t border-edge p-3 text-xs">
          {/* Le nom mène à « Mon compte » : c'est là qu'on le cherche d'instinct. */}
          <NavLink
            to="/compte"
            className="block truncate text-slate-300 hover:text-white"
            title={String(user?.email ?? "")}
          >
            {String(user?.pseudo || user?.email || "compte")}
          </NavLink>
          <p className="text-slate-500">
            rôle {libelleRole(user?.role ?? "")}
          </p>
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
        {/*
          ⚠️ LA BARRE LATÉRALE EST CACHÉE SOUS md — c'est cette bande-là qui la
          remplace sur téléphone. Depuis le 15/09 tout compte a plusieurs écrans
          (News, Forum, Conception) : le menu est pour tous, et la Déconnexion
          reste À CÔTÉ — sans elle, un joueur sur téléphone n'aurait aucun
          moyen de sortir.
        */}
        <div className="flex items-center gap-3 border-b border-edge bg-panel p-3 md:hidden">
          <select
            className="input min-w-0 flex-1"
            onChange={(e) => e.target.value && navigate(e.target.value)}
            value={tous.some((p) => p.to === pathname) ? pathname : ""}
            aria-label="Aller à"
          >
            <option value="">Aller à…</option>
            {tous.map((page) => (
              <option key={page.to} value={page.to}>
                {page.label}
              </option>
            ))}
          </select>
          <button
            className="shrink-0 text-xs text-slate-400 hover:text-red-400"
            title={String(user?.pseudo || user?.email || "compte")}
            onClick={() => {
              signOut();
              navigate("/");
            }}
          >
            Déconnexion
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}

/** Un groupe titré de la barre latérale, séparé du précédent par un filet. */
function Groupe({ titre, liens, filet }: { titre: string; liens: Lien[]; filet: boolean }) {
  if (liens.length === 0) return null;
  return (
    <div className={filet ? "mt-4 border-t border-edge pt-3" : ""}>
      <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">{titre}</p>
      <div className="space-y-0.5">
        {liens.map((page) => (
          <NavLink key={page.to} to={page.to} className={lienClasses}>
            <IconeGenerique />
            {page.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
