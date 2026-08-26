import { useState } from "react";
import { parAlphabet, type Ressource } from "@/lib/ressources";

/**
 * Une liste de ressources a cocher.
 *
 * ⚠️ **Aucune coche = TOUTES les ressources.** C'est la convention du stockage
 * et de l'approvisionnement, et elle est ecrite en toutes lettres a l'ecran :
 * une liste vide qui voudrait dire « rien » rendrait la regle inutile, ce qui
 * n'est jamais l'intention de celui qui la cree.
 *
 * Des cases a cocher, jamais un `<select multiple>` : le Ctrl+clic est
 * invisible et fait croire qu'on ne peut en choisir qu'une.
 */
export default function ChoixRessources({
  ressources,
  choisies,
  onChange,
}: {
  ressources: Ressource[];
  choisies: string[];
  onChange: (codes: string[]) => void;
}) {
  const [filtre, setFiltre] = useState("");
  const q = filtre.trim().toLowerCase();

  const visibles = parAlphabet(ressources).filter(
    (r) => choisies.includes(r.code) || q === "" || r.nom.toLowerCase().includes(q),
  );

  const basculer = (code: string, coche: boolean) =>
    onChange(coche ? [...choisies, code] : choisies.filter((c) => c !== code));

  if (ressources.length === 0) {
    return <p className="text-[11px] text-slate-500">Aucune ressource declaree.</p>;
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${
            choisies.length === 0
              ? "border-accent/40 text-accent"
              : "border-edge text-slate-500"
          }`}
        >
          {choisies.length === 0
            ? "toutes les ressources"
            : `${choisies.length} ressource${choisies.length > 1 ? "s" : ""}`}
        </span>
        {choisies.length > 0 && (
          <button
            type="button"
            className="text-xs text-accent hover:underline"
            onClick={() => onChange([])}
          >
            revenir a « toutes »
          </button>
        )}
        {ressources.length > 10 && (
          <input
            className="input h-7 w-40 py-0.5 text-xs"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            placeholder="filtrer..."
          />
        )}
      </div>

      <div className="max-h-40 overflow-y-auto rounded border border-edge bg-ink/40 p-1">
        {visibles.map((r) => {
          const coche = choisies.includes(r.code);
          return (
            <label
              key={r.id}
              className={`flex cursor-pointer items-center gap-2 rounded px-1.5 py-0.5 text-xs hover:bg-ink ${
                coche ? "text-slate-200" : "text-slate-400"
              }`}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-accent"
                checked={coche}
                onChange={(e) => basculer(r.code, e.target.checked)}
              />
              <span>{r.nom}</span>
              <span className="font-mono text-[10px] text-slate-600">{r.genre}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
