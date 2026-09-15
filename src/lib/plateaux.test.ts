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
  decoderTiles,
  encoderTiles,
  etatVide,
  etatsDe,
  octetsParCase,
  palettePourPlateau,
  redimensionner,
  type Plateau,
} from "@/lib/plateaux";
import type { TypePlateau } from "@/lib/modeles3d";
import type { Planete } from "@/lib/planetes";

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
//  LA PALETTE PAR PLANÈTE — 15/09 (remplace le « type 2 » libre du 13/09).
//
//  ⚠️ L'ESSAI QUI COMPTE est celui du JOUEUR : sa palette ne contient QUE ses
//  tuiles. Une palette qui laisserait passer le jeu serait verte sur la Terre,
//  et le serveur refuserait ensuite d'enregistrer son modèle.
// ============================================================

const pl = (id: string, nom: string, proprietaire = ""): Planete => ({ id, nom, proprietaire, created: "", updated: "" });
const planetes = [pl("pGame", "Game"), pl("pTerre", "Terre"), pl("pJupiter", "Jupiter"), pl("pSeb", "Seb", "u1")];
const tuile = (tileId: number, typeOfPlateau: TypePlateau, planete?: string) => ({
  tileId,
  typeOfPlateau,
  ...(planete === undefined ? {} : { planete }),
});

describe("palettePourPlateau", () => {
  const catalogue = [
    tuile(3, "ground", "pTerre"),
    tuile(1, "ground", "pGame"),
    tuile(2, "ground", "pJupiter"),
    tuile(300, "ground", "pSeb"),
    tuile(4, "space", "pTerre"),
    tuile(5, "ground"),
  ];

  it("chez un joueur : ses tuiles, et rien du jeu", () => {
    expect(palettePourPlateau(catalogue, "ground", "pSeb", planetes).map((t) => t.tileId)).toEqual([300]);
  });

  it("sur la Terre : la Terre, Game et le non rangé — pas Jupiter, pas le joueur", () => {
    expect(palettePourPlateau(catalogue, "ground", "pTerre", planetes).map((t) => t.tileId)).toEqual([1, 3, 5]);
  });

  it("le type de décor décide toujours", () => {
    expect(palettePourPlateau(catalogue, "space", "pTerre", planetes).map((t) => t.tileId)).toEqual([4]);
  });

  it("sans planètes en base : tout le type (l'état d'avant)", () => {
    expect(palettePourPlateau(catalogue, "ground", "pSeb", []).map((t) => t.tileId)).toEqual([1, 2, 3, 5, 300]);
  });
});

// ============================================================
//  LA GRILLE SUR 1 OU 2 OCTETS — 15/09. Mêmes cas que `moteur.LireGrille`.
// ============================================================

describe("la grille", () => {
  const b64 = (octets: number[]) => btoa(String.fromCharCode(...octets));

  it("relit une grille d'avant (1 octet par case) telle quelle", () => {
    const cases = decoderTiles({ largeur: 3, hauteur: 2, tilesBase64: b64([0, 1, 255, 7, 0, 12]) });
    expect([...cases]).toEqual([0, 1, 255, 7, 0, 12]);
  });

  it("lit 2 octets par case, poids fort d'abord", () => {
    const cases = decoderTiles({ largeur: 2, hauteur: 2, tilesBase64: b64([0x01, 0x2c, 0xff, 0xff, 0, 1, 0, 0]) });
    expect([...cases]).toEqual([300, 65535, 1, 0]);
  });

  it("écrit 1 octet tant que tout tient, 2 sinon — et relit ce qu'il écrit", () => {
    expect(atob(encoderTiles([0, 1, 255])).length).toBe(3);
    const grande = [0, 300, 65535, 7, 256, 0];
    const texte = encoderTiles(grande);
    expect(atob(texte).length).toBe(12);
    expect([...decoderTiles({ largeur: 3, hauteur: 2, tilesBase64: texte })]).toEqual(grande);
    expect(octetsParCase(grande)).toBe(2);
    expect(octetsParCase([1, 2])).toBe(1);
  });

  it("une longueur de travers rend une grille de la bonne taille, sans planter", () => {
    expect([...decoderTiles({ largeur: 2, hauteur: 2, tilesBase64: b64([1, 2, 3]) })]).toEqual([1, 2, 3, 0]);
    expect([...decoderTiles({ largeur: 2, hauteur: 1, tilesBase64: "§§" })]).toEqual([0, 0]);
    expect([...decoderTiles({ largeur: 2, hauteur: 1, tilesBase64: "" })]).toEqual([0, 0]);
  });

  it("redimensionne sans tronquer un id au-delà de 255", () => {
    const r = redimensionner(Uint16Array.from([300, 1, 2, 3]), { largeur: 2, hauteur: 2 }, { largeur: 1, hauteur: 2 });
    expect([...r]).toEqual([300, 2]);
  });
});

