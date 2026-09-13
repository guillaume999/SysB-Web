// ============================================================
//  plateaux.test.ts
//  L'état d'une case au format du moteur à cycles — posé le 2026-09-11.
//
//  ⚠️ CE QUI EST TESTÉ ICI EST CE QUI SE PERD EN SILENCE : un vieux `t` par
//  case recopié en base à chaque enregistrement de l'éditeur, ou les navettes
//  d'un joueur effacées parce que l'admin a rouvert son plateau.
//  Le format fait foi dans `SysB/SPEC_MOTEUR_CYCLES.md` §10.
// ============================================================

import { describe, expect, it } from "vitest";

import {
  etatVide,
  etatsDe,
  memeType2,
  palettePourPlateau,
  type2Connus,
  type Plateau,
} from "@/lib/plateaux";
import type { TypePlateau } from "@/lib/modeles3d";

const plateau = (etats: unknown): Plateau => ({ etats } as unknown as Plateau);

describe("etatVide", () => {
  it("naît à l'arrêt, sans cycle joué ni navette — et sans `t` : c'est le plateau qui le porte", () => {
    const e = etatVide(3, 4);
    expect(e).toEqual({
      x: 3,
      z: 4,
      niveau: 1,
      actif: true,
      stock: {},
      t_cycle: 0,
      en_marche: false,
      navettes: [],
    });
    expect(e).not.toHaveProperty("t");
  });
});

describe("etatsDe", () => {
  it("écarte le `t` par case et la satisfaction d'avant le 11/09 — ils ne repartent pas en base", () => {
    const [e] = etatsDe(plateau([{ x: 1, z: 2, niveau: 1, actif: true, stock: {}, t: 1755855600, satisfactionPourMille: 800 }]));
    expect(e).not.toHaveProperty("t");
    expect(e).not.toHaveProperty("satisfactionPourMille");
    expect(e.t_cycle).toBe(0);
  });

  it("recopie TELLES QUELLES les navettes en vol et le chantier", () => {
    const navette = {
      origine: [12, 7],
      destination: [15, 9],
      parti_a: 1755855590,
      arrive_a: 1755855610,
      charge: { ble: 10 },
      sens: "retour",
      regle: 0,
    };
    const [e] = etatsDe(
      plateau([{ x: 12, z: 7, niveau: 1, actif: true, stock: { ble: 3 }, t_cycle: 1755855600, en_marche: true, navettes: [navette], chantier_fin: 1755856000 }]),
    );
    expect(e.navettes).toEqual([navette]);
    expect(e.en_marche).toBe(true);
    expect(e.t_cycle).toBe(1755855600);
    expect(e.chantier_fin).toBe(1755856000);
  });

  it("garde un stock en unités réelles entières, et jette les zéros", () => {
    const [e] = etatsDe(plateau([{ x: 0, z: 0, stock: { ble: 8.9, bois: 0 } }]));
    expect(e.stock).toEqual({ ble: 8 });
  });

  it("survit à un champ jamais rempli", () => {
    expect(etatsDe(plateau(null))).toEqual([]);
  });
});

// ============================================================
//  TYPE DE PLATEAU 2 — la réserve, posée le 2026-09-13.
//
//  ⚠️ CE QUI SE PERD EN SILENCE ICI, c'est une palette. La règle est STRICTE,
//  le vide compris : c'est le choix de l'utilisateur ce jour-là, et il a un
//  effet de bord qui se voit tout de suite (donner une étiquette à un modèle
//  vide sa palette) et un autre qui ne se voit pas (étiqueter une tuile la
//  retire de TOUS les autres plateaux). Un jour quelqu'un voudra « vide =
//  passe-partout » : ces tests lui diront ce qu'il défait.
// ============================================================

const tuile = (tileId: number, typeOfPlateau: TypePlateau, typeOfPlateau2?: string) => ({
  tileId,
  typeOfPlateau,
  ...(typeOfPlateau2 === undefined ? {} : { typeOfPlateau2 }),
});

describe("palettePourPlateau", () => {
  const catalogue = [
    tuile(3, "ground"),
    tuile(1, "ground", "Jupiter"),
    tuile(2, "ground", "Mars"),
    tuile(4, "space", "Jupiter"),
  ];

  it("garde les tuiles SANS étiquette sur un plateau sans étiquette — l'état d'avant le 13/09", () => {
    expect(palettePourPlateau(catalogue, "ground", "").map((t) => t.tileId)).toEqual([3]);
  });

  it("un plateau étiqueté ne voit QUE son étiquette : la tuile nue en est exclue", () => {
    expect(palettePourPlateau(catalogue, "ground", "Jupiter").map((t) => t.tileId)).toEqual([1]);
  });

  it("le type 1 décide toujours : l'étiquette ne fait pas passer une tuile `space` sur du `ground`", () => {
    expect(palettePourPlateau(catalogue, "ground", "Jupiter").every((t) => t.tileId !== 4)).toBe(
      true,
    );
  });

  it("les espaces et la casse ne comptent pas — sinon un champ libre fabrique des jumelles", () => {
    expect(palettePourPlateau(catalogue, "ground", "  jupiter ").map((t) => t.tileId)).toEqual([1]);
  });

  it("une étiquette que personne ne porte rend une palette VIDE, pas le catalogue entier", () => {
    expect(palettePourPlateau(catalogue, "ground", "Saturne")).toEqual([]);
  });

  it("un champ jamais rempli en base (`undefined`) vaut l'absence d'étiquette", () => {
    expect(memeType2(undefined, "")).toBe(true);
    expect(memeType2(undefined, "Jupiter")).toBe(false);
  });

  it("rend la palette dans l'ordre du catalogue, par tileId", () => {
    const deux = [tuile(9, "ground", "Mars"), tuile(2, "ground", "Mars")];
    expect(palettePourPlateau(deux, "ground", "Mars").map((t) => t.tileId)).toEqual([2, 9]);
  });
});

describe("type2Connus", () => {
  it("fond les jumelles de casse, écarte les vides, et range par alphabet français", () => {
    const tuiles = [tuile(1, "ground", "Jupiter"), tuile(2, "ground", "jupiter "), tuile(3, "ground", "")];
    const modeles = [{ typeOfPlateau2: "Élysée" }, { typeOfPlateau2: "Mars" }];
    expect(type2Connus(tuiles, modeles)).toEqual(["Élysée", "Jupiter", "Mars"]);
  });

  it("survit à une source vide — la liste des modèles peut n'être pas encore chargée", () => {
    expect(type2Connus([], [])).toEqual([]);
  });
});
