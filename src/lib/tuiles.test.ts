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
  erreursPalier,
  erreursPaliers,
  fluxVide,
  formatDuree,
  libelleCycle,
  normaliserPalier,
  normaliserProximites,
  palierTourne,
  palierVide,
  paliersPourEnregistrer,
  normaliserRegle,
  pourcentageProximite,
  pourcentageProximites,
  regleApproVide,
  regleUtile,
  regleVide,
  rendementPourIndicateur,
  satisfactionMax,
  seuilsEnDouble,
  tileIdsDe,
  tranchesCouvrentZero,
  tranchesTriees,
  type Palier,
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

// ─── Le palier du modèle à cycles (2026-09-11, spec §2ter) ─────────────────
//
//  ⚠️ Le contrat est celui que le serveur ACCEPTE
//  (`pb_hooks/moteur/cycles/tuiles.js`, `chargerTuile` / `chargerLigne`) : ce
//  que le site laisse partir doit se charger, et ce qu'il bloque doit être
//  exactement ce que le serveur refuserait.

/** Un four : 20 blé → 5 pain, cycle de 2 min. */
function four(patch: Partial<Palier> = {}): Palier {
  return {
    ...palierVide(1),
    cycle_minutes: 2,
    utilisation: [{ ressource: "ble", quantite: 20, direct: false, bonus: 0, proximites: [] }],
    production: [{ ressource: "pain", quantite: 5, indicateur: "", tranches: [], proximites: [] }],
    ...patch,
  };
}

describe("normaliserPalier — le format à cycles, et lui seul", () => {
  it("lit la quantité par cycle, « en direct », le cycle et « démarre avec ce qu'il y a »", () => {
    const p = normaliserPalier(
      {
        niveau: 1,
        cycle_minutes: 2,
        demarre_partiel: true,
        utilisation: [{ ressource: "ble", quantite: 20, direct: true }],
        production: [{ ressource: "pain", quantite: 5 }],
      },
      1,
    );
    expect(p.cycle_minutes).toBe(2);
    expect(p.demarre_partiel).toBe(true);
    expect(p.utilisation[0]).toMatchObject({ ressource: "ble", quantite: 20, direct: true });
    expect(p.production[0]).toMatchObject({ ressource: "pain", quantite: 5, indicateur: "" });
  });

  it("« démarre avec ce qu'il y a » et « en direct » sont DÉCOCHÉS par défaut", () => {
    // ⚠️ Le défaut est le tout-ou-rien (§2) : un palier qui ne dit rien ne
    // doit pas se mettre à manger ce qu'il trouve.
    const p = normaliserPalier({ utilisation: [{ ressource: "ble", quantite: 1 }] }, 1);
    expect(p.demarre_partiel).toBe(false);
    expect(p.utilisation[0].direct).toBe(false);
    expect(p.cycle_minutes).toBe(0);
  });

  it("NE relit PAS `par_minute` ni `part` — on repart de zéro, la ligne revient à 0", () => {
    const p = normaliserPalier(
      {
        utilisation: [{ ressource: "ble", par_minute: 2.5, part: 100 }],
        production: [{ ressource: "pain", par_minute: 5 }],
      },
      1,
    );
    expect(p.utilisation[0].quantite).toBe(0);
    expect(p.production[0].quantite).toBe(0);
    expect(p.utilisation[0]).not.toHaveProperty("par_minute");
    expect(p.utilisation[0]).not.toHaveProperty("part");
  });

  it("n'accepte que des entiers : une quantité décimale est tronquée", () => {
    const p = normaliserPalier({ cycle_minutes: 2.7, utilisation: [{ ressource: "ble", quantite: 3.9 }] }, 1);
    expect(p.cycle_minutes).toBe(2);
    expect(p.utilisation[0].quantite).toBe(3);
  });

  it("ne relit plus l'ancien `rendement` seul : le « plafond fixe » est mort le 11/09", () => {
    const p = normaliserPalier({ production: [{ ressource: "pain", quantite: 5, rendement: 60 }] }, 1);
    expect(p.production[0].tranches).toEqual([]);
  });
});

