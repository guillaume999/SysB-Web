// ============================================================
//  tuiles.test.ts
//  Le filet du modèle des tuiles — posé le 2026-09-09.
//
//  ⚠️ CE QUI EST TESTÉ ICI EST CE QUI SE PERD EN SILENCE. Une couleur de bouton
//  qui change se voit ; un prorata devenu du tout-ou-rien, une proximité
//  d'avant le 30/08 qui perd son bâtiment à la relecture, un aller-retour
//  compté à l'aller seulement — ça, personne ne le voit avant la partie
//  suivante. C'est le critère d'entrée dans ce fichier.
//
//  ⚠️ ON TESTE LA RÈGLE, PAS L'IMPLÉMENTATION. Chaque bloc porte la décision
//  qu'il protège et sa date : le jour où quelqu'un veut la défaire, le test lui
//  dit ce qu'il défait au lieu de lui demander de le deviner.
//
//  ⚠️ La formule d'acheminement est celle du MOTEUR
//  (`pb_hooks/moteur/acheminement.js`). Les deux doivent bouger ensemble ;
//  ce test est ce qui le rappellera.
// ============================================================

import { describe, expect, it } from "vitest";

import {
  casesCouvertes,
  categoriesDe,
  categoriesVersTexte,
  cransParTrajet,
  dureeTrajet,
  formatDuree,
  normaliserProximites,
  normaliserRegle,
  pourcentageProximite,
  pourcentageProximites,
  regleApproVide,
  regleUtile,
  regleVide,
  rendementPourIndicateur,
  seuilsEnDouble,
  tileIdsDe,
  tranchesCouvrentZero,
  type Proximite,
} from "@/lib/tuiles";

describe("tileIdsDe", () => {
  it("dédoublonne, trie, et jette le zéro", () => {
    expect(tileIdsDe([5, 2, 5, 0, 2])).toEqual([2, 5]);
  });

  it("survit à tout ce que PocketBase peut rendre à la place d'une liste", () => {
    expect(tileIdsDe(null)).toEqual([]);
    expect(tileIdsDe(undefined)).toEqual([]);
    expect(tileIdsDe("3,4")).toEqual([]);
    expect(tileIdsDe([1, "2", null, NaN, -3, 4.7])).toEqual([1, 4]);
  });
});

describe("normaliserProximites", () => {
  it("relit le format du 30/08 : une liste de règles", () => {
    expect(normaliserProximites({ proximites: [{ tileIds: [3, 1, 3], nombre: 5, rayon: 2 }] })).toEqual([
      { tileIds: [1, 3], nombre: 5, rayon: 2 },
    ]);
  });

  it("relit l'ANCIEN format, un `proximite` unique à un seul `tileId`", () => {
    // ⚠️ Le jour où ça casse, toutes les proximités saisies avant le 30/08
    // perdent leur bâtiment sans un mot, et les tuiles produisent à 100 %.
    expect(normaliserProximites({ proximite: { tileId: 7, nombre: 3, rayon: 1 } })).toEqual([
      { tileIds: [7], nombre: 3, rayon: 1 },
    ]);
  });

  it("écarte les règles entièrement vides — l'ancienne façon d'écrire « aucune »", () => {
    expect(normaliserProximites({ proximites: [{ tileIds: [], nombre: 0, rayon: 0 }] })).toEqual([]);
    expect(normaliserProximites({})).toEqual([]);
    expect(normaliserProximites(null)).toEqual([]);
  });

  it("garde une règle POSÉE mais incomplète — c'est une saisie en cours, pas un néant", () => {
    expect(normaliserProximites({ proximites: [{ tileIds: [], nombre: 0, rayon: 2 }] })).toEqual([
      { tileIds: [], nombre: 0, rayon: 2 },
    ]);
  });
});

describe("pourcentageProximite", () => {
  const cinqFermes: Proximite = { tileIds: [1], nombre: 5, rayon: 2 };

  it("compte AU PRORATA, jamais en tout-ou-rien (choix du 28/08)", () => {
    expect(pourcentageProximite(cinqFermes, 3)).toBe(60);
    expect(pourcentageProximite(cinqFermes, 0)).toBe(0);
  });

  it("plafonne à 100 : en avoir huit quand cinq suffisent ne produit pas plus", () => {
    expect(pourcentageProximite(cinqFermes, 8)).toBe(100);
  });

  it("rend 100 pour une règle incomplète — ignorée en jeu, pas bloquante", () => {
    expect(pourcentageProximite({ tileIds: [], nombre: 0, rayon: 2 }, 0)).toBe(100);
  });

  it("cumule plusieurs règles par le MINIMUM, pas par le produit (choix du 30/08)", () => {
    // 80 % d'un côté et 50 % de l'autre donnent 50 % : c'est le maillon faible
    // qui commande. Le produit (40 %) s'effondrerait dès trois règles.
    const regles: Proximite[] = [
      { tileIds: [1], nombre: 5, rayon: 2 },
      { tileIds: [2], nombre: 2, rayon: 2 },
    ];
    expect(pourcentageProximites(regles, [4, 1])).toBe(50);
    expect(pourcentageProximites([], [])).toBe(100);
  });
});

