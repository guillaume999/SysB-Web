// ============================================================
//  planetes.ts
//  LA PLANÈTE — l'objet que `typeOfPlateau2` n'était pas encore.
//
//  Jusqu'au 14/09, « le monde » d'une ligne était une ÉTIQUETTE TEXTE
//  (`typeOfPlateau2` : « Terre », « Jupiter ») posée sur `tuiles`, `templates`
//  et `plateaux`. Elle disait déjà la bonne chose ; il lui manquait d'être un
//  objet — un id, un propriétaire, un nom saisi, une apparence. Sans ça, une
//  planète de joueur n'a rien à quoi se rattacher, et rien à montrer sur une
//  fiche.
//
//  ⚠️⚠️ UN SEUL CHAMP SÉPARE LES DEUX FAMILLES : `proprietaire`.
//    vide    → **planète game** (celles de l'administrateur : Terre, Jupiter)
//    rempli  → **planète de joueur**
//  Ne PAS ajouter à côté un booléen « est_game » : ce serait deux vérités pour
//  une même chose, et un jour elles diraient le contraire l'une de l'autre.
//
//  ⚠️ « GAME » EST UNE PLANÈTE À PART — un record sans propriétaire ET auquel
//  aucun `templates` n'est rattaché. Il porte le contenu commun à toutes les
//  planètes de l'administrateur (« bois », « métallurgie »). Il n'est pas
//  jouable, et c'est l'absence de modèle qui le dit : `assurer` ne peut rien en
//  faire.
//
//  ⚠️ CE FICHIER CACHE ET PROPOSE, IL NE PROTÈGE RIEN. Ce qui refuse une
//  écriture, ce sont les règles d'API PocketBase et le crochet du serveur Go.
//  Voir l'en-tête de `lib/acces.ts`, qui dit la même chose pour les écrans.
// ============================================================

import { pb } from "@/lib/pb";

export const COLLECTION_PLANETES = "planetes";
export const COLLECTION_ICONES = "icones";

/** Le nom du porte-contenu commun. Posé par `patch-planetes-2026-09-14.js`. */
export const NOM_GAME = "Game";

export type Planete = {
  id: string;
  nom: string;
  /** Relation → `users`. **Vide = planète game.** */
  proprietaire: string;
  /** Relation → `tuile3dmodel` : la sphère montrée dans la scène. */
  modele3d?: string;
  /** Relation → `icones` : la vignette de la fiche. */
  icone?: string;
  created: string;
  updated: string;
};

/**
 * Tout ce que l'administrateur peut ouvrir à une planète : un modèle 3D, une
 * icône. Les deux portent **exactement** les deux mêmes champs — c'est ce qui
 * permet à `autoriseeSur` de n'exister qu'en un exemplaire.
 */
export interface Partageable {
  /** Les planètes à qui c'est ouvert, une par une. */
  planetes_autorisees?: string[];
  /** Ouvert à **toutes** les planètes, y compris celles créées demain. */
  toutes_planetes?: boolean;
}

/** Une icône déclarée — le pendant de `tuile3dmodel` pour les images 2D. */
export type Icone = Partageable & {
  id: string;
  /** Sous `Assets/Resources/`, sans extension. Ex. `Icones_Tuiles/ble`. */
  chemin: string;
  usage: UsageIcone;
  nom?: string;
};

/**
 * ⚠️ L'usage **se déduit du dossier** au relevé, il ne se saisit pas :
 * `Icones_Tuiles/` → tuile · `Icones/` → ressource · `Icones_Technos/` → techno
 * · `Icones_Planetes/` → planete. Les quatre dossiers sont disjoints, donc un
 * select SIMPLE suffit. Le jour où une même icône servira à deux familles,
 * c'est **ici** qu'il devra passer en multiple, et nulle part ailleurs.
 */
export type UsageIcone = "tuile" | "ressource" | "techno" | "planete";

/** Idem pour les modèles 3D, qui n'ont que deux usages : une tuile, ou une planète. */
export type UsageModele3D = "tuile" | "planete";

