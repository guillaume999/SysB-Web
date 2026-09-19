// ============================================================
//  unites.test.ts
//  Le filet de l'écran UNITÉS (19/09).
//
//  ⚠️ CE QUI COMPTE ICI, ce sont les deux règles que rien d'autre ne tient :
//  une vague automatique est GRATUITE (CDC 1.37), et un joueur n'accède qu'aux
//  unités de SON âge et des précédents (CDC 1.26). Les deux sont écrites dans
//  `lib/unites.ts` côté site et devront l'être côté serveur Go : le jour où
//  elles divergeront, c'est ce fichier qui dira laquelle a bougé.
// ============================================================

import { describe, expect, it } from "vitest";
import {
  AGE_DES_AXES,
  UNITE_VIDE,
  accessiblesA,
  avertissementsUnite,
  coutDe,
  entierDe,
  erreursUnite,
  libelleAxe,
  resumeCout,
  type ValeursUnite,
} from "@/lib/unites";

const RESSOURCES = [{ code: "bois" }, { code: "fer" }, { code: "gibier" }];

const v = (patch: Partial<ValeursUnite> = {}): ValeursUnite => ({
  ...UNITE_VIDE,
  code: "milicien_epieu",
  nom: "Milicien à l'épieu",
  ...patch,
});

describe("les refus de saisie", () => {
  it("laisse passer une unité correcte", () => {
    expect(erreursUnite(v({ cout: [{ ressource: "bois", quantite: 20 }] }), [], RESSOURCES)).toEqual([]);
  });

  it("exige un code, et un code qui fasse une clé", () => {
    expect(erreursUnite(v({ code: " " }), [], RESSOURCES)).toHaveLength(1);
    for (const code of ["Milicien", "milicien épieu", "milicien-epieu", "milicien.epieu"])
      expect(erreursUnite(v({ code }), [], RESSOURCES)).toHaveLength(1);
  });

  it("refuse un code déjà pris", () => {
    expect(erreursUnite(v(), [{ code: "milicien_epieu" }], RESSOURCES)).toHaveLength(1);
    expect(erreursUnite(v(), [{ code: "chasseur_arc" }], RESSOURCES)).toEqual([]);
  });

  it("refuse une vie à zéro — elle serait morte à l'arrivée", () => {
    expect(erreursUnite(v({ vie: 0 }), [], RESSOURCES)).toHaveLength(1);
    expect(erreursUnite(v({ vie: 1 }), [], RESSOURCES)).toEqual([]);
  });

  it("refuse un nombre négatif ou fractionnaire", () => {
    expect(erreursUnite(v({ degats: -1 }), [], RESSOURCES)).toHaveLength(1);
    expect(erreursUnite(v({ portee: 1.5 }), [], RESSOURCES)).toHaveLength(1);
  });

  it("⚠️ refuse un coût sur une vague automatique (CDC 1.37)", () => {
    // L'ESSAI QUI COMPTE : une vague auto est gratuite. Un prix saisi ici ne
    // serait prélevé par personne — le joueur croirait payer, le serveur non.
    const auto = v({ pilotage: "auto", cout: [{ ressource: "bois", quantite: 10 }] });
    expect(erreursUnite(auto, [], RESSOURCES)).toHaveLength(1);
    expect(erreursUnite({ ...auto, cout: [] }, [], RESSOURCES)).toEqual([]);
  });

  it("refuse une ligne de coût qui cite une ressource inconnue", () => {
    expect(erreursUnite(v({ cout: [{ ressource: "mithril", quantite: 5 }] }), [], RESSOURCES))
      .toHaveLength(1);
  });

  it("refuse deux lignes sur la même ressource, et une quantité nulle", () => {
    expect(
      erreursUnite(
        v({ cout: [{ ressource: "bois", quantite: 5 }, { ressource: "bois", quantite: 5 }] }),
        [],
        RESSOURCES,
      ),
    ).toHaveLength(1);
    expect(erreursUnite(v({ cout: [{ ressource: "fer", quantite: 0 }] }), [], RESSOURCES)).toHaveLength(1);
  });
});

