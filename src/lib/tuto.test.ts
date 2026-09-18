import { describe, expect, it } from "vitest";
import {
  CARTE_VIDE,
  cartesJouees,
  deplacer,
  erreursCarte,
  groupes,
  normaliserGroupe,
  ordonner,
  prochainOrdre,
  type CarteTuto,
} from "@/lib/tuto";

const carte = (
  id: string,
  ordre: number,
  extra: Partial<CarteTuto> = {},
): CarteTuto => ({
  id,
  groupe: "terre",
  ordre,
  titre: `Carte ${id}`,
  texte: "Un texte.",
  actif: true,
  created: `2026-09-18 10:0${id}:00.000Z`,
  ...extra,
});

describe("le nom de planète", () => {
  it("descend en minuscules et perd ses accents", () => {
    expect(normaliserGroupe("Terre")).toBe("terre");
    expect(normaliserGroupe("  Aragonia ")).toBe("aragonia");
    expect(normaliserGroupe("Planète Rouge")).toBe("planete-rouge");
  });
});

describe("l'ordre d'affichage", () => {
  it("suit le rang, puis la date de création quand deux cartes sont au même rang", () => {
    const cartes = [carte("3", 2), carte("1", 1), carte("2", 2)];
    expect(ordonner(cartes, "terre").map((c) => c.id)).toEqual(["1", "2", "3"]);
  });

  it("ne mélange pas deux planètes", () => {
    const cartes = [carte("1", 1), carte("2", 1, { groupe: "jupiter" })];
    expect(ordonner(cartes, "terre").map((c) => c.id)).toEqual(["1"]);
    expect(ordonner(cartes, "jupiter").map((c) => c.id)).toEqual(["2"]);
  });

  it("le jeu ne voit que les cartes actives", () => {
    const cartes = [carte("1", 1), carte("2", 2, { actif: false }), carte("3", 3)];
    expect(cartesJouees(cartes, "terre").map((c) => c.id)).toEqual(["1", "3"]);
  });
});

describe("le rang d'une carte ajoutée", () => {
  it("part à 1 sur une planète vide", () => {
    expect(prochainOrdre([], "terre")).toBe(1);
    expect(prochainOrdre([carte("1", 1)], "jupiter")).toBe(1);
  });

  it("se pose après la dernière, même si les rangs ont des trous", () => {
    expect(prochainOrdre([carte("1", 1), carte("2", 7)], "terre")).toBe(8);
  });
});

describe("monter et descendre", () => {
  const cartes = [carte("1", 1), carte("2", 2), carte("3", 3)];

  it("échange bien deux voisines", () => {
    expect(deplacer(cartes, "terre", "3", -1)).toEqual([
      { id: "3", ordre: 2 },
      { id: "2", ordre: 3 },
    ]);
  });

  it("ne rend rien en haut de la liste ni en bas", () => {
    expect(deplacer(cartes, "terre", "1", -1)).toEqual([]);
    expect(deplacer(cartes, "terre", "3", 1)).toEqual([]);
  });

  it("répare les rangs douteux en passant", () => {
    // ⚠️ Deux cartes au même rang : un simple échange n'aurait RIEN changé.
    const bancales = [carte("1", 5), carte("2", 5), carte("3", 5)];
    expect(deplacer(bancales, "terre", "1", 1)).toEqual([
      { id: "2", ordre: 1 },
      { id: "1", ordre: 2 },
      { id: "3", ordre: 3 },
    ]);
  });

  it("ignore une carte qui n'est pas dans la liste", () => {
    expect(deplacer(cartes, "terre", "inconnue", 1)).toEqual([]);
  });
});

describe("les refus de saisie", () => {
  it("laisse passer une carte correcte", () => {
    expect(erreursCarte({ ...CARTE_VIDE, texte: "Bienvenue." })).toEqual([]);
  });

  it("exige un texte", () => {
    expect(erreursCarte({ ...CARTE_VIDE, texte: "   " })).toHaveLength(1);
  });

  it("refuse un nom de planète que la base n'accepterait pas", () => {
    for (const groupe of ["Terre", "planète", "terre 2"])
      expect(erreursCarte({ ...CARTE_VIDE, groupe, texte: "x" })).toHaveLength(1);
  });

  it("refuse un texte trop long pour une carte", () => {
    expect(erreursCarte({ ...CARTE_VIDE, texte: "x".repeat(2001) })).toHaveLength(1);
  });
});

describe("la liste des planètes du sélecteur", () => {
  it("contient toujours la Terre, même sans aucune carte", () => {
    expect(groupes([])).toEqual(["terre"]);
  });

  it("ajoute les planètes qui ont des cartes, sans doublon", () => {
    const cartes = [carte("1", 1, { groupe: "jupiter" }), carte("2", 2, { groupe: "jupiter" })];
    expect(groupes(cartes)).toEqual(["jupiter", "terre"]);
  });
});
