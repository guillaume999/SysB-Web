// ============================================================
//  partage.test.ts
//  Le filet du PARTAGE D'UN MODÈLE — posé le 2026-09-13.
//
//  ⚠️ POURQUOI CE FICHIER EXISTE. Ces fonctions décident de ce qu'un joueur
//  VOIT et de ce qu'un enregistrement neuf devient. Une faute ici ne lève
//  aucune erreur : elle montre à un joueur le catalogue de quelqu'un d'autre,
//  ou range une tuile sur un modèle où plus personne ne pourra la corriger.
//
//  ⚠️ L'ESSAI QUI COMPTE EST TOUJOURS CELUI DU JOUEUR. Un filtre cassé qui
//  rendrait tout serait VERT sur l'admin, qui voit tout de toute façon.
// ============================================================

import { describe, expect, it } from "vitest";
import { type Plateau } from "@/lib/plateaux";
import {
  estConcepteur,
  modelesPartages,
  modelesVisibles,
  nomDuModele,
  peutEcrire,
  porteeDe,
  rattachementDe,
  rattachementParDefaut,
  visiblesPour,
} from "@/lib/partage";

function modele(id: string, nom: string, reste: Partial<Plateau> = {}): Plateau {
  return {
    id,
    collectionId: "c",
    collectionName: "templates",
    nom,
    typeOfPlateau: "ground",
    largeur: 20,
    hauteur: 20,
    tilesBase64: "",
    etats: [],
    actif: true,
    partages: [],
    created: "2026-01-01 00:00:00Z",
    updated: "",
    ...reste,
  };
}

const TERRE = modele("m-terre", "Modèle Terre", {
  partages: ["u-samp"],
  created: "2026-01-01 00:00:00Z",
});
const TERRE_BROUILLON = modele("m-terre2", "Terre (brouillon)", {
  created: "2026-05-01 00:00:00Z",
});
const ESPACE = modele("m-espace", "Station", {
  typeOfPlateau: "space",
  created: "2026-02-01 00:00:00Z",
});
const TEMPLATES = [TERRE, TERRE_BROUILLON, ESPACE];

const ADMIN = porteeDe(true, TEMPLATES, "u-chef");
const SAMP = porteeDe(false, TEMPLATES, "u-samp");
const PASSANT = porteeDe(false, TEMPLATES, "u-personne");

describe("à qui un modèle est ouvert", () => {
  it("ne rend que les modèles où le compte est listé", () => {
    expect(modelesPartages(TEMPLATES, "u-samp")).toEqual([TERRE]);
    expect(modelesPartages(TEMPLATES, "u-personne")).toEqual([]);
  });

  it("ne partage rien à personne quand il n'y a pas de compte", () => {
    expect(modelesPartages(TEMPLATES, undefined)).toEqual([]);
  });

  it("ne traite JAMAIS un admin en concepteur", () => {
    // ⚠️ Un admin n'a pas besoin d'un partage : sa portée laisse la liste vide
    // exprès, sinon deux chemins mèneraient au même droit et il faudrait tenir
    // les deux d'accord.
    expect(ADMIN.modeles).toEqual([]);
    expect(estConcepteur(ADMIN)).toBe(false);
    expect(estConcepteur(porteeDe(true, [modele("x", "X", { partages: ["u-chef"] })], "u-chef"))).toBe(
      false,
    );
  });

  it("fait un concepteur d'un joueur à qui un modèle est ouvert, et de lui seul", () => {
    expect(estConcepteur(SAMP)).toBe(true);
    expect(estConcepteur(PASSANT)).toBe(false);
  });
});

describe("ce qu'une portée voit dans une liste", () => {
  const catalogue = [
    { nom: "à moi", rattachement: "m-terre" },
    { nom: "ailleurs", rattachement: "m-espace" },
    { nom: "nulle part" },
  ];

  it("montre tout à l'admin, y compris ce qui n'est rattaché à rien", () => {
    // ⚠️ Un record oublié par le patch doit RESTER VISIBLE de l'admin : c'est
    // le seul écran d'où on peut le ranger.
    expect(visiblesPour(catalogue, ADMIN)).toHaveLength(3);
  });

  it("ne montre au concepteur que ce qui est rattaché à SON modèle", () => {
    expect(visiblesPour(catalogue, SAMP).map((r) => r.nom)).toEqual(["à moi"]);
  });

  it("cache ce qui n'est rattaché à rien", () => {
    expect(visiblesPour(catalogue, SAMP).map((r) => r.nom)).not.toContain("nulle part");
    expect(visiblesPour(catalogue, PASSANT)).toEqual([]);
  });

  it("filtre les modèles de la même façon", () => {
    expect(modelesVisibles(TEMPLATES, ADMIN)).toHaveLength(3);
    expect(modelesVisibles(TEMPLATES, SAMP)).toEqual([TERRE]);
  });

  it("lit un rattachement absent ou blanc comme « aucun »", () => {
    expect(rattachementDe({})).toBe("");
    expect(rattachementDe({ rattachement: "  " })).toBe("");
    expect(rattachementDe({ rattachement: " m-terre " })).toBe("m-terre");
  });
});

describe("le modèle d'un enregistrement neuf", () => {
  it("pour un concepteur : le sien", () => {
    expect(rattachementParDefaut(SAMP, TEMPLATES)).toBe("m-terre");
    // ⚠️ Même s'il crée une tuile `space` : il n'a que ce modèle-là, et une
    // tuile rangée ailleurs lui échapperait aussitôt.
    expect(rattachementParDefaut(SAMP, TEMPLATES, "space")).toBe("m-terre");
  });

  it("pour un admin : le plus ancien modèle du même type", () => {
    expect(rattachementParDefaut(ADMIN, TEMPLATES, "ground")).toBe("m-terre");
    expect(rattachementParDefaut(ADMIN, TEMPLATES, "space")).toBe("m-espace");
  });

  it("pour un admin sans type : le monde de la Terre", () => {
    // C'est là que le patch du 13/09 a rattaché tout l'existant.
    expect(rattachementParDefaut(ADMIN, TEMPLATES)).toBe("m-terre");
  });

  it("rend vide plutôt que d'inventer un modèle", () => {
    expect(rattachementParDefaut(ADMIN, [])).toBe("");
    expect(rattachementParDefaut(PASSANT, TEMPLATES)).toBe("");
  });
});

describe("qui peut écrire quoi", () => {
  it("l'admin, tout ; le concepteur, son modèle seulement", () => {
    expect(peutEcrire({ rattachement: "m-espace" }, ADMIN)).toBe(true);
    expect(peutEcrire({ rattachement: "m-terre" }, SAMP)).toBe(true);
    expect(peutEcrire({ rattachement: "m-espace" }, SAMP)).toBe(false);
    expect(peutEcrire({}, SAMP)).toBe(false);
  });
});

describe("le nom d'un modèle", () => {
  it("se dit, et dit aussi quand il manque", () => {
    expect(nomDuModele(TEMPLATES, "m-terre")).toBe("Modèle Terre");
    expect(nomDuModele(TEMPLATES, "")).toBe("aucun modèle");
    expect(nomDuModele(TEMPLATES, "m-disparu")).toBe("modèle inconnu");
  });
});
