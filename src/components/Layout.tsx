import { NavLink, useNavigate } from "react-router-dom";
import IconeGenerique from "@/components/IconeGenerique";
import { accueil, ecransVisibles } from "@/lib/acces";
import { useAuth } from "@/lib/auth";
import { estConcepteur, usePartage } from "@/lib/partage";
import { libelleRole } from "@/lib/joueurs";
import { PB_URL } from "@/lib/pb";
import type { ReactNode } from "react";

/**
 * La barre latérale ne décide rien : elle affiche ce que `lib/acces.ts` donne
 * pour le rôle en cours. Un joueur connecté n'y voit que « Conception » — les
 * huit écrans de contenu ne sont pas seulement masqués ici, leur route n'existe
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
  const { portee } = usePartage();
  const navigate = useNavigate();
  const concepteur = estConcepteur(portee);
  const { contenu, documents } = ecransVisibles(estAdmin, concepteur);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-edge bg-panel md:flex">
        <div className="border-b border-edge px-4 py-4">
          <NavLink to={accueil(estAdmin, concepteur)} className="text-lg font-semibold text-white">
            SysB {estAdmin && <span className="text-slate-500">admin</span>}
            {concepteur && <span className="text-slate-500">conception</span>}
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

          {/*
            Le titre « Documentation » ne sert qu'à SÉPARER des écrans de
            contenu : sans eux — le cas du joueur — il n'a plus rien à séparer,
            et le filet au-dessus d'un seul lien ferait croire à une liste
            tronquée.
          */}
          <div className={contenu.length > 0 ? "mt-4 border-t border-edge pt-3" : ""}>
            {contenu.length > 0 && (
              <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                Documentation
              </p>
            )}
            <div className="space-y-0.5">
              {documents.map((page) => (
                <NavLink key={page.to} to={page.to} className={lienClasses}>
                  <IconeGenerique />
                  {page.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-edge p-3 text-xs">
          <p className="truncate text-slate-300" title={String(user?.email ?? "")}>
            {String(user?.pseudo || user?.email || "compte")}
          </p>
          <p className="text-slate-500">
            rôle {libelleRole(user?.role ?? "")}
            {concepteur &&
              ` · ${portee.modeles.length} modèle${portee.modeles.length > 1 ? "s" : ""} partagé${
                portee.modeles.length > 1 ? "s" : ""
              }`}
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
          remplace sur téléphone. Un menu « Aller à… » d'une seule entrée ne mène
          nulle part : pour le joueur on met à la place son nom et la sortie,
          sinon il n'aurait AUCUN moyen de se déconnecter depuis un téléphone —
          et c'est sur un téléphone qu'il lira ce document.
        */}
        <div className="flex items-center gap-3 border-b border-edge bg-panel p-3 md:hidden">
          {contenu.length > 0 ? (
            <select
              className="input"
              onChange={(e) => e.target.value && navigate(e.target.value)}
              defaultValue=""
            >
              <option value="">Aller à…</option>
              {[...contenu, ...documents].map((page) => (
                <option key={page.to} value={page.to}>
                  {page.label}
                </option>
              ))}
            </select>
          ) : (
            <>
              <p className="min-w-0 flex-1 truncate text-sm text-slate-300">
                <span className="font-semibold text-white">SysB</span>{" "}
                <span className="text-slate-500">
                  — {String(user?.pseudo || user?.email || "compte")}
                </span>
              </p>
              <button
                className="shrink-0 text-xs text-slate-400 hover:text-red-400"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
