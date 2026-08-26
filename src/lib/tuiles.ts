/**
 * Catalogue de tuiles — ce que le joueur peut réellement poser sur un plateau.
 *
 * ⚠️ **REMISE À ZÉRO DU 2026-08-26.** Ce fichier ne décrit plus que l'IDENTITÉ
 * d'une tuile. Les règles de pose, les niveaux (coûts et productions) et le rôle
 * logistique ont été retirés du site pour être reconstruits de zéro : le
 * formulaire ne les écrit plus, et plus rien ici ne sait les lire.
 *
 * **Les champs json correspondants existent toujours en base**, avec leur
 * contenu, et **Unity les lit toujours**. C'est pourquoi le type `Tuile` les
 * garde — en `unknown`, juste assez pour les COMPTER et prévenir l'admin qu'une
 * tuile porte encore quelque chose d'invisible. Un champ qui agit sans écran
 * pour le montrer est le piège qu'on s'est déjà pris deux fois.
 *
 * Ce qui a été retiré vit dans l'historique git (dernier commit avant le 26/08),
 * et le modèle qu'il portait est décrit en mémoire projet. Ne pas le réécrire
 * de tête.
 *
 * La grille est **hexagonale**, en offset odd-r pointy-top (cf.
 * `PlateauGenerator.CalculerPosition` : `x + (z impair ? 0.5 : 0)`, `z * 0.866`).
 * Une distance se mesure donc en distance hexagonale, pas en Chebyshev :
 *
 *     axial(x, z) = (x - (z - (z & 1)) / 2, z)
 *     dist = (|dq| + |dq + dr| + |dr|) / 2
 *
 * Un rayon r couvre 3r(r+1) cases autour du centre : 6 à r=1, 18 à r=2, 90 à r=5.
 */

import { pb } from "@/lib/pb";
import type { Modele3D, TypePlateau } from "@/lib/modeles3d";

export type { TypePlateau };

export const COLLECTION_TUILES = "tuiles";

/**
 * `tilesBase64` est un `byte[]` brut : un octet par case. L'id 0 est réservé à
 * la case vide côté `PlateauGenerator`, donc les tuiles vont de 1 à 255.
 */
export const TILE_ID_MIN = 1;
export const TILE_ID_MAX = 255;

// --- Le record --------------------------------------------------------------

export type Tuile = {
  id: string;
  collectionId: string;
  collectionName: string;
  tileId: number;
  nom: string;
  /** Id du record `tuile3dmodel`. */
  modele: string;
  typeOfPlateau: TypePlateau;
  categorie: string;
  description: string;
  /**
   * Couleur de la tuile sur la grille de l'editeur, en `#rrggbb`.
   * Vide = la couleur automatique deduite du tileId.
   */
  couleur: string;
  actif: boolean;
  /**
   * tileId laisse sur la case quand cette tuile est detruite.
   * `0` = case vide, la meme convention que dans `tilesBase64`.
   */
  tileId_apres_destruction: number;
  /**
   * `true` = le joueur ne peut pas detruire cette tuile. Le champ
   * `tileId_apres_destruction` devient alors sans objet.
   */
  indestructible: boolean;
  /**
   * `true` = on ne peut pas non plus poser une autre tuile a sa place.
   * N'a de sens qu'avec `indestructible` : c'est le cran au-dessus.
   *
   * Les deux sont **negatifs** a dessein : un booleen PocketBase vaut `false`
   * par defaut, donc toutes les tuiles deja en base restent destructibles et
   * remplacables sans migration.
   */
  non_remplacable: boolean;
  /**
   * ⚠️ Les trois champs de la remise a zero. Le site ne les ECRIT plus et ne
   * sait plus les lire en detail — mais Unity, lui, les applique toujours. On
   * les garde en `unknown` pour pouvoir dire a l'admin « cette tuile porte
   * encore N choses que cet ecran ne montre pas ».
   */
  placement: unknown[] | null;
  niveaux: unknown[] | null;
  logistique: unknown | null;
  created: string;
  updated: string;
  expand?: { modele?: Modele3D };
};

/**
 * Ce que le formulaire renvoie — l'identite, et rien d'autre.
 *
 * ⚠️ `placement`, `niveaux` et `logistique` n'y sont **volontairement pas** :
 * une cle absente n'est pas envoyee a PocketBase, donc enregistrer une tuile
 * **preserve** ce qu'elle porte encore. Les remettre ici avec une valeur vide
 * effacerait le travail de l'utilisateur au premier changement de nom.
 */