describe("erreursPalier — ce que le serveur refuserait", () => {
  it("un four bien déclaré passe", () => {
    expect(erreursPalier(four())).toEqual([]);
  });

  it("exige un cycle dès que le palier consomme OU produit", () => {
    expect(erreursPalier(four({ cycle_minutes: 0 }))).toHaveLength(1);
    expect(erreursPalier(four({ cycle_minutes: 0, utilisation: [] }))).toHaveLength(1);
    expect(erreursPalier(four({ cycle_minutes: 0, production: [] }))).toHaveLength(1);
  });

  it("n'exige RIEN d'un palier qui ne fait rien — une tuile décorative n'a pas de rythme", () => {
    expect(erreursPalier(palierVide(1))).toEqual([]);
    expect(palierTourne(palierVide(1))).toBe(false);
  });

  it("une ligne à 0 par cycle ne réclame pas de cycle : elle ne partira pas en base", () => {
    const p = four({
      cycle_minutes: 0,
      utilisation: [{ ressource: "ble", quantite: 0, direct: false, bonus: 0, proximites: [] }],
      production: [],
    });
    expect(palierTourne(p)).toBe(false);
    expect(erreursPalier(p)).toEqual([]);
  });

  it("refuse un cycle qui n'est pas un entier ≥ 1 — le plus court est UNE minute", () => {
    expect(erreursPalier(four({ cycle_minutes: 1.5 }))).toHaveLength(1);
    expect(erreursPalier(four({ cycle_minutes: 1 }))).toEqual([]);
  });

  it("refuse une quantité qui n'est pas un entier ≥ 0 (§3 : le 1/3600 a disparu)", () => {
    const p = four();
    p.production[0].quantite = 2.5;
    expect(erreursPalier(p)).toHaveLength(1);
  });

  it("refuse une production qui SUIT un indicateur sans aucune tranche (§5.4)", () => {
    const p = four();
    p.production[0].indicateur = "satisfaction";
    expect(erreursPalier(p)).toHaveLength(1);
    p.production[0].tranches = [{ seuil: 0, rendement: 100 }];
    expect(erreursPalier(p)).toEqual([]);
  });

  it("préfixe chaque erreur de son palier, pour le pied de la fenêtre", () => {
    expect(erreursPaliers([four(), four({ cycle_minutes: 0 })])[0]).toMatch(/^Palier 2 : /);
  });
});

describe("paliersPourEnregistrer — ce qui part en base", () => {
  it("écrit le cycle sur un palier qui tourne, et JAMAIS `0` sur un palier qui ne fait rien", () => {
    // ⚠️ Le serveur refuse `cycle_minutes: 0` : absent est la seule façon de
    // dire « pas de cycle ».
    const [tourne, decor] = paliersPourEnregistrer([four(), { ...palierVide(2), cycle_minutes: 3 }]);
    expect(tourne.cycle_minutes).toBe(2);
    expect(decor).not.toHaveProperty("cycle_minutes");
  });

  it("n'écrit plus ni `par_minute` ni `part`, et `direct` sur une consommation seulement", () => {
    const [p] = paliersPourEnregistrer([four({ demarre_partiel: true })]);
    expect(p.demarre_partiel).toBe(true);
    expect(p.utilisation[0]).toEqual({ ressource: "ble", quantite: 20, direct: false, bonus: 0, proximites: [] });
    expect(p.production[0]).toEqual({
      ressource: "pain",
      quantite: 5,
      indicateur: "",
      tranches: [],
      proximites: [],
    });
  });

  it("retire les lignes à 0 par cycle — l'écran l'a dit avant", () => {
    const p = four();
    p.utilisation.push({ ressource: "bois", quantite: 0, direct: false, bonus: 0, proximites: [] });
    p.production.push({ ressource: "brique", quantite: 0, indicateur: "", tranches: [], proximites: [] });
    const [sortie] = paliersPourEnregistrer([p]);
    expect(sortie.utilisation.map((l) => l.ressource)).toEqual(["ble"]);
    expect(sortie.production.map((l) => l.ressource)).toEqual(["pain"]);
  });

  it("retire un escalier SANS indicateur : « une ligne a UN cadenceur » (§4)", () => {
    const p = four();
    p.production[0].tranches = [{ seuil: 0, rendement: 60 }];
    expect(paliersPourEnregistrer([p])[0].production[0].tranches).toEqual([]);
  });

  it("trie l'escalier d'une ligne qui suit un indicateur", () => {
    const p = four();
    p.production[0].indicateur = "satisfaction";
    p.production[0].tranches = [
      { seuil: 0, rendement: 60 },
      { seuil: 80, rendement: 100 },
    ];
    expect(paliersPourEnregistrer([p])[0].production[0].tranches.map((t) => t.seuil)).toEqual([80, 0]);
  });
});

