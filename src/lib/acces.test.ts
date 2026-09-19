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
  ECRANS_COMPTE,
  ECRANS_CONCEPTION,
  ECRANS_CONTENU,
  ECRANS_GUILDE,
  ECRANS_PUBLICS,
  ONGLETS_PLATEAUX,
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

  it("ne contient QUE ses quatre écrans de conception (15/09)", () => {
    // ⚠️ L'ESSAI QUI COMPTE : ni Joueurs, ni Limites, ni les plateaux des
    // autres, ni le catalogue 3D ou les icônes (c'est l'admin qui les ouvre).
    expect(vu.contenu.map((l) => l.to)).toEqual(["/ressources", "/tuiles", "/technologies", "/modeles"]);
    for (const interdit of ["/", "/joueurs", "/limites", "/guildes", "/plateaux", "/plateaux-joueurs", "/modeles-joueurs", "/3dmodeltuile", "/icones", "/ages", "/unites"]) {
      expect(vu.contenu.map((l) => l.to)).not.toContain(interdit);
    }
    for (const ecran of ECRANS_CONTENU) {
      expect(vu.documents.map((l) => l.to)).not.toContain(ecran.to);
      expect(vu.communaute.map((l) => l.to)).not.toContain(ecran.to);
      expect(vu.guilde.map((l) => l.to)).not.toContain(ecran.to);
    }
  });

  it("a sa guilde et son salon (15/09)", () => {
    expect(vu.guilde.map((l) => l.to)).toEqual(["/guilde", "/guilde/salon"]);
    expect(ecransVisibles(true).guilde).toEqual(ECRANS_GUILDE);
  });

  it("des écrans de conception dont les ADRESSES existent toutes chez l'admin", () => {
    // ⚠️ Par l'adresse, plus par l'objet, depuis le 19/09 : « Modèles » est le
    // seul libellé réécrit pour le joueur (l'admin lit « Modèles game », lui
    // n'a qu'un domaine). La ROUTE, elle, doit rester la même — c'est ce que
    // cet essai garde.
    const chez = ECRANS_CONTENU.map((e) => e.to);
    expect(ECRANS_CONCEPTION.every((e) => chez.includes(e.to))).toBe(true);
    expect(ECRANS_CONCEPTION.find((e) => e.to === "/modeles")?.label).toBe("Modèles");
  });

  it("contient la Conception, les News et le Forum", () => {
    expect(vu.documents.map((l) => l.to)).toEqual(["/conception"]);
    expect(vu.communaute.map((l) => l.to)).toEqual(["/news", "/forum"]);
  });

  it("a son compte (fiche, email, mot de passe)", () => {
    expect(vu.compte.map((l) => l.to)).toEqual(["/compte"]);
  });

  it("entre par les News, pas par le tableau de bord", () => {
    // Le tableau de bord liste `users`, que la règle d'API lui refuse.
    expect(accueil(false)).toBe("/news");
  });
});

describe("les écrans publics", () => {
  it("ne contiennent AUCUN écran de contenu ni la Conception", () => {
    // ⚠️ Ce qui est ici est routé pour un visiteur ANONYME (App.tsx).
    const publics = ECRANS_PUBLICS.map((l) => l.to);
    for (const ecran of ECRANS_CONTENU) expect(publics).not.toContain(ecran.to);
    expect(publics).not.toContain("/conception");
    // ⚠️ « Mon compte » n'a pas de sens sans compte : jamais public.
    for (const ecran of ECRANS_COMPTE) expect(publics).not.toContain(ecran.to);
    expect(publics).not.toContain("/");
  });
});

describe("les quatre onglets des plateaux (19/09)", () => {
  it("ont chacun leur adresse, et toutes sont dans la barre de l'admin", () => {
    const quatre = [
      ONGLETS_PLATEAUX.templates.game,
      ONGLETS_PLATEAUX.templates.joueur,
      ONGLETS_PLATEAUX.plateaux.game,
      ONGLETS_PLATEAUX.plateaux.joueur,
    ];
    // ⚠️ L'ESSAI QUI COMPTE : quatre adresses DISTINCTES. Deux onglets sur la
    // même route, c'est un onglet qu'on croit ouvrir et qui montre l'autre.
    expect(new Set(quatre.map((l) => l.to)).size).toBe(4);
    const chez = ecransVisibles(true).contenu.map((l) => l.to);
    for (const onglet of quatre) expect(chez).toContain(onglet.to);
  });

  it("ne se recouvrent pas avec la route de l'éditeur `/modeles/:id`", () => {
    // `/modeles-joueurs` est un SEGMENT à part, pas `/modeles/joueurs` : sans
    // ça, react-router hésiterait entre l'onglet et un plateau d'id « joueurs ».
    for (const l of Object.values(ONGLETS_PLATEAUX.templates))
      expect(l.to.startsWith("/modeles/")).toBe(false);
  });
});

describe("ce que voit un admin", () => {
  const vu = ecransVisibles(true);

  // ⚠️ TREIZE depuis le 18/09 : « Planètes » est fondu dans « Modèles »,
  //    « Icônes », « Limites », « Guildes », « Socles » puis « Tuto » sont arrivés.
  //    Le compte est volontairement écrit en dur — c'est lui qui fait rougir
  //    l'essai quand un écran est ajouté ou retiré sans être décidé.
  it("garde les seize écrans de contenu ET la Conception", () => {
    // ⚠️ QUINZE depuis le 19/09 : « Modèles » et « Plateaux joueurs » se sont
    //    chacun dédoublés en un onglet game et un onglet joueurs.
    // ⚠️ SEIZE le 19/09 au soir : « Unités » (le catalogue de bataille).
    expect(vu.contenu).toHaveLength(16);
    expect(vu.contenu.map((l) => l.to)).toContain("/unites");
    expect(vu.contenu.map((l) => l.to)).toContain("/limites");
    expect(vu.contenu.map((l) => l.to)).toContain("/guildes");
    expect(vu.contenu.map((l) => l.to)).toContain("/icones");
    expect(vu.contenu.map((l) => l.to)).toContain("/socles");
    expect(vu.contenu.map((l) => l.to)).toContain("/tuto");
    expect(vu.contenu.map((l) => l.to)).toContain("/modeles-joueurs");
    expect(vu.contenu.map((l) => l.to)).toContain("/plateaux-joueurs");
    expect(vu.contenu.map((l) => l.to)).not.toContain("/planetes");
    expect(vu.contenu.map((l) => l.to)).toContain("/joueurs");
    expect(vu.documents.map((l) => l.to)).toEqual(["/conception"]);
    expect(vu.communaute.map((l) => l.to)).toEqual(["/news", "/forum"]);
    expect(vu.compte.map((l) => l.to)).toEqual(["/compte"]);
  });

  it("entre par le tableau de bord", () => {
    expect(accueil(true)).toBe("/");
  });
});
