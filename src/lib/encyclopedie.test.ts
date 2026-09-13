// ============================================================
//  encyclopedie.test.ts
//  Le filet des TROIS SECTIONS LUES DANS LA BASE — posé le 2026-09-13.
//
//  ⚠️ POURQUOI CE FICHIER EXISTE. Le générateur ne rend qu'une chaîne : rien,
//  dans les types, ne dit qu'elle est du Markdown valide ni qu'elle raconte la
//  vérité. Une faute ici ne casse pas la page — elle écrit une phrase fausse
//  dans un document que quelqu'un lira dans trois mois pour savoir ce que le
//  jeu contient.
//
//  ⚠️ LE CATALOGUE DE DÉMONSTRATION PORTE EXPRÈS LES CAS TORDUS — brouillon,
//  règle ignorée, palier sans cycle, appro en erreur, code de ressource
//  disparu, âge déclaré mais vide, barre verticale dans un nom. Un jeu de
//  données propre serait vert quoi qu'on fasse : ce sont ces cas-là qui
//  décident si l'écran ment ou pas.
// ============================================================

import { describe, expect, it } from "vitest";
import { type Age } from "@/lib/ages";
import { extraireTitres } from "@/components/Markdown";
import { type Ressource } from "@/lib/ressources";
import { type Technologie } from "@/lib/technologies";
import {
  type Palier,
  type RegleAppro,
  type ReglePlacement,
  type Tuile,
  fluxVide,
  logistiqueVide,
  palierVide,
  productionVide,
  regleApproVide,
  regleVide,
} from "@/lib/tuiles";
import { type DonneesCatalogue, sectionsDuCatalogue } from "@/lib/encyclopedie";

/* --- Le catalogue de démonstration ---------------------------------- */

const LE_13_SEPTEMBRE = new Date(2026, 8, 13, 15, 2);

function ressource(code: string, nom: string, genre: Ressource["genre"], ordre: number): Ressource {
  return {
    id: `r-${code}`,
    collectionId: "c",
    collectionName: "ressources",
    code,
    nom,
    genre,
    ordre,
    chemin_icone: "",
    created: "",
    updated: "",
  };
}

function tuile(tileId: number, nom: string, reste: Partial<Tuile> = {}): Tuile {
  return {
    id: `t-${tileId}`,
    collectionId: "c",
    collectionName: "tuiles",
    tileId,
    nom,
    code: "",
    age: 0,
    chemin_icone: "",
    modele: "",
    typeOfPlateau: "ground",
    categorie: "",
    description: "",
    couleur: "",
    actif: true,
    tileId_apres_destruction: 0,
    indestructible: false,
    non_remplacable: false,
    placement: null,
    niveaux: null,
    logistique: null,
    created: "",
    updated: "",
    ...reste,
  };
}

function techno(code: string, nom: string, reste: Partial<Technologie> = {}): Technologie {
  return {
    id: `te-${code}`,
    collectionId: "c",
    collectionName: "technologies",
    code,
    nom,
    chemin_icone: "",
    batiment: 0,
    age: 0,
    ordre: 1,
    niveaux: 1,
    description: "",
    batiments_requis: [],
    technos_requises: [],
    debloque: [],
    debloque_technos: [],
    cout: { achat: [], entretien: [] },
    effets: [],
    created: "",
    updated: "",
    ...reste,
  };
}

function age(numero: number, nom: string, description = ""): Age {
  return {
    id: `a-${numero}`,
    collectionId: "c",
    collectionName: "ages",
    numero,
    nom,
    description,
    batiments_requis: [],
    created: "",
    updated: "",
  } as Age;
}

/** Le palier d'une habitation : elle paie, mobilise, mange et publie. */
function palierHabitation(): Palier {
  return {
    ...palierVide(1),
    duree_construction_s: 30,
    cycle_minutes: 2,
    cout: [
      { ressource: "bois", quantite: 80, mode: "paye" },
      { ressource: "habitant", quantite: 6, mode: "mobilise" },
    ],
    utilisation: [
      { ...fluxVide("ble"), quantite: 20 },
      { ...fluxVide("gibier"), quantite: 5, bonus: 20 },
      { ...fluxVide("eau"), quantite: 3, direct: true },
    ],
    production: [
      {
        ...productionVide("pain"),
        quantite: 60,
        indicateur: "satisfaction",
        tranches: [
          { seuil: 0, rendement: 80 },
          { seuil: 80, rendement: 100 },
        ],
      },
    ],
  };
}

/** Un palier fautif : il produit sans avoir déclaré son rythme. */
function palierSansCycle(): Palier {
  return {
    ...palierVide(1),
    cycle_minutes: 0,
    production: [{ ...productionVide("planche"), quantite: 4 }],
  };
}

