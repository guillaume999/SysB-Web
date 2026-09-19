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
import { normaliserPartage, type Partageable } from "@/lib/planetes";

export const COLLECTION_MODELES_3D = "tuile3dmodel";

export type TypePlateau = "ground" | "space" | "TPTplateau";

/**
 * Les types de plateau, dans l'ordre d'affichage. **Point unique** : les listes
 * deroulantes du site (modele, tuile) et les comptes du catalogue les lisent
 * ici. Ajouter un type ailleurs qu'ici, c'est le voir manquer dans un ecran sur
 * deux.
 *
 * `TPTplateau` est arrive le 2026-08-29 : un plateau a lui seul, dans
 * `PlateauScene`, avec son propre catalogue de tuiles
 * (`Prefabs/Univers/Plateau/`). Il ne partage rien avec `ground`.
 */
export const TYPES_PLATEAU: TypePlateau[] = ["ground", "space", "TPTplateau"];

/**
 * Dossier racine des prefabs sous `Assets/Resources/`. Il n'est pas stocké :
 * `chemin_prefab` part juste après lui.
 */
export const RACINE_PREFABS = "Prefabs";

/**
 * Déclaré en `type` et non en `interface` : le SDK PocketBase attend un
 * `RecordModel` indexable, auquel une interface n'est pas assignable.
 */
