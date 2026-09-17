import { useMemo } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Vignette } from "@/components/Vignette";
import { SANS_AGE, libelleAge, numerosDeclares, type Age } from "@/lib/ages";
import { rangerEnGrille } from "@/lib/grilleTuiles";
import { SANS_CATEGORIE } from "@/lib/technologies";
import { cheminIcone, couleurDe, type Tuile } from "@/lib/tuiles";

/**
 * Le catalogue des tuiles en TABLEAU : les âges en colonnes, les catégories en
 * lignes, une petite carte cliquable par tuile (demande du 2026-09-17).
 *
 * ⚠️ Les tuiles arrivent DÉJÀ filtrées et triées par la page : la grille ne
 * fait que les ranger. Un filtre actif vide donc des cases — c'est voulu, les
 * lignes et colonnes restent en place pour qu'on garde ses repères.
 *
 * ⚠️ La suppression confirme dans la carte elle-même, jamais par
 * `window.confirm` (qui gèle l'automatisation Chrome).
 *
 * ⚠️ **LES FLÈCHES ↑/↓ D'UNE LIGNE RANGENT AUSSI LE MAGASIN DU JEU** (17/09) :
 * elles écrivent dans la collection `categories`, que le magasin lit pour
 * ordonner ses onglets. Ce n'est pas un confort d'affichage — c'est le seul
 * endroit où cet ordre se décide.
 */
