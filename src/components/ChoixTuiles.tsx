import { useMemo, useState } from "react";
import { CASE_VIDE, couleurDe, type Tuile } from "@/lib/tuiles";

/**
 * Une liste de tuiles a cocher.
 *
 * ⚠️ **Des cases a cocher, jamais un `<select multiple>`.** Le multi-select
 * natif exige le Ctrl+clic, que rien n'indique a l'ecran : l'utilisateur croit
 * de bonne foi qu'il ne peut en choisir qu'une. C'est la lecon du 25/08, elle
 * a coute une refonte — ne pas y revenir.
 *
 * ⚠️ **La case vide est une entree comme une autre** (`tileId 0`). Avant la
 * remise a zero, les zeros etaient ecartes partout, ce qui rendait « seulement
 * sur une case vide » inexprimable.
 *
 * Au-dela de dix entrees, un champ de filtre apparait — mais **ce qui est coche
 * reste toujours visible**, sinon on ne sait plus ce qu'on a choisi.
 */
export default function ChoixTuiles({
  tuiles,
  choisies,
  onChange,
  avecCaseVide = false,
  vide,
}: {
  tuiles: Tuile[];
  choisies: number[];
  onChange: (tileIds: number[]) => void;
  /** Proposer « case vide » en tete de liste. */
  avecCaseVide?: boolean;
  /** Message quand le catalogue ne propose rien. */
  vide?: string;
}) {
  const [filtre, setFiltre] = useState("");

  const entrees = useMemo(() => {
    const liste = tuiles
      .map((t) => ({ tileId: t.tileId, nom: t.nom, couleur: couleurDe(t), estVide: false }))
      .sort((a, b) => a.tileId - b.tileId);
    return avecCaseVide
      ? [{ tileId: CASE_VIDE, nom: "case vide", couleur: "", estVide: true }, ...liste]
      : liste;
  }, [tuiles, avecCaseVide]);

  const q = filtre.trim().toLowerCase();
  const visibles = entrees.filter(
    (e) =>
      choisies.includes(e.tileId) ||
      q === "" ||
      e.nom.toLowerCase().includes(q) ||
      String(e.tileId) === q,
  );

  const basculer = (tileId: number, coche: boolean) =>
    onChange(
      coche
        ? Array.from(new Set([...choisies, tileId])).sort((a, b) => a - b)
        : choisies.filter((id) => id !== tileId),
    );

  if (entrees.length === 0) {
    return <p className="text-[11px] text-slate-500">{vide ?? "Aucune tuile a proposer."}</p>;
  }

  return (
    <div>
      {entrees.length > 10 && (
        <input
          className="input mb-1 h-8 w-full py-1 text-xs"
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          placeholder="filtrer par nom ou par id..."
        />
      )}

      <div className="max-h-48 overflow-y-auto rounded border border-edge bg-ink/40 p-1">
        {visibles.length === 0 && (
          <p className="p-1 text-[11px] text-slate-500">Rien ne correspond a ce filtre.</p>
        )}
        {visibles.map((e) => {
          const coche = choisies.includes(e.tileId);
          return (
            <label
              key={e.tileId}
              className={`flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-ink ${
                coche ? "text-slate-200" : "text-slate-400"
              }`}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-accent"
                checked={coche}
                onChange={(ev) => basculer(e.tileId, ev.target.checked)}
              />
              {/* La pastille : la meme couleur que dans l'editeur de plateaux. */}
              <span
                className={`h-3 w-3 shrink-0 rounded-sm border ${
                  e.estVide ? "border-dashed border-slate-600" : "border-edge"
                }`}
                style={e.estVide ? undefined : { background: e.couleur }}
              />
              <span className="font-mono text-[10px] text-slate-500">
                {e.estVide ? "—" : `#${e.tileId}`}
              </span>
              <span className={e.estVide ? "italic" : undefined}>{e.nom}</span>
            </label>
          );
        })}
      </div>

      <p className="mt-1 text-[11px] text-slate-500">
        {choisies.length === 0
          ? "aucune cochee"
          : `${choisies.length} cochee${choisies.length > 1 ? "s" : ""}`}
        {entrees.length > 10 && q === "" && " — tape pour filtrer, les cochees restent visibles"}
      </p>
    </div>
  );
}
