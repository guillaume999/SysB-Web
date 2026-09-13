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

import { etatVide, etatsDe, type Plateau } from "@/lib/plateaux";

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
