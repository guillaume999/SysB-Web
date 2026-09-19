/**
 * Plateaux : les modèles de l'admin (`templates`) et les copies des joueurs
 * (`plateaux`). Deux collections, un seul format.
 *
 * UNE SEULE COUCHE DE JEU, DEUX ENCODAGES
 * ---------------------------------------
 * Une case porte UNE tuile, point. Mais deux encodages cohabitent parce qu'ils
 * ne portent pas la même chose :
 *
 *  - `tilesBase64` : un `tileId` par case sur 1 ou 2 octets (voir `Cases`),
 *    index `z * largeur + x`. Il dit CE QU'IL Y A. 10 000 cases = 13 Ko.
 *  - `etats` : un tableau json avec une entrée pour les SEULES cases ayant
 *    quelque chose à retenir. Il dit OÙ EN EST chaque bâtiment.
 *
 * La grille est en **offset odd-r** : les rangées impaires sont décalées d'une
 * demi-case vers la droite, espacement vertical sqrt(3)/2. C'est ce que fait
 * `PlateauGenerator.CalculerPosition` côté Unity (`x + (z impair ? 0.5 : 0)`,
 * `z * 0.866`). L'éditeur dessine ce repère avec des **carrés en quinconce** ;
 * les distances, elles, restent hexagonales (`distanceHex`).
 */

import { duCatalogue } from "@/lib/conception";
import { pb } from "@/lib/pb";
import type { TypePlateau } from "@/lib/modeles3d";
import { appartenance, estPlaneteGame, type Planete } from "@/lib/planetes";

export const COLLECTION_TEMPLATES = "templates";
export const COLLECTION_PLATEAUX = "plateaux";

export type SourcePlateau = "templates" | "plateaux";

/** Réservé à la case vide côté `PlateauGenerator`. */
export const TILE_VIDE = 0;

/**
 * L'état d'une case — **format du moteur à cycles** (2026-09-11,
 * `SysB/SPEC_MOTEUR_CYCLES.md` §2bis et §10).
 *
 * ⚠️ **Plus de `t` par case** : c'est le PLATEAU qui porte `t`, l'instant
 * jusqu'où il est à jour. Une case porte l'état de SON cycle — `t_cycle`, la
 * dernière frontière, et `en_marche`. Ni `satisfaction` (un rapport recalculé
 * à chaque cycle) ni `position` de navette (calculée depuis ses horodatages) :
 * les ranger, ce serait écrire deux fois la même vérité.
 *
 * ⚠️ Aucune entrée d'avant le 11/09 n'est convertie : on repart de zéro
 * (§10). `etatsDe` ne garde que les champs de ce format, un vieux `t` part au
 * premier enregistrement.
 */
export interface EtatCase {
  x: number;
  z: number;
  niveau: number;
  actif: boolean;
  /** Le coffre de la case, en **unités réelles entières** — le 1/3600 a disparu (§3). */
  stock: Record<string, number>;
  /** La dernière frontière de cycle, en secondes d'horloge SERVEUR. `0` = jamais tourné. */
  t_cycle: number;
  /** `false` = à l'arrêt DEPUIS `t_cycle`. La fin du cycle en cours vaut `t_cycle + durée`. */
  en_marche: boolean;
  /**
   * Les navettes de cette case, en vol — imbriquées dans leur propriétaire pour
   * que détruire le bâtiment les emporte (§10). Le site ne les édite pas : il
   * les **recopie telles quelles**, un plateau de joueur rouvert ici ne doit pas
   * perdre ses voyages en cours.
   */
  navettes: Navette[];
  /** Fin du chantier, heure serveur. Absent = pas de chantier en cours. */
  chantier_fin?: number;
}

/**
 * Une navette telle que le moteur l'écrit. **Opaque pour le site** : seul le
 * moteur la crée et la fait avancer, d'où l'index ouvert — un champ qu'il
 * ajoute demain doit survivre à un enregistrement fait ici.
 */
export interface Navette {
  origine: [number, number];
  destination: [number, number];
  parti_a: number;
  arrive_a: number;
  charge: Record<string, number>;
  [autre: string]: unknown;
}

