import { useState } from "react";
import { couleurDe, type Tuile } from "@/lib/tuiles";

/**
 * Choix de plusieurs tuiles par cases à cocher.
 *
 * Remplace le `<select multiple>` qui exigeait Ctrl+clic pour cocher une
 * deuxième tuile — un geste que rien à l'écran ne suggère, et qui donnait
 * l'impression qu'on ne pouvait en choisir qu'une. Ici chaque tuile est une
 * ligne avec sa pastille de couleur ; cocher, c'est cliquer.
 *
 * Un filtre par nom apparaît dès que le catalogue dépasse une dizaine de
 * tuiles. Les tuiles cochées restent visibles même quand le filtre ne les
 * retient pas, pour qu'on ne perde jamais de vue ce qu'on a déjà choisi.
 */
export default function ChoixTuiles({
  tuiles,
  choisies,
  onChange,
  seuilFiltre = 10,
}: {
  /** Les tuiles proposées, dans l'ordre d'affichage. */
  tuiles: Tuile[];
  /** Les tileId cochés. */
  choisies: number[];
  onChange: (tileIds: number[]) => void;
  seuilFiltre?: number;
}) {
  const [filtre, setFiltre] = useState("");
  const avecFiltre = tuiles.length > seuilFiltre;
  const motif = filtre.trim().toLowerCase();

  const visibles = tuiles.filter(
    (t) =>
      motif === "" ||
      choisies.includes(t.tileId) ||
      t.nom.toLowerCase().includes(motif) ||
      String(t.tileId) === motif,
  );

  const basculer = (tileId: number, coche: boolean) => {
    const sans = choisies.filter((id) => id !== tileId);
    // L'ordre du catalogue est conservé : la phrase de relecture reste stable.
    const apres = coche ? [...sans, tileId] : sans;
    onChange(tuiles.map((t) => t.tileId).filter((id) => apres.includes(id)));
  };

  if (tuiles.length === 0) {
    return <p className="text-xs text-slate-600">aucune autre tuile dans le catalogue</p>;
  }

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center gap-2">
        {avecFiltre && (
          <input
            type="search"
            className="input h-8 w-48 py-1 text-xs"
            placeholder="filtrer par nom ou id"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
          />
        )}
        <span className="text-[11px] text-slate-500">
          {choisies.length === 0
            ? "aucune tuile cochée"
            : `${choisies.length} cochée${choisies.length > 1 ? "s" : ""}`}
        </span>
        {choisies.length > 0 && (
          <button
            type="button"
            className="text-[11px] text-slate-500 hover:text-white"
            onClick={() => onChange([])}
          >
            tout décocher
          </button>
        )}
      </div>

      <div className="grid max-h-44 grid-cols-1 gap-x-3 overflow-y-auto rounded border border-edge bg-ink p-1.5 sm:grid-cols-2">
        {visibles.map((t) => {
          const coche = choisies.includes(t.tileId);
          return (
            <label
              key={t.id}
              className={`flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-panel ${
                coche ? "text-slate-100" : "text-slate-400"
              }`}
            >
              <input
                type="checkbox"
                checked={coche}
                onChange={(e) => basculer(t.tileId, e.target.checked)}
              />
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-sm border border-black/40"
                style={{ backgroundColor: couleurDe(t) }}
              />
              <span className="truncate">
                <span className="text-slate-500">#{t.tileId}</span> {t.nom}
              </span>
            </label>
          );
        })}
        {visibles.length === 0 && (
          <p className="px-1.5 py-1 text-xs text-slate-600">rien ne correspond à « {filtre} »</p>
        )}
      </div>
    </div>
  );
}