describe("libelleCycle", () => {
  it("dit la quantité PAR CYCLE, plus « par minute »", () => {
    expect(libelleCycle({ cycle_minutes: 2 })).toBe("par cycle de 2 min");
    expect(libelleCycle({ cycle_minutes: 90 })).toBe("par cycle de 1.5 h");
    expect(libelleCycle({ cycle_minutes: 0 })).toBe("par cycle (durée non déclarée)");
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

// ============================================================
//  §5.5 — LA LIGNE BONUS : dépasser 100 % (13/09)
//
//  ⚠️ Ce qui se perd en silence ici : un `Math.min(100, …)` remis dans
//  `tranchesTriees` rendrait le bonus inutilisable SANS un mot à la saisie —
//  l'escalier se saisirait normalement et ne s'ouvrirait jamais en jeu.
// ============================================================

describe("le bonus de satisfaction (§5.5)", () => {
  it("une ligne neuve est ORDINAIRE : bonus 0, c'est le cas de la quasi-totalité", () => {
    expect(fluxVide("ble").bonus).toBe(0);
  });

  it("un catalogue d'avant le 13/09 se relit en lignes ordinaires — rien à migrer", () => {
    const p = normaliserPalier({
      niveau: 1,
      cycle_minutes: 1,
      utilisation: [{ ressource: "ble", quantite: 20, direct: false }],
    }, 1);
    expect(p.utilisation[0].bonus).toBe(0);
    expect(satisfactionMax(p.utilisation)).toBe(100);
  });

  it("relit le bonus, et le renvoie en base tel quel", () => {
    const p = normaliserPalier({
      niveau: 1,
      cycle_minutes: 1,
      utilisation: [
        { ressource: "nourriture", quantite: 10, direct: false },
        { ressource: "gibier", quantite: 5, direct: false, bonus: 20 },
      ],
    }, 1);
    expect(p.utilisation.map((l) => l.bonus)).toEqual([0, 20]);
    const [sortie] = paliersPourEnregistrer([p]);
    expect(sortie.utilisation.map((l) => l.bonus)).toEqual([0, 20]);
  });

  it("le plafond du palier est 100 + les bonus — c'est lui qui dit si une tranche s'ouvrira", () => {
    const sans = [{ ...fluxVide("ble"), quantite: 10 }];
    expect(satisfactionMax(sans)).toBe(100);

    const avec = [
      { ...fluxVide("nourriture"), quantite: 10 },
      { ...fluxVide("gibier"), quantite: 5, bonus: 20 },
      { ...fluxVide("parure"), quantite: 1, bonus: 15 },
    ];
    expect(satisfactionMax(avec)).toBe(135);
  });

  it("une ligne à 0 par cycle ne compte pas : elle ne partira pas en base", () => {
    const morte = [{ ...fluxVide("gibier"), quantite: 0, bonus: 20 }];
    expect(satisfactionMax(morte)).toBe(100);
  });

  // ⚠️⚠️ LE TEST QUI PROTÈGE TOUT LE RESTE. Avant le 13/09, `tranchesTriees`
  // ramenait seuil ET rendement à 100 : une tranche « de 120 → 130 % » se
  // saisissait, se relisait « de 100 → 100 % », et le bonus ne payait jamais.
  it("l'escalier n'est PLUS plafonné à 100 : c'est ce qui fait payer le bonus", () => {
    const escalier = [
      { seuil: 120, rendement: 130 },
      { seuil: 80, rendement: 100 },
      { seuil: 0, rendement: 60 },
    ];
    expect(tranchesCouvrentZero(escalier)).toBe(true);
    expect(seuilsEnDouble(escalier)).toBe(false);
    expect(rendementPourIndicateur(escalier, 120)).toBe(130);
    expect(rendementPourIndicateur(escalier, 135)).toBe(130);
    expect(rendementPourIndicateur(escalier, 100)).toBe(100);
    expect(rendementPourIndicateur(escalier, 79)).toBe(60);
  });

  it("le tri et les bornes du bas tiennent toujours : entiers, jamais négatifs", () => {
    const triees = tranchesTriees([
      { seuil: 0, rendement: 60.9 },
      { seuil: 120.4, rendement: 130 },
      { seuil: -5, rendement: -10 },
    ]);
    expect(triees).toEqual([
      { seuil: 120, rendement: 130 },
      { seuil: 0, rendement: 60 },
      { seuil: 0, rendement: 0 },
    ]);
  });
});
