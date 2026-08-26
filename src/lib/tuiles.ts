/**
 * Catalogue de tuiles — ce que le joueur peut réellement poser sur un plateau.
 *
 * ⚠️ **REMISE À ZÉRO DU 2026-08-26**, puis reconstruction en cours. Les niveaux
 * (coûts et productions) et le rôle logistique restent retirés du site. Les
 * **règles de pose reviennent une par une** : `support` d'abord — voir plus bas.
 *
 * Les champs json `placement`, `niveaux` et `logistique` **ont été vidés en base
 * le 2026-08-26** sur les 25 tuiles du catalogue : plus rien ne subsiste, donc
 * plus rien n'agit en jeu sans écran pour le montrer. Le contenu des 3 seules
 * tuiles qui portaient autre chose qu'un palier vide est sauvegardé dans
 * `SysB/sauvegarde-tuiles-2026-08-26.json`, côté documentation.
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

// --- Placement : les règles de pose ----------------------------------------

/**
 * Reconstruit le 2026-08-26, à partir d'une page blanche. **Un seul type de
 * règle pour l'instant : `support`.** Les autres (voisinage, limite…) sont
 * ajoutés au fur et à mesure — le tableau `placement` les accueillera sans rien
 * casser, puisque chaque règle porte son champ `regle`.
 *
 * Toutes les règles d'une tuile doivent être vraies en même temps : ET simple.
 */
export type TypeRegle = "support";

export const TYPES_REGLE: { valeur: TypeRegle; libelle: string; aide: string }[] = [
  { valeur: "support", libelle: "support", aide: "ce que la case elle-même doit porter" },
];

/**
 * ⚠️ **La case vide est une valeur comme une autre : `0`.** C'est la convention
 * de `tilesBase64`, et elle se coche dans les listes au même titre qu'une tuile.
 *
 * Avant la remise à zéro, les zéros étaient écartés à la lecture — des deux
 * côtés — ce qui rendait « se construit seulement sur une case vide »
 * inexprimable. Ne jamais refiltrer les `0` d'une liste de tuiles citées.
 */
export const CASE_VIDE = 0;

/**
 * Comment la règle `support` décide.
 *
 * - `liste` : la case doit porter **l'une** des tuiles cochées. Le reste est
 *   refusé — une liste blanche contient déjà son « sauf ».
 * - `tout` : n'importe quelle case convient, **sauf** celles cochées dans
 *   `sauf`. C'est le seul cas où une exception a un sens.
 *
 * Les deux listes ne sont donc jamais utiles en même temps, et l'écran n'en
 * montre qu'une : celle qui correspond à la base choisie.
 */
export type BaseSupport = "liste" | "tout";

export interface ReglePlacement {
  regle: TypeRegle;
  base: BaseSupport;
  /** `base: "liste"` — les tuiles autorisées. `0` = la case vide. */
  tileIds: number[];
  /** `base: "tout"` — les tuiles interdites. `0` = la case vide. */
  sauf: number[];
}

export function regleVide(regle: TypeRegle): ReglePlacement {
  return { regle, base: "liste", tileIds: [], sauf: [] };
}

/**
 * Un champ json jamais renseigné revient `null` de PocketBase, et un objet
 * ancien peut manquer une clé ajoutée depuis. On normalise à la lecture pour
 * que le reste du code n'ait jamais à se demander si une liste existe.
 */
export function normaliserRegle(r: Partial<ReglePlacement>): ReglePlacement {
  const liste = (v: unknown) =>
    Array.isArray(v) ? Array.from(new Set(v.filter((n) => typeof n === "number"))).sort((a, b) => a - b) : [];
  return {
    regle: "support",
    base: r.base === "tout" ? "tout" : "liste",
    tileIds: liste(r.tileIds),
    sauf: liste(r.sauf),
  };
}

/**
 * Vrai si la règle dit réellement quelque chose. Une règle inutile est
 * **ignorée en jeu, pas bloquante** — et signalée en orange sur le site, avec
 * le même mot des deux côtés : « ignorée ».
 *
 * Une liste blanche vide interdirait tout, partout : c'est une saisie inachevée,
 * pas une règle de jeu. Une base « tout » sans exception n'interdit rien.
 */
export function regleUtile(r: ReglePlacement): boolean {
  return r.base === "liste" ? r.tileIds.length > 0 : r.sauf.length > 0;
}

/**
 * La règle relue en français. C'est là qu'une saisie malheureuse se voit — pas
 * dans le formulaire. La même phrase doit exister côté Unity, dans le message
 * de refus montré au joueur.
 */
export function decrireRegle(r: ReglePlacement, nomDe: (tileId: number) => string): string {
  const enumerer = (ids: number[], liaison: string) =>
    ids.map((id) => `« ${nomDe(id)} »`).join(` ${liaison} `);
  if (r.base === "liste") {
    if (r.tileIds.length === 0) return "Aucune tuile cochée — cette règle sera ignorée en jeu.";
    return `Se pose seulement sur ${enumerer(r.tileIds, "ou")}.`;
  }
  if (r.sauf.length === 0) return "Aucune exception — cette règle n'interdit rien, elle sera ignorée en jeu.";
  return `Se pose n'importe où, sauf sur ${enumerer(r.sauf, "ni")}.`;
}

export function placementDe(tuile: { placement?: unknown }): ReglePlacement[] {
  const brutes = Array.isArray(tuile.placement) ? tuile.placement : [];
  return brutes
    .filter((r): r is Partial<ReglePlacement> => !!r && typeof r === "object")
    .map(normaliserRegle);
}

/**
 * Ce qui part en base. Les règles inutiles sont gardées telles quelles : les
 * jeter à l'enregistrement ferait disparaître sous les yeux de l'admin une
 * ligne qu'il était en train de remplir.
 */
export function placementPourEnregistrer(regles: ReglePlacement[]): ReglePlacement[] {
  return regles.map(normaliserRegle);
}

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
  /** Les règles de pose. Reconstruites depuis le 26/08 — voir `ReglePlacement`. */
  placement: ReglePlacement[] | null;
  /*
   * ⚠️ `niveaux` et `logistique` existent encore comme colonnes json sur la
   * collection, mais ils sont VIDES et ce type ne les declare pas. Les
   * redeclarer, c'est se redonner le droit de les lire a moitie.
   */
  created: string;
  updated: string;
  expand?: { modele?: Modele3D };
};

/**
 * Ce que le formulaire renvoie — l'identite, et rien d'autre.
 *
 * ⚠️ `niveaux` et `logistique` n'y sont **volontairement pas** : une cle absente
 * n'est pas envoyee a PocketBase. Le jour ou on reconstruira ces sections, les
 * rajouter ici est ce qui les rendra ecrivables — pas avant. `placement` y est
 * revenu le 26/08, quand l'onglet a ete refait.
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
  placement: ReglePlacement[];
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

/**
 * Tuiles dont une règle de placement cite `tileId`, dans un sens ou dans
 * l'autre. Sert de garde-fou : supprimer une tuile référencée casserait ces
 * règles en silence.
 */
export function tuilesCitant(tuiles: Tuile[], tileId: number): Tuile[] {
  return tuiles.filter((t) =>
    placementDe(t).some((r) => r.tileIds.includes(tileId) || r.sauf.includes(tileId)),
  );
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
