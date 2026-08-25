import Aide, { Terme } from "@/components/Aide";
import ChoixTuiles from "@/components/ChoixTuiles";
import {
  REGLES_A_TUILES,
  TYPES_REGLE,
  casesCouvertes,
  regleComplete,
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
 * Les tuiles citées se cochent dans une liste, jamais au clavier : un tileId
 * inventé ne se verrait qu'en jeu. Proximité, exclusion et support acceptent
 * **plusieurs** tuiles, au sens « n'importe laquelle d'entre elles ».
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
    onChange(
      regles.map((r, i) => {
        if (i !== index) return r;
        const vide = regleVide(type);
        // Passer de proximité à exclusion (ou l'inverse) garde les tuiles cochées
        // et le rayon : on change le sens, pas la cible.
        if (REGLES_A_TUILES.includes(type) && REGLES_A_TUILES.includes(r.regle)) {
          const gardee: ReglePlacement = { ...vide, tileIds: r.tileIds ?? [] };
          if (type !== "support" && r.rayon !== undefined) gardee.rayon = r.rayon;
          return gardee;
        }
        return vide;
      }),
    );

  const retirer = (index: number) => onChange(regles.filter((_, i) => i !== index));

  const nomTuile = (tileId: number) =>
    tuiles.find((t) => t.tileId === tileId)?.nom ?? `id ${tileId}`;

  /** « A », « B » ou « C » — la liste des tuiles cochées, lisible. */
  const enumerer = (ids: number[] | undefined, liaison: string) =>
    (ids ?? []).map((id) => `« ${nomTuile(id)} »`).join(` ${liaison} `);

  const portee = (r: ReglePlacement) =>
    r.rayon === null
      ? "sur tout le plateau"
      : `à ${r.rayon ?? 0} case${(r.rayon ?? 0) > 1 ? "s" : ""} ou moins`;

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
        Toutes les règles doivent être vraies en même temps.
      </p>

      <Aide titre="Les quatre types de règle, et le rayon">
        <Terme nom="proximité">
          Il faut au moins <em>N</em> tuiles à portée, parmi celles cochées — toutes confondues.
          « au moins 2 » avec un rayon de 3 et « Ferme » + « Verger » cochés se lit : deux fermes,
          ou deux vergers, ou une de chaque, dans les 36 cases autour.
        </Terme>
        <Terme nom="exclusion">
          L'inverse : <strong>aucune</strong> des tuiles cochées à portée. C'est ce qui empêche
          deux bâtiments de se gêner, ou une usine de s'installer contre les habitations.
        </Terme>
        <Terme nom="support">
          Ne regarde pas le voisinage mais <strong>la case elle-même</strong> : elle doit porter
          l'une des tuiles cochées. Sert à dire « seulement sur du sable ou de la terre ».
        </Terme>
        <Terme nom="limite">
          Nombre maximum d'exemplaires, par plateau ou dans tout l'empire. Pour les bâtiments
          uniques.
        </Terme>
        <Terme nom="rayon">
          Une distance <strong>hexagonale</strong>, pas un carré : la grille du jeu est en
          hexagones. <code>0</code> = la case elle-même, et « tout le plateau » veut dire qu'il n'y
          a pas de limite de distance. Un rayon <em>r</em> couvre 3r(r+1) cases, ce qui monte
          vite : 6 · 18 · 36 · 60 · 90. Les portées utiles restent donc petites.
        </Terme>
        <p className="text-slate-500">
          Cocher plusieurs tuiles veut toujours dire « n'importe laquelle ». Pour exiger deux
          tuiles différentes en même temps, faire deux règles. Une règle sans aucune tuile cochée
          est <strong>ignorée en jeu</strong> — elle se signale en orange ici. Chaque règle se
          relit en français juste en dessous d'elle : c'est là qu'une saisie malheureuse se voit.
        </p>
      </Aide>

      {regles.length === 0 ? (
        <p className="mt-1 text-xs text-slate-600">aucune — la tuile se pose n'importe où</p>
      ) : (
        <div className="mt-2 space-y-2">
          {regles.map((regle, index) => {
            const citeDesTuiles = REGLES_A_TUILES.includes(regle.regle);
            const incomplete = !regleComplete(regle);
            return (
              <div
                key={index}
                className={`rounded border p-2 ${
                  incomplete ? "border-amber-700/70 bg-amber-950/20" : "border-edge bg-ink/40"
                }`}
              >
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

                  {(regle.regle === "proximite" || regle.regle === "exclusion") && (
                    <>
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

                {citeDesTuiles && (
                  <div className="mt-2">
                    <p className="mb-1 text-[11px] text-slate-500">
                      {regle.regle === "support"
                        ? "La case doit porter l'une de ces tuiles :"
                        : regle.regle === "proximite"
                          ? "Comptées à portée, toutes confondues :"
                          : "Interdites à portée :"}
                    </p>
                    <ChoixTuiles
                      tuiles={citables}
                      choisies={regle.tileIds ?? []}
                      onChange={(tileIds) => maj(index, { tileIds })}
                    />
                  </div>
                )}

                {/* Relecture en français : c'est là qu'une règle mal saisie se voit. */}
                <p
                  className={`mt-1.5 text-[11px] leading-tight ${
                    incomplete ? "text-amber-400" : "text-slate-500"
                  }`}
                >
                  {incomplete && "Aucune tuile cochée — cette règle sera ignorée en jeu."}
                  {!incomplete &&
                    regle.regle === "proximite" &&
                    `Au moins ${regle.min ?? 1} ${enumerer(regle.tileIds, "ou")} ${portee(regle)}${
                      regle.rayon === null
                        ? ""
                        : ` (${casesCouvertes(regle.rayon ?? 0)} cases balayées)`
                    }.`}
                  {!incomplete &&
                    regle.regle === "exclusion" &&
                    `Aucune ${enumerer(regle.tileIds, "ni")} ${portee(regle)}.`}
                  {!incomplete &&
                    regle.regle === "support" &&
                    `La case doit porter ${enumerer(regle.tileIds, "ou")}.`}
                  {regle.regle === "limite" &&
                    `Au plus ${regle.max ?? 1} exemplaire${(regle.max ?? 1) > 1 ? "s" : ""} ${
                      regle.portee === "empire" ? "dans tout l'empire" : "par plateau"
                    }.`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
