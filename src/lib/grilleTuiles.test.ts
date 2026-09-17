// ============================================================
//  grilleTuiles.test.ts
//  Le tableau âges × catégories de l'onglet Tuiles (17/09).
// ============================================================

import { describe, expect, it } from "vitest";
import { rangerEnGrille } from "@/lib/grilleTuiles";
import { SANS_CATEGORIE } from "@/lib/technologies";

const t = (id: string, age: number, categorie = "") => ({ id, age, categorie });

describe("rangerEnGrille", () => {
  it("met une tuile multi-catégorie dans chaque ligne, mais la compte une fois", () => {
    const g = rangerEnGrille([t("a", 1, "Vivres, Confort"), t("b", 1, "Vivres")], [1]);
    expect(g.categories).toEqual(["Confort", "Vivres"]);
    expect(g.cellule("Confort", 1).map((x) => x.id)).toEqual(["a"]);
    expect(g.cellule("Vivres", 1).map((x) => x.id)).toEqual(["a", "b"]);
    expect(g.totalAge(1)).toBe(2);
    expect(g.totalCategorie("Vivres")).toBe(2);
  });

  it("garde les âges déclarés vides et montre un âge non déclaré", () => {
    const g = rangerEnGrille([t("a", 5, "X")], [1, 2]);
    expect(g.ages).toEqual([1, 2, 5]);
    expect(g.cellule("X", 1)).toEqual([]);
  });

  it("met « sans âge » en dernière colonne, seulement s'il sert", () => {
    expect(rangerEnGrille([t("a", 1, "X")], [1, 2]).ages).toEqual([1, 2]);
    expect(rangerEnGrille([t("a", 0, "X"), t("b", 2, "X")], [1]).ages).toEqual([1, 2, 0]);
  });

  it("range une tuile sans catégorie dans la dernière ligne", () => {
    const g = rangerEnGrille([t("a", 1, ""), t("b", 1, "Zinc")], [1]);
    expect(g.categories).toEqual(["Zinc", SANS_CATEGORIE]);
    expect(g.cellule(SANS_CATEGORIE, 1).map((x) => x.id)).toEqual(["a"]);
  });

  it("ne crée pas deux lignes pour une différence de casse", () => {
    const g = rangerEnGrille([t("a", 1, "Vivres"), t("b", 2, "vivres")], [1, 2]);
    expect(g.categories).toEqual(["Vivres"]);
    expect(g.cellule("vivres", 2).map((x) => x.id)).toEqual(["b"]);
  });
});