export interface ValeursTuile {
  tileId: number;
  nom: string;
  modele: string;
  typeOfPlateau: TypePlateau;
  categorie: string;
  description: string;
  couleur: string;
  actif: boolean;
  tileId_apres_destruction: number;
  indestructible: boolean;
  non_remplacable: boolean;
}

// --- Ce qui reste en base sans ecran pour le montrer -------------------------

export interface RestesEnBase {
  placement: number;
  niveaux: number;
  logistique: number;
  total: number;
}

/**
 * Combien de choses invisibles cette tuile porte encore. Sert au bandeau de la
 * fenetre d'edition et a la colonne « reste en base » de la liste : tant que
 * ces donnees existent, le jeu s'en sert, et l'admin doit pouvoir les trouver.
 */
export function restesEnBase(tuile: {
  placement?: unknown;
  niveaux?: unknown;
  logistique?: unknown;
}): RestesEnBase {
  const combien = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  const placement = combien(tuile.placement);
  const niveaux = combien(tuile.niveaux);
  const logistique = tuile.logistique ? 1 : 0;
  return { placement, niveaux, logistique, total: placement + niveaux + logistique };
}

// --- Destruction -------------------------------------------------------------

/**
 * Les trois etats possibles d'une tuile face au joueur qui veut liberer la case.
 * Une seule fonction pour que la liste, le formulaire et le jeu disent la meme
 * chose a partir des deux booleens.
 */
export type Contrainte = "destructible" | "indestructible" | "figee";

export function contrainteDe(tuile: {
  indestructible?: boolean;
  non_remplacable?: boolean;
}): Contrainte {
  if (!tuile.indestructible) return "destructible";
  return tuile.non_remplacable ? "figee" : "indestructible";
}

// --- Chargement et helpers --------------------------------------------------

export function loadTuiles(): Promise<Tuile[]> {
  return pb.collection(COLLECTION_TUILES).getFullList<Tuile>({ sort: "tileId", expand: "modele" });
}

/**
 * Prochain id à proposer : **max + 1**, pas le plus petit trou libre.
 * Un `tileId` ne doit jamais être recyclé : une règle de placement qui citait
 * l'ancienne tuile pointerait silencieusement vers la nouvelle.
 */
export function prochainTileId(tuiles: Tuile[]): number | null {
  const max = tuiles.reduce((m, t) => Math.max(m, t.tileId ?? 0), 0);
  const suivant = Math.max(max + 1, TILE_ID_MIN);
  return suivant > TILE_ID_MAX ? null : suivant;
}

/** Tuiles regroupées par modèle 3D, pour afficher les réutilisations. */
export function tuilesParModele(tuiles: Tuile[]): Map<string, Tuile[]> {
  const index = new Map<string, Tuile[]>();
  for (const tuile of tuiles) {
    const liste = index.get(tuile.modele);
    if (liste) liste.push(tuile);
    else index.set(tuile.modele, [tuile]);
  }
  return index;
}

/**
 * Nombre de cases couvertes par un rayon sur une grille hexagonale : 3r(r+1).
 * Utilisé par le pinceau de l'éditeur de plateaux — il survit donc à la remise
 * à zéro des règles de pose.
 */
export function casesCouvertes(rayon: number): number {
  return 3 * rayon * (rayon + 1);
}

// --- Couleurs ---------------------------------------------------------------

/**
 * Couleur de repli, deduite du `tileId` et de lui seul.
 *
 * L'angle d'or en degres repartit les teintes sans jamais retomber juste : deux
 * tuiles creees a la suite ne se ressemblent pas, et une tuile garde sa couleur
 * d'une session a l'autre puisqu'un `tileId` n'est jamais recycle.
 *
 * Le resultat est en `#rrggbb` plutot qu'en `hsl()` : c'est le seul format
 * qu'accepte `<input type="color">`, qui doit pouvoir afficher la couleur
 * effective d'une tuile meme quand le catalogue ne dit rien.
 */
export function couleurAuto(tileId: number): string {
  return hslVersHex((tileId * 137.508) % 360, 0.55, 0.45);
}

/** Couleur retenue : celle du catalogue si elle est renseignee, sinon l'automatique. */
export function couleurDe(tuile: { tileId: number; couleur?: string }): string {
  const choisie = tuile.couleur?.trim();
  return choisie ? choisie : couleurAuto(tuile.tileId);
}

/** Vrai pour `#rrggbb` et pour la chaine vide — ce qu'accepte le champ en base. */
export function couleurValide(valeur: string): boolean {
  return /^(#[0-9a-fA-F]{6})?$/.test(valeur.trim());
}

function hslVersHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const canal = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const octet = (n: number) =>
    Math.round(canal(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${octet(0)}${octet(8)}${octet(4)}`;
}
