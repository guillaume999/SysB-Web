/**
 * Catalogue de tuiles — ce que le joueur peut réellement poser sur un plateau.
 *
 * Une tuile n'est pas un modèle 3D : c'est un modèle (relation vers `tuile3dmodel`)
 * **plus** les règles du jeu qui vont avec — coût d'obtention, conditions de
 * placement, production, rôle logistique.
 *
 * Tout ce qui est structuré vit dans des champs `json` plutôt que dans des tables
 * filles, pour une raison précise : le jeu lit le catalogue **en entier**, une fois,
 * et le met en cache. Une tuile = un record autonome = une requête. En contrepartie
 * PocketBase ne valide rien de ce contenu, donc les formulaires du site ne doivent
 * jamais laisser saisir un code ou un tileId au clavier : uniquement des listes.
 *
 * La grille est **hexagonale**, en offset odd-r pointy-top (cf.
 * `PlateauGenerator.CalculerPosition` : `x + (z impair ? 0.5 : 0)`, `z * 0.866`).
 * Un `rayon` se mesure donc en distance hexagonale, pas en distance de Chebyshev :
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

// --- Coût d'obtention -------------------------------------------------------

/**
 * - `consomme` : payé et perdu.
 * - `occupe` : mobilisé tant que le bâtiment vit, rendu à la destruction (la population).
 * - `requis` : vérifié sans être prélevé.
 */
export type ModeCout = "consomme" | "occupe" | "requis";

export const MODES_COUT: { valeur: ModeCout; libelle: string; aide: string }[] = [
  { valeur: "consomme", libelle: "consommé", aide: "payé et perdu" },
  { valeur: "occupe", libelle: "occupé", aide: "mobilisé tant que le bâtiment vit" },
  { valeur: "requis", libelle: "requis", aide: "vérifié sans être prélevé" },
];

export interface LigneCout {
  ressource: string;
  quantite: number;
  mode: ModeCout;
  /** Seulement pour `occupe` : le bâtiment éteint rend-il ce qu'il mobilise ? */
  libere_si_inactif?: boolean;
}

// --- Prérequis (ce qui n'est pas une ressource) -----------------------------

export type TypePrerequis = "niveau_joueur" | "tuile_possedee";

export const TYPES_PREREQUIS: { valeur: TypePrerequis; libelle: string }[] = [
  { valeur: "niveau_joueur", libelle: "niveau du joueur" },
  { valeur: "tuile_possedee", libelle: "tuile déjà possédée" },
];

export interface Prerequis {
  type: TypePrerequis;
  /** `niveau_joueur` */
  valeur?: number;
  /** `tuile_possedee` */
  tileId?: number;
  min?: number;
}

export function prerequisVide(type: TypePrerequis): Prerequis {
  return type === "niveau_joueur" ? { type, valeur: 1 } : { type, tileId: 0, min: 1 };
}

// --- Production -------------------------------------------------------------

/** Versé une fois, à la construction. */
export interface LigneInstant {
  ressource: string;
  quantite: number;
}

/**
 * Production ou consommation dans le temps. Volontairement `{quantite, periode_s}`
 * et non un taux décimal : la progression hors ligne se recalcule en multipliant
 * des entiers, sans dérive d'arrondi sur douze heures.
 */
export interface LigneFlux {
  ressource: string;
  quantite: number;
  periode_s: number;
}

export interface Production {
  immediat: LigneInstant[];
  periodique: LigneFlux[];
  consomme: LigneFlux[];
  /** Le bâtiment s'arrête quand son coffre local est plein. 0 = pas de plafond. */
  stock_max: number;
}

// --- Niveaux ----------------------------------------------------------------

/**
 * Un objet par palier. Le champ `niveau` est explicite en plus de la position
 * dans le tableau : un réordonnancement accidentel se voit alors, au lieu de
 * décaler tout le contenu en silence.
 */
export interface Niveau {
  niveau: number;
  duree_construction_s: number;
  cout: LigneCout[];
  prerequis: Prerequis[];
  production: Production;
}

// --- Placement --------------------------------------------------------------

/**
 * Toutes les règles doivent être vraies (ET simple). Un champ `groupe` pourra
 * être ajouté plus tard pour les OU sans invalider une seule règle déjà saisie.
 *
 * `rayon` absent ou `null` = tout le plateau. **Ne jamais utiliser 0 pour ça** :
 * 0 a déjà un sens légitime, la case elle-même.
 */
export type TypeRegle = "proximite" | "exclusion" | "support" | "limite";

export const TYPES_REGLE: { valeur: TypeRegle; libelle: string; aide: string }[] = [
  { valeur: "proximite", libelle: "proximité", aide: "au moins N tuiles d'un id donné à portée" },
  { valeur: "exclusion", libelle: "exclusion", aide: "aucune tuile de cet id à portée" },
  { valeur: "support", libelle: "support", aide: "la case elle-même doit porter un de ces ids" },
  { valeur: "limite", libelle: "limite", aide: "nombre maximum d'exemplaires" },
];

export interface ReglePlacement {
  regle: TypeRegle;
  /** `proximite`, `exclusion` */
  tileId?: number;
  /** `support` */
  tileIds?: number[];
  /** Distance hexagonale. `null` = tout le plateau. */
  rayon?: number | null;
  /** `proximite` */
  min?: number;
  /** `limite` */
  max?: number;
  portee?: "plateau" | "empire";
}

