import Aide, { Terme } from "@/components/Aide";
import ChoixRessources from "@/components/ChoixRessources";
import ChoixTuiles from "@/components/ChoixTuiles";
import { estTransportable, libelleRessource, type Ressource } from "@/lib/ressources";
import {
  CIBLES_APPRO,
  SENS_APPRO,
  debitParPeriode,
  decrireAppro,
  estEntrepot,
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
  const { stockage, appros } = logistique;

  const majStockage = (patch: Partial<typeof stockage>) =>
    onChange({ ...logistique, stockage: { ...stockage, ...patch } });

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

  return (
    <div className="space-y-4">
      {/* ── Le stockage ──────────────────────────────────────────────── */}
      <div>
        <p className="label mb-0">Stockage</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Ce que cette tuile garde chez elle, et combien.
        </p>

        <Aide titre="Ce que « toutes » veut dire, et à quoi sert la capacité">
          <Terme nom="aucune coche = toutes">
            Une règle sans ressource cochée porte sur <strong>toutes</strong> les ressources. C'est
            la même convention pour le stockage et pour l'approvisionnement : une seule chose à
            retenir. Coche pour restreindre, décoche tout pour revenir à « toutes ».
          </Terme>
          <Terme nom="loger de la population">
            Un logement, c'est une tuile dont le stockage est limité à la ressource{" "}
            <strong>population</strong> : capacité 12, ressource « population » cochée, et voilà
            douze habitants logés.
            <br />
            ⚠️ <strong>Ce nombre ne varie jamais</strong>, et pas par convention : la population ne
            figure dans <em>aucune</em> liste d'approvisionnement. Rien ne peut la récolter, rien
            ne peut l'envoyer — un habitant ne prend pas la navette, il est mobilisable là où il
            est logé.
          </Terme>
          <Terme nom="capacité">
            Le total que la tuile peut garder, toutes ressources confondues. <code>0</code> = elle
            ne stocke rien : ce qu'elle produit doit partir tout de suite, ou il est perdu.
            <br />
            C'est cette pression qui donne une raison d'exister aux entrepôts — un producteur plein
            s'arrête.
          </Terme>
        </Aide>

        <div className="mt-2 rounded border border-edge bg-ink/40 p-2">
          <label className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
            capacité
            <input
              type="number"
              min={0}
              step={1}
              className="input h-9 w-24 py-1"
              value={stockage.capacite}
              onChange={(e) => majStockage({ capacite: Math.max(0, Number(e.target.value) || 0) })}
            />
            <span className="ml-1">
              {stockage.capacite === 0
                ? "ne stocke rien"
                : "au total, toutes ressources confondues"}
            </span>
          </label>

          {stockage.capacite > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
                Ressources acceptées
              </p>
              <ChoixRessources
                ressources={stockables}
                choisies={stockage.ressources}
                onChange={(codes) => majStockage({ ressources: codes })}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                {stockage.ressources.length === 0
                  ? `Garde jusqu'à ${stockage.capacite} de n'importe quelle ressource.`
                  : `Garde jusqu'à ${stockage.capacite} de ${stockage.ressources
                      .map(nomRessource)
                      .join(", ")} — et rien d'autre.`}
              </p>
            </div>
          )}
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
              + je reçois
            </button>
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => onChange({ ...logistique, appros: [...appros, regleApproVide("sortant")] })}
            >
              + je fournis
            </button>
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Par où ça entre, par où ça sort. Les deux sens peuvent coexister.
        </p>

        <Aide titre="Les deux sens, le rayon, les navettes">
          <Terme nom="je reçois de">
            La ressource <strong>vient jusqu'ici</strong>. Le rayon est un{" "}
            <strong>rayon de récolte</strong> : jusqu'où cette tuile va chercher.
          </Terme>
          <Terme nom="je fournis">
            La ressource <strong>part d'ici</strong>. Le rayon est un{" "}
            <strong>rayon d'envoi</strong> : jusqu'où cette tuile dessert.
          </Terme>
          <Terme nom="entrepôt">
            Il n'y a pas de case « c'est un entrepôt » : une tuile qui a une règle{" "}
            <em>je reçois</em> <strong>et</strong> une règle <em>je fournis</em> en est un. Le rôle
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
                    navette(s) de
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
                    <span className="tabular-nums text-slate-300">{debitParPeriode(regle)}</span> par
                    période
                  </div>

                  {regle.cible === "tuiles" && (
                    <div className="mt-2">
                      <p className="mb-1 text-[11px] text-slate-500">
                        {regle.sens === "entrant" ? "Récolte chez :" : "Envoie vers :"}
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
                </div>
              );
            })}
          </div>
        )}

        {estEntrepot(logistique) && (
          <p className="mt-2 rounded border border-accent/40 bg-accent/10 p-2 text-[11px] text-accent">
            Cette tuile reçoit <strong>et</strong> fournit : c'est un entrepôt. Rien à cocher de
            plus — le rôle se déduit de ses règles.
          </p>
        )}
      </div>
    </div>
  );
}