function support(tileIds: number[]): ReglePlacement {
  return { ...regleVide("support"), base: "liste", tileIds };
}

const CATALOGUE: DonneesCatalogue = {
  ressources: [
    ressource("bois", "Bois", "stock", 1),
    ressource("ble", "Blé", "stock", 2),
    ressource("gibier", "Gibier", "stock", 3),
    ressource("eau", "Eau", "stock", 4),
    ressource("pain", "Pain", "stock", 5),
    ressource("planche", "Planche", "stock", 6),
    ressource("habitant", "Habitant", "mobilise", 7),
    ressource("monnaie", "Monnaie", "FluxStock", 8),
    ressource("satisfaction", "Satisfaction", "indicateur", 9),
    // ⚠️ Une barre verticale dans un nom : rien ne l'interdit en base.
    ressource("bizarre", "Tuyau | coude", "stock", 10),
    // ⚠️ Un genre jamais renseigné : le champ n'est pas requis.
    ressource("orphelin", "Orphelin", "", 11),
  ],
  tuiles: [
    tuile(1, "Herbe", { age: 0 }),
    tuile(12, "Cabane en bois", {
      age: 1,
      code: "cabane_bois",
      categorie: "Habitat, Confort",
      description: "Le premier toit.",
      tileId_apres_destruction: 1,
      niveaux: [palierHabitation()],
      placement: [support([1, 0]), { ...regleVide("gratuite"), offerts: 2 }],
      logistique: {
        ...logistiqueVide(),
        stockage: [
          { ressource: "*", max: 500 },
          { ressource: "habitant", max: 12 },
        ],
        appros: [{ ...regleApproVide("entrant"), rayon: 5, ressources: ["ble"] }],
      },
      expand: {
        modele: {
          id: "m1",
          collectionId: "c",
          collectionName: "tuile3dmodel",
          nom_prefab: "VERT_BLE",
          chemin_prefab: "Empire/Earth/Ground",
          section: "",
          section2: "",
          section3: "",
          section4: "",
          created: "",
          updated: "",
        },
      },
    }),
    tuile(13, "Scierie", {
      age: 1,
      actif: false,
      niveaux: [palierSansCycle()],
      // ⚠️ Une règle de pose inachevée : liste blanche vide.
      placement: [{ ...regleVide("support"), base: "liste", tileIds: [] }],
      logistique: {
        ...logistiqueVide(),
        stock_commun: true,
        stockage: [{ ressource: "planche", max: 40 }],
        appros: [
          // ⚠️ Une règle d'avant le 08/09 : ni `debit` ni `vitesse` en base.
          //    L'erreur n'est pas posée à la main — c'est la LECTURE qui la met.
          //    Le double cast dit exactement ça : ce que PocketBase rend n'est PAS
          //    encore une `RegleAppro`, c'est `logistiqueDe` qui la fabrique.
          { sens: "entrant", cible: "tout", tileIds: [], rayon: 3, ressources: [] } as unknown as RegleAppro,
          { ...regleApproVide("envoi") },
        ],
      },
    }),
    tuile(14, "Volcan", {
      age: 0,
      indestructible: true,
      non_remplacable: true,
      // ⚠️ Un coût qui cite un code de ressource disparu.
      niveaux: [
        // ⚠️ Il coûte, mais ne consomme ni ne produit : la base ne porte alors
        //    AUCUN cycle — `paliersPourEnregistrer` ne l'écrit pas.
        { ...palierVide(1), cout: [{ ressource: "obsidienne", quantite: 1, mode: "paye" }] },
      ],
    }),
  ],
  technologies: [
    techno("feu", "Le feu", { batiment: 12, age: 1, debloque_technos: ["metallurgie"] }),
    techno("metallurgie", "Métallurgie", {
      batiment: 12,
      age: 1,
      niveaux: 3,
      batiments_requis: [12],
      debloque: [13],
      cout: { achat: [{ ressource: "bois", quantite: 100 }], entretien: [{ ressource: "ble", par_minute: 2 }] },
      effets: [{ tuile: 12, ressource: "pain", valeur: 20, mode: "pourcentage" }],
    }),
    techno("brouillon", "Sans hôte"),
  ],
  // ⚠️ L'âge 2 est déclaré mais ne porte aucun bâtiment.
  ages: [age(1, "Les pionniers", "Le premier âge."), age(2, "Le secteur artisanal")],
};

const RENDU = sectionsDuCatalogue(CATALOGUE, LE_13_SEPTEMBRE);

