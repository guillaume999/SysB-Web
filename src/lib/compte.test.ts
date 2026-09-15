// ============================================================
//  compte.test.ts
//  Le filet de « Mon compte » (15/09) : la saisie refusée AVANT le serveur,
//  et la reconnaissance de l'erreur « ancien mot de passe faux ».
// ============================================================

import { describe, expect, it } from "vitest";
import { LONGUEUR_MAX_MOT_DE_PASSE, erreurSurAncien, problemeSaisie } from "@/lib/compte";
import { LONGUEUR_MOT_DE_PASSE } from "@/lib/joueurs";

const bon = { ancien: "ancien-mdp", nouveau: "nouveau-mdp", confirmation: "nouveau-mdp" };

describe("la saisie du nouveau mot de passe", () => {
  it("accepte une saisie correcte", () => {
    expect(problemeSaisie(bon)).toBeNull();
  });

  it("exige le mot de passe actuel", () => {
    expect(problemeSaisie({ ...bon, ancien: "" })).toMatch(/actuel/);
  });

  it("borne la longueur des deux côtés", () => {
    const court = "x".repeat(LONGUEUR_MOT_DE_PASSE - 1);
    expect(problemeSaisie({ ...bon, nouveau: court, confirmation: court })).toMatch(/au moins/);
    const juste = "x".repeat(LONGUEUR_MOT_DE_PASSE);
    expect(problemeSaisie({ ...bon, nouveau: juste, confirmation: juste })).toBeNull();
    const long = "x".repeat(LONGUEUR_MAX_MOT_DE_PASSE + 1);
    expect(problemeSaisie({ ...bon, nouveau: long, confirmation: long })).toMatch(/au plus/);
  });

  it("refuse deux saisies différentes", () => {
    expect(problemeSaisie({ ...bon, confirmation: "nouveau-mdP" })).toMatch(/identiques/);
  });

  it("refuse un nouveau mot de passe égal à l'actuel", () => {
    expect(problemeSaisie({ ancien: "meme-mdp1", nouveau: "meme-mdp1", confirmation: "meme-mdp1" })).toMatch(
      /identique à l'actuel/,
    );
  });
});

describe("l'erreur « ancien mot de passe faux » renvoyée par PocketBase", () => {
  it("est reconnue sur le champ oldPassword", () => {
    expect(erreurSurAncien({ response: { data: { oldPassword: { message: "Invalid" } } } })).toBe(true);
  });

  it("n'est pas confondue avec une autre erreur", () => {
    expect(erreurSurAncien({ response: { data: { password: { message: "Too short" } } } })).toBe(false);
    expect(erreurSurAncien({ status: 403 })).toBe(false);
    expect(erreurSurAncien(null)).toBe(false);
  });
});
