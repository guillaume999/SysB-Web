// ============================================================
//  Communaute.tsx
//  Les petites pièces partagées par les News et le Forum.
// ============================================================

import { useState, type ReactNode } from "react";

/**
 * Un bouton « Supprimer » qui se confirme EN PLACE (jamais `window.confirm`,
 * qui gèle l'automatisation Chrome — convention du site).
 */
export function SupprimerEnPlace({
  quoi,
  onConfirme,
  occupe,
}: {
  quoi: string;
  onConfirme: () => void;
  occupe?: boolean;
}) {
  const [demande, setDemande] = useState(false);
  if (!demande)
    return (
      <button type="button" className="text-xs text-slate-500 hover:text-red-400" onClick={() => setDemande(true)}>
        Supprimer
      </button>
    );
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs">
      <span className="text-red-300">Supprimer {quoi} ?</span>
      <button type="button" className="btn-danger px-2 py-0.5 text-xs" disabled={occupe} onClick={onConfirme}>
        {occupe ? "…" : "Oui, supprimer"}
      </button>
      <button type="button" className="text-slate-400 hover:text-white" onClick={() => setDemande(false)}>
        Annuler
      </button>
    </span>
  );
}

/**
 * Le texte d'un message du forum : du texte BRUT, retours à la ligne gardés.
 * Pas de Markdown ici — c'est un texte de joueur, et du texte brut ne peut
 * rien cacher (ni lien piégé, ni mise en page qui déborde).
 */
export function TexteBrut({ texte }: { texte: string }) {
  return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{texte}</p>;
}

export function Erreur({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300" role="alert">
      {children}
    </p>
  );
}

export function Pastille({ actif, children }: { actif: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] ${
        actif ? "bg-emerald-900/40 text-emerald-300" : "bg-slate-800 text-slate-400"
      }`}
    >
      {children}
    </span>
  );
}

/** Le cadre modal commun (Échap ferme). */
export function Fenetre({
  titre,
  onFermer,
  children,
}: {
  titre: string;
  onFermer: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8"
      onKeyDown={(e) => e.key === "Escape" && onFermer()}
    >
      <div className="card w-full max-w-2xl p-5 shadow-2xl" role="dialog" aria-label={titre}>
        <h2 className="text-lg font-semibold text-white">{titre}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
