// ============================================================
//  PartageJoueurs.tsx
//  L'ONGLET « PARTAGE » des fiches 3DmodelTuile et Icônes (15/09).
//
//  Deux choix : TOUS les joueurs, ou des joueurs NOMMÉS (cherchés par pseudo
//  ou email). Rien n'est écrit ici — la fiche enregistre tout d'un coup avec
//  son bouton, comme le reste du formulaire.
//
//  ⚠️ « Tous les joueurs » = le champ `toutes_planetes`. Ce n'est pas un
//  raccourci d'affichage : c'est le même droit (chaque joueur a sa planète),
//  et le panneau Planète de l'onglet Modèles le montre « à toutes ».
//
//  ⚠️ Décocher « tous » GARDE la liste nommée : on peut ouvrir à tout le monde
//  le temps d'un essai, puis revenir à la liste d'avant sans la retaper.
//
//  ⚠️ CE PANNEAU NE PROTÈGE RIEN : le refus vit dans le serveur Go
//  (`routes.AutoriseeSur`) et dans les règles d'API PocketBase.
// ============================================================

import { useMemo, useState } from "react";
import type { Joueur } from "@/lib/joueurs";
import { avecJoueur, chercherJoueurs, nomJoueur } from "@/lib/partageJoueurs";

export type ValeurPartage = { toutes_planetes: boolean; joueurs_autorises: string[] };

export default function PartageJoueurs({
  valeur,
  onChange,
  joueurs,
  chargement,
  planetesAutorisees = 0,
  objet,
}: {
  valeur: ValeurPartage;
  onChange: (v: ValeurPartage) => void;
  joueurs: Joueur[];
  chargement?: boolean;
  /** Combien de planètes l'ouvrent déjà par le panneau Planète — pour le dire. */
  planetesAutorisees?: number;
  /** « ce modèle 3D », « cette icône » — pour les phrases. */
  objet: string;
}) {
  const [recherche, setRecherche] = useState("");
  const tous = valeur.toutes_planetes;
  const choisis = valeur.joueurs_autorises;

  const trouves = useMemo(() => chercherJoueurs(joueurs, recherche), [joueurs, recherche]);
  const inconnus = choisis.filter((id) => !joueurs.some((j) => j.id === id));

  const basculer = (id: string, ouvert: boolean) =>
    onChange({ ...valeur, joueurs_autorises: avecJoueur(choisis, id, ouvert) });

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="label mb-1">Qui peut utiliser {objet} ?</legend>
        <label className="flex items-start gap-2 text-sm text-slate-200">
          <input
            type="radio"
            name="partage-portee"
            className="mt-1"
            checked={tous}
            onChange={() => onChange({ ...valeur, toutes_planetes: true })}
          />
          <span>
            Tous les joueurs
            <span className="block text-xs text-slate-500">
              Y compris ceux qui s'inscriront plus tard.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-200">
          <input
            type="radio"
            name="partage-portee"
            className="mt-1"
            checked={!tous}
            onChange={() => onChange({ ...valeur, toutes_planetes: false })}
          />
          <span>
            Seulement les joueurs choisis{" "}
            <span className="text-xs text-slate-500">({choisis.length})</span>
            <span className="block text-xs text-slate-500">
              Personne de coché = réservé aux planètes du jeu (Terre, Jupiter…), qui ont tout.
            </span>
          </span>
        </label>
      </fieldset>

      <div className={tous ? "pointer-events-none opacity-40" : ""} aria-disabled={tous}>
        {choisis.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {choisis.map((id) => {
              const j = joueurs.find((x) => x.id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full border border-edge bg-ink/60 px-2 py-0.5 text-xs text-slate-200"
                >
                  {j ? nomJoueur(j) : <em className="text-slate-500">compte supprimé</em>}
                  <button
                    type="button"
                    className="text-slate-500 hover:text-red-300"
                    aria-label="Retirer"
                    onClick={() => basculer(id, false)}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <input
          className="input"
          placeholder="Chercher un joueur (pseudo ou email)…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          disabled={tous}
        />
        <ul className="mt-2 max-h-64 divide-y divide-edge overflow-y-auto rounded border border-edge">
          {chargement && <li className="px-3 py-2 text-xs text-slate-500">Chargement des joueurs…</li>}
          {!chargement && trouves.length === 0 && (
            <li className="px-3 py-2 text-xs text-slate-500">
              {joueurs.length === 0 ? "Aucun compte joueur." : "Aucun joueur ne correspond."}
            </li>
          )}
          {trouves.map((j) => (
            <li key={j.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-ink/40">
                <input
                  type="checkbox"
                  checked={choisis.includes(j.id)}
                  disabled={tous}
                  onChange={(e) => basculer(j.id, e.target.checked)}
                />
                <span className="truncate text-slate-200">{nomJoueur(j)}</span>
                {j.pseudo?.trim() && <span className="truncate text-xs text-slate-500">{j.email}</span>}
                {j.role === "admin" && (
                  <span className="ml-auto rounded border border-edge px-1 text-[10px] uppercase text-slate-500">
                    admin
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
        {inconnus.length > 0 && (
          <p className="mt-2 text-xs text-amber-300">
            {inconnus.length} compte{inconnus.length > 1 ? "s" : ""} de la liste n'existe
            {inconnus.length > 1 ? "nt" : ""} plus — retire-le{inconnus.length > 1 ? "s" : ""} avec ×.
          </p>
        )}
      </div>

      {planetesAutorisees > 0 && (
        <p className="text-xs text-slate-500">
          Aussi ouvert à {planetesAutorisees} planète{planetesAutorisees > 1 ? "s" : ""} depuis le
          panneau Planète de l'onglet Modèles — ce réglage-là n'est pas modifié ici.
        </p>
      )}
    </div>
  );
}
