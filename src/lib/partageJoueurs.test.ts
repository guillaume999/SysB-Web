import { describe, expect, it } from "vitest";
import { avecJoueur, chercherJoueurs, nomJoueur, resumePartage } from "@/lib/partageJoueurs";

const j = (id: string, pseudo: string, email = `${id}@x.fr`) => ({ id, pseudo, email });
const JOUEURS = [j("u1", "Zoé"), j("u2", "aragon"), j("u3", "", "sans.pseudo@x.fr")];

describe("chercher un joueur", () => {
  it("trie par nom et cherche dans pseudo ET email, sans accent ni casse", () => {
    expect(chercherJoueurs(JOUEURS, "").map((x) => x.id)).toEqual(["u2", "u3", "u1"]);
    expect(chercherJoueurs(JOUEURS, "ZOE").map((x) => x.id)).toEqual(["u1"]);
    expect(chercherJoueurs(JOUEURS, "sans.pseudo").map((x) => x.id)).toEqual(["u3"]);
  });

  it("montre l'email quand le pseudo manque", () => {
    expect(nomJoueur(JOUEURS[2])).toBe("sans.pseudo@x.fr");
  });
});

describe("la liste des joueurs choisis", () => {
  it("n'a jamais de doublon et garde son ordre", () => {
    expect(avecJoueur(["a", "b"], "a", true)).toEqual(["a", "b"]);
    expect(avecJoueur(["a", "b"], "c", true)).toEqual(["a", "b", "c"]);
    expect(avecJoueur(["a", "b"], "a", false)).toEqual(["b"]);
  });
});

describe("le résumé d'une ligne", () => {
  it("dit « personne » pour un partage neuf — pas « tous »", () => {
    expect(resumePartage({}, JOUEURS)).toBe("personne");
  });
  it("dit « tous les joueurs » quand la case est cochée, liste ou pas", () => {
    expect(resumePartage({ toutes_planetes: true, joueurs_autorises: ["u1"] }, JOUEURS)).toBe(
      "tous les joueurs",
    );
  });
  it("nomme deux joueurs puis compte, et compte les comptes disparus", () => {
    expect(resumePartage({ joueurs_autorises: ["u1", "u2", "u3"] }, JOUEURS)).toBe("Zoé, aragon +1");
    expect(resumePartage({ joueurs_autorises: ["u1", "zz"] }, JOUEURS)).toBe("Zoé (+1 inconnu)");
    expect(resumePartage({ planetes_autorisees: ["p"] }, JOUEURS)).toBe("1 planète");
  });
});
