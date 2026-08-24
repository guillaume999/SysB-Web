import {
  MODES_GRATUITE,
  amorcageVide,
  type Amorcage,
  type ModeGratuite,
  type RegleGratuite,
  type RessourceDepart,
} from "@/lib/plateaux";
import { codeInconnu, type Ressource } from "@/lib/ressources";
import type { Tuile } from "@/lib/tuiles";

/**
 * Comment une partie démarre sur ce modèle de plateau.
 *
 * ⚠️ Ces réglages appartiennent au **modèle**, pas à la tuile. Décidé le
 * 2026-08-24 : une tuile est une entrée de catalogue générique, réutilisable par
 * plusieurs scénarios ; combien d'exemplaires sont offerts au démarrage est une
 * propriété du scénario. Le champ « Exemplaires offerts » a donc quitté le
 * formulaire des tuiles pour arriver ici.
 *
 * Deux mécanismes de dotation coexistent, et c'est voulu :
 *  - le **coffre d'une case**, dans l'onglet d'inspection — pour placer
 *    précisément quelque chose à un endroit précis ;
 *  - la **liste ci-dessous** — pour la dotation globale, sans avoir à aller
 *    cliquer une case.
 */
export default function AmorcageEditeur({
  amorcage,
  tuiles,
  ressources,
  onChange,
}: {
  amorcage: Amorcage | null;
  tuiles: Tuile[];
  ressources: Ressource[];
  onChange: (a: Amorcage) => void;
}) {
  const a = amorcage ?? amorcageVide();
  const dotation = a.ressources_depart ?? [];
  const regles = a.gratuites ?? [];

  const majDotation = (lignes: RessourceDepart[]) => onChange({ ...a, ressources_depart: lignes });
  const majRegles = (lignes: RegleGratuite[]) => onChange({ ...a, gratuites: lignes });

  const nomTuile = (tileId: number) =>
    tuiles.find((t) => t.tileId === tileId)?.nom ?? `tuile ${tileId}`;

  return (
    <div className="space-y-6">
      {/* ── La dotation de départ ─────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="label mb-0">Ressources de départ</p>
          <button
            type="button"
            className="text-xs text-accent hover:underline"
            onClick={() =>
              majDotation([...dotation, { ressource: ressources[0]?.code ?? "", quantite: 100 }])
            }
          >
            + ajouter
          </button>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Versées dans les <strong>entrepôts</strong> du plateau à sa création, en respectant leur
          capacité. Si le modèle n&apos;a aucun collecteur, la dotation n&apos;a nulle part où
          aller — le jeu le signale plutôt que de la faire disparaître.
        </p>

        {dotation.length === 0 ? (
          <p className="mt-1 text-xs text-slate-600">aucune</p>
        ) : (
          <div className="mt-2 space-y-2">
            {dotation.map((ligne, i) => {
              const inconnue = codeInconnu(ressources, ligne.ressource);
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    className="input h-9 w-40 py-1"
                    value={ligne.ressource}
                    onChange={(e) =>
                      majDotation(
                        dotation.map((l, k) =>
                          k === i ? { ...l, ressource: e.target.value } : l,
                        ),
                      )
                    }
                  >
                    {inconnue && (
                      <option value={ligne.ressource}>{ligne.ressource} (inconnue)</option>
                    )}
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
                    className="input h-9 w-28 py-1"
                    value={ligne.quantite}
                    onChange={(e) =>
                      majDotation(
                        dotation.map((l, k) =>
                          k === i ? { ...l, quantite: Number(e.target.value) } : l,
                        ),
                      )
                    }
                    aria-label="quantité"
                  />

                  <button
                    type="button"
                    className="ml-auto text-xs text-slate-500 hover:text-red-400"
                    onClick={() => majDotation(dotation.filter((_, k) => k !== i))}
                  >
                    retirer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Les règles de gratuité ────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="label mb-0">Bâtiments offerts</p>
          <button
            type="button"
            className="text-xs text-accent hover:underline"
            onClick={() =>
              majRegles([
                ...regles,
                { tileId: tuiles[0]?.tileId ?? 0, mode: "sous_minimum", min: 1, max: 0 },
              ])
            }
          >
            + ajouter
          </button>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Les trois modes ne diffèrent que sur <strong>une</strong> question : que se passe-t-il
          quand le joueur <em>détruit</em> un exemplaire offert ? Seule la <strong>pose</strong>
          {" "}est concernée — améliorer se paie toujours.
        </p>

        {regles.length === 0 ? (
          <p className="mt-1 text-xs text-slate-600">aucune</p>
        ) : (
          <div className="mt-2 space-y-3">
            {regles.map((regle, i) => {
              const maj = (patch: Partial<RegleGratuite>) =>
                majRegles(regles.map((r, k) => (k === i ? { ...r, ...patch } : r)));
              const mode = MODES_GRATUITE.find((m) => m.valeur === regle.mode);
              const orpheline = regle.tileId > 0 && !tuiles.some((t) => t.tileId === regle.tileId);

              return (
                <div key={i} className="rounded border border-edge p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="input h-9 w-52 py-1"
                      value={regle.tileId}
                      onChange={(e) => maj({ tileId: Number(e.target.value) })}
                    >
                      {/* Une tuile supprimée depuis la saisie doit rester visible :
                          la faire disparaître du menu changerait la règle en silence. */}
                      {orpheline && (
                        <option value={regle.tileId}>
                          {nomTuile(regle.tileId)} — supprimée du catalogue
                        </option>
                      )}
                      {tuiles.map((t) => (
                        <option key={t.id} value={t.tileId}>
                          {t.tileId} · {t.nom}
                        </option>
                      ))}
                    </select>

                    <select
                      className="input h-9 w-44 py-1"
                      value={regle.mode}
                      onChange={(e) => maj({ mode: e.target.value as ModeGratuite })}
                    >
                      {MODES_GRATUITE.map((m) => (
                        <option key={m.valeur} value={m.valeur}>
                          {m.libelle}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      offerts
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="input h-9 w-20 py-1"
                        value={regle.min}
                        onChange={(e) => maj({ min: Number(e.target.value) })}
                      />
                    </label>

                    {/* Le plafond n'existe que dans le mode qui en a un. L'afficher
                        partout laisserait croire qu'il agit ailleurs. */}
                    {regle.mode === "borne" && (
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        maximum
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="input h-9 w-20 py-1"
                          value={regle.max}
                          onChange={(e) => maj({ max: Number(e.target.value) })}
                        />
                      </label>
                    )}

                    <button
                      type="button"
                      className="ml-auto text-xs text-slate-500 hover:text-red-400"
                      onClick={() => majRegles(regles.filter((_, k) => k !== i))}
                    >
                      retirer
                    </button>
                  </div>

                  {mode && <p className="mt-1.5 text-[11px] text-slate-500">{mode.aide}</p>}

                  {regle.mode === "borne" && regle.max > 0 && regle.max < regle.min && (
                    <p className="mt-1 text-[11px] text-amber-400">
                      Le maximum ({regle.max}) est inférieur au nombre offert ({regle.min}) : la
                      pose sera interdite avant que la gratuité ait pu servir.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
