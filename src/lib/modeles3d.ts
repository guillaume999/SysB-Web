/**
 * 3DmodelTuile — le pont entre les prefabs du jeu Unity et le site d'admin.
 *
 * Un record de la collection `tuile3dmodel` désigne un prefab, en deux morceaux :
 * `nom_prefab` (le fichier) et `chemin_prefab` (le dossier qui le contient, compté
 * **à partir de `Assets/Resources/Prefabs/`**). Le segment « Prefabs » est donc
 * implicite et n'est pas stocké — c'est `cheminJeu()` qui le remet pour produire
 * l'argument de `Resources.Load`.
 *
 * Les quatre `section*` sont des libellés de classement libres, tous facultatifs.
 *
 * Ce qui est jouable — coûts, productions, conditions — vit dans le catalogue de tuiles
 * (`tuiles`), qui se construit *à partir* de ces modèles.
 *
 * ⚠️ Le lien avec Unity est **littéral** : le jeu fait `Resources.Load(cheminJeu(modele))`.
 * Une faute de frappe ne se voit pas ici, elle se voit dans le jeu sous forme de case vide.
 */

import { pb } from "@/lib/pb";

export const COLLECTION_MODELES_3D = "tuile3dmodel";

export type TypePlateau = "ground" | "space";

/**
 * Dossier racine des prefabs sous `Assets/Resources/`. Il n'est pas stocké :
 * `chemin_prefab` part juste après lui.
 */
export const RACINE_PREFABS = "Prefabs";

/**
 * Déclaré en `type` et non en `interface` : le SDK PocketBase attend un
 * `RecordModel` indexable, auquel une interface n'est pas assignable.
 */
export type Modele3D = {
  id: string;
  collectionId: string;
  collectionName: string;
  /** Nom du fichier prefab, sans extension. Ex. `VERT_BLE`. */
  nom_prefab: string;
  /** Dossier, à partir de `Assets/Resources/Prefabs/`. Ex. `Empire/Earth/Ground`. Peut être vide. */
  chemin_prefab: string;
  /** Quatre libellés de classement libres, tous facultatifs. */
  section: string;
  section2: string;
  section3: string;
  section4: string;
  created: string;
  updated: string;
};

/** Valeurs éditables — ce que le formulaire renvoie. */
export interface ValeursModele3D {
  nom_prefab: string;
  chemin_prefab: string;
  section: string;
  section2: string;
  section3: string;
  section4: string;
}

/** Les quatre champs de section, dans l'ordre, pour éviter de les répéter partout. */
export const CHAMPS_SECTION = ["section", "section2", "section3", "section4"] as const;
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
 * Le chemin que `Resources.Load` reçoit : `Prefabs/<chemin_prefab>/<nom_prefab>`.
 * Les segments vides sont écartés, donc un prefab posé directement sous `Prefabs/`
 * (chemin vide) donne bien `Prefabs/NOM` et pas `Prefabs//NOM`.
 */
export function cheminJeuDe(chemin: string, nom: string): string {
  return [RACINE_PREFABS, chemin.replace(/^\/+|\/+$/g, ""), nom]
    .filter((s) => s.trim() !== "")
    .join("/");
}

export function cheminJeu(modele: Modele3D): string {
  return cheminJeuDe(modele.chemin_prefab ?? "", modele.nom_prefab);
}

/**
 * Prefabs présents dans le projet Unity, proposés en autocomplétion.
 *
 * ⚠️ BLOC GÉNÉRÉ — ne pas éditer à la main. Il est réécrit par l'outil d'éditeur
 * Unity `SySB → Relever les prefabs pour le site`, qui balaie
 * `Assets/Resources/Prefabs/` et remplace tout ce qui se trouve entre les deux
 * balises RELEVE_PREFABS. C'est une **aide à la saisie**, pas une contrainte :
 * les champs du formulaire restent libres, pour ne jamais bloquer l'admin quand
 * un prefab vient d'être ajouté côté Unity.
 */