/** La fiche d'un seul bâtiment ou d'une seule techno, jusqu'au titre suivant. */
function fiche(titre: string): string {
  const debut = RENDU.indexOf(titre);
  if (debut < 0) throw new Error(`fiche introuvable : ${titre}`);
  const suite = RENDU.slice(debut + titre.length);
  // ⚠️ S'arrêter à N'IMPORTE QUEL titre suivant, pas seulement à une autre
  //    fiche : la dernière d'une section avalerait sinon toute la suivante.
  const fin = suite.search(/\n#{1,4} /);
  return titre + (fin < 0 ? suite : suite.slice(0, fin));
}

/* --- Ce que le document doit dire ----------------------------------- */

describe("la place des sections dans le document", () => {
  it("ajoute quatre entrées au sommaire, et quatre seulement", () => {
    // ⚠️ L'ASSERTION QUI COMPTE : les 4 bâtiments et les 3 technos sont en
    // niveau 3-4, donc HORS sommaire. Les passer en niveau 2 rendrait le
    // filtre du sommaire inutilisable dès la centième tuile.
    expect(extraireTitres(RENDU, 2).map((t) => t.texte)).toEqual([
      "PARTIE IX — LE CONTENU RÉEL, LU DANS LA BASE",
      "Les ressources",
      "Les bâtiments",
      "Les technologies",
    ]);
  });

  it("n'ouvre jamais de bloc de code", () => {
    // ⚠️ Trois accents graves avaleraient TOUT le reste du document dans un
    // <pre> — et le sommaire s'arrêterait là, puisque `extraireTitres` saute
    // les lignes d'un bloc.
    expect(RENDU).not.toContain("```");
  });

  it("dit quand il a lu la base", () => {
    expect(RENDU).toContain("Lecture du 13/09/2026 à 15:02.");
  });

  it("compte les actives à part des brouillons", () => {
    expect(RENDU).toContain("| Bâtiments | 4 | **3 actifs**, 1 en brouillon |");
  });
});

describe("les ressources", () => {
  it("échappe une barre verticale, qui couperait la cellule en deux", () => {
    expect(RENDU).toContain("Tuyau \\| coude");
  });

  it("signale un genre jamais renseigné", () => {
    expect(RENDU).toMatch(/\| `orphelin` \| Orphelin \| ⚠️ non renseigné \|/);
  });

  it("dit lesquelles la navette porte", () => {
    expect(RENDU).toMatch(/\| `bois` \| Bois \| stock \|[^|]+\| oui \| 1 \|/);
    expect(RENDU).toMatch(/\| `habitant` \| Habitant \| mobilisé \|[^|]+\| non \| 7 \|/);
    expect(RENDU).toMatch(/\| `monnaie` \| Monnaie \| FluxStock \|[^|]+\| non \| 8 \|/);
  });
});

describe("un bâtiment", () => {
  it("porte son identité complète", () => {
    expect(RENDU).toContain("#### 12 — Cabane en bois");
    expect(RENDU).toContain("code `cabane_bois`");
    expect(RENDU).toContain("Âge 1 — Les pionniers");
    expect(RENDU).toContain("Habitat et Confort");
    expect(RENDU).toContain("modèle 3D `VERT_BLE`");
    expect(RENDU).toContain("destructible — la case redevient « Herbe »");
  });

  it("signale un brouillon, et seulement lui", () => {
    expect(RENDU).toContain("#### 13 — Scierie · brouillon");
    expect(RENDU).toContain("#### 12 — Cabane en bois\n");
    expect(RENDU).not.toContain("#### 12 — Cabane en bois · brouillon");
  });

  it("relit ses règles de pose avec les mots de l'écran d'admin", () => {
    expect(RENDU).toContain("Se pose seulement sur « case vide » ou « Herbe ».");
    expect(RENDU).toContain("Gratuite tant que le joueur en possède moins de 2");
    // La liste blanche vide de la Scierie : dite « ignorée », pas passée sous silence.
    expect(RENDU).toContain("Aucune tuile cochée — cette règle sera ignorée en jeu.");
  });

  it("distingue ce qui est payé de ce qui est mobilisé", () => {
    expect(RENDU).toContain("payé à la construction, et perdu — 80 « Bois »");
    expect(RENDU).toContain("mobilisé tant qu'il tourne, rendu par la veille — 6 « Habitant »");
  });

  it("écrit le rythme du cycle, le chantier et le mode de démarrage", () => {
    expect(RENDU).toContain("**Palier 1** — chantier 30 s · par cycle de 2 min · tout ou rien");
  });

  it("dit ce qu'une ligne bonus et une ligne en direct changent", () => {
    expect(RENDU).toContain("5 « Gibier » (bonus +20 % de satisfaction, ne bloque jamais le cycle)");
    expect(RENDU).toContain("3 « Eau » (en direct, sans navette)");
    // Le bonus monte le plafond de satisfaction : l'escalier doit pouvoir le viser.
    expect(RENDU).toContain("satisfaction jusqu'à 120 %");
  });

  it("écrit l'escalier d'une production dans l'ordre de lecture", () => {
    expect(RENDU).toContain(
      "60 « Pain », cadencé par « satisfaction » : à partir de 80 % → 100 %, à partir de 0 % → 80 %",
    );
  });

  it("remonte les erreurs de saisie d'un palier", () => {
    expect(RENDU).toContain("il consomme ou produit sans cycle");
  });

  it("signale un code de ressource qui n'existe plus", () => {
    expect(RENDU).toContain("`obsidienne` (⚠️ code inconnu)");
  });

  it("décrit le coffre, le stock commun et le transport", () => {
    expect(RENDU).toContain("n'importe quoi jusqu'à 500 et « Habitant » jusqu'à 12.");
    expect(RENDU).toContain("**Stock commun**");
    expect(RENDU).toContain("il récolte **et** il livre : c'est un entrepôt.");
    expect(RENDU).toContain("Prend « Blé » chez n'importe quelle tuile à 5 cases");
    expect(RENDU).toContain("⚠️ **erreur de saisie** — débit non renseigné en base");
  });

  it("n'invente pas de cycle pour un palier qui ne tourne pas", () => {
    // ⚠️ Annoncer « par cycle (durée non déclarée) » sur un bâtiment qui ne
    // consomme et ne produit rien inventerait une faute de saisie — et le
    // catalogue en compte beaucoup, toutes les cases de terrain payantes.
    expect(fiche("#### 14 — Volcan")).toContain("**Palier 1** — chantier immédiat\n");
    expect(fiche("#### 14 — Volcan")).not.toContain("cycle");
  });

  it("dit qu'une tuile figée ne se détruit ni ne se remplace", () => {
    expect(RENDU).toContain("figée : ni destruction, ni remplacement");
  });
});

describe("le rangement par âge", () => {
  it("garde un âge déclaré mais vide", () => {
    expect(RENDU).toContain("### Âge 2 — Le secteur artisanal — 0 bâtiment");
    expect(RENDU).toContain("Aucun bâtiment n'est rangé dans cet âge pour l'instant.");
  });

  it("met « sans âge » à la fin, après les âges numérotés", () => {
    expect(RENDU.indexOf("### sans âge")).toBeGreaterThan(RENDU.indexOf("### Âge 2"));
  });

  it("ne prête pas un palier à une case de terrain qui n'en a aucun", () => {
    // ⚠️ `paliersDe` en rend un vide — le défaut du formulaire. Affiché tel
    // quel, « Palier 1, chantier immédiat, cycle non déclaré » ferait passer
    // l'herbe pour une saisie ratée.
    expect(fiche("#### 1 — Herbe")).toContain("il ne coûte rien et ne fait rien (une case de terrain)");
    expect(fiche("#### 1 — Herbe")).not.toContain("Palier 1");
    // ⚠️ Mais la Scierie, elle, produit SANS cycle déclaré : là c'est une
    // vraie faute de saisie, et elle doit se voir.
    expect(fiche("#### 13 — Scierie · brouillon")).toContain("par cycle (durée non déclarée)");
  });
});

describe("une technologie", () => {
  it("dit où elle vit et combien de niveaux elle compte", () => {
    expect(RENDU).toContain("dans « Cabane en bois » (Habitat, Confort)");
    expect(RENDU).toContain("3 niveaux, et chacun repaie le coût");
  });

  it("lit la flèche des DEUX bouts", () => {
    // ⚠️ « Le feu » ne déclare aucun prérequis pour Métallurgie : c'est LUI qui
    // dit la débloquer. Lire `technos_requises` seul rendrait la moitié des
    // arêtes invisibles.
    expect(RENDU).toContain("avoir cherché « Le feu »");
  });

  it("écrit le coût d'acquisition et l'entretien séparément", () => {
    expect(RENDU).toContain("à l'acquisition : 100 « Bois » · entretien : 2 « Blé » par minute");
  });

  it("écrit ses effets en clair", () => {
    expect(RENDU).toContain("« Cabane en bois » produit +20 % de « Pain »");
  });

  it("signale une techno sans bâtiment hôte", () => {
    expect(RENDU).toContain("#### Sans hôte — `brouillon` · brouillon");
    expect(RENDU).toContain("⚠️ aucun bâtiment hôte");
  });

  it("prévient que le moteur n'applique ni l'entretien ni les effets", () => {
    expect(RENDU).toContain("ne sont pas appliqués par le moteur à cycles");
  });
});

describe("un catalogue vide", () => {
  it("rend quand même les trois sections, sans planter", () => {
    const vide = sectionsDuCatalogue(
      { ressources: [], tuiles: [], technologies: [], ages: [] },
      LE_13_SEPTEMBRE,
    );
    expect(extraireTitres(vide, 2)).toHaveLength(4);
    expect(vide).toContain("| Bâtiments | 0 |");
  });
});