// --- Amorcage : comment une partie demarre ----------------------------------
//
// ⚠️ **LA GRATUITE N'EST PLUS ICI.** Elle a fait l'aller-retour :
//   · avant le 24/08 elle vivait sur la tuile (`tuiles.premiers_gratuits`) ;
//   · le 24/08 elle est passee sur le MODELE de plateau, au motif qu'une tuile
//     est une entree de catalogue generique et que le meme entrepot doit
//     pouvoir etre offert sur un plateau de debutant et payant ailleurs ;
//   · le **26/08 l'utilisateur l'a voulue de nouveau sur la tuile**, en
//     connaissance de ce compromis. Elle est desormais une regle de placement,
//     `{regle: "gratuite", offerts}` — voir `lib/tuiles.ts`.
//
// Il ne doit y en avoir **qu'un seul endroit**, sinon un jour la question
// « laquelle gagne ? ». C'est pourquoi `Amorcage.gratuites` a ete retire ici et
// vide en base le meme jour, plutot que laisse a dormir.
//
// Ce qui reste : la dotation en ressources de depart. Pendant exact de
// `SysB.Backend.Amorcage` cote Unity : memes champs, memes noms. **Renommer
// d'un cote sans l'autre casse le jeu en silence** — le modele se chargerait,
// avec des regles vides.

export interface RessourceDepart {
  ressource: string;
  quantite: number;
}

export interface Amorcage {
  ressources_depart: RessourceDepart[];
}

export function amorcageVide(): Amorcage {
  return { ressources_depart: [] };
}

/**
 * Lit le champ `amorcage` d'un record. **Tolerant par construction** : un champ
 * jamais rempli revient `null` de PocketBase, et une saisie abimee ne doit pas
 * empecher d'ouvrir le plateau — elle doit pouvoir se reparer a l'ecran.
 */
export function amorcageDe(plateau: Plateau | null | undefined): Amorcage {
  const a = plateau?.amorcage;
  if (!a || typeof a !== "object") return amorcageVide();
  return {
    ressources_depart: Array.isArray(a.ressources_depart) ? a.ressources_depart : [],
  };
}

/**
 * Ecarte les lignes vides avant l'envoi : une ressource sans code ou a quantite
 * nulle ne veut rien dire. Autant ne pas la stocker, plutot que de laisser
 * croire qu'elle agit.
 *
 * ⚠️ Ne renvoie QUE `ressources_depart` : c'est aussi ce qui efface en base les
 * anciennes `gratuites` du modele des qu'un amorcage est reenregistre.
 */
export function amorcageNettoye(a: Amorcage): Amorcage {
  return {
    ressources_depart: (a.ressources_depart ?? []).filter(
      (r) => r.ressource !== "" && r.quantite > 0,
    ),
  };
}

export type Plateau = {
  id: string;
  collectionId: string;
  collectionName: string;
  nom: string;
  typeOfPlateau: TypePlateau;
  /**
   * Le NOM de la planète, recopié pour le jeu d'avant les planètes. Il ne
   * décide plus rien sur le site depuis le 15/09 : c'est `planete` qui compte.
   */
  typeOfPlateau2?: string;
  largeur: number;
  hauteur: number;
  tilesBase64: string;
  /**
   * **L'altitude de chaque case** (18/09), un cran entier par case, encodée en
   * base64 — voir `decoderAltitudes`. Le relief vit ici, PAS sur la tuile : une
   * tuile pose son altitude par défaut, et l'éditeur peut ensuite la corriger
   * case par case sans changer la tuile.
   *
   * ⚠️ **Absent ou vide = plateau plat**, et c'est le cas de tous les plateaux
   * d'avant le 18/09 : rien à migrer, rien à réécrire.
   */
  altitudesBase64?: string;
  etats: EtatCase[] | null;
  /** `templates` seulement. */
  actif?: boolean;
  /**
   * La planete ou ce plateau se joue — relation → `planetes` (14/09). C'est
   * elle que lit `assurer` ; `typeOfPlateau2` n'en est que l'etiquette.
   */
  planete?: string;
  /**
   * `templates` seulement — **a qui est ce modele** (15/09) : `"game"` ou l'id
   * du joueur. ⚠️ Vide ≠ game. Lire par `appartenance()` (`lib/planetes.ts`).
   */
  appartient?: string;
  /** `templates` seulement : comment une partie demarre sur ce modele. */
  amorcage?: Amorcage | null;
  /** `plateaux` seulement. */
  ownerId?: string;
  created: string;
  updated: string;
  expand?: { ownerId?: { id: string; email: string; pseudo?: string } };
};

