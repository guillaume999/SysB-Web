import {
  TYPES_REGLE,
  casesCouvertes,
  regleVide,
  type ReglePlacement,
  type Tuile,
  type TypeRegle,
} from "@/lib/tuiles";

/**
 * Éditeur des conditions de déploiement.
 *
 * Toutes les règles doivent être vraies : ET simple, pas de groupes OU. Le champ
 * `groupe` pourra être ajouté plus tard sans invalider une règle déjà saisie,
 * puisqu'une règle sans groupe se comportera exactement comme aujourd'hui.
 *
 * Les tuiles citées se choisissent dans une liste, jamais au clavier : un tileId
 * inventé ne se verrait qu'en jeu.
 */
export default function TuilePlacement({
  regles,
  tuiles,
  tuileCourante,
  onChange,
}: {
  regles: ReglePlacement[];
  /** Le catalogue, pour proposer les tuiles citables. */
  tuiles: Tuile[];
  /** Id de la tuile en cours d'édition, exclue de ses propres références. */
  tuileCourante: string | null;
  onChange: (regles: ReglePlacement[]) => void;
}) {
  const citables = tuiles.filter((t) => t.id !== tuileCourante);

  const maj = (index: number, patch: Partial<ReglePlacement>) =>
    onChange(regles.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const changerType = (index: number, type: TypeRegle) =>
    onChange(regles.map((r, i) => (i === index ? regleVide(type) : r)));

  const retirer = (index: number) => onChange(regles.filter((_, i) => i !== index));

  const nomTuile = (tileId?: number) =>
    tuiles.find((t) => t.tileId === tileId)?.nom ?? `id ${tileId}`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="label mb-0">Conditions de déploiement</p>
        <button
          type="button"
          className="text-xs text-accent hover:underline"
          onClick={() => onChange([...regles, regleVide("proximite")])}
        >
          + ajouter une règle
        </button>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Toutes les règles doivent être vraies. Les distances sont hexagonales : un rayon r couvre
        3r(r+1) cases.
      </p>

      {regles.length === 0 ? (
        <p className="mt-1 text-xs text-slate-600">aucune — la tuile se pose n'importe où</p>
      ) : (
        <div className="mt-2 space-y-2">
          {regles.map((regle, index) => (
            <div key={index} className="rounded border border-edge bg-ink/40 p-2">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="input h-9 w-36 py-1"
                  value={regle.regle}
                  onChange={(e) => changerType(index, e.target.value as TypeRegle)}
                  title={TYPES_REGLE.find((t) => t.valeur === regle.regle)?.aide}
                >
                  {TYPES_REGLE.map((t) => (
                    <option key={t.valeur} value={t.valeur}>
                      {t.libelle}
                    </option>
                  ))}
                </select>

                {(regle.regle === "proximite" || regle.regle === "exclusion") && (
                  <>
                    <select
                      className="input h-9 w-52 py-1"
                      value={regle.tileId ?? 0}
                      onChange={(e) => maj(index, { tileId: Number(e.target.value) })}
                    >
                      <option value={0}>— choisir une tuile —</option>
                      {citables.map((t) => (
                        <option key={t.id} value={t.tileId}>
                          #{t.tileId} {t.nom}
                        </option>
                      ))}
                    </select>

                    {regle.regle === "proximite" && (
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        au moins
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="input h-9 w-16 py-1"
                          value={regle.min ?? 1}
                          onChange={(e) => maj(index, { min: Number(e.target.value) })}
                        />
                      </label>
                    )}

                    {/* rayon null = tout le plateau. Zéro reste la case elle-même. */}
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      rayon
                      <input
                        type="number"
                        min={0}
                        step={1}
                        disabled={regle.rayon === null}
                        className="input h-9 w-16 py-1 disabled:opacity-40"
                        value={regle.rayon ?? 0}
                        onChange={(e) => maj(index, { rayon: Number(e.target.value) })}
                      />
                    </label>
                    <label className="flex items-center gap-1 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={regle.rayon === null}
                        onChange={(e) => maj(index, { rayon: e.target.checked ? null : 2 })}
                      />
                      tout le plateau
                    </label>
                  </>
                )}

                {regle.regle === "support" && (
                  <select
                    multiple
                    size={Math.min(5, Math.max(3, citables.length))}
                    className="input h-auto w-64 py-1"
                    value={(regle.tileIds ?? []).map(String)}
                    onChange={(e) =>
                      maj(index, {
                        tileIds: Array.from(e.target.selectedOptions, (o) => Number(o.value)),
                      })
                    }
                  >
                    {citables.map((t) => (
                      <option key={t.id} value={t.tileId}>
                        #{t.tileId} {t.nom}
                      </option>
                    ))}
                  </select>
                )}

                {regle.regle === "limite" && (
                  <>
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      au plus
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="input h-9 w-16 py-1"
                        value={regle.max ?? 1}
                        onChange={(e) => maj(index, { max: Number(e.target.value) })}
                      />
                    </label>
                    <select
                      className="input h-9 w-32 py-1"
                      value={regle.portee ?? "plateau"}
                      onChange={(e) =>
                        maj(index, { portee: e.target.value as "plateau" | "empire" })
                      }
                    >
                      <option value="plateau">par plateau</option>
                      <option value="empire">par empire</option>
                    </select>
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

              {/* Relecture en français : c'est là qu'une règle mal saisie se voit. */}
              <p className="mt-1.5 text-[11px] leading-tight text-slate-500">
                {regle.regle === "proximite" &&
                  `Au moins ${regle.min ?? 1} « ${nomTuile(regle.tileId)} » ${
                    regle.rayon === null
                      ? "sur le plateau"
                      : `à ${regle.rayon} case${(regle.rayon ?? 0) > 1 ? "s" : ""} ou moins (${casesCouvertes(regle.rayon ?? 0)} cases balayées)`
                  }.`}
                {regle.regle === "exclusion" &&
                  `Aucune « ${nomTuile(regle.tileId)} » ${
                    regle.rayon === null
                      ? "sur le plateau"
                      : `à ${regle.rayon} case${(regle.rayon ?? 0) > 1 ? "s" : ""} ou moins`
                  }.`}
                {regle.regle === "support" &&
                  (regle.tileIds?.length
                    ? `La case doit porter : ${regle.tileIds.map(nomTuile).join(", ")}.`
                    : "Aucun support choisi — la règle ne laissera rien passer.")}
                {regle.regle === "limite" &&
                  `Au plus ${regle.max ?? 1} exemplaire${(regle.max ?? 1) > 1 ? "s" : ""} ${
                    regle.portee === "empire" ? "dans tout l'empire" : "par plateau"
                  }.`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