describe("les avertissements — ils ne bloquent rien", () => {
  it("signalent une unité d'âge 5 sans axe, et un axe avant l'âge 5", () => {
    expect(avertissementsUnite(v({ age: AGE_DES_AXES, axe: "" })).join(" ")).toContain("axe");
    expect(avertissementsUnite(v({ age: 2, axe: "science" })).join(" ")).toContain("n'existent pas");
    expect(avertissementsUnite(v({ age: AGE_DES_AXES, axe: "science", cout: [{ ressource: "fer", quantite: 1 }] })))
      .toEqual([]);
  });

  it("signalent des dégâts sans portée, et une unité immobile", () => {
    expect(avertissementsUnite(v({ degats: 100, portee: 0 })).join(" ")).toContain("frapper");
    expect(avertissementsUnite(v({ vitesse: 0 })).join(" ")).toContain("Vitesse 0");
  });

  it("ne disent rien d'une vague auto sans coût : c'est la règle", () => {
    expect(avertissementsUnite(v({ pilotage: "auto", cout: [] })).join(" ")).not.toContain("Aucun coût");
  });
});

describe("le coût relu d'un champ json", () => {
  it("survit à tout ce que PocketBase peut rendre", () => {
    // ⚠️ Un `json` n'est validé par personne : ce qui remonte peut être un
    // objet, une chaîne, null, ou des lignes à moitié saisies à la main dans
    // l'admin. Un écran qui ferait `.map` dessus planterait sur la première.
    expect(coutDe({ cout: undefined })).toEqual([]);
    expect(coutDe({ cout: null })).toEqual([]);
    expect(coutDe({ cout: "bois" })).toEqual([]);
    expect(coutDe({ cout: { ressource: "bois" } })).toEqual([]);
    expect(coutDe({ cout: [null, 3, { quantite: 2 }] })).toEqual([]);
    expect(coutDe({ cout: [{ ressource: "bois", quantite: "20" }] }))
      .toEqual([{ ressource: "bois", quantite: 20 }]);
  });

  it("se résume en une ligne", () => {
    expect(resumeCout([])).toBe("gratuite");
    expect(resumeCout([{ ressource: "bois", quantite: 20 }, { ressource: "fer", quantite: 5 }]))
      .toBe("20 bois + 5 fer");
  });
});

describe("ce qu'un joueur peut produire (CDC 1.26)", () => {
  const u = (code: string, age: number, actif = true) => ({ code, age, actif });
  const toutes = [u("a", 1), u("b", 2), u("c", 5), u("d", 5, false), u("e", 0), u("f", 7)];

  it("donne son âge ET les précédents, jamais les suivants", () => {
    expect(accessiblesA(2, toutes).map((x) => x.code)).toEqual(["a", "b"]);
    expect(accessiblesA(5, toutes).map((x) => x.code)).toEqual(["a", "b", "c"]);
  });

  it("écarte les inactives et les hors-âge", () => {
    // `d` est d'âge 5 mais pas cochée ; `e` est en âge 0 — aucun plateau
    // Univers ne l'admet, quel que soit son âge à lui.
    expect(accessiblesA(7, toutes).map((x) => x.code)).toEqual(["a", "b", "c", "f"]);
  });
});

describe("les à-côtés", () => {
  it("lit un entier de saisie, et rend 0 sur une saisie vide", () => {
    expect(entierDe("12")).toBe(12);
    expect(entierDe("")).toBe(0);
    expect(entierDe("abc")).toBe(0);
    expect(entierDe("-3")).toBe(-3);
  });

  it("nomme l'axe, vide compris", () => {
    expect(libelleAxe("")).toBe("commun");
    expect(libelleAxe("archeomages")).toBe("Archéomages");
  });

  it("crée une unité INACTIVE par défaut — on la relit avant la bataille", () => {
    expect(UNITE_VIDE.actif).toBe(false);
  });
});