export interface ValeursPlateau {
  nom: string;
  typeOfPlateau: TypePlateau;
  typeOfPlateau2: string;
  largeur: number;
  hauteur: number;
  tilesBase64: string;
  /** Voir `Plateau.altitudesBase64`. Chaîne vide = plateau plat. */
  altitudesBase64?: string;
  etats: EtatCase[];
  actif?: boolean;
  amorcage?: Amorcage;
  ownerId?: string;
}

// --- Game ou joueur : la famille d'un plateau (19/09) ------------------------
//
// ⚠️⚠️ LA MÊME QUESTION DES DEUX CÔTÉS, DEUX ENDROITS OÙ ELLE SE LIT. « Est-ce
// au jeu, ou au domaine d'un joueur ? » range aussi bien un modèle qu'une copie
// — mais les deux collections ne portent pas le même champ :
//
//   · un MODÈLE porte `appartient` (`"game"` ou l'id du joueur), et c'est LUI
//     qu'affiche la colonne « appartient » de la liste. Le déduire d'ailleurs
//     ferait dire deux choses différentes à la même ligne.
//   · une COPIE de joueur n'a pas ce champ — elles sont toutes à un joueur. Ce
//     qui les sépare, c'est la PLANÈTE où elles se jouent : une planète du jeu
//     (Terre, Jupiter) ou le domaine de son propriétaire.
//
// ⚠️ **L'INCONNU VA DANS `game`**, jamais dans un troisième onglet que
// personne n'ouvrirait : un modèle non rangé (`appartient` vide) et un plateau
// d'avant les planètes (`planete` vide) restent là où l'admin regarde, avec
// leur mention orange, plutôt que de disparaître de l'écran.

/** De quel côté une ligne tombe : le jeu, ou le domaine d'un joueur. */
export type FamillePlateau = "game" | "joueur";

/** La famille d'un MODÈLE — ce que dit `appartient`, et rien d'autre. */
export function familleDeModele(p: Plateau): FamillePlateau {
  return appartenance(p.appartient).famille === "joueur" ? "joueur" : "game";
}

/** La famille d'une COPIE de joueur — celle de la planète où elle se joue. */
export function familleDeCopie(p: Plateau, planetes: Planete[]): FamillePlateau {
  const sienne = planetes.find((x) => x.id === p.planete);
  return sienne && !estPlaneteGame(sienne) ? "joueur" : "game";
}

/** La famille d'une ligne, quelle que soit la collection d'où elle vient. */
export function familleDe(
  p: Plateau,
  source: SourcePlateau,
  planetes: Planete[],
): FamillePlateau {
  return source === COLLECTION_TEMPLATES ? familleDeModele(p) : familleDeCopie(p, planetes);
}

/** Ce que garde un onglet : les lignes de sa famille. */
export function deLaFamille(
  liste: Plateau[],
  famille: FamillePlateau,
  source: SourcePlateau,
  planetes: Planete[],
): Plateau[] {
  return liste.filter((p) => familleDe(p, source, planetes) === famille);
}

// --- La palette : ce qui se peint sur un plateau ------------------------------
//
// ⚠️ DEPUIS LE 15/09, C'EST LA PLANÈTE QUI DÉCIDE, plus l'étiquette libre
// « type 2 » du 13/09 (elle en était déjà le brouillon : le 14/09, la planète
// est devenue un objet, et l'étiquette n'en est plus que le nom recopié).
//
// La palette d'un plateau = les tuiles qui JOUENT sur sa planète (la même règle
// que le serveur, `duCatalogue` dans `lib/conception.ts`) et du même type de
// décor. Peindre autre chose, c'est poser une case que le serveur met de côté
// (« figée ») — et, chez un joueur, une grille qu'il refuse d'enregistrer.

/**
 * La palette du pinceau : les tuiles qu'on a le droit de peindre sur ce plateau.
 * Le tri par `tileId` est celui du catalogue, le même que partout ailleurs.
 */
export function palettePourPlateau<
  T extends { tileId: number; typeOfPlateau: TypePlateau; planete?: string },
>(tuiles: T[], type: TypePlateau, planeteId: string, planetes: Planete[]): T[] {
  return duCatalogue(tuiles, planetes, planeteId)
    .filter((t) => t.typeOfPlateau === type)
    .sort((a, b) => a.tileId - b.tileId);
}

// --- Encodage ---------------------------------------------------------------

export function index(largeur: number, x: number, z: number): number {
  return z * largeur + x;
}