describe("regleUtile", () => {
  it("dit non tant que la règle n'exige rien — une liste blanche vide interdirait TOUT", () => {
    expect(regleUtile(regleVide("support"))).toBe(false);
    expect(regleUtile({ ...regleVide("support"), tileIds: [3] })).toBe(true);
    expect(regleUtile({ ...regleVide("support"), base: "tout" })).toBe(false);
    expect(regleUtile({ ...regleVide("support"), base: "tout", sauf: [3] })).toBe(true);
  });

  it("juge chaque type sur SON champ", () => {
    expect(regleUtile(regleVide("limite"))).toBe(true); // max: 1 par défaut
    expect(regleUtile({ ...regleVide("limite"), max: 0 })).toBe(false);
    expect(regleUtile(regleVide("gratuite"))).toBe(true); // offerts: 1
    expect(regleUtile({ ...regleVide("batiments"), batiment: 4 })).toBe(true);
    expect(regleUtile(regleVide("batiments"))).toBe(false); // aucun bâtiment choisi
    expect(regleUtile({ ...regleVide("technologie"), techno: "metallurgie" })).toBe(true);
    expect(regleUtile(regleVide("technologie"))).toBe(false);
  });
});

describe("normaliserRegle", () => {
  it("comble ce qu'un vieux record ne portait pas encore", () => {
    expect(normaliserRegle({})).toEqual(regleVide("support"));
  });

  it("ramène un type inconnu sur `support` plutôt que de le laisser filer", () => {
    expect(normaliserRegle({ regle: "voisinage" as never }).regle).toBe("support");
  });

  it("refuse les nombres négatifs et les décimales", () => {
    const r = normaliserRegle({ regle: "limite", max: -3, niveau: 2.9 });
    expect(r.max).toBe(0);
    expect(r.niveau).toBe(2);
  });
});

describe("rendementPourIndicateur", () => {
  const escalier = [
    { seuil: 80, rendement: 100 },
    { seuil: 50, rendement: 60 },
    { seuil: 20, rendement: 20 },
  ];

  it("prend la tranche atteinte la plus haute", () => {
    expect(rendementPourIndicateur(escalier, 90)).toBe(100);
    expect(rendementPourIndicateur(escalier, 80)).toBe(100);
    expect(rendementPourIndicateur(escalier, 55)).toBe(60);
  });

  it("sous la dernière marche, rend la PLUS BASSE — jamais 100", () => {
    // Une satisfaction catastrophique qui rendrait la production maximale est
    // exactement le contraire de l'intention.
    expect(rendementPourIndicateur(escalier, 0)).toBe(20);
  });

  it("sans tranche, rien ne freine", () => {
    expect(rendementPourIndicateur([], 0)).toBe(100);
  });

  it("signale l'escalier qui ne descend pas à zéro, et les seuils en double", () => {
    expect(tranchesCouvrentZero(escalier)).toBe(false);
    expect(tranchesCouvrentZero([...escalier, { seuil: 0, rendement: 0 }])).toBe(true);
    expect(seuilsEnDouble(escalier)).toBe(false);
    expect(seuilsEnDouble([...escalier, { seuil: 50, rendement: 10 }])).toBe(true);
  });
});

describe("acheminement — la même formule que le moteur", () => {
  const regle = () => ({
    ...regleApproVide("entrant"),
    debit: { navettes: 2, quantite: 10 },
    vitesse: { crans: 1, periode_s: 20 },
  });

  it("compte l'ALLER-RETOUR, avec un plancher de 1 case", () => {
    expect(cransParTrajet(4)).toBe(8);
    expect(cransParTrajet(0)).toBe(2);
  });

  it("partage la flotte à parts égales entre les cibles à portée (07/09)", () => {
    // T = 2d × periode_s × N / (crans × navettes)
    const d = 4;
    const n = 5;
    expect(dureeTrajet(regle(), d, n)).toBe((2 * d * 20 * n) / (1 * 2));
    // Deux fois plus de cibles = deux fois moins souvent servi. C'est CE
    // rapport que le modèle mort du 06/09 ne respectait pas.
    expect(dureeTrajet(regle(), d, 2 * n)).toBe(2 * (dureeTrajet(regle(), d, n) as number));
  });

  it("rend null quand rien ne circule, et 0 quand c'est « sans limite »", () => {
    expect(dureeTrajet({ ...regle(), vitesse: { crans: 0, periode_s: 20 } }, 3)).toBeNull();
    expect(dureeTrajet({ ...regle(), debit: { navettes: 0, quantite: 10 } }, 3)).toBeNull();
    expect(dureeTrajet({ ...regle(), illimite: true }, 3)).toBe(0);
  });
});

describe("casesCouvertes", () => {
  it("suit la géométrie HEXAGONALE : 3r(r+1)", () => {
    expect(casesCouvertes(0)).toBe(0);
    expect(casesCouvertes(1)).toBe(6);
    expect(casesCouvertes(2)).toBe(18);
  });
});

describe("formatDuree", () => {
  it("dit « immédiat » pour zéro, et change d'unité au bon endroit", () => {
    expect(formatDuree(0)).toBe("immédiat");
    expect(formatDuree(45)).toBe("45 s");
    expect(formatDuree(600)).toBe("10 min");
    expect(formatDuree(3600)).toBe("1 h");
    expect(formatDuree(5400)).toBe("1.5 h");
  });
});

describe("categoriesDe", () => {
  it("découpe, taille les blancs, et dédoublonne SANS regarder la casse", () => {
    // C'est ce qui empêche une 141e tuile d'inaugurer « Habitations » à côté
    // d'« Habitat ».
    expect(categoriesDe("Habitat, production ,  HABITAT ")).toEqual(["Habitat", "production"]);
    expect(categoriesDe({ categorie: "" })).toEqual([]);
    expect(categoriesDe(null)).toEqual([]);
  });

  it("remet la liste en une ligne, nettoyée au passage", () => {
    expect(categoriesVersTexte(["Habitat", " habitat ", "Eau"])).toBe("Habitat, Eau");
  });
});
