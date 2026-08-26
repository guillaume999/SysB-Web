import Aide, { Terme } from "@/components/Aide";
import ChoixRessources from "@/components/ChoixRessources";
import ChoixTuiles from "@/components/ChoixTuiles";
import { estTransportable, libelleRessource, type Ressource } from "@/lib/ressources";
import {
  CIBLES_APPRO,
  SENS_APPRO,
  TOUTES_RESSOURCES,
  debitParPeriode,
  decrireAppro,
  estEntrepot,
  lignesNominatives,
  maxStocke,
  maxToutesRessources,
  regleApproUtile,
  regleApproVide,
  type CibleAppro,
  type Logistique,
  type SensAppro,
  type Tuile,
} from "@/lib/tuiles";

/**
 * Stockage et approvisionnement — **onglet cree le 2026-08-26**, a la demande de
 * l'utilisateur : *« on va faire un nouvel onglet, enleve l'approvisionnement de
 * l'onglet cout »*. Il avait d'abord ete greffe ligne par ligne dans les couts ;
 * c'etait le mauvais endroit, parce que l'entrepot ne consomme rien et n'aurait
 * donc eu aucune ligne ou se decrire.
 *
 * Trois exigences, mot pour mot :
 *
 *  · *« l'approvisionnement doit aller dans les 2 sens si necessaire (cas de
 *    l'entrepot) »* → chaque regle porte un SENS. Une tuile qui recoit ET
 *    fournit EST un entrepot ; le role ne se declare plus, il se deduit.
 *  · *« doit pouvoir etre pour toutes les ressources ou certaines »* → une
 *    liste de ressources par regle, **vide = toutes**.
 *  · *« un rayon de recolte ou d'envoi […] un nombre de navettes par periodes
 *    et une quantite sur les navettes »* → rayon par regle, et un debit ecrit
 *    en navettes plutot qu'en nombre abstrait.
 *
 * ⚠️ Les navettes restent une ANIMATION : le nombre sert a dessiner le trafic et
 * a donner un reglage qu'on visualise, la comptabilite est une multiplication.
 * Aucun deplacement n'est simule — c'est ce qui garde la progression hors ligne
 * calculable en forme fermee.
 */
