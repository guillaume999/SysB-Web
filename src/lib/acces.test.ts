// ============================================================
//  acces.test.ts
//  Le filet du PARTAGE DES ÉCRANS — posé le 2026-09-13, à l'ouverture du site
//  aux comptes joueurs.
//
//  ⚠️ POURQUOI CE FICHIER EXISTE. Tant que `signIn` refusait tout compte non
//  admin, « qui voit quoi » n'existait pas : personne d'autre n'entrait. Le
//  jour où un joueur se connecte, la seule chose qui tient les neuf écrans de
//  contenu hors de sa vue est une poignée de fonctions — et aucun type ne dit
//  qu'elles rendent la bonne liste.
//
//  ⚠️ L'ESSAI QUI COMPTE est celui du JOUEUR, pas celui de l'admin : un
//  `ecransVisibles` cassé qui rendrait toujours tout serait VERT sur l'admin.
//  D'où l'assertion en boucle plus bas — aucune adresse d'écran de contenu ne
//  doit se trouver dans ce que voit un joueur.
// ============================================================

import { describe, expect, it } from "vitest";
import {
  ECRANS_CONCEPTEUR,
  ECRANS_CONTENU,
  accueil,
  ecransVisibles,
  roleEstAdmin,
} from "@/lib/acces";

describe("le rôle qui ouvre les écrans de contenu", () => {
  it("n'est que `admin`", () => {
    expect(roleEstAdmin("admin")).toBe(true);
    expect(roleEstAdmin("player")).toBe(false);
    // ⚠️ « testeur » n'est PAS un demi-admin : sa fiche dit « mêmes droits
    // qu'un joueur », et c'est ici que ça se joue.
    expect(roleEstAdmin("tester")).toBe(false);
  });

  it("refuse un rôle absent ou vide — `role` n'est pas requis sur `users`", () => {
    expect(roleEstAdmin(undefined)).toBe(false);
    expect(roleEstAdmin(null)).toBe(false);
    expect(roleEstAdmin("")).toBe(false);
  });
});

describe("ce que voit un joueur", () => {
  const vu = ecransVisibles(false);

  it("ne contient AUCUN écran de contenu", () => {
    expect(vu.contenu).toEqual([]);
    for (const ecran of ECRANS_CONTENU) {
      expect(vu.documents.map((l) => l.to)).not.toContain(ecran.to);
    }
  });

  it("contient la Conception, et elle seule", () => {
    expect(vu.documents.map((l) => l.to)).toEqual(["/conception", "/ma-planete"]);
  });

  it("entre par /conception, pas par le tableau de bord", () => {
    // Le tableau de bord liste `users`, que la règle d'API lui refuse.
    expect(accueil(false)).toBe("/conception");
  });
});

describe("ce que voit un concepteur", () => {
  // ⚠️ Un joueur à qui l'admin a ouvert un modèle (13/09) : mêmes écrans que
  // l'admin, mais quatre seulement.
  const vu = ecransVisibles(false, true);

  it("ouvre les quatre écrans de création, et pas un de plus", () => {
    // ⚠️ Le modèle EN PREMIER : c'est ce qu'on lui a partagé, et c'est là
    // qu'il atterrit.
    expect(vu.contenu.map((l) => l.to)).toEqual([
      "/modeles",
      "/tuiles",
      "/ressources",
      "/technologies",
    ]);
  });

  it("garde hors de vue ce qui n'est pas à lui", () => {
    // ⚠️ L'ASSERTION QUI COMPTE : les comptes, les plateaux des joueurs, les
    // modèles 3D et les âges restent à l'admin.
    for (const interdit of ["/joueurs", "/plateaux", "/3dmodeltuile", "/ages"])
      expect(vu.contenu.map((l) => l.to)).not.toContain(interdit);
  });

  it("garde la Conception, comme tout le monde", () => {
    expect(vu.documents.map((l) => l.to)).toEqual(["/conception", "/ma-planete"]);
  });

  it("entre par ses modèles", () => {
    expect(accueil(false, true)).toBe("/modeles");
  });

  it("ne réécrit aucune adresse : elles viennent des écrans de contenu", () => {
    // Une faute de frappe dans `ADRESSES_CONCEPTEUR` donnerait une liste
    // silencieusement plus courte.
    expect(ECRANS_CONCEPTEUR).toHaveLength(4);
    for (const lien of ECRANS_CONCEPTEUR) expect(ECRANS_CONTENU).toContainEqual(lien);
  });
});

describe("ce que voit un admin", () => {
  const vu = ecransVisibles(true);

  // ⚠️ NEUF depuis le 14/09 : « Planètes » est arrivé avec le chantier du même
  //    nom. Le compte est volontairement écrit en dur — c'est lui qui fait
  //    rougir l'essai quand un écran est ajouté sans être décidé.
  it("garde les neuf écrans de contenu ET la Conception", () => {
    expect(vu.contenu).toHaveLength(9);
    expect(vu.contenu.map((l) => l.to)).toContain("/joueurs");
    expect(vu.documents.map((l) => l.to)).toEqual(["/conception", "/ma-planete"]);
  });

  it("entre par le tableau de bord", () => {
    expect(accueil(true)).toBe("/");
  });
});
