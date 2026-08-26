/**
 * Plateaux : les modèles de l'admin (`templates`) et les copies des joueurs
 * (`plateaux`). Deux collections, un seul format.
 *
 * UNE SEULE COUCHE DE JEU, DEUX ENCODAGES
 * ---------------------------------------
 * Une case porte UNE tuile, point. Mais deux encodages cohabitent parce qu'ils
 * ne portent pas la même chose :
 *
 *  - `tilesBase64` : un `byte[]` encodé, un `tileId` par case, index
 *    `z * largeur + x`. Il dit CE QU'IL Y A. 10 000 cases = 13 Ko.
 *  - `etats` : un tableau json avec une entrée pour les SEULES cases ayant
 *    quelque chose à retenir. Il dit OÙ EN EST chaque bâtiment.
 *
 * La grille est en **offset odd-r** : les rangées impaires sont décalées d'une
 * demi-case vers la droite, espacement vertical sqrt(3)/2. C'est ce que fait
 * `PlateauGenerator.CalculerPosition` côté Unity (`x + (z impair ? 0.5 : 0)`,
 * `z * 0.866`). L'éditeur dessine ce repère avec des **carrés en quinconce** ;
 * les distances, elles, restent hexagonales (`distanceHex`).
 */

import { pb } from "@/lib/pb";

export const COLLECTION_TEMPLATES = "templates";
export const COLLECTION_PLATEAUX = "plateaux";

export type SourcePlateau = "templates" | "plateaux";

/** Réservé à la case vide côté `PlateauGenerator`. */
export const TILE_VIDE = 0;

export interface EtatCase {
  x: number;
  z: number;
  niveau: number;
  actif: boolean;
  stock: Record<string, number>;
  /** Horodatage unix (secondes), en heure serveur. */
  t: number;
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
  typeOfPlateau: "ground" | "space";
  largeur: number;
  hauteur: number;
  tilesBase64: string;
  etats: EtatCase[] | null;
  /** `templates` seulement. */
  actif?: boolean;
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
  typeOfPlateau: "ground" | "space";
  largeur: number;
  hauteur: number;
  tilesBase64: string;
  etats: EtatCase[];
  actif?: boolean;
  amorcage?: Amorcage;
  ownerId?: string;
}

// --- Encodage ---------------------------------------------------------------

export function index(largeur: number, x: number, z: number): number {
  return z * largeur + x;
}

/**
 * Décode en tableau d'octets. Un contenu illisible ou de mauvaise taille rend
 * une grille vide **de la bonne taille** plutôt qu'une exception : un plateau
 * qui refuse de s'ouvrir est pire qu'un plateau qu'on voit vide et qu'on peut
 * réparer.
 */
export function decoderTiles(plateau: {
  tilesBase64?: string;
  largeur: number;
  hauteur: number;
}): Uint8Array {
  const taille = plateau.largeur * plateau.hauteur;
  if (!plateau.tilesBase64) return new Uint8Array(taille);
  try {
    const binaire = atob(plateau.tilesBase64);
    const octets = new Uint8Array(taille);
    for (let i = 0; i < Math.min(binaire.length, taille); i++) octets[i] = binaire.charCodeAt(i);
    return octets;
  } catch {
    return new Uint8Array(taille);
  }
}

export function encoderTiles(octets: Uint8Array): string {
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
  octets: Uint8Array,
  ancienne: { largeur: number; hauteur: number },
  nouvelle: { largeur: number; hauteur: number },
): Uint8Array {
  const sortie = new Uint8Array(nouvelle.largeur * nouvelle.hauteur);
  const largeurCommune = Math.min(ancienne.largeur, nouvelle.largeur);
  const hauteurCommune = Math.min(ancienne.hauteur, nouvelle.hauteur);
  for (let z = 0; z < hauteurCommune; z++) {
    for (let x = 0; x < largeurCommune; x++) {
      sortie[index(nouvelle.largeur, x, z)] = octets[index(ancienne.largeur, x, z)];
    }
  }
  return sortie;
}

// --- États ------------------------------------------------------------------

/** Un champ json jamais renseigné revient `null` de PocketBase. */
export function etatsDe(plateau: Plateau): EtatCase[] {
  return Array.isArray(plateau.etats) ? plateau.etats : [];
}

export function cleCase(x: number, z: number): string {
  return `${x},${z}`;
}

export function indexerEtats(etats: EtatCase[]): Map<string, EtatCase> {
  return new Map(etats.map((e) => [cleCase(e.x, e.z), e]));
}

export function etatVide(x: number, z: number): EtatCase {
  return { x, z, niveau: 1, actif: true, stock: {}, t: 0 };
}

/**
 * Écarte les états devenus incohérents : hors du plateau, ou sur une case vide.
 * Le pendant de `PlateauData.NettoyerEtats()` côté Unity — sans lui, une case
 * repeinte laisserait l'état de l'ancien bâtiment, qui continuerait à produire.
 */
export function nettoyerEtats(
  etats: EtatCase[],
  octets: Uint8Array,
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
