import { useMemo } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Vignette } from "@/components/Vignette";
import { SANS_AGE, libelleAge, numerosDeclares, type Age } from "@/lib/ages";
import { rangerEnGrille } from "@/lib/grilleTuiles";
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
 */
export default function GrilleTuiles({
  tuiles,
  ages,
  probleme,
  avertissement,
  aSupprimer,
  onOuvrir,
  onDemanderSuppression,
  onSupprimer,
}: {
  tuiles: Tuile[];
  ages: Age[];
  /** Le souci de modèle 3D d'une tuile, ou null. */
  probleme: (t: Tuile) => string | null;
  /** Ce qu'on dit avant de supprimer (tuiles qui citent son id…). */
  avertissement: (t: Tuile) => string;
  /** L'id de la tuile dont la suppression attend confirmation, ou null. */
  aSupprimer: string | null;
  onOuvrir: (t: Tuile) => void;
  onDemanderSuppression: (id: string | null) => void;
  onSupprimer: (t: Tuile) => void;
}) {
  const grille = useMemo(() => rangerEnGrille(tuiles, numerosDeclares(ages)), [tuiles, ages]);

  return (
    <div>
      <div className="card max-h-[75vh] overflow-auto">
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
            {grille.categories.map((categorie) => (
              <tr key={categorie}>
                <th className="sticky left-0 z-10 border-b border-r border-edge bg-panel px-3 py-2 text-left align-top text-[11px] font-semibold uppercase tracking-wide text-[#39ff14]">
                  {categorie}
                  <span className="ml-2 font-normal tabular-nums text-slate-500">
                    {grille.totalCategorie(categorie)}
                  </span>
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
            ))}
          </tbody>
        </table>
      </div>

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
        <Terme nom="carte">
          un clic ouvre la fiche d'édition. Grisée et en pointillé = brouillon ; bord orange = modèle
          3D absent ou introuvable. La croix supprime, après confirmation.
        </Terme>
        <Terme nom="filtres">
          ils vident des cases sans retirer de ligne ni de colonne. Le tri choisi en vue Liste
          s'applique aussi à l'ordre des cartes dans une case.
        </Terme>
      </Aide>
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