/**
 * Le contenu des cases : un `tileId` par case, jusqu'à 65 535.
 *
 * ⚠️⚠️ UN OU DEUX OCTETS PAR CASE (15/09) — la même règle que le serveur
 * (`moteur.LireGrille`) et qu'Unity (`PlateauData`) :
 *   largeur × hauteur octets      → 1 octet par case (le format d'avant) ;
 *   2 × largeur × hauteur octets  → 2 octets par case, POIDS FORT D'ABORD.
 * Le format se lit à la LONGUEUR : un plateau d'avant se relit tel quel.
 */
export type Cases = Uint16Array;

/**
 * Décode. Un contenu illisible ou d'une longueur qui ne correspond à aucun
 * format rend une grille **de la bonne taille** (lue octet par octet, comme
 * avant le 15/09) plutôt qu'une exception : un plateau qui refuse de s'ouvrir
 * est pire qu'un plateau qu'on voit abîmé et qu'on peut réparer.
 */
export function decoderTiles(plateau: {
  tilesBase64?: string;
  largeur: number;
  hauteur: number;
}): Cases {
  const taille = plateau.largeur * plateau.hauteur;
  const cases = new Uint16Array(taille);
  if (!plateau.tilesBase64) return cases;
  let binaire: string;
  try {
    binaire = atob(plateau.tilesBase64);
  } catch {
    return cases;
  }
  if (taille > 0 && binaire.length === 2 * taille) {
    for (let i = 0; i < taille; i++)
      cases[i] = (binaire.charCodeAt(2 * i) << 8) | binaire.charCodeAt(2 * i + 1);
    return cases;
  }
  for (let i = 0; i < Math.min(binaire.length, taille); i++) cases[i] = binaire.charCodeAt(i);
  return cases;
}

/** Le format qu'une grille demande : 1 octet tant que tous les ids tiennent, 2 sinon. */
export function octetsParCase(cases: ArrayLike<number>): 1 | 2 {
  for (let i = 0; i < cases.length; i++) if (cases[i] > 255) return 2;
  return 1;
}

/**
 * Encode. ⚠️ En 1 octet tant que c'est possible : c'est ce qui laisse un jeu
 * d'avant le 15/09 lire une grille qui ne porte que des tuiles d'avant — et ça
 * divise la taille par deux. Dès qu'une case porte 256 ou plus : 2 octets.
 */
export function encoderTiles(cases: ArrayLike<number>): string {
  const deux = octetsParCase(cases) === 2;
  const octets = new Uint8Array(deux ? 2 * cases.length : cases.length);
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    if (deux) {
      octets[2 * i] = c >> 8;
      octets[2 * i + 1] = c & 0xff;
    } else octets[i] = c;
  }
  let binaire = "";
  // Par paquets : String.fromCharCode(...tableau) dépasse la pile d'appels
  // au-delà de quelques dizaines de milliers d'éléments.
  const paquet = 8192;
  for (let i = 0; i < octets.length; i += paquet) {
    binaire += String.fromCharCode(...octets.subarray(i, i + paquet));
  }
  return btoa(binaire);
}

/**
 * Redimensionne en **conservant les coordonnées**, pas l'ordre des octets.
 *
 * Sans ça, changer la largeur décalerait tout le plateau : l'index est
 * `z * largeur + x`, donc une largeur différente ne relit pas les mêmes cases.
 * Les cases sortant du nouveau cadre sont perdues, et leurs états avec.
 */
export function redimensionner(
  octets: Cases,
  ancienne: { largeur: number; hauteur: number },
  nouvelle: { largeur: number; hauteur: number },
): Cases {
  const sortie = new Uint16Array(nouvelle.largeur * nouvelle.hauteur);
  const largeurCommune = Math.min(ancienne.largeur, nouvelle.largeur);
  const hauteurCommune = Math.min(ancienne.hauteur, nouvelle.hauteur);
  for (let z = 0; z < hauteurCommune; z++) {
    for (let x = 0; x < largeurCommune; x++) {
      sortie[index(nouvelle.largeur, x, z)] = octets[index(ancienne.largeur, x, z)];
    }
  }
  return sortie;
}

