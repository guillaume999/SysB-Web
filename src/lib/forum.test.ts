// ============================================================
//  forum.test.ts — qui peut quoi, et l'ordre des sujets.
//
//  ⚠️ L'essai qui compte est celui du JOUEUR dans un salon FERMÉ : un
//  `peutOuvrirSujet` cassé qui rendrait toujours vrai serait vert sur l'admin.
// ============================================================

import { describe, expect, it } from "vitest";
import {
  activiteDesSujets,
  erreurPost,
  erreurSalon,
  nomAuteur,
  participant,
  peutModifier,
  peutOuvrirSujet,
  peutRepondre,
  raisonRefus,
  trierSalons,
  trierSujets,
} from "@/lib/forum";

const admin = { id: "adm", pseudo: "Samp", admin: true };
const joueur = { id: "j1", pseudo: "Zed", admin: false };
const ouvert = { sujets_joueurs: true, reponses_joueurs: true };
const ferme = { sujets_joueurs: false, reponses_joueurs: false };
const annonces = { sujets_joueurs: false, reponses_joueurs: true };

describe("ouvrir un sujet", () => {
  it("un visiteur ne peut jamais", () => {
    expect(peutOuvrirSujet(ouvert, null)).toBe(false);
  });
  it("un joueur seulement si le salon le permet", () => {
    expect(peutOuvrirSujet(ouvert, joueur)).toBe(true);
    expect(peutOuvrirSujet(ferme, joueur)).toBe(false);
    expect(peutOuvrirSujet(annonces, joueur)).toBe(false);
  });
  it("l'admin toujours", () => {
    expect(peutOuvrirSujet(ferme, admin)).toBe(true);
  });
});

describe("répondre", () => {
  it("suit sa propre case, indépendante de celle des sujets", () => {
    expect(peutRepondre(annonces, joueur)).toBe(true);
    expect(peutRepondre(ferme, joueur)).toBe(false);
    expect(peutRepondre(ouvert, null)).toBe(false);
    expect(peutRepondre(ferme, admin)).toBe(true);
  });
});

describe("modifier / supprimer", () => {
  it("l'auteur et l'admin, personne d'autre", () => {
    expect(peutModifier({ auteur: "j1" }, joueur)).toBe(true);
    expect(peutModifier({ auteur: "j2" }, joueur)).toBe(false);
    expect(peutModifier({ auteur: "j2" }, admin)).toBe(true);
    expect(peutModifier({ auteur: "j1" }, null)).toBe(false);
  });
});

describe("la raison affichée à la place du bouton", () => {
  it("dit de se connecter à un visiteur, et rien quand c'est permis", () => {
    expect(raisonRefus(false, null, "sujet")).toMatch(/Connecte-toi/);
    expect(raisonRefus(false, joueur, "sujet")).toMatch(/admin/);
    expect(raisonRefus(false, joueur, "reponse")).toMatch(/réponses/);
    expect(raisonRefus(true, joueur, "reponse")).toBeNull();
  });
});

describe("participant et nom", () => {
  it("rend null sans compte, et un pseudo vide plutôt qu'undefined", () => {
    expect(participant(null, false)).toBeNull();
    expect(participant({ id: "x" }, false)).toEqual({ id: "x", pseudo: "", admin: false });
  });
  it("nomme un compte sans pseudo", () => {
    expect(nomAuteur("")).toBe("joueur sans pseudo");
    expect(nomAuteur(" Zed ")).toBe("Zed");
  });
});

describe("l'ordre", () => {
  it("range les salons par ordre puis par nom", () => {
    const r = trierSalons([
      { ordre: 2, nom: "b" },
      { ordre: 1, nom: "z" },
      { ordre: 1, nom: "a" },
    ]);
    expect(r.map((s) => s.nom)).toEqual(["a", "z", "b"]);
  });

  it("compte les réponses et met le sujet le plus actif en tête", () => {
    const sujets = [
      { id: "s1", created: "2026-09-01 10:00:00.000Z", auteur_nom: "A" },
      { id: "s2", created: "2026-09-05 10:00:00.000Z", auteur_nom: "B" },
    ];
    const messages = [
      { sujet: "s1", created: "2026-09-10 10:00:00.000Z", auteur_nom: "C" },
      { sujet: "s1", created: "2026-09-02 10:00:00.000Z", auteur_nom: "D" },
      { sujet: "inconnu", created: "2026-09-20 10:00:00.000Z", auteur_nom: "E" },
    ];
    const act = activiteDesSujets(sujets, messages);
    expect(act.get("s1")).toEqual({ reponses: 2, derniere: "2026-09-10 10:00:00.000Z", dernierAuteur: "C" });
    expect(act.get("s2")?.reponses).toBe(0);
    expect(trierSujets(sujets, act).map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});

describe("validation", () => {
  it("refuse un titre ou un message vide", () => {
    expect(erreurPost("  ", "texte")).toMatch(/titre/);
    expect(erreurPost(null, "   ")).toMatch(/vide/);
    expect(erreurPost("Titre", "texte")).toBeNull();
    expect(erreurPost(null, "x".repeat(20001))).toMatch(/dépasse/);
  });
  it("refuse un salon sans nom", () => {
    const v = { nom: " ", description: "", ordre: 0, sujets_joueurs: true, reponses_joueurs: true };
    expect(erreurSalon(v)).toMatch(/nom/);
    expect(erreurSalon({ ...v, nom: "Général" })).toBeNull();
  });
});
