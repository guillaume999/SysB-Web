// ============================================================
//  categories.test.ts
//  L'ordre des catégories de tuiles (17/09) — la collection `categories`.
// ============================================================

import { describe, expect, it } from "vitest";
import {
  deplacerCategorie,
  ecrituresDOrdre,
  ordreCategories,
  rangCategorie,
  type CategorieRangee,
} from "@/lib/categories";

const r = (id: string, nom: string, ordre?: number): CategorieRangee => ({ id, nom, ordre });

describe("ordreCategories", () => {
  it("suit le rang des rangées, puis range les inconnues alphabétiquement", () => {
    const ordre = ordreCategories(
      [r("1", "Vivres", 20), r("2", "Matériaux", 10)],
      ["Vivres", "Matériaux", "Zinc", "Confort"],
    );
    expect(ordre).toEqual(["Matériaux", "Vivres", "Confort", "Zinc"]);
  });

  it("garde l'orthographe EN USAGE, pas celle de la rangée", () => {
    expect(ordreCategories([r("1", "vivres", 10)], ["Vivres"])).toEqual(["Vivres"]);
  });

  it("garde une rangée que plus aucune tuile ne porte", () => {
    expect(ordreCategories([r("1", "Vivres", 10)], ["Confort"])).toEqual(["Vivres", "Confort"]);
  });

  it("range une rangée sans `ordre` après celles qui en ont un", () => {
    expect(ordreCategories([r("1", "Aaa"), r("2", "Zzz", 10)], ["Aaa", "Zzz"])).toEqual([
      "Zzz",
      "Aaa",
    ]);
  });
});

describe("deplacerCategorie", () => {
  const ordre = ["A", "B", "C", "D"];

  it("monte et descend d'un cran", () => {
    expect(deplacerCategorie(ordre, ordre, "C", -1)).toEqual(["A", "C", "B", "D"]);
    expect(deplacerCategorie(ordre, ordre, "B", 1)).toEqual(["A", "C", "B", "D"]);
  });

  it("ne bouge pas la première vers le haut, ni la dernière vers le bas", () => {
    expect(deplacerCategorie(ordre, ordre, "A", -1)).toEqual(ordre);
    expect(deplacerCategorie(ordre, ordre, "D", 1)).toEqual(ordre);
  });

  it("compte le cran sur les lignes VISIBLES : la cachée suit le mouvement", () => {
    // B est cachée par un filtre : monter C doit le passer au-dessus de A.
    expect(deplacerCategorie(ordre, ["A", "C", "D"], "C", -1)).toEqual(["C", "A", "B", "D"]);
  });

  it("ignore la casse et laisse la liste intacte pour une inconnue", () => {
    expect(deplacerCategorie(ordre, ordre, "c", -1)).toEqual(["A", "C", "B", "D"]);
    expect(deplacerCategorie(ordre, ordre, "Z", -1)).toEqual(ordre);
  });
});

describe("rangCategorie", () => {
  it("rend Infinity pour une catégorie hors de l'ordre", () => {
    expect(rangCategorie(["A", "B"], "b")).toBe(1);
    expect(rangCategorie(["A", "B"], "C")).toBe(Infinity);
  });
});

describe("ecrituresDOrdre", () => {
  it("n'écrit QUE les rangées dont le rang change, et crée les manquantes", () => {
    const rangees = [r("1", "A", 10), r("2", "B", 20), r("3", "C", 30)];
    // A et B échangent : C garde son rang 30 et ne part pas en base.
    const ecritures = ecrituresDOrdre(["B", "A", "C"], rangees);
    expect(ecritures).toEqual([
      { id: "2", nom: "B", ordre: 10 },
      { id: "1", nom: "A", ordre: 20 },
    ]);
  });

  it("crée la rangée d'une catégorie qui n'en a pas", () => {
    expect(ecrituresDOrdre(["A", "N"], [r("1", "A", 10)])).toEqual([
      { id: null, nom: "N", ordre: 20 },
    ]);
  });
});
