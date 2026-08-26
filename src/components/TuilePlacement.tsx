import Aide, { Terme } from "@/components/Aide";
import ChoixTuiles from "@/components/ChoixTuiles";
import {
  CASE_VIDE,
  TYPES_REGLE,
  decrireRegle,
  regleUtile,
  regleVide,
  type BaseSupport,
  type ReglePlacement,
  type Tuile,
} from "@/lib/tuiles";

/**
 * Les conditions de pose d'une tuile — **reconstruit de zero le 2026-08-26**.
 *
 * Un seul type de regle pour l'instant : `support`, qui regarde la case
 * elle-meme. Les autres reviendront une par une ; l'ecran est deja fait pour :
 * une liste de regles, un menu de type, un bloc par regle.
 *
 * Toutes les regles doivent etre vraies en meme temps (ET simple).
 *
 * Trois choix hérités des erreurs passées, a ne pas defaire :
 *  · des cases a cocher, jamais un `<select multiple>` (Ctrl+clic invisible) ;
 *  · une regle qui ne dit rien est IGNOREE en jeu, pas bloquante — signalee en
 *    orange ici, avec le meme mot des deux cotes ;
 *  · chaque regle se relit en francais juste en dessous d'elle : c'est la
 *    qu'une saisie malheureuse se voit, pas dans le formulaire.
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
  /** Id du record en cours d'edition — une tuile peut se citer elle-meme. */
  tuileCourante: string | null;
  onChange: (regles: ReglePlacement[]) => void;
}) {
  const maj = (index: number, patch: Partial<ReglePlacement>) =>
    onChange(regles.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const retirer = (index: number) => onChange(regles.filter((_, i) => i !== index));

  const nomTuile = (tileId: number) => {
    if (tileId === CASE_VIDE) return "case vide";
    const t = tuiles.find((x) => x.tileId === tileId);
    if (t) return t.nom + (t.id === tuileCourante ? " (cette tuile)" : "");
    return `tuile ${tileId}`;
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="label mb-0">Conditions de deploiement</p>
        <button
          type="button"
          className="text-xs text-accent hover:underline"
          onClick={() => onChange([...regles, regleVide("support")])}
        >
          + ajouter une regle
        </button>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Toutes les regles doivent etre vraies en meme temps.
      </p>

      <Aide titre="Le support, et son « sauf »">
        <Terme nom="support">
          Ne regarde pas le voisinage mais <strong>la case elle-meme</strong> : ce qu'il y a
          dessous au moment de construire.
        </Terme>
        <Terme nom="seulement sur ces tuiles">
          La liste blanche. La case doit porter l'une des tuiles cochees, et rien d'autre ne
          passe. Cocher plusieurs tuiles veut toujours dire <em>n'importe laquelle</em>.
          <strong> Une liste blanche contient deja son « sauf »</strong> : si tu autorises Terre
          et Herbe, le Volcan est deja refuse, inutile de le nommer.
        </Terme>
        <Terme nom="n'importe ou, sauf">
          L'inverse : tout convient, sauf ce que tu coches. C'est le seul cas ou une exception
          sert a quelque chose — <em>« partout sauf sur l'eau »</em> etait impossible a ecrire
          avant.
        </Terme>
        <Terme nom="case vide">
          Une entree comme une autre, en tete des listes. Elle permet
          <em> « seulement sur une case vide »</em>, et son contraire
          <em> « partout sauf sur du vide »</em>.
        </Terme>
        <Terme nom="cette tuile">
          Une tuile peut se citer elle-meme : le catalogue n'est plus ampute de la tuile en cours
          d'edition. Utile le jour ou le voisinage reviendra — <em>« pas deux fermes cote a
          cote »</em>.
        </Terme>
        <p className="text-slate-500">
          Une regle qui ne dit rien — liste blanche vide, ou aucune exception — est
          <strong> ignoree en jeu</strong> plutot que bloquante. Elle se signale en orange ici.
          Chaque regle se relit en francais juste en dessous d'elle.
        </p>
      </Aide>

      {regles.length === 0 ? (
        <p className="mt-1 text-xs text-slate-600">aucune — la tuile se pose n'importe ou</p>
      ) : (
        <div className="mt-2 space-y-2">
          {regles.map((regle, index) => {
            const inutile = !regleUtile(regle);
            return (
              <div
                key={index}
                className={`rounded border p-2 ${
                  inutile ? "border-amber-700/70 bg-amber-950/20" : "border-edge bg-ink/40"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="input h-9 w-36 py-1"
                    value={regle.regle}
                    onChange={() => undefined}
                    disabled={TYPES_REGLE.length < 2}
                    title={TYPES_REGLE.find((t) => t.valeur === regle.regle)?.aide}
                  >
                    {TYPES_REGLE.map((t) => (
                      <option key={t.valeur} value={t.valeur}>
                        {t.libelle}
                      </option>
                    ))}
                  </select>

                  {/* La base : liste blanche, ou tout sauf. Deux boutons plutot
                      qu'un menu — il n'y a que deux cas, et ils changent ce que
                      la suite du bloc demande. */}
                  <div className="flex overflow-hidden rounded border border-edge text-xs">
                    {(
                      [
                        { valeur: "liste", libelle: "seulement sur..." },
                        { valeur: "tout", libelle: "n'importe ou, sauf..." },
                      ] as { valeur: BaseSupport; libelle: string }[]
                    ).map((b) => (
                      <button
                        key={b.valeur}
                        type="button"
                        className={`px-2 py-1.5 transition-colors ${
                          regle.base === b.valeur
                            ? "bg-accent/20 text-white"
                            : "text-slate-400 hover:bg-ink"
                        }`}
                        onClick={() => maj(index, { base: b.valeur })}
                      >
                        {b.libelle}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="ml-auto text-xs text-slate-500 hover:text-red-400"
                    onClick={() => retirer(index)}
                  >
                    retirer
                  </button>
                </div>

                {/* Une seule liste a l'ecran : celle que la base rend utile.
                    Montrer les deux inviterait a cocher une tuile des deux
                    cotes, puis a chercher longtemps pourquoi rien ne marche. */}
                <div className="mt-2">
                  <p className="mb-1 text-[11px] text-slate-500">
                    {regle.base === "liste"
                      ? "La case doit porter l'une de ces tuiles :"
                      : "Toutes les cases conviennent, sauf celles-ci :"}
                  </p>
                  {regle.base === "liste" ? (
                    <ChoixTuiles
                      tuiles={tuiles}
                      choisies={regle.tileIds}
                      onChange={(tileIds) => maj(index, { tileIds })}
                      avecCaseVide
                    />
                  ) : (
                    <ChoixTuiles
                      tuiles={tuiles}
                      choisies={regle.sauf}
                      onChange={(sauf) => maj(index, { sauf })}
                      avecCaseVide
                    />
                  )}
                </div>

                {/* La relecture en francais. */}
                <p
                  className={`mt-1.5 text-[11px] leading-tight ${
                    inutile ? "text-amber-400" : "text-slate-500"
                  }`}
                >
                  {decrireRegle(regle, nomTuile)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