export function regleVide(regle: TypeRegle): ReglePlacement {
  switch (regle) {
    case "proximite":
      return { regle, tileId: 0, rayon: 2, min: 1 };
    case "exclusion":
      return { regle, tileId: 0, rayon: 2 };
    case "support":
      return { regle, tileIds: [] };
    case "limite":
      return { regle, max: 1, portee: "plateau" };
  }
}

// --- Logistique -------------------------------------------------------------

/**
 * Le modèle de couverture : un collecteur draine, à `debit`, les stocks locaux des
 * producteurs dans son `rayon`. Ce qui est dans un collecteur est disponible pour
 * la population ; ce qui est resté chez le producteur ne l'est pas.
 *
 * Les navettes visibles en jeu sont **une animation**, pas une simulation : elles
 * racontent ce que la formule vient de calculer. C'est ce qui rend la progression
 * hors ligne calculable en forme fermée au lieu de rejouer huit heures d'agents.
 */
export type RoleLogistique = "collecteur" | "consommateur";

export const ROLES_LOGISTIQUE: { valeur: RoleLogistique; libelle: string; aide: string }[] = [
  {
    valeur: "collecteur",
    libelle: "collecteur",
    aide: "draine les stocks locaux à portée (entrepôt)",
  },
  {
    valeur: "consommateur",
    libelle: "consommateur",
    aide: "puise dans les collecteurs à portée (habitat)",
  },
];

export interface Logistique {
  role: RoleLogistique;
  rayon: number | null;
  /** Codes acceptés. Liste vide = toutes les ressources. */
  ressources: string[];
  debit: { quantite: number; periode_s: number };
  capacite: number;
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
  actif: boolean;
  /**
   * tileId laisse sur la case quand cette tuile est detruite.
   * `0` = case vide, la meme convention que dans `tilesBase64`.
   */
  tileId_apres_destruction: number;
  placement: ReglePlacement[] | null;
  niveaux: Niveau[] | null;
  logistique: Logistique | null;
  created: string;
  updated: string;
  expand?: { modele?: Modele3D };
};

/** Ce que le formulaire renvoie. */
export interface ValeursTuile {
  tileId: number;
  nom: string;
  modele: string;
  typeOfPlateau: TypePlateau;
  categorie: string;
  description: string;
  actif: boolean;
  tileId_apres_destruction: number;
  placement: ReglePlacement[];
  niveaux: Niveau[];
  logistique: Logistique | null;
}

// --- Valeurs par défaut et normalisation ------------------------------------

export function productionVide(): Production {
  return { immediat: [], periodique: [], consomme: [], stock_max: 0 };
}

export function niveauVide(numero: number): Niveau {
  return {
    niveau: numero,
    duree_construction_s: 0,
    cout: [],
    prerequis: [],
    production: productionVide(),
  };
}

export function logistiqueVide(role: RoleLogistique): Logistique {
  return { role, rayon: 5, ressources: [], debit: { quantite: 10, periode_s: 60 }, capacite: 100 };
}

/**
 * Un champ json jamais renseigné revient `null` de PocketBase, et un objet ancien
 * peut manquer une clé ajoutée depuis. On normalise à la lecture pour que le reste
 * du code n'ait jamais à se demander si une liste existe.
 */
export function placementDe(tuile: Tuile): ReglePlacement[] {
  return Array.isArray(tuile.placement) ? tuile.placement : [];
}

export function niveauxDe(tuile: Tuile): Niveau[] {
  const bruts = Array.isArray(tuile.niveaux) ? tuile.niveaux : [];
  if (bruts.length === 0) return [niveauVide(1)];
  return bruts.map((n, i) => ({
    niveau: n.niveau ?? i + 1,
    duree_construction_s: n.duree_construction_s ?? 0,
    cout: Array.isArray(n.cout) ? n.cout : [],
    prerequis: Array.isArray(n.prerequis) ? n.prerequis : [],
    production: {
      immediat: Array.isArray(n.production?.immediat) ? n.production.immediat : [],
      periodique: Array.isArray(n.production?.periodique) ? n.production.periodique : [],
      consomme: Array.isArray(n.production?.consomme) ? n.production.consomme : [],
      stock_max: n.production?.stock_max ?? 0,
    },
  }));
}

export function logistiqueDe(tuile: Tuile): Logistique | null {
  const l = tuile.logistique;
  if (!l || !l.role) return null;
  return {
    role: l.role,
    rayon: l.rayon ?? null,
    ressources: Array.isArray(l.ressources) ? l.ressources : [],
    debit: { quantite: l.debit?.quantite ?? 0, periode_s: l.debit?.periode_s ?? 60 },
    capacite: l.capacite ?? 0,
  };
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
 * Tuiles dont une règle de placement cite `tileId`. Sert de garde-fou :
 * supprimer une tuile référencée casserait ces règles en silence.
 */
export function tuilesCitant(tuiles: Tuile[], tileId: number): Tuile[] {
  return tuiles.filter((t) =>
    placementDe(t).some(
      (r) => r.tileId === tileId || (Array.isArray(r.tileIds) && r.tileIds.includes(tileId)),
    ),
  );
}

/** Résumé d'une durée en secondes, pour l'affichage. */
export function formatDuree(secondes: number): string {
  if (!secondes) return "immédiat";
  if (secondes < 60) return `${secondes} s`;
  if (secondes < 3600) return `${Math.round(secondes / 60)} min`;
  return `${(secondes / 3600).toFixed(1).replace(".0", "")} h`;
}

/** Nombre de cases couvertes par un rayon sur une grille hexagonale : 3r(r+1). */
export function casesCouvertes(rayon: number): number {
  return 3 * rayon * (rayon + 1);
}
