import Aide, { Terme } from "@/components/Aide";
import ChoixTuiles from "@/components/ChoixTuiles";
import { niveauxDe, type Technologie } from "@/lib/technologies";
import {
  CASE_VIDE,
  TYPES_REGLE,
  decrireRegle,
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
 * Cinq types : `support`, qui regarde la case elle-meme, `limite`, qui compte
 * les exemplaires deja poses, `gratuite`, qui offre les premiers, et depuis le
 * 2026-08-28 `batiments` (il faut deja posseder N exemplaires d'un type) et
 * `technologie` (il faut avoir cherche, jusqu'a un niveau donne). Les autres
 * reviendront une par une ; l'ecran est deja fait pour : une liste de regles,
 * un menu de type, un bloc par regle.
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
  technologies,
  tuileCourante,
  onChange,
}: {
  regles: ReglePlacement[];
  /** Le catalogue, pour proposer les tuiles citables. */
  tuiles: Tuile[];
  /**
   * Les technos declarees — onglet Technologie. C'est elles que propose la
   * regle « technologie requise », jamais un code tape a la main.
   */
  technologies: Technologie[];
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

  /** Le nom d'une techno d'apres son code — le code seul si elle a disparu. */
  const nomTechno = (code: string) => technologies.find((t) => t.code === code)?.nom ?? code;

  // Une liste, jamais un id tape a la main : c'est la convention du site.
  const parNom = [...tuiles].sort((a, b) => a.nom.localeCompare(b.nom));

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

      <Aide titre="Le support, la limite, la gratuite, les batiments et la techno requis">
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
        <Terme nom="batiments requis">
          Ce qu'il faut <strong>deja avoir construit</strong> sur ce plateau pour avoir le droit
          de poser celle-ci. <strong>Un type par regle</strong>, avec son nombre : pour
          <em> 3 fermes ET 2 moulins</em>, mets deux regles. Ce n'est pas un detour — c'est ce qui
          empeche de se demander, en relisant, si le nombre valait par type ou au total.
          <br />
          Le compte est celui du <strong>moment</strong>, sur le plateau ou tu poses : demolir une
          ferme peut rendre la tuile a nouveau impossible.
          <br />
          ⚠️ <strong>Pas encore appliquee en jeu</strong> : le validateur ne connait que le support
          et la limite. Un avertissement orange le rappelle sous la regle.
        </Terme>
        <Terme nom="technologie requise">
          La recherche qu'il faut avoir faite, et <strong>jusqu'a quel niveau</strong>. Une techno
          declare son nombre de niveaux dans l'onglet <strong>Technologie</strong> ; en demander
          plus rendrait la tuile impossible a poser, et l'ecran te le dit en orange.
          <br />
          Niveau 1 = il suffit de l'avoir cherchee.
          <br />
          ⚠️ <strong>Pas encore appliquee en jeu</strong> : le jeu ne lit pas encore la collection
          des technologies — rien ne sait si une recherche est acquise.
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
            // La techno citee, si elle existe encore. `undefined` = code
            // orphelin (techno supprimee, ou renommee) : on le GARDE visible
            // plutot que de le faire disparaitre du menu, ce qui changerait la
            // regle en silence au premier reenregistrement.
            const techno =
              regle.regle === "technologie" && regle.techno !== ""
                ? technologies.find((t) => t.code === regle.techno)
                : undefined;
            const technoOrpheline = regle.regle === "technologie" && regle.techno !== "" && !techno;
            // Meme garde pour un tileId qui ne designe plus rien : il reste
            // dans le menu, marque « inconnue ».
            const batimentOrphelin =
              regle.regle === "batiments" &&
              regle.batiment > 0 &&
              !tuiles.some((t) => t.tileId === regle.batiment);
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

                  {/* ⚠️ UN type par regle, un nombre. Choix de l'utilisateur le
                      28/08 : « plusieurs regles, chaque regle un type, un
                      nombre ». Une liste cochee avec un nombre commun aurait
                      laisse ambigu si le nombre valait par type ou au total. */}
                  {regle.regle === "batiments" && (
                    <label className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                      il faut deja posseder
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="input h-9 w-20 py-1"
                        value={regle.nombre}
                        onChange={(e) =>
                          maj(index, { nombre: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                      <select
                        className={`input h-9 w-48 py-1 ${
                          batimentOrphelin ? "border-amber-700 text-amber-300" : ""
                        }`}
                        value={String(regle.batiment)}
                        onChange={(e) => maj(index, { batiment: Number(e.target.value) || 0 })}
                      >
                        <option value="0">choisir un batiment</option>
                        {batimentOrphelin && (
                          <option value={regle.batiment}>tuile {regle.batiment} — inconnue</option>
                        )}
                        {parNom.map((t) => (
                          <option key={t.id} value={t.tileId}>
                            {t.nom}
                            {t.id === tuileCourante ? " (cette tuile)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {regle.regle === "technologie" && (
                    <label className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                      il faut avoir cherche
                      <select
                        className={`input h-9 w-48 py-1 ${
                          technoOrpheline ? "border-amber-700 text-amber-300" : ""
                        }`}
                        value={regle.techno}
                        onChange={(e) => maj(index, { techno: e.target.value })}
                      >
                        <option value="">choisir une technologie</option>
                        {technoOrpheline && (
                          <option value={regle.techno}>{regle.techno} — inconnue</option>
                        )}
                        {technologies.map((t) => (
                          <option key={t.id} value={t.code}>
                            {t.nom}
                          </option>
                        ))}
                      </select>
                      au moins au niveau
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="input h-9 w-16 py-1"
                        value={regle.niveau}
                        onChange={(e) =>
                          maj(index, { niveau: Math.max(1, Number(e.target.value) || 1) })
                        }
                      />
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
                  {decrireRegle(regle, nomTuile, nomTechno)}
                </p>

                {/* Les avertissements « pas encore appliqué en jeu » (empire,
                    batiments, technologie) sont partis le 28/08, AVEC leur
                    mécanisme — le moteur applique les cinq règles. */}
                {regle.regle === "technologie" && technologies.length === 0 && (
                  <p className="mt-1 text-[11px] leading-tight text-amber-400">
                    Aucune technologie declaree : commence par l&apos;onglet Technologie.
                  </p>
                )}

                {/* Un code qui ne designe plus rien : le dire, ne pas le
                    corriger a la place de l'admin. */}
                {technoOrpheline && (
                  <p className="mt-1 text-[11px] leading-tight text-amber-400">
                    ⚠️ Aucune technologie ne porte le code &laquo; {regle.techno} &raquo; :
                    elle a ete supprimee ou renommee. Choisis-en une autre, ou recree-la dans
                    l&apos;onglet Technologie.
                  </p>
                )}

                {/* Un niveau au-dela de ce que la techno declare : la tuile
                    serait impossible a poser, pour toujours. */}
                {techno && regle.niveau > niveauxDe(techno) && (
                  <p className="mt-1 text-[11px] leading-tight text-amber-400">
                    ⚠️ &laquo; {nomTechno(regle.techno)} &raquo; ne compte que {niveauxDe(techno)}{" "}
                    niveau(x) : demander le niveau {regle.niveau} rendrait cette tuile{" "}
                    <strong>impossible a poser</strong>. Corrige le niveau ici, ou le nombre de
                    niveaux dans l&apos;onglet Technologie.
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
