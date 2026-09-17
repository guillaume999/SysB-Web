// ============================================================
//  grilleTuiles.ts
//  Le catalogue des tuiles en TABLEAU : les âges en colonnes, les catégories
//  en lignes (demande du 2026-09-17).
//
//  ⚠️ RIEN N'EST STOCKÉ ICI : la grille se recalcule à partir des tuiles
//  affichées (filtres compris) et des âges déclarés. Une seule source, celle
//  de la base.
// ============================================================

import { categoriesDe } from "@/lib/tuiles";
import { SANS_CATEGORIE } from "@/lib/technologies";
import { SANS_AGE } from "@/lib/ages";

export interface GrilleTuiles<T> {
  /** Les numéros d'âge en colonnes, dans l'ordre ; `SANS_AGE` (0) en dernier s'il sert. */
  ages: number[];
  /** Les catégories en lignes, par ordre alphabétique ; `SANS_CATEGORIE` en dernier. */
  categories: string[];
  /** Les tuiles d'une case, dans l'ordre reçu. Case vide = liste vide. */
  cellule: (categorie: string, age: number) => T[];
  /** Combien de tuiles DIFFÉRENTES dans une colonne (une tuile multi-catégorie compte une fois). */
  totalAge: (age: number) => number;
  /** Combien de tuiles dans une ligne. */
  totalCategorie: (categorie: string) => number;
}

/** L'âge d'une tuile tel que la grille le range : un entier ≥ 1, sinon `SANS_AGE`. */
export function ageDeGrille(t: { age?: number | null }): number {
  const a = Number(t.age);
  return Number.isFinite(a) && a >= 1 ? Math.trunc(a) : SANS_AGE;
}

/** La clé d'une catégorie : la casse ne crée pas de ligne. */
const cleCategorie = (c: string) => c.toLocaleLowerCase("fr");
const cleCase = (categorie: string, age: number) => `${age}|${cleCategorie(categorie)}`;

/**
 * Range les tuiles dans la grille.
 *
 * ⚠️ **Une tuile à plusieurs catégories apparaît dans CHAQUE ligne** (choix du
 * 17/09) : les catégories sont toutes égales depuis le 30/08, comme au magasin
 * du jeu et sur l'écran des technologies. Les totaux, eux, la comptent une fois.
 *
 * ⚠️ **Les âges montrés = les âges déclarés ∪ ceux que portent les tuiles.**
 * Un âge déclaré mais vide garde sa colonne (il attend une saisie) ; un âge
 * porté par une tuile mais non déclaré s'affiche aussi — le masquer ferait
 * disparaître ses tuiles en silence. Même règle que l'écran Ressources.
 *
 * ⚠️ « vivres » et « Vivres » sont la même ligne : on garde la première
 * orthographe rencontrée.
 */
export function rangerEnGrille<T extends { id: string; age?: number | null; categorie?: string }>(
  tuiles: T[],
  agesDeclares: number[],
): GrilleTuiles<T> {
  const cases = new Map<string, T[]>();
  const nomsCategories = new Map<string, string>();
  const parAge = new Map<number, Set<string>>();
  const parCategorie = new Map<string, Set<string>>();
  const agesVus = new Set<number>(agesDeclares.filter((a) => a >= 1));

  const ajouter = <K>(m: Map<K, Set<string>>, k: K, id: string) => {
    const s = m.get(k) ?? new Set<string>();
    s.add(id);
    m.set(k, s);
  };

  for (const t of tuiles) {
    const age = ageDeGrille(t);
    agesVus.add(age);
    ajouter(parAge, age, t.id);

    const cats = categoriesDe(t);
    for (const nom of cats.length > 0 ? cats : [SANS_CATEGORIE]) {
      const cle = cleCategorie(nom);
      if (!nomsCategories.has(cle)) nomsCategories.set(cle, nom);
      const k = cleCase(nom, age);
      cases.set(k, [...(cases.get(k) ?? []), t]);
      ajouter(parCategorie, cle, t.id);
    }
  }

  const ages = [...agesVus]
    // SANS_AGE n'a de colonne que si une tuile l'occupe.
    .filter((a) => a !== SANS_AGE || parAge.has(SANS_AGE))
    .sort((a, b) => (a || Infinity) - (b || Infinity));

  const cleSans = cleCategorie(SANS_CATEGORIE);
  const categories = [...nomsCategories.entries()]
    .sort(([ka, a], [kb, b]) => {
      if (ka === cleSans) return 1;
      if (kb === cleSans) return -1;
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    })
    .map(([, nom]) => nom);

  return {
    ages,
    categories,
    cellule: (categorie, age) => cases.get(cleCase(categorie, age)) ?? [],
    totalAge: (age) => parAge.get(age)?.size ?? 0,
    totalCategorie: (categorie) => parCategorie.get(cleCategorie(categorie))?.size ?? 0,
  };
}
