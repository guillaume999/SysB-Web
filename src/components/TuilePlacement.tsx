import Aide, { Terme } from "@/components/Aide";
import ChoixTuiles from "@/components/ChoixTuiles";
import {
  CASE_VIDE,
  TYPES_REGLE,
  decrireRegle,
  porteePasEncoreAppliquee,
  regleUtile,
  regleVide,
  type BaseSupport,
  type PorteeLimite,
  type ReglePlacement,
  type Tuile,
  type TypeRegle,
} from "@/lib/tuiles";

/**
 * Les conditions de pose d'une tuile — **reconstruit de zero le 2026-08-26**.
 *
 * Trois types pour l'instant : `support`, qui regarde la case elle-meme,
 * `limite`, qui compte les exemplaires deja poses, et `gratuite`, qui offre les
 * premiers. Les autres reviendront une par une ; l'ecran est deja fait pour :
 * une liste de regles, un menu de type, un bloc par regle.
 *
 * ⚠️ `support` et `limite` sont des CONDITIONS — elles disent oui ou non, et
 * doivent toutes etre vraies en meme temps (ET simple). `gratuite` ne
 * conditionne rien : elle change le PRIX. Elles vivent dans la meme liste parce
 * que ce sont, pour l'utilisateur, « les regles de la tuile » ; la distinction
 * se lit dans la phrase sous chaque regle.
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

  /**
   * Changer de type repart d'une regle neuve : support et limite n'ont aucun
   * champ en commun, garder l'ancien contenu ne ferait que trainer des valeurs
   * invisibles jusqu'en base.
   */
  const changerType = (index: number, regle: TypeRegle) =>
    onChange(regles.map((r, i) => (i === index ? regleVide(regle) : r)));

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

      <Aide titre="Le support et son « sauf », la limite, la gratuite">
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
        <Terme nom="gratuite">
          Tant que le joueur en possede <strong>moins de N sur ce plateau</strong>, poser ne coute
          rien. Ce n'est pas une condition de pose : c'est le prix qui change.
          <br />
          Le compte est celui du <strong>moment</strong>, pas un historique : detruire son dernier
          entrepot rend le suivant a nouveau gratuit. C'est un filet de securite — sans ce
          re-armement, un joueur qui demolit son unique entrepot resterait bloque pour de bon.
          Seule la <strong>pose</strong> est offerte : ameliorer se paie toujours.
          <br />
          Pour &laquo; offert au debut, puis plafonne &raquo;, mettre deux regles : une gratuite
          et une limite.
        </Terme>
        <Terme nom="limite">
          Le nombre maximum d'exemplaires que le joueur peut avoir.
          <br />
          <strong>Sur ce plateau</strong> : la colonie et la station comptent separement, comme
          tout le reste du modele. C'est le seul cas que le jeu applique aujourd'hui.
          <br />
          <strong>Dans tout l'empire</strong> : tous plateaux confondus. Le choix est enregistre,
          mais <strong>pas encore applique en jeu</strong> — un avertissement orange le rappelle
          sous la regle des que tu le choisis. Il disparaitra quand le jeu saura compter partout.
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
                    onChange={(e) => changerType(index, e.target.value as TypeRegle)}
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
                  {regle.regle === "support" && (
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
                  )}

                  {regle.regle === "limite" && (
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      au plus
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="input h-9 w-20 py-1"
                        value={regle.max}
                        onChange={(e) => maj(index, { max: Math.max(0, Number(e.target.value) || 0) })}
                      />
                      exemplaires
                      <select
                        className="input h-9 w-40 py-1"
                        value={regle.portee}
                        onChange={(e) => maj(index, { portee: e.target.value as PorteeLimite })}
                      >
                        <option value="plateau">sur ce plateau</option>
                        <option value="empire">dans tout l'empire</option>
                      </select>
                    </label>
                  )}

                  {regle.regle === "gratuite" && (
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      les
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="input h-9 w-20 py-1"
                        value={regle.offerts}
                        onChange={(e) =>
                          maj(index, { offerts: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                      premiers sont offerts
                    </label>
                  )}

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
                {regle.regle === "support" && (
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
                )}

                {/* La relecture en francais. */}
                <p
                  className={`mt-1.5 text-[11px] leading-tight ${
                    inutile ? "text-amber-400" : "text-slate-500"
                  }`}
                >
                  {decrireRegle(regle, nomTuile)}
                </p>

                {/* ⚠️ Un champ enregistre mais pas encore branche cote jeu. On
                    le dit ici, sous la regle, au moment ou l'admin le choisit —
                    c'est ce qui separe un champ « pas encore fait » d'un champ
                    qui ment. A retirer avec le rattrapage Unity, pas avant. */}
                {porteePasEncoreAppliquee(regle) && (
                  <p className="mt-1 text-[11px] leading-tight text-amber-400">
                    ⚠️ « dans tout l'empire » est enregistre mais{" "}
                    <strong>pas encore applique en jeu</strong> : le jeu compte pour l'instant le
                    seul plateau ou tu poses. La regle agira des que le comptage sur tous les
                    plateaux sera fait.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
