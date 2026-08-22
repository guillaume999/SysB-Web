/**
 * 3DmodelTuile — le pont entre les prefabs du jeu Unity et le site d'admin.
 *
 * Un record de la collection `tuile3dmodel` ne porte plus qu'une chose utile au jeu :
 * **le chemin du prefab**. Tout le reste (nom d'affichage, type de plateau, vignette) a été
 * retiré le 2026-08-22 — c'était de la décoration d'admin, et le type était de toute façon
 * déductible du dossier. Les trois `section*` restent, comme libellés de classement libres.
 *
 * Ce qui est jouable — coûts, productions, conditions — vit dans le catalogue de tuiles
 * (`tuiles`), qui se construit *à partir* de ces modèles.
 *
 * ⚠️ Le lien avec Unity est le champ `nom_dans_le_jeu`, et il est **littéral** :
 * le jeu fait `Resources.Load(nom_dans_le_jeu)`. Une faute de frappe ne se voit pas ici,
 * elle se voit dans le jeu sous forme de case vide.
 */

import { pb } from "@/lib/pb";

export const COLLECTION_MODELES_3D = "tuile3dmodel";

export type TypePlateau = "ground" | "space";

/**
 * Déclaré en `type` et non en `interface` : le SDK PocketBase attend un
 * `RecordModel` indexable, auquel une interface n'est pas assignable.
 */
export type Modele3D = {
  id: string;
  collectionId: string;
  collectionName: string;
  /** Chemin du prefab sous `Assets/Resources/`, sans extension. */
  nom_dans_le_jeu: string;
  /** Trois libellés de classement libres, tous facultatifs. */
  section: string;
  section2: string;
  section3: string;
  created: string;
  updated: string;
};

/** Valeurs éditables — ce que le formulaire renvoie. */
export interface ValeursModele3D {
  nom_dans_le_jeu: string;
  section: string;
  section2: string;
  section3: string;
}

/** Les trois champs de section, dans l'ordre, pour éviter de les répéter partout. */
export const CHAMPS_SECTION = ["section", "section2", "section3"] as const;
export type ChampSection = (typeof CHAMPS_SECTION)[number];

/** Sections non vides d'un modèle, prêtes à afficher. */
export function sectionsDe(modele: Modele3D): string[] {
  return CHAMPS_SECTION.map((c) => modele[c]?.trim() ?? "").filter((v) => v !== "");
}

/** Valeurs déjà utilisées pour un champ de section, pour l'autocomplétion. */
export function sectionsConnues(modeles: Modele3D[], champ: ChampSection): string[] {
  const vues = new Set<string>();
  for (const m of modeles) {
    const v = m[champ]?.trim();
    if (v) vues.add(v);
  }
  return [...vues].sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * Là où vivent les prefabs dans le projet Unity, à la date du 22/08/2026 :
 * `Assets/Resources/Prefabs/Empire/Earth/{Ground,Space}/`.
 * `Resources.Load` prend le chemin relatif à `Resources/`, sans extension.
 */
export const RACINE_PREFABS = "Prefabs/Empire/Earth";

/**
 * Prefabs présents dans le projet au 22/08/2026, proposés en autocomplétion.
 * C'est une **aide à la saisie**, pas une contrainte : le champ reste libre,
 * pour ne pas bloquer l'admin quand un prefab est ajouté côté Unity sans que
 * cette liste soit remise à jour.
 */
export const PREFABS_CONNUS: string[] = [
  "Prefabs/Empire/Earth/Ground/BEIGE",
  "Prefabs/Empire/Earth/Ground/BLEU",
  "Prefabs/Empire/Earth/Ground/MOUTON",
  "Prefabs/Empire/Earth/Ground/VERT",
  "Prefabs/Empire/Earth/Ground/VERT_BLE",
  "Prefabs/Empire/Earth/Ground/VERT_FORET",
  "Prefabs/Empire/Earth/Ground/VERT_MOULIN",
  "Prefabs/Empire/Earth/Ground/Vert_abattoir",
  "Prefabs/Empire/Earth/Ground/Vert_bovin",
  "Prefabs/Empire/Earth/Ground/Vert_volcan",
  "Prefabs/Empire/Earth/Space/Recup_materiaux4",
  "Prefabs/Empire/Earth/Space/Space_centre_trie",
  "Prefabs/Empire/Earth/Space/Space_porte",
  "Prefabs/Empire/Earth/Space/Tile_transparente_doree",
];

/**
 * Type déduit du **dossier** du prefab, seule source depuis que le champ
 * `typeOfPlateau` a été retiré. Null quand le chemin ne dit rien.
 */
export function typeDepuisChemin(chemin: string): TypePlateau | null {
  const bas = chemin.toLowerCase();
  if (bas.includes("/space/")) return "space";
  if (bas.includes("/ground/")) return "ground";
  return null;
}

/** Nom court à afficher : le dernier segment du chemin. */
export function libelle(modele: Modele3D): string {
  return modele.nom_dans_le_jeu.split("/").pop() || modele.nom_dans_le_jeu;
}

export function loadModeles3D(): Promise<Modele3D[]> {
  return pb.collection(COLLECTION_MODELES_3D).getFullList<Modele3D>({ sort: "nom_dans_le_jeu" });
}

/**
 * Erreurs de saisie repérables depuis le site, sans ouvrir Unity.
 * On ne bloque jamais la saisie : on signale.
 */
export function avertissements(modele: Modele3D): string[] {
  const liste: string[] = [];
  const chemin = modele.nom_dans_le_jeu;

  if (chemin !== chemin.trim()) liste.push("Le chemin commence ou finit par un espace.");
  if (/\.(prefab|fbx|blend)$/i.test(chemin))
    liste.push("Retire l'extension : Resources.Load attend un chemin sans « .prefab ».");
  if (chemin.startsWith("Assets/") || chemin.includes("Resources/"))
    liste.push("Le chemin est relatif à Resources/ : commence à « Prefabs/… ».");
  if (!typeDepuisChemin(chemin))
    liste.push(`Chemin hors des dossiers connus (« ${RACINE_PREFABS}/Ground » ou « /Space »).`);

  return liste;
}
