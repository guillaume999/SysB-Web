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
  ALTITUDE_MAX,
  altitudeDeCase,
  cranValable,
  deLaFamille,
  familleDeCopie,
  familleDeModele,
  decoderAltitudes,
  ecrireAltitudes,
  decoderTiles,
  encoderAltitudes,
  encoderTiles,
  estPlat,
  redimensionnerAltitudes,
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

// ============================================================
//  L'ALTITUDE DES CASES (18/09) — le relief vit sur la CASE.
//
//  ⚠️ Ce qui se perdrait en silence : un plateau plat qui se met à écrire
//  5 000 zéros en base, ou une grille d'altitude qui se décale d'une case
//  quand on change la largeur — le relief irait alors sous les mauvais
//  bâtiments, et personne ne saurait dire quand ça a commencé.
// ============================================================

describe("altitude des cases", () => {
  it("un plateau sans altitude est plat, et ne s'écrit pas", () => {
    expect([...decoderAltitudes({ largeur: 2, hauteur: 2 })]).toEqual([0, 0, 0, 0]);
    expect([...decoderAltitudes({ largeur: 2, hauteur: 1, altitudesBase64: "" })]).toEqual([0, 0]);
    expect(estPlat([0, 0, 0])).toBe(true);
    // ⚠️ La chaîne VIDE, pas une suite de zéros : c'est ce qui laisse les
    // plateaux d'avant le relief exactement comme ils sont.
    expect(encoderAltitudes([0, 0, 0, 0])).toBe("");
  });

  it("relit ce qu'il écrit, un octet par case", () => {
    const crans = [0, 1, 10, 255, 3, 0];
    const texte = encoderAltitudes(crans);
    expect(atob(texte).length).toBe(6);
    expect([...decoderAltitudes({ largeur: 3, hauteur: 2, altitudesBase64: texte })]).toEqual(crans);
  });

  it("un contenu abîmé rend un plateau lisible plutôt qu'une exception", () => {
    expect([...decoderAltitudes({ largeur: 2, hauteur: 2, altitudesBase64: "§§" })]).toEqual([0, 0, 0, 0]);
    expect([...decoderAltitudes({ largeur: 2, hauteur: 2, altitudesBase64: btoa("\x01\x02") })]).toEqual([1, 2, 0, 0]);
  });

  it("redimensionne en gardant les coordonnées, pas l'ordre des octets", () => {
    const avant = Uint8Array.from([1, 2, 3, 4, 5, 6]); // largeur 3, hauteur 2
    const apres = redimensionnerAltitudes(avant, { largeur: 3, hauteur: 2 }, { largeur: 2, hauteur: 2 });
    expect([...apres]).toEqual([1, 2, 4, 5]);
  });

  it("borne les crans saisis au lieu de les laisser partir en base", () => {
    expect(cranValable("3")).toBe(3);
    expect(cranValable(-2)).toBe(0);
    expect(cranValable(1e9)).toBe(ALTITUDE_MAX);
    expect(cranValable("bonjour")).toBe(0);
    expect(cranValable(2.7)).toBe(2);
    expect(encoderAltitudes([-1, 999])).toBe(encoderAltitudes([0, ALTITUDE_MAX]));
  });

  it("lit le cran d'une case, et rend 0 hors du plateau", () => {
    const crans = [1, 2, 3, 4];
    expect(altitudeDeCase(crans, 2, 1, 1)).toBe(4);
    expect(altitudeDeCase(crans, 2, 0, 5)).toBe(0);
  });
});

describe("ecrireAltitudes", () => {
  const cases = (l: number, h: number) => new Uint8Array(l * h);

  it("n'écrit que les cases visées", () => {
    const apres = ecrireAltitudes(cases(3, 2), [{ x: 1, z: 1 }], 4, 3, 2);
    expect([...apres]).toEqual([0, 0, 0, 0, 4, 0]);
  });

  it("rend LE MÊME tableau quand rien ne change", () => {
    const avant = Uint8Array.from([0, 2, 0, 0]);
    // ⚠️ L'identité, pas l'égalité : c'est elle qui évite de marquer le plateau
    // modifié et de redessiner la grille quand le pinceau repasse au même endroit.
    expect(ecrireAltitudes(avant, [{ x: 1, z: 0 }], 2, 2, 2)).toBe(avant);
    expect(ecrireAltitudes(avant, [{ x: 1, z: 0 }], 3, 2, 2)).not.toBe(avant);
  });

  it("installe un relief à plat sur un plateau qui n'en avait pas", () => {
    const apres = ecrireAltitudes(new Uint8Array(0), [{ x: 0, z: 0 }], 1, 2, 2);
    expect([...apres]).toEqual([1, 0, 0, 0]);
  });

  it("borne le cran et ignore une case hors plateau", () => {
    expect([...ecrireAltitudes(cases(2, 1), [{ x: 0, z: 0 }], 999, 2, 1)]).toEqual([255, 0]);
    expect([...ecrireAltitudes(cases(2, 1), [{ x: 9, z: 9 }], 3, 2, 1)]).toEqual([0, 0]);
  });
});

