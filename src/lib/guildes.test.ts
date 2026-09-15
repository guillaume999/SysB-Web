import { describe, expect, it } from "vitest";
import {
  REGLAGES_DEFAUT,
  attenteDuRefus,
  erreurReglages,
  lienAvec,
  nomValide,
  officiersRestants,
  peutExclure,
  raisonCreation,
  verdict,
  type EtatGuildes,
  type Membre,
} from "@/lib/guildes";

const etat = (x: Partial<EtatGuildes> = {}): EtatGuildes => ({
  reglages: { ...REGLAGES_DEFAUT, age_min_creation: 2 },
  age: 2,
  peut_creer: true,
  guildes: [],
  mes_demandes: [],
  ...x,
});

describe("les réglages", () => {
  it("acceptent les défauts du serveur", () => {
    expect(erreurReglages(REGLAGES_DEFAUT)).toBeNull();
  });
  it("refusent l'absurde", () => {
    expect(erreurReglages({ ...REGLAGES_DEFAUT, membres_max: 0 })).toMatch(/Membres/);
    expect(erreurReglages({ ...REGLAGES_DEFAUT, officiers_max: -1 })).toMatch(/Officiers/);
    expect(erreurReglages({ ...REGLAGES_DEFAUT, membres_max: 3, officiers_max: 3 })).toMatch(/moins d'officiers/);
    expect(erreurReglages({ ...REGLAGES_DEFAUT, delai_salon_s: 1.5 })).toMatch(/Anti-spam/);
    expect(erreurReglages({ ...REGLAGES_DEFAUT, age_min_creation: 8 })).toMatch(/Âge/);
  });
  it("gardent zéro officier et zéro délai comme des choix", () => {
    expect(erreurReglages({ membres_max: 5, officiers_max: 0, delai_salon_s: 0, age_min_creation: 0 })).toBeNull();
  });
});

describe("qui peut quoi", () => {
  it("le chef exclut tout le monde sauf lui-même ; l'officier, un membre", () => {
    expect(peutExclure("chef", "officier")).toBe(true);
    expect(peutExclure("chef", "chef")).toBe(false);
    expect(peutExclure("officier", "membre")).toBe(true);
    expect(peutExclure("officier", "officier")).toBe(false);
    expect(peutExclure("membre", "membre")).toBe(false);
    expect(peutExclure(undefined, "membre")).toBe(false);
  });
  it("compte les places d'officier restantes", () => {
    const m = (role: Membre["role"]): Membre => ({ id: role, guilde: "g", joueur: role, nom: role, role });
    expect(officiersRestants([m("chef"), m("officier"), m("membre")], { ...REGLAGES_DEFAUT, officiers_max: 3 })).toBe(2);
    expect(officiersRestants([m("officier"), m("officier")], { ...REGLAGES_DEFAUT, officiers_max: 1 })).toBe(0);
  });
  it("dit pourquoi on ne peut pas fonder", () => {
    expect(raisonCreation(etat())).toBeNull();
    expect(raisonCreation(etat({ age: 1 }))).toMatch(/âge 2.*âge 1/);
    expect(
      raisonCreation(
        etat({ ma_guilde: { guilde: { id: "g", nom: "G", description: "", chef: "a", created: "" }, role: "membre", membres: [] } }),
      ),
    ).toMatch(/déjà/);
  });
});

describe("le nom", () => {
  it("réduit les espaces comme le serveur", () => {
    expect(nomValide("  Les   Ours ")).toEqual({ nom: "Les Ours", ok: true });
    expect(nomValide("ab").ok).toBe(false);
    expect(nomValide("x".repeat(31)).ok).toBe(false);
    expect(nomValide("é".repeat(30)).ok).toBe(true);
  });
});

describe("le lien avec une guilde", () => {
  it("distingue membre, demande et invitation", () => {
    const e = etat({
      mes_demandes: [
        { id: "1", guilde: "g1", guilde_nom: "A", joueur: "me", joueur_nom: "Moi", sens: "demande", created: "" },
        { id: "2", guilde: "g2", guilde_nom: "B", joueur: "me", joueur_nom: "Moi", sens: "invitation", created: "" },
      ],
    });
    expect(lienAvec(e, "g1")).toBe("demande");
    expect(lienAvec(e, "g2")).toBe("invitation");
    expect(lienAvec(e, "g3")).toBeNull();
  });
});

describe("les refus du serveur", () => {
  it("lisent `verdict`, pas `message`", () => {
    expect(verdict({ status: 400, response: { verdict: "Cette guilde est complete." } }, "x")).toBe(
      "Cette guilde est complete.",
    );
    expect(verdict({ status: 404, response: {} }, "x")).toMatch(/pas encore en service/);
  });
  it("donnent l'attente d'un 429 seulement", () => {
    expect(attenteDuRefus({ status: 429, response: { attente: 7 } })).toBe(7);
    expect(attenteDuRefus({ status: 400, response: { attente: 7 } })).toBe(0);
    expect(attenteDuRefus({ status: 429, response: {} })).toBe(0);
  });
});
