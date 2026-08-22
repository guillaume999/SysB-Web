import { useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import TuileLignes from "@/components/TuileLignes";
import {
  TYPES_PREREQUIS,
  formatDuree,
  niveauVide,
  prerequisVide,
  type LigneCout,
  type LigneFlux,
  type LigneInstant,
  type Niveau,
  type Prerequis,
  type Tuile,
  type TypePrerequis,
} from "@/lib/tuiles";
import type { Ressource } from "@/lib/ressources";

/**
 * Éditeur des niveaux d'une tuile.
 *
 * Un seul palier est affiché à la fois — un onglet par niveau. Afficher les
 * quatre listes de trois niveaux d'un coup rendrait la fenêtre illisible, et
 * l'admin ne travaille de toute façon que sur un palier à la fois.
 *
 * « Dupliquer le précédent » n'est pas un confort : sans lui, chaque palier
 * demande de retaper six lignes qui ne changent que par leurs quantités.
 */
export default function TuileNiveaux({
  niveaux,
  ressources,
  tuiles,
  onChange,
}: {
  niveaux: Niveau[];
  ressources: Ressource[];
  tuiles: Tuile[];
  onChange: (niveaux: Niveau[]) => void;
}) {
  const [actif, setActif] = useState(0);
  const index = Math.min(actif, niveaux.length - 1);
  const niveau = niveaux[index];

  const majNiveau = (patch: Partial<Niveau>) =>
    onChange(niveaux.map((n, i) => (i === index ? { ...n, ...patch } : n)));

  const majProduction = (patch: Partial<Niveau["production"]>) =>
    majNiveau({ production: { ...niveau.production, ...patch } });

  /** Renumérote après ajout ou retrait : la position et le champ restent d'accord. */
  const renumeroter = (liste: Niveau[]) => liste.map((n, i) => ({ ...n, niveau: i + 1 }));

  const ajouter = (copier: boolean) => {
    const source = copier ? niveaux[niveaux.length - 1] : null;
    const nouveau: Niveau = source
      ? JSON.parse(JSON.stringify({ ...source, niveau: niveaux.length + 1 }))
      : niveauVide(niveaux.length + 1);
    onChange(renumeroter([...niveaux, nouveau]));
    setActif(niveaux.length);
  };

  const retirer = () => {
    if (niveaux.length <= 1) return;
    onChange(renumeroter(niveaux.filter((_, i) => i !== index)));
    setActif(Math.max(0, index - 1));
  };

  const majPrerequis = (i: number, patch: Partial<Prerequis>) =>
    majNiveau({ prerequis: niveau.prerequis.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border border-edge">
          {niveaux.map((n, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActif(i)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                i === index ? "bg-accent/20 text-white" : "text-slate-400 hover:bg-ink"
              }`}
            >
              niveau {n.niveau}
            </button>
          ))}
        </div>
        <button type="button" className="text-xs text-accent hover:underline" onClick={() => ajouter(false)}>
          + vierge
        </button>
        <button type="button" className="text-xs text-accent hover:underline" onClick={() => ajouter(true)}>
          + dupliquer le précédent
        </button>
        {niveaux.length > 1 && (
          <button
            type="button"
            className="ml-auto text-xs text-slate-500 hover:text-red-400"
            onClick={retirer}
          >
            retirer le niveau {niveau.niveau}
          </button>
        )}
      </div>

      <Aide titre="Ce que porte un niveau">
        <Terme nom="niveau 1">
          Ce que le joueur construit. Les paliers suivants sont les améliorations : chacun a son
          propre coût et sa propre production, et remplace le précédent.
        </Terme>
        <Terme nom="durée de construction">
          Le temps d'attente avant que le bâtiment devienne actif. 0 = immédiat.
        </Terme>
        <Terme nom="coût, consommé">Payé et perdu au moment de construire.</Terme>
        <Terme nom="coût, occupé">
          Mobilisé <strong>tant que le bâtiment vit</strong>, et rendu s'il est détruit. C'est le
          cas normal de la population : trois habitants travaillent ici et ne sont plus disponibles
          ailleurs. La case à cocher dit si un bâtiment <strong>éteint</strong> les rend aussi.
        </Terme>
        <Terme nom="coût, requis">
          Vérifié mais pas prélevé. « Il faut 100 habitants dans l'empire », sans les dépenser.
        </Terme>
        <Terme nom="prérequis">
          Ce qui n'est pas une ressource : un niveau de joueur, ou une autre tuile déjà posée.
        </Terme>
        <Terme nom="production périodique">
          La quantité produite à chaque période. On écrit « 2 toutes les 120 s » plutôt qu'un taux à
          virgule : le calcul hors ligne reste en nombres entiers, sans dérive d'arrondi sur douze
          heures.
        </Terme>
        <Terme nom="consommation périodique">
          Les intrants. Un abattoir consomme du bovin pour produire de la viande ; sans intrant
          disponible, il ne produit pas.
        </Terme>
        <Terme nom="versement immédiat">Versé une seule fois, à la construction.</Terme>
        <Terme nom="stock local maximum">
          Le coffre du bâtiment. Une fois plein, <strong>il s'arrête</strong> jusqu'à ce qu'un
          collecteur vienne le vider — c'est cette pression qui donne une raison d'exister aux
          entrepôts, et au joueur une raison de revenir. 0 = pas de plafond.
        </Terme>
      </Aide>

      <div className="mt-3 space-y-4 rounded border border-edge bg-ink/40 p-3">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Durée de construction
          <input
            type="number"
            min={0}
            step={1}
            className="input h-9 w-24 py-1"
            value={niveau.duree_construction_s}
            onChange={(e) => majNiveau({ duree_construction_s: Number(e.target.value) })}
          />
          s
          <span className="text-slate-600">({formatDuree(niveau.duree_construction_s)})</span>
        </label>

        <TuileLignes
          titre="Coût d'obtention"
          aide="consommé = payé et perdu · occupé = mobilisé tant que le bâtiment vit · requis = vérifié sans être prélevé"
          variante="cout"
          lignes={niveau.cout}
          ressources={ressources}
          onChange={(l) => majNiveau({ cout: l as LigneCout[] })}
        />

        {/* Ce qui n'est pas une ressource : niveau du joueur, tuile déjà posée. */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="label mb-0">Prérequis</p>
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() =>
                majNiveau({ prerequis: [...niveau.prerequis, prerequisVide("niveau_joueur")] })
              }
            >
              + ajouter
            </button>
          </div>
          {niveau.prerequis.length === 0 ? (
            <p className="mt-1 text-xs text-slate-600">aucun</p>
          ) : (
            <div className="mt-2 space-y-2">
              {niveau.prerequis.map((p, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    className="input h-9 w-48 py-1"
                    value={p.type}
                    onChange={(e) =>
                      majNiveau({
                        prerequis: niveau.prerequis.map((q, j) =>
                          j === i ? prerequisVide(e.target.value as TypePrerequis) : q,
                        ),
                      })
                    }
                  >
                    {TYPES_PREREQUIS.map((t) => (
                      <option key={t.valeur} value={t.valeur}>
                        {t.libelle}
                      </option>
                    ))}
                  </select>

                  {p.type === "niveau_joueur" && (
                    <input
                      type="number"
                      min={1}
                      step={1}
                      className="input h-9 w-20 py-1"
                      value={p.valeur ?? 1}
                      onChange={(e) => majPrerequis(i, { valeur: Number(e.target.value) })}
                      aria-label="niveau requis"
                    />
                  )}

                  {p.type === "tuile_possedee" && (
                    <>
                      <select
                        className="input h-9 w-52 py-1"
                        value={p.tileId ?? 0}
                        onChange={(e) => majPrerequis(i, { tileId: Number(e.target.value) })}
                      >
                        <option value={0}>— choisir une tuile —</option>
                        {tuiles.map((t) => (
                          <option key={t.id} value={t.tileId}>
                            #{t.tileId} {t.nom}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        au moins
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="input h-9 w-16 py-1"
                          value={p.min ?? 1}
                          onChange={(e) => majPrerequis(i, { min: Number(e.target.value) })}
                        />
                      </label>
                    </>
                  )}

                  <button
                    type="button"
                    className="ml-auto text-xs text-slate-500 hover:text-red-400"
                    onClick={() =>
                      majNiveau({ prerequis: niveau.prerequis.filter((_, j) => j !== i) })
                    }
                  >
                    retirer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <TuileLignes
          titre="Production périodique"
          variante="flux"
          lignes={niveau.production.periodique}
          ressources={ressources}
          onChange={(l) => majProduction({ periodique: l as LigneFlux[] })}
        />

        <TuileLignes
          titre="Consommation périodique"
          aide="les intrants : sans eux le bâtiment ne produit pas"
          variante="flux"
          lignes={niveau.production.consomme}
          ressources={ressources}
          onChange={(l) => majProduction({ consomme: l as LigneFlux[] })}
        />

        <TuileLignes
          titre="Versement immédiat"
          aide="versé une fois, à la construction"
          variante="instant"
          lignes={niveau.production.immediat}
          ressources={ressources}
          onChange={(l) => majProduction({ immediat: l as LigneInstant[] })}
        />

        <label className="flex items-center gap-2 text-xs text-slate-500">
          Stock local maximum
          <input
            type="number"
            min={0}
            step={1}
            className="input h-9 w-24 py-1"
            value={niveau.production.stock_max}
            onChange={(e) => majProduction({ stock_max: Number(e.target.value) })}
          />
          <span className="text-slate-600">
            0 = pas de plafond ; sinon le bâtiment s'arrête une fois plein, jusqu'à ce qu'un
            collecteur le vide.
          </span>
        </label>
      </div>
    </div>
  );
}