export type Modele3D = Partageable & {
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
  /** `tuile` · `planete` — vide se lit « tuile » (voir `usageDuModele3D`). */
  usage?: string;
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
// <<< RELEVE_PREFABS  releve du 2026-09-19  —  genere, ne pas editer a la main
export const PREFABS_CONNUS: { chemin: string; nom: string }[] = [
  { chemin: "Empire", nom: "BLEU_SELECTION" },
  { chemin: "Empire/Earth/Ground", nom: "BEIGE" },
  { chemin: "Empire/Earth/Ground", nom: "BLEU" },
  { chemin: "Empire/Earth/Ground", nom: "Foret" },
  { chemin: "Empire/Earth/Ground", nom: "VERT" },
  { chemin: "Empire/Earth/Ground", nom: "abattoir" },
  { chemin: "Empire/Earth/Ground", nom: "acierie" },
  { chemin: "Empire/Earth/Ground", nom: "arcologie" },
  { chemin: "Empire/Earth/Ground", nom: "arene_gravite_variable" },
  { chemin: "Empire/Earth/Ground", nom: "astroport" },
  { chemin: "Empire/Earth/Ground", nom: "atelier_holographique" },
  { chemin: "Empire/Earth/Ground", nom: "atelier_textile" },
  { chemin: "Empire/Earth/Ground", nom: "autel" },
  { chemin: "Empire/Earth/Ground", nom: "boulangerie" },
  { chemin: "Empire/Earth/Ground", nom: "brasserie" },
  { chemin: "Empire/Earth/Ground", nom: "carriere" },
  { chemin: "Empire/Earth/Ground", nom: "cathedrale" },
  { chemin: "Empire/Earth/Ground", nom: "centrale_electrique" },
  { chemin: "Empire/Earth/Ground", nom: "centrale_vapeur" },
  { chemin: "Empire/Earth/Ground", nom: "centre_admin" },
  { chemin: "Empire/Earth/Ground", nom: "chaine_automatisee" },
  { chemin: "Empire/Earth/Ground", nom: "champ_canne" },
  { chemin: "Empire/Earth/Ground", nom: "champ_tir" },
  { chemin: "Empire/Earth/Ground", nom: "chantier_naval_orbital" },
  { chemin: "Empire/Earth/Ground", nom: "chapelle" },
  { chemin: "Empire/Earth/Ground", nom: "charbonniere" },
  { chemin: "Empire/Earth/Ground", nom: "chateau_eau" },
  { chemin: "Empire/Earth/Ground", nom: "cimenterie" },
  { chemin: "Empire/Earth/Ground", nom: "cite_dome_intelligente" },
  { chemin: "Empire/Earth/Ground", nom: "cite_ouvriere" },
  { chemin: "Empire/Earth/Ground", nom: "cite_universitaire" },
  { chemin: "Empire/Earth/Ground", nom: "cocon_mutaculture" },
  { chemin: "Empire/Earth/Ground", nom: "colisee_orbital" },
  { chemin: "Empire/Earth/Ground", nom: "collecteur_neutrinos" },
  { chemin: "Empire/Earth/Ground", nom: "complexe_medical" },
  { chemin: "Empire/Earth/Ground", nom: "complexe_olympique" },
  { chemin: "Empire/Earth/Ground", nom: "complexe_residentiel" },
  { chemin: "Empire/Earth/Ground", nom: "conseil_transhumain" },
  { chemin: "Empire/Earth/Ground", nom: "conserverie" },
  { chemin: "Empire/Earth/Ground", nom: "consul_colonial" },
  { chemin: "Empire/Earth/Ground", nom: "couture" },
  { chemin: "Empire/Earth/Ground", nom: "cuve_artisanale" },
  { chemin: "Empire/Earth/Ground", nom: "dispensaire" },
  { chemin: "Empire/Earth/Ground", nom: "distillerie" },
  { chemin: "Empire/Earth/Ground", nom: "distillerie_quantique" },
  { chemin: "Empire/Earth/Ground", nom: "distillerie_whisky" },
  { chemin: "Empire/Earth/Ground", nom: "dome_atmosphere" },
  { chemin: "Empire/Earth/Ground", nom: "ecole" },
  { chemin: "Empire/Earth/Ground", nom: "entrepot_antigrav" },
  { chemin: "Empire/Earth/Ground", nom: "entrepot_bois" },
  { chemin: "Empire/Earth/Ground", nom: "entrepot_brique" },
  { chemin: "Empire/Earth/Ground", nom: "entrepot_industriel" },
  { chemin: "Empire/Earth/Ground", nom: "entrepot_orbital" },
  { chemin: "Empire/Earth/Ground", nom: "entrepot_sous_pression" },
  { chemin: "Empire/Earth/Ground", nom: "entrepot_urbain" },
  { chemin: "Empire/Earth/Ground", nom: "extracteur_orbital" },
  { chemin: "Empire/Earth/Ground", nom: "ferme_hydroponique" },
  { chemin: "Empire/Earth/Ground", nom: "ferme_hydroponique_v2" },
  { chemin: "Empire/Earth/Ground", nom: "ferme_meca" },
  { chemin: "Empire/Earth/Ground", nom: "feu_de_camp" },
  { chemin: "Empire/Earth/Ground", nom: "flotte_peche" },
  { chemin: "Empire/Earth/Ground", nom: "fonderie" },
  { chemin: "Empire/Earth/Ground", nom: "fonderie_alliages" },
  { chemin: "Empire/Earth/Ground", nom: "fonderie_armement" },
  { chemin: "Empire/Earth/Ground", nom: "forge_du_village" },
  { chemin: "Empire/Earth/Ground", nom: "four_a_briques" },
  { chemin: "Empire/Earth/Ground", nom: "galerie_art_design" },
  { chemin: "Empire/Earth/Ground", nom: "gare_ferroviaire" },
  { chemin: "Empire/Earth/Ground", nom: "grand_astroport" },
  { chemin: "Empire/Earth/Ground", nom: "grand_nexus_croyance" },
  { chemin: "Empire/Earth/Ground", nom: "gymnase" },
  { chemin: "Empire/Earth/Ground", nom: "gymnase_v2" },
  { chemin: "Empire/Earth/Ground", nom: "habitat_modulable" },
  { chemin: "Empire/Earth/Ground", nom: "habitat_orbital" },
  { chemin: "Empire/Earth/Ground", nom: "haut_fourneau" },
  { chemin: "Empire/Earth/Ground", nom: "hopital" },
  { chemin: "Empire/Earth/Ground", nom: "hotel_de_ville" },
  { chemin: "Empire/Earth/Ground", nom: "hutte_Bucheron" },
  { chemin: "Empire/Earth/Ground", nom: "immeuble" },
  { chemin: "Empire/Earth/Ground", nom: "injecteur_porte" },
  { chemin: "Empire/Earth/Ground", nom: "institut_recherche" },
  { chemin: "Empire/Earth/Ground", nom: "laboratoire_de_pointe" },
  { chemin: "Empire/Earth/Ground", nom: "laboratoire_neotonique" },
  { chemin: "Empire/Earth/Ground", nom: "lycee_technique" },
  { chemin: "Empire/Earth/Ground", nom: "machines_outils" },
  { chemin: "Empire/Earth/Ground", nom: "mairie" },
  { chemin: "Empire/Earth/Ground", nom: "maison_brique" },
  { chemin: "Empire/Earth/Ground", nom: "manufacture_tabac" },
  { chemin: "Empire/Earth/Ground", nom: "manufacture_tabac_v2" },
  { chemin: "Empire/Earth/Ground", nom: "marche_village" },
  { chemin: "Empire/Earth/Ground", nom: "mine_charbon" },
  { chemin: "Empire/Earth/Ground", nom: "mine_de_fer" },
  { chemin: "Empire/Earth/Ground", nom: "mine_or" },
  { chemin: "Empire/Earth/Ground", nom: "mine_si_ni" },
  { chemin: "Empire/Earth/Ground", nom: "observatoire_runique" },
  { chemin: "Empire/Earth/Ground", nom: "papeterie" },
  { chemin: "Empire/Earth/Ground", nom: "parures" },
  { chemin: "Empire/Earth/Ground", nom: "processeurs_quantiques" },
  { chemin: "Empire/Earth/Ground", nom: "puits" },
  { chemin: "Empire/Earth/Ground", nom: "puits_petrole" },
  { chemin: "Empire/Earth/Ground", nom: "raffinerie_petro" },
  { chemin: "Empire/Earth/Ground", nom: "raffinerie_sucre" },
  { chemin: "Empire/Earth/Ground", nom: "raffinerie_sucre_v2" },
  { chemin: "Empire/Earth/Ground", nom: "raffinerie_titane" },
  { chemin: "Empire/Earth/Ground", nom: "reacteur_fusion" },
  { chemin: "Empire/Earth/Ground", nom: "reseau_telepathie" },
  { chemin: "Empire/Earth/Ground", nom: "residence_acier" },
  { chemin: "Empire/Earth/Ground", nom: "rucher" },
  { chemin: "Empire/Earth/Ground", nom: "salle_fetes" },
  { chemin: "Empire/Earth/Ground", nom: "sanctuaire_elements" },
  { chemin: "Empire/Earth/Ground", nom: "sanctuaire_recumbent" },
  { chemin: "Empire/Earth/Ground", nom: "scierie" },
  { chemin: "Empire/Earth/Ground", nom: "sculpteur_de_corps" },
  { chemin: "Empire/Earth/Ground", nom: "sechoir_bois" },
  { chemin: "Empire/Earth/Ground", nom: "senat_metropolitain" },
  { chemin: "Empire/Earth/Ground", nom: "serre_adaptation_xeno" },
  { chemin: "Empire/Earth/Ground", nom: "silo" },
  { chemin: "Empire/Earth/Ground", nom: "site_de_fouilles" },
  { chemin: "Empire/Earth/Ground", nom: "stabilisateur_porte" },
  { chemin: "Empire/Earth/Ground", nom: "stade" },
  { chemin: "Empire/Earth/Ground", nom: "synthetiseur_matiere" },
  { chemin: "Empire/Earth/Ground", nom: "taverne" },
  { chemin: "Empire/Earth/Ground", nom: "teinturerie" },
  { chemin: "Empire/Earth/Ground", nom: "temple_urbain" },
  { chemin: "Empire/Earth/Ground", nom: "terrain_jeux" },
  { chemin: "Empire/Earth/Ground", nom: "tisserand" },
  { chemin: "Empire/Earth/Ground", nom: "usine_chimique" },
  { chemin: "Empire/Earth/Ground", nom: "usine_electronique" },
  { chemin: "Empire/Earth/Ground", nom: "usine_hydrazine" },
  { chemin: "Empire/Earth/Ground", nom: "usine_quantique" },
  { chemin: "Empire/Earth/Ground", nom: "verrerie" },
  { chemin: "Empire/Earth/Ground/building", nom: "bat_admin02" },
  { chemin: "Empire/Earth/Space", nom: "Tile_transparente_doree" },
  { chemin: "Univers/Plateau", nom: "Foret" },
  { chemin: "Univers/Plateau", nom: "VERT" },
];
export const RELEVE_PREFABS_DATE = "2026-09-19";
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
  // ⚠️ `plateau` AVANT les deux autres : c'est le dossier propre a TPTplateau
  // (`Univers/Plateau`), et il ne contient ni « ground » ni « space ».
  if (segments.includes("plateau")) return "TPTplateau";
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
    .getFullList<Modele3D>({ sort: "chemin_prefab,nom_prefab" })
    .then((l) => l.map(normaliserPartage));
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

/**
 * Ce qui cloche avec le modèle 3D d'une tuile, en une phrase — ou null si tout
 * va bien. Sert à l'onglet Tuiles, qui doit le dire SUR la ligne : sans ça, une
 * tuile dont le prefab a disparu du projet ne se distingue en rien des autres,
 * et il faut ouvrir chaque fiche une par une pour retrouver les coupables.
 *
 * Deux pannes bien différentes, et le remède n'est pas le même :
 *  - plus de modèle du tout (relation vide ou record supprimé) → il faut en
 *    choisir un dans la fiche de la tuile ;
 *  - le modèle existe, mais son prefab n'est plus dans le relevé Unity → soit
 *    le prefab a été supprimé du jeu, soit le relevé est en retard
 *    (menu `SySB → Relever les prefabs pour le site`).
 */
export function problemeDeModele(modele: Modele3D | null | undefined): string | null {
  if (!modele) return "aucun modèle 3D : la tuile ne s'affichera pas sur le plateau";
  if (!estPrefabConnu(modele.chemin_prefab ?? "", modele.nom_prefab))
    return (
      `prefab « ${cheminJeu(modele)} » absent du relevé Unity du ${RELEVE_PREFABS_DATE} : ` +
      "supprimé du projet, ou relevé à refaire"
    );
  return null;
}