// <<< RELEVE_PREFABS  releve du 2026-08-26  —  genere, ne pas editer a la main
export const PREFABS_CONNUS: { chemin: string; nom: string }[] = [
  { chemin: "Empire/Earth/Ground", nom: "BEIGE" },
  { chemin: "Empire/Earth/Ground", nom: "BLEU" },
  { chemin: "Empire/Earth/Ground", nom: "BLEU_PECHEUR" },
  { chemin: "Empire/Earth/Ground", nom: "Briquerie" },
  { chemin: "Empire/Earth/Ground", nom: "CENTRE_VILLAGE" },
  { chemin: "Empire/Earth/Ground", nom: "Distillerie" },
  { chemin: "Empire/Earth/Ground", nom: "Entrepot_bois" },
  { chemin: "Empire/Earth/Ground", nom: "MOUTON" },
  { chemin: "Empire/Earth/Ground", nom: "RUCHER" },
  { chemin: "Empire/Earth/Ground", nom: "STONE_AUTEL" },
  { chemin: "Empire/Earth/Ground", nom: "VERT" },
  { chemin: "Empire/Earth/Ground", nom: "VERT_ARGILE" },
  { chemin: "Empire/Earth/Ground", nom: "VERT_BAIES" },
  { chemin: "Empire/Earth/Ground", nom: "VERT_BLE" },
  { chemin: "Empire/Earth/Ground", nom: "VERT_BUCHERON" },
  { chemin: "Empire/Earth/Ground", nom: "VERT_CARRIERE" },
  { chemin: "Empire/Earth/Ground", nom: "VERT_FORET" },
  { chemin: "Empire/Earth/Ground", nom: "VERT_MOULIN" },
  { chemin: "Empire/Earth/Ground", nom: "Vert_abattoir" },
  { chemin: "Empire/Earth/Ground", nom: "Vert_bovin" },
  { chemin: "Empire/Earth/Ground", nom: "Vert_volcan" },
  { chemin: "Empire/Earth/Ground", nom: "habitation_bois1" },
  { chemin: "Empire/Earth/Ground", nom: "habitation_bois2" },
  { chemin: "Empire/Earth/Ground/building", nom: "bat_admin01" },
  { chemin: "Empire/Earth/Ground/building", nom: "bat_admin02" },
  { chemin: "Empire/Earth/Ground/building", nom: "buildings" },
  { chemin: "Empire/Earth/Ground/building", nom: "eglise" },
  { chemin: "Empire/Earth/Ground/building", nom: "habitation_pierre" },
  { chemin: "Empire/Earth/Ground/building", nom: "hopital" },
  { chemin: "Empire/Earth/Space", nom: "Recup_materiaux4" },
  { chemin: "Empire/Earth/Space", nom: "Space_centre_trie" },
  { chemin: "Empire/Earth/Space", nom: "Space_porte" },
  { chemin: "Empire/Earth/Space", nom: "Tile_transparente_doree" },
];
export const RELEVE_PREFABS_DATE = "2026-08-26";
// RELEVE_PREFABS >>>

/** Dossiers distincts relevés dans le projet, pour l'autocomplétion du chemin. */
export const DOSSIERS_CONNUS: string[] = [...new Set(PREFABS_CONNUS.map((p) => p.chemin))];

/** Chemins connus, reconstitués — sert à repérer une saisie inventée. */
const CHEMINS_JEU_CONNUS = new Set(PREFABS_CONNUS.map((p) => cheminJeuDe(p.chemin, p.nom)));

export function estPrefabConnu(chemin: string, nom: string): boolean {
  return CHEMINS_JEU_CONNUS.has(cheminJeuDe(chemin, nom));
}

/**
 * Type déduit du **dossier** du prefab, seule source depuis que le champ
 * `typeOfPlateau` a été retiré. Null quand le dossier ne dit rien.
 */
export function typeDepuisChemin(chemin: string): TypePlateau | null {
  const segments = chemin.toLowerCase().split("/");
  if (segments.includes("space")) return "space";
  if (segments.includes("ground")) return "ground";
  return null;
}

/** Nom court à afficher. */
export function libelle(modele: Modele3D): string {
  return modele.nom_prefab;
}

export function loadModeles3D(): Promise<Modele3D[]> {
  return pb
    .collection(COLLECTION_MODELES_3D)
    .getFullList<Modele3D>({ sort: "chemin_prefab,nom_prefab" });
}

/**
 * Erreurs de saisie repérables depuis le site, sans ouvrir Unity.
 * On ne bloque jamais la saisie : on signale.
 *
 * ⚠️ Le dernier avertissement se compare à `PREFABS_CONNUS`, un RELEVÉ daté du
 * projet Unity. Il n'y a donc rien à « vérifier » depuis le site : le signal
 * vieillit tout seul dès qu'un prefab est ajouté côté Unity, et la réponse est
 * de refaire le relevé — menu `SySB → Relever les prefabs pour le site`, qui
 * réécrit le bloc balisé ci-dessus.
 */
export function avertissementsDe(chemin: string, nom: string): string[] {
  const liste: string[] = [];

  if (nom !== nom.trim() || chemin !== chemin.trim())
    liste.push("Un des champs commence ou finit par un espace.");
  if (/\.(prefab|fbx|blend)$/i.test(nom))
    liste.push("Retire l'extension du nom : Resources.Load attend « VERT_BLE », pas « VERT_BLE.prefab ».");
  if (nom.includes("/"))
    liste.push("Le nom ne doit pas contenir de « / » — les dossiers vont dans le champ chemin.");
  if (/^(Assets\/|Resources\/)/i.test(chemin) || /(^|\/)Prefabs(\/|$)/i.test(chemin))
    liste.push("Le chemin part APRÈS Assets/Resources/Prefabs/ : commence à « Empire/… ».");
  if (chemin.trim() !== "" && !typeDepuisChemin(chemin))
    liste.push("Dossier hors des emplacements connus (« …/Ground » ou « …/Space »).");
  if (nom.trim() !== "" && !estPrefabConnu(chemin, nom))
    liste.push(
      `Ce prefab ne figure pas dans le relevé du projet Unity du ${RELEVE_PREFABS_DATE}. ` +
        "Rien à valider ici : ou bien le nom est faux, ou bien le prefab a été ajouté " +
        "depuis, et c'est le relevé qu'il faut refaire — menu Unity « SySB → Relever les " +
        "prefabs pour le site ».",
    );

  return liste;
}

export function avertissements(modele: Modele3D): string[] {
  return avertissementsDe(modele.chemin_prefab ?? "", modele.nom_prefab);
}
