// ============================================================
//  technologies.test.ts
//  Le filet de l'arbre des technos — posé le 2026-09-09.
//
//  ⚠️ TOUT CE FICHIER TOURNE AUTOUR D'UNE SEULE RÈGLE : la flèche s'écrit des
//  DEUX BOUTS. « A débloque B » et « B exige A » disent la même chose, et le
//  graphe se lit en UNION des deux — `prerequisEffectifs`. Lire
//  `technos_requises` seul rend la moitié des arêtes invisible, et le garde-fou
//  des cycles laisse alors passer un cycle sur deux. C'est la régression que
//  ces tests attendent.
// ============================================================

import { describe, expect, it } from "vitest";

import {
  codesDe,
  codesInterdits,
  dependancesDe,
  niveauxDe,
  prerequisDeclaresAilleurs,
  prerequisEffectifs,
  type Technologie,
} from "@/lib/technologies";

/** Le strict nécessaire pour raisonner sur le graphe ; le reste est du décor. */
function techno(code: string, arcs: Partial<Technologie> = {}): Technologie {
  return {
    id: code,
    collectionId: "technologies",
    collectionName: "technologies",
    code,
    nom: code,
    chemin_icone: "",
    batiment: 1,
    age: 1,
    ordre: 0,
    niveaux: 1,
    description: "",
    batiments_requis: [],
    technos_requises: [],
    debloque: [],
    debloque_technos: [],
    cout: { achat: [], entretien: [] },
    effets: [],
    created: "",
    updated: "",
    ...arcs,
  };
}

describe("codesDe", () => {
  it("dédoublonne, trie, et jette le vide", () => {
    expect(codesDe(["b", "a", "b", ""])).toEqual(["a", "b"]);
    expect(codesDe(null)).toEqual([]);
    expect(codesDe("a,b")).toEqual([]);
  });
});

describe("prerequisEffectifs", () => {
  it("réunit ce que la fiche déclare ET ce qui se déclare comme la débloquant", () => {
    const arbre = [
      techno("feu"),
      techno("roue", { technos_requises: ["feu"] }),
      // La MÊME flèche, écrite de l'autre bout : personne ne l'a mise dans
      // `roue.technos_requises`, et elle doit compter quand même.
      techno("bronze", { debloque_technos: ["roue"] }),
    ];
    expect(prerequisEffectifs("roue", arbre)).toEqual(["bronze", "feu"]);
  });

  it("ne compte pas deux fois une flèche écrite des deux côtés — redondant, jamais faux", () => {
    const arbre = [
      techno("feu", { debloque_technos: ["roue"] }),
      techno("roue", { technos_requises: ["feu"] }),
    ];
    expect(prerequisEffectifs("roue", arbre)).toEqual(["feu"]);
  });

  it("montre à part ceux qui ne viennent PAS de la fiche", () => {
    const arbre = [
      techno("feu"),
      techno("roue", { technos_requises: ["feu"] }),
      techno("bronze", { debloque_technos: ["roue"] }),
    ];
    expect(prerequisDeclaresAilleurs("roue", arbre)).toEqual(["bronze"]);
  });

  it("rend une liste vide pour un code inconnu, sans jeter", () => {
    expect(prerequisEffectifs("inexistante", [techno("feu")])).toEqual([]);
  });
});

describe("dependancesDe", () => {
  const chaine = [
    techno("feu"),
    techno("roue", { technos_requises: ["feu"] }),
    techno("chariot", { technos_requises: ["roue"] }),
  ];

  it("remonte toute la chaîne, pas seulement le premier cran", () => {
    expect([...dependancesDe("chariot", chaine)].sort()).toEqual(["feu", "roue"]);
  });

  it("REVIENT même si la base contient déjà un cycle", () => {
    // Une base remplie par script peut porter « A exige B qui exige A ». Une
    // récursion naïve n'en reviendrait pas : ce test est le garde `vus`.
    const cycle = [
      techno("a", { technos_requises: ["b"] }),
      techno("b", { technos_requises: ["a"] }),
    ];
    expect([...dependancesDe("a", cycle)].sort()).toEqual(["a", "b"]);
  });
});

describe("codesInterdits", () => {
  const chaine = [
    techno("feu"),
    techno("roue", { technos_requises: ["feu"] }),
    techno("chariot", { technos_requises: ["roue"] }),
  ];

  it("interdit soi-même et tout ce qui dépend déjà de soi", () => {
    // « feu » ne peut exiger ni feu, ni roue, ni chariot : ce serait un arbre
    // qu'aucun joueur ne peut gravir.
    expect([...codesInterdits("feu", chaine)].sort()).toEqual(["chariot", "feu", "roue"]);
  });

  it("laisse passer ce qui est en AMONT", () => {
    expect([...codesInterdits("chariot", chaine)].sort()).toEqual(["chariot"]);
  });

  it("attrape aussi le cycle écrit par `debloque_technos`", () => {
    // Le cas que la lecture naïve de `technos_requises` laissait passer.
    const arbre = [techno("feu", { debloque_technos: ["roue"] }), techno("roue")];
    expect(codesInterdits("feu", arbre).has("roue")).toBe(true);
  });
});

describe("niveauxDe", () => {
  it("vaut 1 pour un record d'avant le 28/08, qui n'avait pas le champ", () => {
    expect(niveauxDe(undefined)).toBe(1);
    expect(niveauxDe({})).toBe(1);
    expect(niveauxDe({ niveaux: 0 })).toBe(1);
    expect(niveauxDe({ niveaux: -2 })).toBe(1);
    expect(niveauxDe({ niveaux: 3 })).toBe(3);
  });
});