// --- L'altitude des cases ----------------------------------------------------
//
// ⚠️⚠️ L'ALTITUDE EST UNE DONNÉE DE CASE, PAS DE TUILE (décision du 18/09,
// après avoir essayé l'inverse). Une tuile porte son altitude PAR DÉFAUT, que
// la pose recopie sur la case ; ensuite les deux vivent leur vie. C'est ce qui
// permettra, le jour venu, de monter le terrain sans détruire ce qui est posé
// dessus — et ce qui évite de décliner chaque bâtiment en onze tuiles.
//
// ⚠️ LA COULEUR, ELLE, RESTE SUR LA TUILE : une couleur = un matériau partagé
// dans Unity, et une couleur par case ferait un ordre de dessin par case.
//
// Un octet par case, la même façon de lire que `tilesBase64` : c'est la
// LONGUEUR qui dit le format, et une longueur inattendue se lit quand même
// plutôt que de refuser d'ouvrir le plateau.

/** Un cran d'altitude par case. 0 = le niveau du sol. */
export type Altitudes = Uint8Array;

/**
 * Le cran le plus haut qu'une case puisse porter — la limite de l'octet.
 * ⚠️ Ce n'est PAS le nombre de socles modélisés (une dizaine) : un cran sans
 * socle retombe sur le plus haut disponible, côté Unity, en le disant.
 */
export const ALTITUDE_MAX = 255;

/**
 * Décode. Absent, vide ou illisible = **plateau plat** : une grille de zéros de
 * la bonne taille. Un plateau d'avant le relief s'ouvre donc tel quel, et un
 * contenu abîmé se voit et se répare au lieu d'empêcher l'ouverture.
 */
export function decoderAltitudes(plateau: {
  altitudesBase64?: string;
  largeur: number;
  hauteur: number;
}): Altitudes {
  const taille = plateau.largeur * plateau.hauteur;
  const crans = new Uint8Array(taille);
  if (!plateau.altitudesBase64) return crans;
  let binaire: string;
  try {
    binaire = atob(plateau.altitudesBase64);
  } catch {
    return crans;
  }
  for (let i = 0; i < Math.min(binaire.length, taille); i++) crans[i] = binaire.charCodeAt(i) & 0xff;
  return crans;
}

/** True si aucune case n'est surélevée. */
export function estPlat(crans: ArrayLike<number>): boolean {
  for (let i = 0; i < crans.length; i++) if (crans[i] > 0) return false;
  return true;
}

/**
 * Encode. ⚠️ **Un plateau plat rend la chaîne VIDE**, il n'écrit pas 5 000
 * zéros en base : c'est ce qui garde les plateaux d'aujourd'hui exactement
 * comme ils sont, et ce qui rend le champ ignorable par tout ce qui ne connaît
 * pas encore le relief.
 */
export function encoderAltitudes(crans: ArrayLike<number>): string {
  if (estPlat(crans)) return "";
  const octets = new Uint8Array(crans.length);
  for (let i = 0; i < crans.length; i++)
    octets[i] = Math.min(ALTITUDE_MAX, Math.max(0, Math.trunc(crans[i]) || 0));
  let binaire = "";
  // Par paquets, comme `encoderTiles` : String.fromCharCode(...tableau) dépasse
  // la pile d'appels au-delà de quelques dizaines de milliers d'éléments.
  const paquet = 8192;
  for (let i = 0; i < octets.length; i += paquet)
    binaire += String.fromCharCode(...octets.subarray(i, i + paquet));
  return btoa(binaire);
}

/**
 * Redimensionne comme `redimensionner`, et pour la même raison : l'index est
 * `z * largeur + x`, donc changer la largeur sans recalculer décalerait tout le
 * relief d'une case à l'autre.
 */
export function redimensionnerAltitudes(
  crans: Altitudes,
  ancienne: { largeur: number; hauteur: number },
  nouvelle: { largeur: number; hauteur: number },
): Altitudes {
  const sortie = new Uint8Array(nouvelle.largeur * nouvelle.hauteur);
  const largeurCommune = Math.min(ancienne.largeur, nouvelle.largeur);
  const hauteurCommune = Math.min(ancienne.hauteur, nouvelle.hauteur);
  for (let z = 0; z < hauteurCommune; z++)
    for (let x = 0; x < largeurCommune; x++)
      sortie[index(nouvelle.largeur, x, z)] = crans[index(ancienne.largeur, x, z)];
  return sortie;
}

/** Le cran d'une case, 0 hors du plateau. */
export function altitudeDeCase(
  crans: ArrayLike<number>,
  largeur: number,
  x: number,
  z: number,
): number {
  const i = index(largeur, x, z);
  return i >= 0 && i < crans.length ? crans[i] : 0;
}

