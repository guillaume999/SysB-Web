// ============================================================
//  Conception.tsx — les pièces communes aux écrans de conception (15/09) :
//  la bannière du joueur (sa planète, ce qu'il lui reste à créer), le choix de
//  planète de l'admin, et le choix d'icône du joueur.
// ============================================================

import { Vignette } from "@/components/Vignette";
import {
  etatQuota,
  planetesChoisissables,
  type CollectionConcue,
  type Portee,
} from "@/lib/conception";
import { autoriseeSur, estPlaneteGame, type Icone, type Planete, type UsageIcone } from "@/lib/planetes";

const MOTS: Record<CollectionConcue, string> = {
  tuiles: "tuiles",
  ressources: "ressources",
  technologies: "technologies",
};

/**
 * Pour un joueur : sur quelle planète il travaille, et combien il peut encore
 * créer. Rien pour l'admin.
 */
export function BandeauJoueur({
  portee,
  collection,
  deja,
  chargement,
}: {
  portee: Portee;
  collection?: CollectionConcue;
  deja?: number;
  chargement?: boolean;
}) {
  if (portee.admin || chargement) return null;
  if (!portee.planete)
    return (
      <p className="mb-4 rounded border border-amber-900/60 bg-amber-950/30 p-3 text-sm text-amber-200">
        Ta planète n'existe pas encore : le serveur la crée à l'inscription. Recharge la page dans
        un moment ; si elle n'apparaît toujours pas, préviens l'administrateur.
      </p>
    );
  const q = collection ? etatQuota(portee.limites, collection, deja ?? 0) : null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-edge bg-panel px-3 py-2 text-sm">
      <span className="text-slate-400">
        Planète <strong className="text-white">{portee.planete.nom}</strong>
      </span>
      {q && collection && (
        <span className={q.refus ? "text-amber-300" : "text-slate-400"}>
          {MOTS[collection]} : <strong className="tabular-nums">{q.deja}</strong> / {q.max}
          {q.refus ? ` — ${q.refus}` : ` (encore ${q.reste})`}
        </span>
      )}
    </div>
  );
}

/** Le choix de la planète d'un record — admin seulement. */
export function ChoixPlanete({
  planetes,
  valeur,
  onChange,
  id = "choix-planete",
  aide,
}: {
  planetes: Planete[];
  valeur: string;
  onChange: (id: string) => void;
  id?: string;
  aide?: string;
}) {
  const inconnue = valeur !== "" && !planetes.some((p) => p.id === valeur);
  return (
    <div>
      <label className="label" htmlFor={id}>
        Planète
      </label>
      <select id={id} className="input" value={valeur} onChange={(e) => onChange(e.target.value)}>
        <option value="">aucune — à ranger</option>
        {planetesChoisissables(planetes).map((p) => (
          <option key={p.id} value={p.id}>
            {p.nom}
            {estPlaneteGame(p) ? "" : " (joueur)"}
          </option>
        ))}
        {inconnue && <option value={valeur}>planète inconnue ({valeur})</option>}
      </select>
      <p className="mt-1 text-xs text-slate-500">
        {aide ??
          "Là où le serveur la fait jouer. « Game » = le contenu commun à toutes les planètes du jeu."}
      </p>
    </div>
  );
}

/**
 * Le choix d'icône d'un JOUEUR : seulement les icônes de la bonne catégorie
 * que l'administrateur a ouvertes à sa planète. Le chemin que lit Unity en est
 * recopié (`chemin_icone`).
 */
export function ChoixIconeJoueur({
  icones,
  planete,
  usage,
  valeur,
  onChange,
  id = "choix-icone",
}: {
  icones: Icone[];
  planete: Planete | null;
  usage: UsageIcone;
  valeur: string;
  onChange: (icone: Icone | null) => void;
  id?: string;
}) {
  const ouvertes = icones.filter((i) => i.usage === usage && autoriseeSur(i, planete));
  const choisie = icones.find((i) => i.id === valeur) ?? null;
  return (
    <div>
      <label className="label" htmlFor={id}>
        Vignette
      </label>
      <div className="flex items-center gap-3">
        <Vignette chemin={choisie?.chemin} alt="" taille={44} />
        <select
          id={id}
          className="input"
          value={valeur}
          onChange={(e) => onChange(icones.find((i) => i.id === e.target.value) ?? null)}
        >
          <option value="">aucune</option>
          {ouvertes.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nom?.trim() || i.chemin.slice(i.chemin.lastIndexOf("/") + 1)}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {ouvertes.length === 0
          ? "Aucune icône n'est ouverte à ta planète dans cette catégorie : c'est l'administrateur qui les partage."
          : `${ouvertes.length} icône(s) ouverte(s) à ta planète.`}
      </p>
    </div>
  );
}