export default function GrilleTuiles({
  tuiles,
  ages,
  ordreCategories,
  peutRanger,
  rangementOccupe,
  onDeplacerCategorie,
  probleme,
  avertissement,
  aSupprimer,
  onOuvrir,
  onDemanderSuppression,
  onSupprimer,
  plein = false,
}: {
  tuiles: Tuile[];
  ages: Age[];
  /** L'ordre des lignes, de la collection `categories`. Vide = alphabétique. */
  ordreCategories: string[];
  /** Les flèches ne s'affichent que pour qui a le droit d'écrire (admin). */
  peutRanger: boolean;
  /** Une écriture est en cours : les flèches attendent, sinon on empile les clics. */
  rangementOccupe: boolean;
  /**
   * ⚠️ `visibles` = les lignes que la grille affiche VRAIMENT, dans leur ordre.
   * La page ne les connait pas (les filtres sont a elle, les lignes sont a la
   * grille), et un cran se compte sur ce qu'on voit.
   */
  onDeplacerCategorie: (categorie: string, sens: -1 | 1, visibles: string[]) => void;
  /** Le souci de modèle 3D d'une tuile, ou null. */
  probleme: (t: Tuile) => string | null;
  /** Ce qu'on dit avant de supprimer (tuiles qui citent son id…). */
  avertissement: (t: Tuile) => string;
  /** L'id de la tuile dont la suppression attend confirmation, ou null. */
  aSupprimer: string | null;
  onOuvrir: (t: Tuile) => void;
  onDemanderSuppression: (id: string | null) => void;
  onSupprimer: (t: Tuile) => void;
  /**
   * Plein ecran : le tableau prend TOUTE la hauteur que son parent lui laisse
   * au lieu des 75 % de la fenetre.
   *
   * ⚠️ Il faut un parent en `flex flex-col` avec une hauteur bornee (le
   * panneau `fixed` de la page), sinon `flex-1` n'a rien a remplir et le
   * tableau retombe a sa hauteur naturelle.
   */
  plein?: boolean;
}) {
  const grille = useMemo(
    () => rangerEnGrille(tuiles, numerosDeclares(ages), ordreCategories),
    [tuiles, ages, ordreCategories],
  );

  return (
    <div className={plein ? "flex min-h-0 flex-1 flex-col" : undefined}>
      {/* ⚠️ `min-h-0` EST OBLIGATOIRE sur les deux niveaux : sans lui, un
          enfant flex garde la taille de son contenu, le tableau deborde du
          bas de la fenetre et c'est la PAGE qui defile — donc les entetes
          collants ne collent plus a rien. */}
      <div
        className={`card overflow-auto ${plein ? "min-h-0 flex-1" : "max-h-[75vh]"}`}
      >
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {/* Le coin : collé en haut ET à gauche, au-dessus des deux autres. */}
              <th className="sticky left-0 top-0 z-30 min-w-[6rem] sm:min-w-[9rem] border-b border-r border-edge bg-panel px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-slate-500">
                catégorie \ âge
              </th>
              {grille.ages.map((age) => (
                <th
                  key={age}
                  className="sticky top-0 z-20 min-w-[11rem] border-b border-r border-edge bg-panel px-3 py-2 text-left align-bottom text-xs font-medium text-slate-200 last:border-r-0"
                >
                  {age === SANS_AGE ? "Sans âge" : libelleAge(age, ages)}
                  <span className="ml-2 tabular-nums text-slate-500">{grille.totalAge(age)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grille.categories.map((categorie, i) => {
              // ⚠️ « sans catégorie » n'est pas une catégorie : elle n'existe
              //    en base nulle part, elle ne se range pas, et elle reste en
              //    dernier. C'est aussi pourquoi la ligne juste au-dessus
              //    d'elle n'a pas de flèche « descendre ».
              const rangeable = peutRanger && categorie !== SANS_CATEGORIE;
              const derniereRangeable =
                i === grille.categories.length - 1 || grille.categories[i + 1] === SANS_CATEGORIE;
              return (
              <tr key={categorie}>
                <th className="sticky left-0 z-10 border-b border-r border-edge bg-panel px-3 py-2 text-left align-top text-[11px] font-semibold uppercase tracking-wide text-[#39ff14]">
                  <div className="flex items-start gap-1.5">
                    {rangeable && (
                      <span className="-mt-0.5 flex flex-col text-[9px] leading-[1.1] text-slate-500">
                        <Fleche
                          sens={-1}
                          categorie={categorie}
                          inactive={i === 0 || rangementOccupe}
                          onClick={() => onDeplacerCategorie(categorie, -1, grille.categories)}
                        />
                        <Fleche
                          sens={1}
                          categorie={categorie}
                          inactive={derniereRangeable || rangementOccupe}
                          onClick={() => onDeplacerCategorie(categorie, 1, grille.categories)}
                        />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      {categorie}
                      <span className="ml-2 font-normal tabular-nums text-slate-500">
                        {grille.totalCategorie(categorie)}
                      </span>
                    </span>
                  </div>
                </th>
                {grille.ages.map((age) => {
                  const liste = grille.cellule(categorie, age);
                  return (
                    <td
                      key={age}
                      className="border-b border-r border-edge/60 px-1.5 py-1.5 align-top last:border-r-0"
                    >
                      <div className="flex flex-col gap-1">
                        {liste.map((tuile) => (
                          <CarteTuile
                            key={tuile.id}
                            tuile={tuile}
                            probleme={probleme(tuile)}
                            avertissement={aSupprimer === tuile.id ? avertissement(tuile) : ""}
                            confirme={aSupprimer === tuile.id}
                            onOuvrir={() => onOuvrir(tuile)}
                            onDemander={() => onDemanderSuppression(tuile.id)}
                            onAnnuler={() => onDemanderSuppression(null)}
                            onSupprimer={() => onSupprimer(tuile)}
                          />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ⚠️ Pas d'aide en plein ecran : on y va pour la place, et elle
          pousserait le tableau vers le haut a chaque ouverture. */}
      {!plein && (
      <Aide titre="Comment lire ce tableau">
        <Terme nom="colonnes">
          les âges déclarés dans l'onglet Âges, plus tout âge porté par une tuile sans être déclaré
          (marqué « non déclaré »). « Sans âge » arrive en dernier : ce sont surtout les cases de
          terrain.
        </Terme>
        <Terme nom="lignes">
          les catégories des tuiles. Une tuile qui en porte plusieurs apparaît dans chacune ; les
          nombres à côté des titres la comptent une seule fois.
        </Terme>
        <Terme nom="flèches ↑ ↓">
          l'ordre des lignes, et c'est le MÊME que celui des onglets du magasin dans le jeu : ranger
          ici range là-bas. Une catégorie jamais rangée reste à la suite, par ordre alphabétique.
          Avec un filtre actif, une flèche fait passer la ligne au-dessus (ou en dessous) de celle
          qu'on VOIT — les lignes cachées suivent.
        </Terme>
        <Terme nom="carte">
          un clic ouvre la fiche d'édition. Grisée et en pointillé = brouillon ; bord orange = modèle
          3D absent ou introuvable. La croix supprime, après confirmation.
        </Terme>
        <Terme nom="filtres">
          ils vident des cases sans retirer de ligne ni de colonne. Le tri choisi en vue Liste
          s'applique aussi à l'ordre des cartes dans une case.
        </Terme>
      </Aide>
      )}
    </div>
  );
}

function CarteTuile({
  tuile,
  probleme,
  avertissement,
  confirme,
  onOuvrir,
  onDemander,
  onAnnuler,
  onSupprimer,
}: {
  tuile: Tuile;
  probleme: string | null;
  avertissement: string;
  confirme: boolean;
  onOuvrir: () => void;
  onDemander: () => void;
  onAnnuler: () => void;
  onSupprimer: () => void;
}) {
  if (confirme) {
    return (
      <div className="rounded border border-red-900/70 bg-red-950/30 px-2 py-1.5 text-[11px]">
        <p className="leading-tight text-red-300">Supprimer « {tuile.nom} » ?</p>
        {avertissement && <p className="mt-0.5 leading-tight text-red-300/80">{avertissement}</p>}
        <p className="mt-1">
          <button type="button" className="text-red-300 hover:underline" onClick={onSupprimer}>
            Confirmer
          </button>
          <button type="button" className="ml-3 text-slate-400 hover:text-white" onClick={onAnnuler}>
            Annuler
          </button>
        </p>
      </div>
    );
  }

  const bord = probleme
    ? "border-amber-500/70"
    : tuile.actif
      ? "border-edge"
      : "border-dashed border-edge";

  return (
    <div
      className={`group relative flex items-center gap-2 rounded border ${bord} bg-ink/50 py-1 pl-1 pr-6 hover:border-accent hover:bg-ink`}
      title={[`#${tuile.tileId} ${tuile.nom}`, tuile.actif ? "" : "brouillon", probleme ?? ""]
        .filter(Boolean)
        .join(" · ")}
    >
      {/* Toute la carte ouvre la fiche : un bouton étiré sous le contenu. */}
      <button
        type="button"
        className="absolute inset-0 rounded"
        aria-label={`Modifier ${tuile.nom}`}
        onClick={onOuvrir}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 top-0 w-0.5 rounded-l"
        style={{ background: couleurDe(tuile) }}
      />
      <span className={`pointer-events-none ml-1 ${tuile.actif ? "" : "opacity-50"}`}>
        <Vignette chemin={cheminIcone(tuile)} alt="" taille={26} />
      </span>
      <span
        className={`pointer-events-none min-w-0 flex-1 text-xs leading-tight ${
          tuile.actif ? "text-slate-200" : "text-slate-500"
        }`}
      >
        {tuile.nom}
      </span>
      <button
        type="button"
        className="absolute right-1 top-1/2 -translate-y-1/2 px-1 text-xs text-slate-600 opacity-0 hover:text-red-400 focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        aria-label={`Supprimer ${tuile.nom}`}
        onClick={onDemander}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Une flèche de rangement. Deux d'entre elles tiennent dans la hauteur du titre
 * de ligne, d'où la taille minuscule et l'interligne serré.
 *
 * ⚠️ `disabled` plutôt que masqué : une flèche qui DISPARAÎT en bout de liste
 * ferait sauter le titre d'un cran à chaque déplacement, et on cliquerait à
 * côté au coup suivant.
 */
function Fleche({
  sens,
  categorie,
  inactive,
  onClick,
}: {
  sens: -1 | 1;
  categorie: string;
  inactive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={inactive}
      className="px-0.5 hover:text-accent disabled:cursor-default disabled:opacity-25 disabled:hover:text-slate-500"
      aria-label={`${sens === -1 ? "Monter" : "Descendre"} ${categorie}`}
      title={`${sens === -1 ? "Monter" : "Descendre"} « ${categorie} » — range aussi le magasin du jeu`}
      onClick={onClick}
    >
      {sens === -1 ? "▲" : "▼"}
    </button>
  );
}