/**
 * Écrit un cran sur une liste de cases.
 *
 * ⚠️ REND LE MÊME TABLEAU SI RIEN NE CHANGE. C'est ce qui fait qu'un pinceau
 * qui repasse au même endroit ne marque pas le plateau comme modifié et ne
 * redessine pas la grille — sur dix mille cases, la différence se voit.
 *
 * ⚠️ Un plateau d'avant le relief n'a pas de tableau à la bonne taille : on en
 * installe un à plat plutôt que d'écrire à côté.
 */
export function ecrireAltitudes(
  avant: Altitudes,
  cibles: { x: number; z: number }[],
  cran: number,
  largeur: number,
  hauteur: number,
): Altitudes {
  const base = avant.length === largeur * hauteur ? avant : new Uint8Array(largeur * hauteur);
  const valeur = cranValable(cran);
  let copie: Altitudes | null = null;
  for (const c of cibles) {
    const i = index(largeur, c.x, c.z);
    if (i < 0 || i >= base.length || base[i] === valeur) continue;
    if (!copie) copie = new Uint8Array(base);
    copie[i] = valeur;
  }
  return copie ?? base;
}

/** Ramène une saisie à un cran valable : un entier de 0 à `ALTITUDE_MAX`. */
export function cranValable(saisie: unknown): number {
  const n = Math.trunc(Number(saisie));
  if (!Number.isFinite(n)) return 0;
  return Math.min(ALTITUDE_MAX, Math.max(0, n));
}

// --- États ------------------------------------------------------------------

/**
 * Les états d'un plateau, **ramenés au format du moteur à cycles**. Un champ
 * json jamais renseigné revient `null` de PocketBase.
 *
 * ⚠️ Ce n'est pas une lecture de l'ancien format : c'est ce qui l'EMPÊCHE de
 * repartir en base. Un `t` ou un `satisfactionPourMille` d'avant le 11/09 est
 * écarté ici, et disparaît au premier enregistrement au lieu d'être recopié
 * pour toujours.
 */
export function etatsDe(plateau: Plateau): EtatCase[] {
  return Array.isArray(plateau.etats) ? plateau.etats.map(normaliserEtat) : [];
}

function normaliserEtat(brut: unknown): EtatCase {
  const o = (brut ?? {}) as Partial<EtatCase>;
  const entier = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0);
  const stock: Record<string, number> = {};
  if (o.stock && typeof o.stock === "object") {
    for (const [code, q] of Object.entries(o.stock)) {
      const n = entier(q);
      if (n > 0) stock[code] = n;
    }
  }
  const etat: EtatCase = {
    x: entier(o.x),
    z: entier(o.z),
    niveau: Math.max(1, entier(o.niveau)),
    actif: o.actif !== false,
    stock,
    t_cycle: Math.max(0, entier(o.t_cycle)),
    en_marche: o.en_marche === true,
    navettes: Array.isArray(o.navettes) ? o.navettes : [],
  };
  if (entier(o.chantier_fin) > 0) etat.chantier_fin = entier(o.chantier_fin);
  return etat;
}

export function cleCase(x: number, z: number): string {
  return `${x},${z}`;
}

export function indexerEtats(etats: EtatCase[]): Map<string, EtatCase> {
  return new Map(etats.map((e) => [cleCase(e.x, e.z), e]));
}

/**
 * L'état d'une case qu'on vient de toucher dans l'éditeur : à l'arrêt, sans
 * cycle encore joué (`t_cycle: 0`), sans navette. Le moteur le démarrera au
 * premier cycle dont il a les ressources.
 */
export function etatVide(x: number, z: number): EtatCase {
  return { x, z, niveau: 1, actif: true, stock: {}, t_cycle: 0, en_marche: false, navettes: [] };
}

/**
 * Écarte les états devenus incohérents : hors du plateau, ou sur une case vide.
 * Le pendant de `PlateauData.NettoyerEtats()` côté Unity — sans lui, une case
 * repeinte laisserait l'état de l'ancien bâtiment, qui continuerait à produire.
 */
export function nettoyerEtats(
  etats: EtatCase[],
  octets: Cases,
  largeur: number,
  hauteur: number,
): EtatCase[] {
  return etats.filter((e) => {
    if (e.x < 0 || e.z < 0 || e.x >= largeur || e.z >= hauteur) return false;
    return octets[index(largeur, e.x, e.z)] !== TILE_VIDE;
  });
}

