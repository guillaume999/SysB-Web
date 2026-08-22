import {
  MODES_COUT,
  type LigneCout,
  type LigneFlux,
  type LigneInstant,
  type ModeCout,
} from "@/lib/tuiles";
import { codeInconnu, type Ressource } from "@/lib/ressources";

/**
 * Éditeur d'une liste de lignes { ressource, quantité, … }.
 *
 * Les trois variantes du catalogue (coût, flux périodique, versement immédiat)
 * partagent la même mécanique : une ressource choisie **dans une liste**, jamais
 * tapée, plus une quantité. Elles ne diffèrent que par les colonnes en plus.
 * Un seul composant, donc, plutôt que trois qui divergeraient au premier
 * changement.
 */
export type VarianteLigne = "cout" | "flux" | "instant";

type Ligne = LigneCout | LigneFlux | LigneInstant;

function ligneVide(variante: VarianteLigne, code: string): Ligne {
  if (variante === "cout") return { ressource: code, quantite: 1, mode: "consomme" };
  if (variante === "flux") return { ressource: code, quantite: 1, periode_s: 60 };
  return { ressource: code, quantite: 1 };
}

export default function TuileLignes({
  titre,
  aide,
  variante,
  lignes,
  ressources,
  onChange,
}: {
  titre: string;
  aide?: string;
  variante: VarianteLigne;
  lignes: Ligne[];
  ressources: Ressource[];
  onChange: (lignes: Ligne[]) => void;
}) {
  const majLigne = (index: number, patch: Partial<LigneCout & LigneFlux>) =>
    onChange(lignes.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const retirer = (index: number) => onChange(lignes.filter((_, i) => i !== index));

  const ajouter = () => {
    // Pré-remplir avec la première ressource évite une ligne à ressource vide
    // que PocketBase accepterait et que le jeu ne saurait pas interpréter.
    const premier = ressources[0]?.code ?? "";
    onChange([...lignes, ligneVide(variante, premier)]);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="label mb-0">{titre}</p>
        <button type="button" className="text-xs text-accent hover:underline" onClick={ajouter}>
          + ajouter
        </button>
      </div>
      {aide && <p className="mt-0.5 text-[11px] text-slate-500">{aide}</p>}

      {lignes.length === 0 ? (
        <p className="mt-1 text-xs text-slate-600">aucune</p>
      ) : (
        <div className="mt-2 space-y-2">
          {lignes.map((ligne, index) => {
            const cout = variante === "cout" ? (ligne as LigneCout) : null;
            const flux = variante === "flux" ? (ligne as LigneFlux) : null;
            const inconnue = codeInconnu(ressources, ligne.ressource);
            return (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  className="input h-9 w-40 py-1"
                  value={ligne.ressource}
                  onChange={(e) => majLigne(index, { ressource: e.target.value })}
                >
                  {inconnue && <option value={ligne.ressource}>{ligne.ressource} (inconnue)</option>}
                  {ressources.map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.nom}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={0}
                  step={1}
                  className="input h-9 w-24 py-1"
                  value={ligne.quantite}
                  onChange={(e) => majLigne(index, { quantite: Number(e.target.value) })}
                  aria-label="quantité"
                />

                {flux && (
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    toutes les
                    <input
                      type="number"
                      min={1}
                      step={1}
                      className="input h-9 w-20 py-1"
                      value={flux.periode_s}
                      onChange={(e) => majLigne(index, { periode_s: Number(e.target.value) })}
                    />
                    s
                  </label>
                )}

                {cout && (
                  <>
                    <select
                      className="input h-9 w-32 py-1"
                      value={cout.mode}
                      onChange={(e) => majLigne(index, { mode: e.target.value as ModeCout })}
                      title={MODES_COUT.find((m) => m.valeur === cout.mode)?.aide}
                    >
                      {MODES_COUT.map((m) => (
                        <option key={m.valeur} value={m.valeur}>
                          {m.libelle}
                        </option>
                      ))}
                    </select>

                    {/* La libération n'a de sens que pour ce qui est mobilisé. */}
                    {cout.mode === "occupe" && (
                      <label className="flex items-center gap-1 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          checked={cout.libere_si_inactif ?? true}
                          onChange={(e) => majLigne(index, { libere_si_inactif: e.target.checked })}
                        />
                        libéré si le bâtiment est éteint
                      </label>
                    )}
                  </>
                )}

                <button
                  type="button"
                  className="ml-auto text-xs text-slate-500 hover:text-red-400"
                  onClick={() => retirer(index)}
                >
                  retirer
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