/**
 * ⚠️ **Vide se lit « tuile »**, et c'est ce qui rend le patch gratuit : les 28
 * modèles en service n'ont rien à migrer. Passer un modèle à `planete` le sort
 * de la liste des tuiles pour le mettre dans celle des planètes.
 */
export function usageDuModele3D(m: { usage?: string }): UsageModele3D {
  return m.usage === "planete" ? "planete" : "tuile";
}

/** Vrai pour une planète de l'administrateur — Terre, Jupiter, et « Game ». */
export function estPlaneteGame(p: Planete): boolean {
  return !(p.proprietaire ?? "").trim();
}

/** Vrai pour le porte-contenu commun, qui ne se joue pas. */
export function estGame(p: Planete): boolean {
  return p.nom === NOM_GAME;
}

/**
 * ⚠️⚠️ **LA RÈGLE DU PARTAGE — elle vit ICI et nulle part ailleurs.**
 *
 *     autorisé  =  toutes_planetes
 *               || la planète est dans planetes_autorisees
 *               || la planète n'a PAS de propriétaire   (planète game)
 *
 * ⚠️ **Une liste vide veut dire « à personne », pas « à tout le monde ».**
 * C'est pour ça qu'il faut les DEUX champs : avec « vide = toutes », on
 * perdrait la seule façon de dire « rien pour l'instant », et une entrée
 * oubliée s'ouvrirait à tous en silence.
 *
 * ⚠️ La troisième branche est ce qui rend le patch indolore : les 28 prefabs et
 * les icônes en service restent utilisables sur la Terre et Jupiter **sans
 * qu'on ait rien coché**. Une planète de joueur, elle, n'a rien tant que
 * l'administrateur n'a pas ouvert.
 *
 * ⚠️ Et ce n'est PAS un garde-fou : le refus qui compte est celui du serveur
 * Go, au moment où la tuile s'enregistre. Ici on évite juste au joueur de
 * choisir dans une liste ce qui lui serait refusé ensuite.
 */
export function autoriseeSur(part: Partageable, planete: Planete | null | undefined): boolean {
  if (!planete) return false;
  if (part.toutes_planetes === true) return true;
  if ((part.planetes_autorisees ?? []).includes(planete.id)) return true;
  return estPlaneteGame(planete);
}

/** Ce qu'une planète a le droit d'utiliser, dans une liste quelconque. */
export function ouvertsA<T extends Partageable>(liste: T[], planete: Planete | null): T[] {
  return liste.filter((x) => autoriseeSur(x, planete));
}

/**
 * Pourquoi une planète ne peut rien créer, en une phrase — ou `null` si elle
 * peut.
 *
 * ⚠️ **Il lui faut les DEUX** : un modèle 3D *et* une icône. Une planète à qui
 * l'administrateur n'a ouvert que l'un des deux est **injouable, et rien ne
 * l'annonce** — c'est cette phrase-là qui l'annonce, et elle NOMME laquelle des
 * deux listes est vide.
 */
export function pourquoiRienACreer(
  planete: Planete | null,
  modeles3d: Partageable[],
  icones: Partageable[],
): string | null {
  if (!planete) return "Aucune planète choisie.";
  const m = ouvertsA(modeles3d, planete).length;
  const i = ouvertsA(icones, planete).length;
  if (m > 0 && i > 0) return null;
  if (m === 0 && i === 0)
    return `Aucun modèle 3D ni aucune icône n'est ouvert à « ${planete.nom} » : elle ne peut porter aucune tuile. C'est à l'administrateur de les ouvrir.`;
  if (m === 0)
    return `Aucun MODÈLE 3D n'est ouvert à « ${planete.nom} » (${i} icône(s) le sont). Une tuile a besoin des deux.`;
  return `Aucune ICÔNE n'est ouverte à « ${planete.nom} » (${m} modèle(s) 3D le sont). Une tuile a besoin des deux.`;
}

