import { describe, expect, it } from "vitest";
import { FILTRE_ICONES_VIDE, filtrerLignes, grouperIcones, nomAffiche } from "@/lib/icones";
import type { Icone } from "@/lib/planetes";

const rec = (id: string, chemin: string, usage: Icone["usage"], nom = ""): Icone => ({
  id,
  chemin,
  usage,
  nom,
});

describe("grouper fichiers et records", () => {
  const fichiers = [
    { dossier: "icones", nom: "ble" },
    { dossier: "icones", nom: "bois" },
    { dossier: "icones_tuiles", nom: "moulin" },
    { dossier: "dossier_inconnu", nom: "x" },
  ];
  const records = [
    rec("r1", "Icones_Ressources/ble", "ressource", "Blé"),
    // ⚠️ l'ancienne écriture doit être RETROUVÉE, pas doublée
    rec("r2", "Icones/bois", "autre"),
    rec("r3", "Icones_Planetes/terre", "planete"),
  ];
  const groupes = grouperIcones(fichiers, records);
  const toutes = groupes.flatMap((g) => g.lignes);

  it("range par dossier Unity, triés, et ignore les dossiers inconnus", () => {
    expect(groupes.map((g) => g.dossier)).toEqual([
      "Icones_Planetes",
      "Icones_Ressources",
      "Icones_Tuiles",
    ]);
    expect(toutes).toHaveLength(4);
  });

  it("rattache un record à son dessin, même par l'alias `Icones/`", () => {
    const bois = toutes.find((l) => l.url === "/icones/bois.svg");
    expect(bois?.record?.id).toBe("r2");
    expect(bois?.chemin).toBe("Icones/bois");
    expect(toutes.filter((l) => l.record?.id === "r2")).toHaveLength(1);
  });

  it("montre un dessin non déclaré avec la catégorie de son dossier", () => {
    const moulin = toutes.find((l) => l.chemin === "Icones_Tuiles/moulin");
    expect(moulin?.record).toBeNull();
    expect(moulin?.usageParDefaut).toBe("tuile");
    expect(nomAffiche(moulin!)).toBe("moulin");
  });

  it("montre un record sans dessin (planètes)", () => {
    const terre = toutes.find((l) => l.chemin === "Icones_Planetes/terre");
    expect(terre?.url).toBeNull();
    expect(terre?.record?.id).toBe("r3");
  });

  it("filtre par texte, dossier et catégorie — dont « pas encore déclarées »", () => {
    expect(filtrerLignes(toutes, { ...FILTRE_ICONES_VIDE, texte: "blé" })).toHaveLength(1);
    expect(filtrerLignes(toutes, { ...FILTRE_ICONES_VIDE, dossier: "Icones_Ressources" })).toHaveLength(2);
    expect(filtrerLignes(toutes, { ...FILTRE_ICONES_VIDE, categorie: "aucune" })).toHaveLength(1);
    expect(filtrerLignes(toutes, { ...FILTRE_ICONES_VIDE, categorie: "autre" })).toHaveLength(1);
  });
});
