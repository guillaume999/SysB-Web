// ============================================================
//  conception.test.ts — le miroir des règles du serveur (15/09).
//  Les cas sont ceux de `routes/conception_test.go` et
//  `routes/catalogue_planete_test.go` : si l'un bouge, l'autre doit suivre.
// ============================================================

import { describe, expect, it } from "vitest";
import {
  AUCUNE_LIMITE,
  dansLaPortee,
  duCatalogue,
  erreurFiche,
  etatQuota,
  etiquettePourPlanete,
  ficheVide,
  limitesDe,
  planeteDuJoueur,
  planeteParDefaut,
  planetesDuCatalogue,
  refusTaille,
  type Portee,
} from "@/lib/conception";
import type { Planete } from "@/lib/planetes";

const pl = (id: string, nom: string, proprietaire = ""): Planete => ({
  id,
  nom,
  proprietaire,
  created: "",
  updated: "",
});
const planetes = [
  pl("pGame", "Game"),
  pl("pTerre", "Terre"),
  pl("pJupiter", "Jupiter"),
  pl("pSeb", "Seb", "u1"),
  pl("pZoe", "Zoe", "u2"),
];

const fiche = (general: boolean, joueurs: unknown, l: number, h: number, tu: number, re: number, te: number) => ({
  general,
  joueurs: joueurs as string[],
  largeur_max: l,
  hauteur_max: h,
  tuiles_max: tu,
  ressources_max: re,
  technos_max: te,
});

describe("les limites", () => {
  it("sans fiche, rien", () => {
    expect(limitesDe("u1", [])).toEqual(AUCUNE_LIMITE);
    expect(etatQuota(AUCUNE_LIMITE, "tuiles", 0).refus).toMatch(/aucune tuile/);
  });

  it("la fiche générale vaut pour tous", () => {
    const l = limitesDe("u9", [fiche(true, [], 80, 60, 10, 5, 3)]);
    expect(l).toMatchObject({ largeur_max: 80, tuiles_max: 10, source: "general" });
  });

  it("la fiche personnelle REMPLACE la générale, même plus petite", () => {
    const fiches = [fiche(true, null, 80, 60, 10, 5, 3), fiche(false, ["u1"], 20, 20, 2, 0, 0)];
    expect(limitesDe("u1", fiches)).toMatchObject({ tuiles_max: 2, ressources_max: 0, source: "joueur" });
    expect(limitesDe("u2", fiches).tuiles_max).toBe(10);
  });

  it("deux fiches perso : la plus large, et une relation rendue en texte compte", () => {
    const l = limitesDe("u1", [fiche(false, ["u1", "u2"], 30, 10, 2, 9, 0), fiche(false, "u1", 10, 40, 5, 1, 4)]);
    expect(l).toEqual({ largeur_max: 30, hauteur_max: 40, tuiles_max: 5, ressources_max: 9, technos_max: 4, source: "joueur" });
    expect(limitesDe("u1", [fiche(true, null, -5, 1, 1, 1, 1)]).largeur_max).toBe(0);
  });

  it("le quota dit ce qui reste", () => {
    const l = { ...AUCUNE_LIMITE, tuiles_max: 2 };
    expect(etatQuota(l, "tuiles", 1)).toEqual({ max: 2, deja: 1, reste: 1, refus: null });
    expect(etatQuota(l, "tuiles", 2).refus).toMatch(/Limite atteinte/);
    expect(etatQuota(l, "technologies", 0).refus).toMatch(/aucune technologie/);
  });

  it("une fiche ne vaut pour personne sans joueur ni « tous »", () => {
    expect(erreurFiche({ ...ficheVide(), nom: "x" })).toMatch(/tous les joueurs/);
    expect(erreurFiche({ ...ficheVide(), nom: "x", general: true })).toBeNull();
    expect(erreurFiche({ ...ficheVide(), nom: " ", general: true })).toMatch(/nom/);
    expect(erreurFiche({ ...ficheVide(), nom: "x", general: true, largeur_max: 201 })).toMatch(/200/);
  });

  it("chaque côté reste sous le plus grand de (actuel, limite)", () => {
    const l = { ...AUCUNE_LIMITE, largeur_max: 10, hauteur_max: 10 };
    expect(refusTaille({ largeur: 60, hauteur: 60 }, { largeur: 60, hauteur: 60 }, l)).toBeNull();
    expect(refusTaille({ largeur: 60, hauteur: 60 }, { largeur: 10, hauteur: 10 }, l)).toBeNull();
    expect(refusTaille({ largeur: 60, hauteur: 60 }, { largeur: 61, hauteur: 60 }, l)).toMatch(/refusée/);
    expect(refusTaille({ largeur: 2, hauteur: 2 }, { largeur: 0, hauteur: 2 }, l)).toMatch(/au moins/);
    // Un côté à la fois : réduire la largeur d'un 60 × 60.
    expect(refusTaille({ largeur: 60, hauteur: 60 }, { largeur: 10, hauteur: 60 }, l)).toBeNull();
    expect(refusTaille({ largeur: 10, hauteur: 60 }, { largeur: 11, hauteur: 60 }, l)).toMatch(/refusée/);
  });
});

describe("la portée", () => {
  const seb: Portee = { admin: false, uid: "u1", planete: planetes[3], limites: AUCUNE_LIMITE };
  const tuiles = [{ planete: "pSeb" }, { planete: "pTerre" }, { planete: "" }, {}];

  it("un joueur ne voit que sa planète", () => {
    expect(dansLaPortee(seb, tuiles)).toEqual([{ planete: "pSeb" }]);
  });

  it("sans planète, un joueur ne voit rien — surtout pas le jeu", () => {
    expect(dansLaPortee({ ...seb, planete: null }, tuiles)).toEqual([]);
  });

  it("l'admin voit tout", () => {
    expect(dansLaPortee({ admin: true }, tuiles)).toHaveLength(4);
  });

  it("retrouve la planète du joueur", () => {
    expect(planeteDuJoueur(planetes, "u2")?.id).toBe("pZoe");
    expect(planeteDuJoueur(planetes, "")).toBeNull();
    expect(planeteDuJoueur(planetes, "u9")).toBeNull();
  });
});

