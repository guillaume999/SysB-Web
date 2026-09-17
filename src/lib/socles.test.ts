import { describe, expect, it } from "vitest";
import {
  SOCLE_VIDE,
  cheminMateriau,
  erreursSocle,
  libelleSocle,
  normaliserCouleur,
  usagesParSocle,
  type Socle,
} from "@/lib/socles";

const socle = (id: string, code: string, nom = "", couleur = "#04CC0D"): Socle => ({
  id,
  code,
  nom,
  couleur,
});

describe("la couleur", () => {
  it("accepte avec ou sans dièse, et rend toujours des majuscules", () => {
    expect(normaliserCouleur("#04cc0d")).toBe("#04CC0D");
    expect(normaliserCouleur("04cc0d")).toBe("#04CC0D");
    expect(normaliserCouleur("  #FFD569 ")).toBe("#FFD569");
  });

  it("refuse ce qui n'est pas une couleur", () => {
    expect(normaliserCouleur("")).toBe("");
    expect(normaliserCouleur("vert")).toBe("");
    expect(normaliserCouleur("#ABC")).toBe("");
    expect(normaliserCouleur("#04CC0DD")).toBe("");
  });
});

describe("les refus de saisie", () => {
  const autres = [socle("s1", "vert"), socle("s2", "beige")];

  it("laisse passer une saisie correcte", () => {
    expect(erreursSocle({ code: "roche", nom: "Roche", couleur: "#888888" }, autres)).toEqual([]);
  });

  it("exige un code", () => {
    expect(erreursSocle({ ...SOCLE_VIDE, code: "  " }, autres)).toHaveLength(1);
  });

  it("refuse un code qui ne ferait pas un nom de fichier", () => {
    // ⚠️ Le code part dans un `Resources.Load` d'Unity : espace, accent et
    // majuscule donneraient un chemin introuvable en jeu.
    for (const code of ["Roche", "roche claire", "rôche", "roche/claire"])
      expect(erreursSocle({ ...SOCLE_VIDE, code }, autres)).toHaveLength(1);
  });

  it("refuse un code déjà pris, et accepte celui qu'on est en train d'éditer", () => {
    expect(erreursSocle({ ...SOCLE_VIDE, code: "vert" }, autres)).toHaveLength(1);
    // Le socle édité n'est pas dans `autres` : son propre code reste valide.
    expect(erreursSocle({ ...SOCLE_VIDE, code: "vert" }, [socle("s2", "beige")])).toEqual([]);
  });

  it("cumule les refus", () => {
    expect(erreursSocle({ code: "", nom: "", couleur: "bleu" }, autres)).toHaveLength(2);
  });
});

describe("les à-côtés", () => {
  it("donne le chemin Unity du matériau", () => {
    expect(cheminMateriau("vert")).toBe("Materials/Socles/Socle_vert");
  });

  it("affiche le nom, sinon le code", () => {
    expect(libelleSocle(socle("s1", "vert", "Vert"))).toBe("Vert");
    expect(libelleSocle(socle("s1", "vert"))).toBe("vert");
  });

  it("compte les tuiles par socle, en ignorant celles qui n'en ont pas", () => {
    const usages = usagesParSocle([{ socle: "s1" }, { socle: "s1" }, { socle: "s2" }, {}]);
    expect(usages.get("s1")).toBe(2);
    expect(usages.get("s2")).toBe(1);
    expect(usages.size).toBe(2);
  });
});
