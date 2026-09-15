// ============================================================
//  planetes.test.ts
//  Le filet de LA RÈGLE DU PARTAGE — 2026-09-14.
//
//  ⚠️ POURQUOI CE FICHIER EXISTE. `autoriseeSur` a trois branches, et la plus
//  facile à casser est la plus silencieuse : **une liste vide veut dire « à
//  personne »**, pas « à tout le monde ». Un jour quelqu'un trouvera plus
//  simple d'écrire « pas de liste = ouvert », et rien à l'écran ne le dira —
//  tous les modèles 3D du jeu apparaîtraient d'un coup chez tous les joueurs.
//  C'est l'essai `un partageable NEUF n'est ouvert à AUCUNE planète de joueur`
//  qui tient cette porte.
//
//  ⚠️ L'ESSAI QUI COMPTE est celui de la planète DE JOUEUR. Une règle cassée
//  qui rendrait toujours `true` serait VERTE sur une planète game, puisque la
//  troisième branche l'autorise de toute façon.
// ============================================================

import { describe, expect, it } from "vitest";
import {
  APPARTIENT_GAME,
  appartenance,
  appartientPourPlanete,
  autoriseeSur,
  pseudoReserve,
  rangAppartenance,
  avecPlanete,
  enListe,
  normaliserPartage,
  estGame,
  estPlaneteGame,
  nomDePlanete,
  ouvertsA,
  pourquoiRienACreer,
  triAdmin,
  usageDuModele3D,
  type Partageable,
  type Planete,
} from "@/lib/planetes";

const planete = (nom: string, proprietaire = ""): Planete => ({
  id: `id_${nom.toLowerCase()}`,
  nom,
  proprietaire,
  created: "2026-09-14 10:00:00Z",
  updated: "2026-09-14 10:00:00Z",
});

const GAME = planete("Game");
const TERRE = planete("Terre");
const JUPITER = planete("Jupiter");
const ARAGONIA = planete("Aragonia", "u_guillaume");
const CHEZ_SEB = planete("Sebtopia", "u_seb");

describe("ce qui sépare une planète game d'une planète de joueur", () => {
  it("est le seul champ `proprietaire`", () => {
    expect(estPlaneteGame(TERRE)).toBe(true);
    expect(estPlaneteGame(GAME)).toBe(true);
    expect(estPlaneteGame(ARAGONIA)).toBe(false);
  });

  it("et « Game » se reconnaît en plus à son nom", () => {
    expect(estGame(GAME)).toBe(true);
    expect(estGame(TERRE)).toBe(false);
  });
});

describe("la règle du partage", () => {
  it("⚠️ un partageable NEUF n'est ouvert à AUCUNE planète de joueur", () => {
    // Le cœur du sujet : liste vide = à personne. Si cet essai passe au rouge
    // en rendant `true`, c'est que quelqu'un a écrit « vide = toutes ».
    const neuf: Partageable = {};
    expect(autoriseeSur(neuf, ARAGONIA)).toBe(false);
    expect(autoriseeSur(neuf, CHEZ_SEB)).toBe(false);
  });

  it("…mais reste utilisable sur les planètes game, sans rien cocher", () => {
    // C'est CETTE branche qui rend le patch indolore : les 28 prefabs en
    // service continuent de servir sur la Terre et Jupiter.
    const neuf: Partageable = {};
    expect(autoriseeSur(neuf, TERRE)).toBe(true);
    expect(autoriseeSur(neuf, JUPITER)).toBe(true);
    expect(autoriseeSur(neuf, GAME)).toBe(true);
  });

  it("s'ouvre à une planète nommée", () => {
    const part: Partageable = { planetes_autorisees: [ARAGONIA.id] };
    expect(autoriseeSur(part, ARAGONIA)).toBe(true);
    expect(autoriseeSur(part, CHEZ_SEB)).toBe(false);
  });

  it("s'ouvre à toutes d'un coup, y compris à celles qui n'existent pas encore", () => {
    const part: Partageable = { toutes_planetes: true };
    expect(autoriseeSur(part, ARAGONIA)).toBe(true);
    expect(autoriseeSur(part, CHEZ_SEB)).toBe(true);
    expect(autoriseeSur(part, planete("PasEncoreNée", "u_futur"))).toBe(true);
  });

  it("s'ouvre aux planètes d'un joueur nommé, et à elles seules (15/09)", () => {
    const part: Partageable = { joueurs_autorises: [CHEZ_SEB.proprietaire] };
    expect(autoriseeSur(part, CHEZ_SEB)).toBe(true);
    expect(autoriseeSur(part, ARAGONIA)).toBe(false);
    expect(autoriseeSur(part, TERRE)).toBe(true);
  });

  it("refuse quand aucune planète n'est choisie", () => {
    expect(autoriseeSur({ toutes_planetes: true }, null)).toBe(false);
  });

  it("filtre une liste entière", () => {
    const liste: Partageable[] = [
      {},
      { planetes_autorisees: [ARAGONIA.id] },
      { toutes_planetes: true },
    ];
    expect(ouvertsA(liste, ARAGONIA)).toHaveLength(2);
    expect(ouvertsA(liste, CHEZ_SEB)).toHaveLength(1);
    expect(ouvertsA(liste, TERRE)).toHaveLength(3);
  });
});