describe("le catalogue d'une planète", () => {
  const trie = (s: Set<string> | null) => (s ? [...s].sort() : null);
  it("chez un joueur : sa planète seule", () => {
    expect(trie(planetesDuCatalogue(planetes, "pSeb"))).toEqual(["pSeb"]);
  });
  it("sur la Terre : la Terre, Game et le non rangé — pas Jupiter", () => {
    expect(trie(planetesDuCatalogue(planetes, "pTerre"))).toEqual(["", "pGame", "pTerre"]);
  });
  it("planète inconnue : le jeu, jamais un joueur", () => {
    expect(trie(planetesDuCatalogue(planetes, "x"))).toEqual(["", "pGame", "pJupiter", "pTerre"]);
  });
  it("sans planètes : tout", () => {
    expect(planetesDuCatalogue([], "pSeb")).toBeNull();
    expect(duCatalogue([{ planete: "a" }], [], "b")).toHaveLength(1);
  });
  it("filtre une liste", () => {
    const r = [{ code: "bois", planete: "pGame" }, { code: "bois", planete: "pSeb" }, { code: "or", planete: "pTerre" }];
    expect(duCatalogue(r, planetes, "pSeb").map((x) => x.planete)).toEqual(["pSeb"]);
    expect(duCatalogue(r, planetes, "pTerre").map((x) => x.planete)).toEqual(["pGame", "pTerre"]);
  });
});

describe("la planète à la création (admin)", () => {
  it("le filtre d'abord, sinon Game pour ressources et technos, rien pour une tuile", () => {
    expect(planeteParDefaut(planetes, "tuiles", "pTerre")).toBe("pTerre");
    expect(planeteParDefaut(planetes, "tuiles", "")).toBe("");
    expect(planeteParDefaut(planetes, "ressources", "")).toBe("pGame");
    expect(planeteParDefaut(planetes, "technologies", "inconnue")).toBe("pGame");
  });
  it("l'étiquette suit le nom, sauf pour Game", () => {
    expect(etiquettePourPlanete(planetes[1])).toBe("Terre");
    expect(etiquettePourPlanete(planetes[0])).toBe("");
    expect(etiquettePourPlanete(null)).toBe("");
  });
});

describe("le filtre de planète de l'admin", () => {
  it("une planète, ou les records sans planète", async () => {
    const { filtrerParPlanete, SANS_PLANETE } = await import("@/lib/conception");
    const l = [{ planete: "a" }, { planete: "" }, {}];
    expect(filtrerParPlanete(l, "")).toHaveLength(3);
    expect(filtrerParPlanete(l, "a")).toEqual([{ planete: "a" }]);
    expect(filtrerParPlanete(l, SANS_PLANETE)).toHaveLength(2);
  });
});

describe("le territoire (18/09)", () => {
  const gardees = (s: Set<string> | null) => (s ? [...s].sort() : []);

  it("⚠️ deux planètes game ne font qu'UN jeu — ce n'est pas la découpe du catalogue", async () => {
    const { territoireDe, TERRITOIRE_JEU } = await import("@/lib/conception");
    expect(territoireDe(planetes, "pTerre")).toBe(TERRITOIRE_JEU);
    expect(territoireDe(planetes, "pJupiter")).toBe(TERRITOIRE_JEU);
    // là où le catalogue, lui, les sépare :
    expect(gardees(planetesDuCatalogue(planetes, "pTerre"))).not.toContain("pJupiter");
  });

  it("chez un joueur : son domaine, et deux joueurs ne le partagent pas", async () => {
    const { territoireDe } = await import("@/lib/conception");
    expect(territoireDe(planetes, "pSeb")).toBe("pSeb");
    expect(territoireDe(planetes, "pSeb")).not.toBe(territoireDe(planetes, "pZoe"));
  });

  it("vide, inconnu, ou sans planètes en base : le jeu", async () => {
    const { territoireDe, TERRITOIRE_JEU } = await import("@/lib/conception");
    expect(territoireDe(planetes, "")).toBe(TERRITOIRE_JEU);
    expect(territoireDe(planetes, "inconnue")).toBe(TERRITOIRE_JEU);
    expect(territoireDe([], "pSeb")).toBe(TERRITOIRE_JEU);
  });

  it("filtre une liste : les âges du jeu se lisent sur Jupiter, ceux d'un domaine non", async () => {
    const { duTerritoire } = await import("@/lib/conception");
    const ages = [{ nom: "jeu" }, { nom: "terre", planete: "pTerre" }, { nom: "seb", planete: "pSeb" }];
    expect(duTerritoire(ages, planetes, "pJupiter").map((a) => a.nom)).toEqual(["jeu", "terre"]);
    expect(duTerritoire(ages, planetes, "pSeb").map((a) => a.nom)).toEqual(["seb"]);
  });

  it("les territoires choisissables : le jeu, puis un domaine par joueur — aucune planète game", async () => {
    const { territoiresChoisissables, TERRITOIRE_JEU } = await import("@/lib/conception");
    const l = territoiresChoisissables(planetes);
    expect(l[0].id).toBe(TERRITOIRE_JEU);
    expect(l.map((x) => x.id)).toEqual([TERRITOIRE_JEU, "pSeb", "pZoe"]);
  });
});