/**
 * L'ordre d'affichage : **« Game » d'abord** — c'est le contenu commun, celui
 * qu'on ouvre en premier — puis les planètes de l'administrateur, puis celles
 * des joueurs, chaque groupe par ordre alphabétique.
 */
export function triAdmin(planetes: Planete[]): Planete[] {
  const rang = (p: Planete) => (estGame(p) ? 0 : estPlaneteGame(p) ? 1 : 2);
  return [...planetes].sort(
    (a, b) => rang(a) - rang(b) || a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }),
  );
}

/**
 * Le rang d'un modèle dans l'onglet Modèles : ceux du **jeu** d'abord, puis
 * ceux des **joueurs**, puis ceux que **personne** n'a rangés — ces derniers en
 * bas, là où on les remarque.
 */
export function rangAppartenance(valeur: string | undefined | null): number {
  const a = appartenance(valeur);
  return a.famille === "game" ? 0 : a.famille === "joueur" ? 1 : 2;
}

/** Le nom d'une planète d'après son id — pour les écrans, jamais pour décider. */
export function nomDePlanete(planetes: Planete[], id: string | undefined): string {
  if (!id) return "aucune planète";
  return planetes.find((p) => p.id === id)?.nom ?? "planète inconnue";
}

/**
 * Ajouter ou retirer une planète de la liste d'un partageable, **sans doublon
 * et sans réordonner**. Rend la liste telle qu'elle doit être enregistrée.
 */
export function avecPlanete(part: Partageable, planeteId: string, ouvert: boolean): string[] {
  const actuelles = part.planetes_autorisees ?? [];
  if (ouvert) return actuelles.includes(planeteId) ? actuelles : [...actuelles, planeteId];
  return actuelles.filter((id) => id !== planeteId);
}

export function loadPlanetes(): Promise<Planete[]> {
  return pb
    .collection(COLLECTION_PLANETES)
    .getFullList<Planete>({ sort: "created" })
    .then((l) => l.map((p) => ({ ...p, proprietaire: (p.proprietaire ?? "") as string })));
}

export function loadIcones(): Promise<Icone[]> {
  return pb.collection(COLLECTION_ICONES).getFullList<Icone>({ sort: "chemin" });
}

/* ------------------------------------------------------------------ */
/* À qui appartient un modèle — `templates.appartient` (15/09)          */
/* ------------------------------------------------------------------ */

/**
 * La valeur d'`appartient` pour un modèle **du jeu**.
 *
 * ⚠️⚠️ `appartient` est un texte à deux familles : `"game"`, ou l'**id** du
 * joueur. **Vide ne veut PAS dire « game »** : c'est un modèle que personne
 * n'a rangé, et l'écran le signale. C'est aussi pourquoi le pseudo « game »
 * est interdit (`pseudoReserve`) — le serveur Go le refuse de son côté.
 */
export const APPARTIENT_GAME = "game";

export type Appartenance =
  | { famille: "game" }
  | { famille: "joueur"; id: string }
  | { famille: "personne" };

export function appartenance(valeur: string | undefined | null): Appartenance {
  const v = (valeur ?? "").trim();
  if (v === "") return { famille: "personne" };
  if (v === APPARTIENT_GAME) return { famille: "game" };
  return { famille: "joueur", id: v };
}

/**
 * Ce qu'`appartient` doit valoir pour un modèle rattaché à cette planète :
 * `"game"` pour une planète sans propriétaire, l'id du propriétaire sinon.
 */
export function appartientPourPlanete(planete: Planete | null | undefined): string {
  const proprio = (planete?.proprietaire ?? "").trim();
  return proprio === "" ? APPARTIENT_GAME : proprio;
}

/** « game » (casse et espaces ignorés) est réservé — voir `APPARTIENT_GAME`. */
export function pseudoReserve(pseudo: string | undefined | null): boolean {
  return (pseudo ?? "").trim().toLowerCase() === APPARTIENT_GAME;
}

/** Même phrase que le serveur Go (`routes.VerdictPseudoReserve`). */
export const VERDICT_PSEUDO_RESERVE = "« game » est réservé au jeu : choisis un autre pseudo.";