export default function TuileStockage({
  logistique,
  ressources,
  tuiles,
  tuileCourante,
  onChange,
}: {
  logistique: Logistique;
  ressources: Ressource[];
  tuiles: Tuile[];
  tuileCourante: string | null;
  onChange: (l: Logistique) => void;
}) {
  const { appros } = logistique;

  /**
   * Cocher une ressource lui donne un plafond ; decocher retire la ligne.
   * Le plafond par defaut n'est pas zero : une ligne a zero serait jetee a
   * l'enregistrement, et l'utilisateur croirait avoir stocke quelque chose.
   */
  const majStock = (code: string, max: number | null) => {
    const sans = logistique.stockage.filter((x) => x.ressource !== code);
    onChange({
      ...logistique,
      stockage: max === null ? sans : [...sans, { ressource: code, max }],
    });
  };

  const majAppro = (i: number, patch: Partial<(typeof appros)[number]>) =>
    onChange({
      ...logistique,
      appros: appros.map((r, k) => (k === i ? { ...r, ...patch } : r)),
    });

  const nomTuile = (tileId: number) =>
    tuiles.find((t) => t.tileId === tileId)?.nom ?? `tuile ${tileId}`;
  const nomRessource = (code: string) => libelleRessource(ressources, code);
  const citables = tuiles.filter((t) => t.id !== tuileCourante);

  /**
   * ⚠️ **Deux genres ne montent dans aucune navette** : `population` et
   * `indicateur`. Un habitant ne se transporte pas — il est mobilisable la ou
   * il est loge — et un pourcentage encore moins. Les exclure de la LISTE est
   * plus sur que de le verifier apres coup : ce qui n'est pas proposable ne
   * peut pas etre saisi par erreur.
   *
   * C'est aussi ce qui repond a « le stockage de la pop ne doit pas varier » :
   * si rien ne peut la recolter ni l'envoyer, elle ne peut pas bouger. Ce n'est
   * pas une promesse, c'est une impossibilite.
   */
  const transportables = ressources.filter(estTransportable);
  /** Le stockage accepte la population (c'est un logement), jamais un indicateur. */
  const stockables = ressources.filter((r) => r.genre !== "indicateur");
  const toutes = maxToutesRessources(logistique);
  const nominatives = lignesNominatives(logistique);

  return (
    <div className="space-y-4">
      {/* ── Le stockage ──────────────────────────────────────────────── */}
      <div>
        <p className="label mb-0">Stockage</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Ce que cette tuile garde chez elle, et combien.
        </p>

        <Aide titre="Un plafond par ressource, et pourquoi ça compte">
          <Terme nom="toutes les ressources">
            La première ligne du tableau : la tuile accepte <strong>n'importe quoi</strong>, dans
            la limite d'un volume <strong>partagé</strong>. C'est l'entrepôt générique — 500 au
            total, peu importe ce que c'est.
          </Terme>
          <Terme nom="coche et plafond">
            Une ressource cochée a son <strong>propre</strong> maximum, et il l'emporte sur la
            ligne « toutes ». C'est ce qui permet d'écrire « n'importe quoi jusqu'à 500, mais pas
            plus de 50 de bois ».
            <br />
            Une ressource ni cochée ni couverte par « toutes » n'est{" "}
            <strong>pas stockée du tout</strong>.
          </Terme>
          <Terme nom="à quoi sert le plafond">
            Un producteur plein <strong>s'arrête</strong>. C'est cette pression qui donne une
            raison d'exister aux entrepôts — sans plafond, personne n'aurait besoin de venir
            ramasser quoi que ce soit.
          </Terme>
          <Terme nom="loger de la population">
            Un logement, c'est une tuile qui stocke la ressource <strong>population</strong> :
            coche-la, mets 12, et voilà douze habitants logés.
            <br />
            ⚠️ <strong>Ce nombre ne varie jamais</strong>, et pas par convention : la population ne
            figure dans <em>aucune</em> liste d'approvisionnement. Rien ne peut la récolter, rien
            ne peut l'envoyer — un habitant ne prend pas la navette, il est mobilisable là où il
            est logé.
          </Terme>
        </Aide>

        <div className="mt-2 rounded border border-edge bg-ink/40 p-2">
          {stockables.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aucune ressource declaree : commence par l'onglet Ressources.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-edge text-left uppercase tracking-wide text-slate-500">
                  <th className="w-8 py-1" />
                  <th className="py-1 font-medium">ressource</th>
                  <th className="w-24 py-1 font-medium">genre</th>
                  <th className="w-32 py-1 font-medium">max stocké</th>
                </tr>
              </thead>
              <tbody>
                {/* La ligne fourre-tout, en tete et detachee : c'est un volume
                    global, pas une ressource de plus. */}
                <tr className="border-b-2 border-edge">
                  <td className="py-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-accent"
                      checked={toutes > 0 || logistique.stockage.some((x) => x.ressource === TOUTES_RESSOURCES)}
                      onChange={(e) => majStock(TOUTES_RESSOURCES, e.target.checked ? 500 : null)}
                      aria-label="stocker toutes les ressources"
                    />
                  </td>
                  <td className={`py-1 italic ${toutes > 0 ? "text-accent" : "text-slate-500"}`}>
                    toutes les ressources
                  </td>
                  <td className="py-1 font-mono text-[10px] text-slate-600">au total</td>
                  <td className="py-1">
                    <input
                      type="number"
                      min={0}
                      step={50}
                      disabled={!logistique.stockage.some((x) => x.ressource === TOUTES_RESSOURCES)}
                      className="input h-8 w-28 py-0.5 disabled:opacity-30"
                      value={toutes}
                      onChange={(e) =>
                        majStock(TOUTES_RESSOURCES, Math.max(0, Number(e.target.value) || 0))
                      }
                    />
                  </td>
                </tr>
                {stockables.map((r) => {
                  const propre = logistique.stockage.find((x) => x.ressource === r.code);
                  const coche = propre !== undefined;
                  const max = coche ? propre.max : maxStocke(logistique, r.code);
                  return (
                    <tr key={r.id} className="border-b border-edge/40 last:border-0">
                      <td className="py-1">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-accent"
                          checked={coche}
                          onChange={(e) => majStock(r.code, e.target.checked ? 100 : null)}
                          aria-label={`stocker ${r.nom}`}
                        />
                      </td>
                      <td className={`py-1 ${coche ? "text-slate-200" : "text-slate-500"}`}>
                        {r.nom}
                        {!coche && toutes > 0 && (
                          <span className="ml-2 text-[10px] text-slate-600">
                            couverte par « toutes » ({toutes})
                          </span>
                        )}
                      </td>
                      <td className="py-1 font-mono text-[10px] text-slate-600">{r.genre}</td>
                      <td className="py-1">
                        <input
                          type="number"
                          min={0}
                          step={10}
                          disabled={!coche}
                          className="input h-8 w-28 py-0.5 disabled:opacity-30"
                          value={coche ? max : toutes}
                          onChange={(e) => majStock(r.code, Math.max(0, Number(e.target.value) || 0))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <p className="mt-2 text-[11px] text-slate-500">
            {logistique.stockage.length === 0 ? (
              "Cette tuile ne stocke rien : ce qu'elle produit doit partir tout de suite."
            ) : (
              <>
                {toutes > 0 && (
                  <>
                    Garde{" "}
                    <span className="text-slate-300">
                      n'importe quelle ressource, {toutes} au total
                    </span>
                    {nominatives.length > 0 ? " — sauf " : "."}
                  </>
                )}
                {toutes === 0 && nominatives.length > 0 && <>Garde jusqu'à </>}
                {nominatives.length > 0 && (
                  <>
                    <span className="text-slate-300">
                      {nominatives
                        .map((x) => `${x.max} ${nomRessource(x.ressource)}`)
                        .join(", ")}
                    </span>
                    {toutes > 0
                      ? ", plafonnées à part."
                      : " — et rien d'autre."}
                  </>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── L'approvisionnement ──────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="label mb-0">Approvisionnement</p>
          <span className="flex gap-3">
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => onChange({ ...logistique, appros: [...appros, regleApproVide("entrant")] })}
            >
              + je prends
            </button>
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => onChange({ ...logistique, appros: [...appros, regleApproVide("sortant")] })}
            >
              + je produis
            </button>
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Ce que la tuile prend ailleurs, ce qu'elle produit pour les autres. Les deux peuvent
          coexister — c'est ce qui fait un entrepôt.
        </p>

        <Aide titre="Les deux sens, le rayon, les navettes">
          <Terme nom="je prends">
            La ressource <strong>vient jusqu'ici</strong>. Le rayon est un{" "}
            <strong>rayon de récolte</strong> : jusqu'où cette tuile va chercher.
          </Terme>
          <Terme nom="je produis">
            La ressource <strong>part d'ici</strong>. Le rayon est un{" "}
            <strong>rayon d'envoi</strong> : jusqu'où cette tuile dessert.
          </Terme>
          <Terme nom="combien on produit vraiment">
            Le débit d'une règle « je produis » est <strong>ce que la tuile fabrique</strong> — et
            c'est un <strong>maximum</strong>. La production réelle vaut :
            <br />
            <code>débit × couverture des intrants × satisfaction du plateau</code>
            <br />
            Un abattoir à 20 viandes / 2 min, qui n'a reçu que la moitié de ses bovins, sur un
            plateau à 60 % de satisfaction, sort <strong>6</strong>. La couverture est un
            pourcentage, pas un tout-ou-rien : à moitié approvisionné, on produit la moitié.
            <br />
            ⚠️ Et sans sa main-d'œuvre, un bâtiment ne produit <strong>rien du tout</strong>,
            quelle que soit la couverture.
          </Terme>
          <Terme nom="la satisfaction s'applique ou non">
            Une case à cocher, sur chaque règle « je produis ». Cochée, la production est
            multipliée par la satisfaction du plateau ; décochée, elle n'en dépend pas.
            <br />
            ⚠️ <strong>C'est le garde-fou contre la spirale.</strong> Décoche-la sur les fermes et
            elles continuent de nourrir même quand tout va mal ; laisse-la sur l'industrie et elle
            tousse avec le reste. Sans au moins une production insensible quelque part, la boucle
            satisfaction → production → nourriture → satisfaction s'effondre toute seule pendant
            que le joueur dort — et il ne peut plus rien reconstruire, puisque construire coûte ce
            qu'il ne produit plus.
          </Terme>
          <Terme nom="produire sans livrer">
            Mets le <strong>rayon à 0</strong> : la tuile produit chez elle et ne dessert
            personne — c'est l'entrepôt qui viendra ramasser la récolte avec sa propre règle
            « je prends ». Rayon 0 veut dire « la case elle-même », pas « aucune portée ».
          </Terme>
          <Terme nom="entrepôt">
            Il n'y a pas de case « c'est un entrepôt » : une tuile qui a une règle{" "}
            <em>je prends</em> <strong>et</strong> une règle <em>je produis</em> en est un. Le rôle
            se déduit au lieu de se déclarer, donc il ne peut pas contredire les règles.
          </Terme>
          <Terme nom="navettes">
            Le débit s'écrit <strong>N navettes × Q par période</strong> plutôt qu'en nombre
            abstrait : 3 navettes de 20 toutes les 2 minutes, c'est 60 par 2 minutes.
            <br />
            ⚠️ Les navettes qu'on verra en jeu sont une <strong>animation</strong>, pas une
            simulation : rien ne se déplace vraiment, la comptabilité est une multiplication. C'est
            ce qui permet de calculer douze heures d'absence d'un coup au lieu de les rejouer.
          </Terme>
          <Terme nom="rayon">
            Distance <strong>hexagonale</strong>. Un rayon <em>r</em> couvre 3r(r+1) cases :
            6 · 18 · 36 · 60 · 90. « Tout le plateau » veut dire qu'il n'y a pas de limite de
            distance — le réglage naturel pour un entrepôt qui dessert la colonie entière.
          </Terme>
        </Aide>

        {appros.length === 0 ? (
          <p className="mt-1 text-xs text-slate-600">
            aucune — cette tuile ne reçoit rien et ne fournit rien
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {appros.map((regle, i) => {
              const inutile = !regleApproUtile(regle);
              return (
                <div
                  key={i}
                  className={`rounded border p-2 ${
                    inutile ? "border-amber-700/70 bg-amber-950/20" : "border-edge bg-ink/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="input h-9 w-36 py-1"
                      value={regle.sens}
                      onChange={(e) => majAppro(i, { sens: e.target.value as SensAppro })}
                    >
                      {SENS_APPRO.map((s) => (
                        <option key={s.valeur} value={s.valeur}>
                          {s.libelle}
                        </option>
                      ))}
                    </select>

                    <select
                      className="input h-9 w-48 py-1"
                      value={regle.cible}
                      onChange={(e) => majAppro(i, { cible: e.target.value as CibleAppro })}
                    >
                      {CIBLES_APPRO.map((c) => (
                        <option key={c.valeur} value={c.valeur}>
                          {c.libelle}
                        </option>
                      ))}
                    </select>

                    {/* rayon null = tout le plateau. Zero reste la case elle-meme. */}
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      {regle.sens === "entrant" ? "rayon de récolte" : "rayon d'envoi"}
                      <input
                        type="number"
                        min={0}
                        step={1}
                        disabled={regle.rayon === null}
                        className="input h-9 w-16 py-1 disabled:opacity-40"
                        value={regle.rayon ?? 0}
                        onChange={(e) => majAppro(i, { rayon: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </label>
                    <label className="flex items-center gap-1 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={regle.rayon === null}
                        onChange={(e) => majAppro(i, { rayon: e.target.checked ? null : 3 })}
                      />
                      tout le plateau
                    </label>

                    <button
                      type="button"
                      className="ml-auto text-xs text-slate-500 hover:text-red-400"
                      onClick={() =>
                        onChange({ ...logistique, appros: appros.filter((_, k) => k !== i) })
                      }
                    >
                      retirer
                    </button>
                  </div>

                  {/* Les navettes : N x Q par periode. */}
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="input h-9 w-16 py-1"
                      value={regle.debit.navettes}
                      onChange={(e) =>
                        majAppro(i, {
                          debit: { ...regle.debit, navettes: Math.max(0, Number(e.target.value) || 0) },
                        })
                      }
                    />
                    {regle.sens === "entrant" ? "navette(s) de" : "navette(s) portant"}
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="input h-9 w-20 py-1"
                      value={regle.debit.quantite}
                      onChange={(e) =>
                        majAppro(i, {
                          debit: { ...regle.debit, quantite: Math.max(0, Number(e.target.value) || 0) },
                        })
                      }
                    />
                    toutes les
                    <input
                      type="number"
                      min={1}
                      step={1}
                      className="input h-9 w-20 py-1"
                      value={regle.debit.periode_s}
                      onChange={(e) =>
                        majAppro(i, {
                          debit: { ...regle.debit, periode_s: Math.max(1, Number(e.target.value) || 1) },
                        })
                      }
                    />
                    s — soit{" "}
                    <span className="tabular-nums text-slate-300">{debitParPeriode(regle)}</span>{" "}
                    {regle.sens === "entrant" ? "ramassés" : "produits"} par période
                  </div>

                  {/* Le garde-fou contre la spirale, reduit a une case a cocher. */}
                  {regle.sens === "sortant" && (
                    <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-accent"
                        checked={regle.soumis_satisfaction}
                        onChange={(e) => majAppro(i, { soumis_satisfaction: e.target.checked })}
                      />
                      la satisfaction du plateau s'applique à cette production
                    </label>
                  )}

                  {regle.cible === "tuiles" && (
                    <div className="mt-2">
                      <p className="mb-1 text-[11px] text-slate-500">
                        {regle.sens === "entrant" ? "Prend chez :" : "Produit pour :"}
                      </p>
                      <ChoixTuiles
                        tuiles={citables}
                        choisies={regle.tileIds}
                        onChange={(tileIds) => majAppro(i, { tileIds })}
                      />
                    </div>
                  )}

                  <div className="mt-2">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
                      Ressources concernées
                    </p>
                    <ChoixRessources
                      ressources={transportables}
                      choisies={regle.ressources}
                      onChange={(codes) => majAppro(i, { ressources: codes })}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      La population et les indicateurs ne sont pas proposés : ils ne se
                      transportent pas.
                    </p>
                  </div>

                  <p
                    className={`mt-1.5 text-[11px] leading-tight ${
                      inutile ? "text-amber-400" : "text-slate-500"
                    }`}
                  >
                    {inutile
                      ? "Règle incomplète — aucune tuile cochée, ou aucun débit : elle sera ignorée en jeu."
                      : decrireAppro(regle, nomTuile, nomRessource)}
                  </p>

                  {/* ⚠️ Le chiffre saisi est un PLAFOND, pas une garantie. Le
                      dire ici, sous la regle, evite de croire qu'un batiment
                      mal approvisionne produira quand meme son maximum. */}
                  {!inutile && regle.sens === "sortant" && (
                    <p className="mt-1 text-[11px] leading-tight text-slate-500">
                      C'est un <strong>maximum</strong> : la production réelle vaut ce débit ×{" "}
                      <span className="text-slate-300">la couverture de ses intrants</span>
                      {regle.soumis_satisfaction ? (
                        <>
                          {" "}× <span className="text-slate-300">la satisfaction du plateau</span>
                        </>
                      ) : (
                        <>
                          {" "}
                          — <span className="text-accent">insensible à la satisfaction</span>, elle
                          produit à plein même quand le plateau va mal
                        </>
                      )}
                      . Et sans sa main-d'œuvre, elle est nulle.
                      {regle.rayon === 0 && (
                        <> Rayon 0 : elle produit chez elle, on vient l'y chercher.</>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {estEntrepot(logistique) && (
          <p className="mt-2 rounded border border-accent/40 bg-accent/10 p-2 text-[11px] text-accent">
            Cette tuile prend <strong>et</strong> produit : c'est un entrepôt. Rien à cocher de
            plus — le rôle se déduit de ses règles.
          </p>
        )}
      </div>
    </div>
  );
}