describe("ce qu'on dit à un joueur qui ne peut rien créer", () => {
  const unModele: Partageable[] = [{ planetes_autorisees: [ARAGONIA.id] }];
  const uneIcone: Partageable[] = [{ planetes_autorisees: [ARAGONIA.id] }];

  it("ne dit rien quand les deux listes sont servies", () => {
    expect(pourquoiRienACreer(ARAGONIA, unModele, uneIcone)).toBeNull();
  });

  it("⚠️ NOMME laquelle des deux manque — c'est tout l'intérêt de la phrase", () => {
    expect(pourquoiRienACreer(ARAGONIA, [], uneIcone)).toMatch(/MODÈLE 3D/);
    expect(pourquoiRienACreer(ARAGONIA, unModele, [])).toMatch(/ICÔNE/);
    expect(pourquoiRienACreer(ARAGONIA, [], [])).toMatch(/ni aucune icône/);
  });

  it("et une planète game n'est jamais bloquée", () => {
    expect(pourquoiRienACreer(TERRE, [{}], [{}])).toBeNull();
  });
});

describe("l'ordre d'affichage", () => {
  it("met Game en tête, puis les planètes game, puis celles des joueurs", () => {
    const rendu = triAdmin([CHEZ_SEB, JUPITER, ARAGONIA, TERRE, GAME]).map((p) => p.nom);
    expect(rendu).toEqual(["Game", "Jupiter", "Terre", "Aragonia", "Sebtopia"]);
  });
});

describe("cocher et décocher une planète", () => {
  it("n'ajoute jamais deux fois la même", () => {
    const part: Partageable = { planetes_autorisees: [ARAGONIA.id] };
    expect(avecPlanete(part, ARAGONIA.id, true)).toEqual([ARAGONIA.id]);
  });

  it("ajoute à la suite et retire sans toucher au reste", () => {
    const part: Partageable = { planetes_autorisees: [ARAGONIA.id] };
    expect(avecPlanete(part, CHEZ_SEB.id, true)).toEqual([ARAGONIA.id, CHEZ_SEB.id]);
    expect(avecPlanete(part, ARAGONIA.id, false)).toEqual([]);
  });

  it("part d'une liste absente sans broncher", () => {
    expect(avecPlanete({}, ARAGONIA.id, true)).toEqual([ARAGONIA.id]);
    expect(avecPlanete({}, ARAGONIA.id, false)).toEqual([]);
  });
});

describe("l'usage d'un modèle 3D", () => {
  it("⚠️ vide se lit « tuile » — c'est ce qui rend le patch gratuit", () => {
    expect(usageDuModele3D({})).toBe("tuile");
    expect(usageDuModele3D({ usage: "" })).toBe("tuile");
    expect(usageDuModele3D({ usage: "tuile" })).toBe("tuile");
    expect(usageDuModele3D({ usage: "planete" })).toBe("planete");
  });
});

describe("le nom d'une planète", () => {
  it("se lit pour l'écran, et dit quand il ne sait pas", () => {
    expect(nomDePlanete([TERRE], TERRE.id)).toBe("Terre");
    expect(nomDePlanete([TERRE], undefined)).toBe("aucune planète");
    expect(nomDePlanete([TERRE], "id_inconnu")).toBe("planète inconnue");
  });
});

describe("à qui appartient un modèle", () => {
  it("⚠️ vide n'est PAS « game » : c'est un modèle que personne n'a rangé", () => {
    expect(appartenance("")).toEqual({ famille: "personne" });
    expect(appartenance(undefined)).toEqual({ famille: "personne" });
    expect(appartenance("game")).toEqual({ famille: "game" });
    expect(appartenance(" u_seb ")).toEqual({ famille: "joueur", id: "u_seb" });
  });

  it("se déduit de la planète : sans propriétaire = game", () => {
    expect(appartientPourPlanete(TERRE)).toBe(APPARTIENT_GAME);
    expect(appartientPourPlanete(ARAGONIA)).toBe("u_guillaume");
  });

  it("range le jeu, puis les joueurs, puis les modèles sans propriétaire", () => {
    expect(["", "u1", "game"].sort((a, b) => rangAppartenance(a) - rangAppartenance(b))).toEqual([
      "game",
      "u1",
      "",
    ]);
  });

  it("⚠️ réserve le pseudo « game », casse et espaces ignorés", () => {
    for (const p of ["game", "Game", " GAME "]) expect(pseudoReserve(p)).toBe(true);
    for (const p of ["", "gamer", "Samp", "le game"]) expect(pseudoReserve(p)).toBe(false);
  });
});

// ⚠️ RELEVÉ EN PROD (15/09) : une relation `maxSelect: 0` est SIMPLE, rendue en texte.
describe("une relation rendue en texte par PocketBase", () => {
  it("devient une liste", () => {
    expect(enListe("")).toEqual([]);
    expect(enListe("abc")).toEqual(["abc"]);
    expect(enListe(["a", ""])).toEqual(["a"]);
    expect(enListe(undefined)).toEqual([]);
  });

  it("ne s'ouvre plus par sous-chaîne", () => {
    const brut = { planetes_autorisees: "id_aragonia_bis" } as unknown as Partageable;
    expect(autoriseeSur(normaliserPartage(brut), ARAGONIA)).toBe(false);
    expect(avecPlanete(normaliserPartage(brut), ARAGONIA.id, true)).toEqual([
      "id_aragonia_bis",
      ARAGONIA.id,
    ]);
  });
});