// --- Géométrie de la grille ------------------------------------------------
//
// Le jeu pose ses cases en **offset odd-r** : les rangées impaires sont
// décalées d'une demi-case vers la droite, et l'espacement vertical vaut
// sqrt(3)/2 (`PlateauGenerator.CalculerPosition`).
//
// L'éditeur dessine des **carrés en quinconce** plutôt qu'un pavage hexagonal :
// le repère est le même, mais des carrés se visent et se lisent mieux à
// l'écran. ⚠️ Les distances du jeu restent hexagonales — voir `distanceHex`.

/** Espacement vertical entre deux rangées, comme dans Unity. */
export const PAS_VERTICAL = Math.sqrt(3) / 2;

/** Taille d'une case dessinée. Un peu plus petite que le pas, pour le jour. */
export const LARGEUR_CASE = 0.92;
export const HAUTEUR_CASE = 0.78;

/** Centre d'une case en coordonnées de dessin, espacement horizontal = 1. */
export function centreCase(x: number, z: number): { cx: number; cy: number } {
  return { cx: x + (z % 2 === 1 ? 0.5 : 0), cy: z * PAS_VERTICAL };
}

/**
 * Distance **hexagonale** entre deux cases (offset odd-r → axial → cube).
 *
 * C'est la métrique du jeu, celle qu'utilisent les règles de placement. Elle ne
 * change pas parce que l'éditeur dessine des carrés : un rayon de 2 couvre
 * 18 cases, pas 24.
 */
export function distanceHex(x1: number, z1: number, x2: number, z2: number): number {
  const q1 = x1 - (z1 - (z1 & 1)) / 2;
  const q2 = x2 - (z2 - (z2 & 1)) / 2;
  const dq = q1 - q2;
  const dr = z1 - z2;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

// --- Chargement -------------------------------------------------------------

/**
 * Les cases du plateau a distance hexagonale <= `rayon`, bord compris.
 *
 * Sert au pinceau large comme a son apercu : les deux doivent peindre exactement
 * la meme chose, et c'est la distance du jeu qui decide, pas un carre de cases.
 *
 * La double boucle est bornee genereusement puis filtree au vrai calcul : en
 * offset odd-r, un rayon `r` peut deborder de `r/2` colonnes de plus qu'on ne le
 * croit, et une borne trop juste raboterait un cote du disque.
 */
export function casesDansRayon(
  cx: number,
  cz: number,
  rayon: number,
  largeur: number,
  hauteur: number,
): { x: number; z: number }[] {
  if (rayon <= 0) return [{ x: cx, z: cz }];
  const liste: { x: number; z: number }[] = [];
  const marge = rayon + Math.ceil(rayon / 2);
  for (let z = Math.max(0, cz - rayon); z <= Math.min(hauteur - 1, cz + rayon); z++) {
    for (let x = Math.max(0, cx - marge); x <= Math.min(largeur - 1, cx + marge); x++) {
      if (distanceHex(cx, cz, x, z) <= rayon) liste.push({ x, z });
    }
  }
  return liste;
}

export function loadTemplates(): Promise<Plateau[]> {
  return pb.collection(COLLECTION_TEMPLATES).getFullList<Plateau>({ sort: "typeOfPlateau,nom" });
}

export function loadPlateauxJoueurs(): Promise<Plateau[]> {
  return pb
    .collection(COLLECTION_PLATEAUX)
    .getFullList<Plateau>({ sort: "-updated", expand: "ownerId" });
}

export function loadPlateau(source: SourcePlateau, id: string): Promise<Plateau> {
  const options = source === COLLECTION_PLATEAUX ? { expand: "ownerId" } : undefined;
  return pb.collection(source).getOne<Plateau>(id, options);
}

/** Nombre de cases occupées, pour le résumé de la liste. */
export function compterOccupees(plateau: Plateau): number {
  const octets = decoderTiles(plateau);
  let n = 0;
  for (const o of octets) if (o !== TILE_VIDE) n++;
  return n;
}

/** Propriétaire lisible d'un plateau joueur. */
export function libelleProprietaire(plateau: Plateau): string {
  const u = plateau.expand?.ownerId;
  return u?.pseudo || u?.email || plateau.ownerId || "—";
}
