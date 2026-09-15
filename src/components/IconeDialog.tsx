// ============================================================
//  IconeDialog.tsx
//  La fiche d'une icône — onglets Identité (nom, catégorie) et Partage.
//
//  ⚠️ Une icône PAS ENCORE DÉCLARÉE s'ouvre aussi : la fiche CRÉE son record
//  à l'enregistrement (`enregistrerIcone`). Le chemin, lui, ne se saisit pas :
//  il vient du fichier, et c'est ce que `Resources.Load` attendra.
// ============================================================

import { useEffect, useState } from "react";
import PartageJoueurs, { type ValeurPartage } from "@/components/PartageJoueurs";
import {
  CATEGORIES_ICONE,
  nomDeFichier,
  type LigneIcone,
  type ValeursIcone,
} from "@/lib/icones";
import type { Joueur } from "@/lib/joueurs";
import type { UsageIcone } from "@/lib/planetes";

type Onglet = "identite" | "partage";

export default function IconeDialog({
  ligne,
  joueurs,
  joueursChargement,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  ligne: LigneIcone;
  joueurs: Joueur[];
  joueursChargement?: boolean;
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (v: ValeursIcone) => void;
}) {
  const r = ligne.record;
  const [onglet, setOnglet] = useState<Onglet>("identite");
  const [nom, setNom] = useState(r?.nom ?? nomDeFichier(ligne.chemin));
  const [usage, setUsage] = useState<UsageIcone>(r?.usage ?? ligne.usageParDefaut);
  const [partage, setPartage] = useState<ValeurPartage>({
    toutes_planetes: r?.toutes_planetes === true,
    joueurs_autorises: r?.joueurs_autorises ?? [],
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    onSubmit({ nom, usage, ...partage });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form onSubmit={submit} className="card w-full max-w-xl p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          {ligne.url ? (
            <img src={ligne.url} alt="" className="h-14 w-14 shrink-0 rounded bg-ink/40" />
          ) : (
            <span className="h-14 w-14 shrink-0 rounded border border-dashed border-edge" />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">
              {r ? "Modifier l'icône" : "Déclarer l'icône"}
            </h2>
            <p className="break-all font-mono text-xs text-slate-400">{ligne.chemin}</p>
            {!r && (
              <p className="mt-1 text-xs text-amber-300">
                Pas encore en base : l'enregistrement la crée.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-1 border-b border-edge" role="tablist">
          {(
            [
              ["identite", "Identité"],
              ["partage", "Partage"],
            ] as const
          ).map(([id, libelle]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={onglet === id}
              onClick={() => setOnglet(id)}
              className={`-mb-px border-b-2 px-3 py-1.5 text-sm ${
                onglet === id
                  ? "border-accent text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {libelle}
              {id === "partage" && (
                <span className="ml-1.5 text-xs text-slate-500">
                  {partage.toutes_planetes ? "tous" : partage.joueurs_autorises.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-5" hidden={onglet !== "identite"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="icone-nom">
                Nom
              </label>
              <input
                id="icone-nom"
                className="input"
                value={nom}
                maxLength={100}
                onChange={(e) => setNom(e.target.value)}
                placeholder={nomDeFichier(ligne.chemin)}
              />
              <p className="mt-1 text-xs text-slate-500">
                Pour toi seulement — le jeu charge l'image par son chemin.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="icone-categorie">
                Catégorie
              </label>
              <select
                id="icone-categorie"
                className="input"
                value={usage}
                onChange={(e) => setUsage(e.target.value as UsageIcone)}
              >
                {CATEGORIES_ICONE.map((c) => (
                  <option key={c.valeur} value={c.valeur}>
                    {c.libelle}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Décide dans quelles listes l'icône est proposée (Planète : la fiche de planète).
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5" hidden={onglet !== "partage"}>
          <PartageJoueurs
            objet="cette icône"
            valeur={partage}
            onChange={setPartage}
            joueurs={joueurs}
            chargement={joueursChargement}
            planetesAutorisees={r?.planetes_autorisees?.length ?? 0}
          />
        </div>

        {erreur && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            {erreur}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : r ? "Enregistrer" : "Créer l'icône"}
          </button>
        </div>
      </form>
    </div>
  );
}