// ============================================================
//  GAME OU JOUEUR — la découpe des quatre onglets (19/09)
//
//  ⚠️ L'ESSAI QUI COMPTE est celui de L'INCONNU : un modèle non rangé et un
//  plateau sans planète doivent tomber dans « game ». S'ils tombaient ailleurs
//  — ou nulle part — ils disparaîtraient des deux écrans sans une erreur, et
//  personne n'irait les corriger.
// ============================================================

const ligne = (x: Partial<Plateau>): Plateau => x as Plateau;

describe("la famille d'un MODÈLE", () => {
  it("se lit sur `appartient`, et sur rien d'autre", () => {
    expect(familleDeModele(ligne({ appartient: "game" }))).toBe("game");
    expect(familleDeModele(ligne({ appartient: "u1" }))).toBe("joueur");
  });

  it("range un modèle NON RANGÉ dans « game », là où l'admin le verra", () => {
    expect(familleDeModele(ligne({ appartient: "" }))).toBe("game");
    expect(familleDeModele(ligne({}))).toBe("game");
  });

  it("ne regarde PAS la planète : la colonne « appartient » dirait autre chose", () => {
    // Un modèle marqué « game » posé par erreur sur la planète d'un joueur
    // reste dans l'onglet game — c'est là qu'on peut le corriger.
    expect(familleDeModele(ligne({ appartient: "game", planete: "pSeb" }))).toBe("game");
  });
});

describe("la famille d'une COPIE de joueur", () => {
  it("se lit sur la PLANÈTE où elle se joue", () => {
    expect(familleDeCopie(ligne({ planete: "pTerre" }), planetes)).toBe("game");
    expect(familleDeCopie(ligne({ planete: "pSeb" }), planetes)).toBe("joueur");
  });

  it("range dans « game » un plateau sans planète, ou dont la planète a disparu", () => {
    expect(familleDeCopie(ligne({}), planetes)).toBe("game");
    expect(familleDeCopie(ligne({ planete: "envolee" }), planetes)).toBe("game");
  });
});

describe("deLaFamille", () => {
  const modeles = [
    ligne({ id: "a", appartient: "game" }),
    ligne({ id: "b", appartient: "u1" }),
    ligne({ id: "c", appartient: "" }),
  ];
  const copies = [
    ligne({ id: "d", planete: "pJupiter" }),
    ligne({ id: "e", planete: "pSeb" }),
  ];

  it("partage les modèles en deux, sans en perdre un seul", () => {
    expect(deLaFamille(modeles, "game", "templates", planetes).map((p) => p.id)).toEqual(["a", "c"]);
    expect(deLaFamille(modeles, "joueur", "templates", planetes).map((p) => p.id)).toEqual(["b"]);
  });

  it("partage les copies par leur planète", () => {
    expect(deLaFamille(copies, "game", "plateaux", planetes).map((p) => p.id)).toEqual(["d"]);
    expect(deLaFamille(copies, "joueur", "plateaux", planetes).map((p) => p.id)).toEqual(["e"]);
  });

  it("met tout le monde dans exactement UN onglet", () => {
    // ⚠️ Deux onglets qui se recouvrent afficheraient deux fois la même ligne ;
    // deux onglets qui laissent un trou la feraient disparaître.
    for (const [liste, source] of [[modeles, "templates"], [copies, "plateaux"]] as const) {
      const game = deLaFamille(liste, "game", source, planetes);
      const joueur = deLaFamille(liste, "joueur", source, planetes);
      expect(game.length + joueur.length).toBe(liste.length);
      expect(game.filter((p) => joueur.includes(p))).toEqual([]);
    }
  });
});
