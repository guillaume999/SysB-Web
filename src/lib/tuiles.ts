/**
 * Catalogue de tuiles — ce que le joueur peut réellement poser sur un plateau.
 *
 * ⚠️ **REMISE À ZÉRO DU 2026-08-26**, puis reconstruction en cours. Le rôle
 * logistique reste retiré du site. Sont revenus : les **règles de pose**
 * (`support`, `limite`, `gratuite`) et les **paliers de coût** — voir plus bas.
 *
 * Les champs json `placement`, `niveaux` et `logistique` **ont été vidés en base
 * le 2026-08-26** sur les 25 tuiles du catalogue : plus rien ne subsiste, donc
 * plus rien n'agit en jeu sans écran pour le montrer. Le contenu des 3 seules
 * tuiles qui portaient autre chose qu'un palier vide est sauvegardé dans
 * `SysB/sauvegarde-tuiles-2026-08-26.json`, côté documentation.
 *
 * Ce qui a été retiré vit dans l'historique git (dernier commit avant le 26/08),
 * et le modèle qu'il portait est décrit en mémoire projet. Ne pas le réécrire
 * de tête.
 *
 * La grille est **hexagonale**, en offset odd-r pointy-top (cf.
 * `PlateauGenerator.CalculerPosition` : `x + (z impair ? 0.5 : 0)`, `z * 0.866`).
 * Une distance se mesure donc en distance hexagonale, pas en Chebyshev :
 *
 *     axial(x, z) = (x - (z - (z & 1)) / 2, z)
 *     dist = (|dq| + |dq + dr| + |dr|) / 2
 *
 * Un rayon r couvre 3r(r+1) cases autour du centre : 6 à r=1, 18 à r=2, 90 à r=5.
 */

import { pb } from "@/lib/pb";
import type { Modele3D, TypePlateau } from "@/lib/modeles3d";

export type { TypePlateau };

export const COLLECTION_TUILES = "tuiles";

/**
 * `tilesBase64` est un `byte[]` brut : un octet par case. L'id 0 est réservé à
 * la case vide côté `PlateauGenerator`, donc les tuiles vont de 1 à 255.
 */
export const TILE_ID_MIN = 1;
export const TILE_ID_MAX = 255;

// --- Placement : les règles de pose ----------------------------------------

/**
 * Reconstruit le 2026-08-26, à partir d'une page blanche. Trois types pour
 * l'instant : **`support`** (ce que la case porte), **`limite`** (combien on
 * peut en avoir) et **`gratuite`** (les premiers ne coûtent rien). Les autres —
 * le voisinage surtout — sont ajoutés au fur et à mesure : le tableau
 * `placement` les accueillera sans rien casser, puisque chaque règle porte son
 * champ `regle`.
 *
 * ⚠️ **Toutes les règles ne sont PAS de même nature.** `support` et `limite`
 * sont des CONDITIONS : elles disent oui ou non, et doivent toutes être vraies
 * en même temps (ET simple). `gratuite` ne conditionne rien — elle change le
 * PRIX. Côté Unity, les deux premières sont l'affaire de `PlacementValidator`,
 * la troisième celle de `CoutConstruction`, et le validateur doit **ignorer
 * explicitement** `gratuite` au lieu de la traiter en règle inconnue.
 */
export type TypeRegle = "support" | "limite" | "gratuite";

export const TYPES_REGLE: { valeur: TypeRegle; libelle: string; aide: string }[] = [
  { valeur: "support", libelle: "support", aide: "ce que la case elle-même doit porter" },
  { valeur: "limite", libelle: "limite", aide: "nombre maximum d'exemplaires sur le plateau" },
  { valeur: "gratuite", libelle: "gratuité", aide: "les premiers exemplaires sont offerts" },
];

/**
 * ⚠️ **La case vide est une valeur comme une autre : `0`.** C'est la convention
 * de `tilesBase64`, et elle se coche dans les listes au même titre qu'une tuile.
 *
 * Avant la remise à zéro, les zéros étaient écartés à la lecture — des deux
 * côtés — ce qui rendait « se construit seulement sur une case vide »
 * inexprimable. Ne jamais refiltrer les `0` d'une liste de tuiles citées.
 */
export const CASE_VIDE = 0;

/**
 * Comment la règle `support` décide.
 *
 * - `liste` : la case doit porter **l'une** des tuiles cochées. Le reste est
 *   refusé — une liste blanche contient déjà son « sauf ».
 * - `tout` : n'importe quelle case convient, **sauf** celles cochées dans
 *   `sauf`. C'est le seul cas où une exception a un sens.
 *
 * Les deux listes ne sont donc jamais utiles en même temps, et l'écran n'en
 * montre qu'une : celle qui correspond à la base choisie.
 */
export type BaseSupport = "liste" | "tout";

/** Sur quoi porte une `limite`. Voir le champ `portee`. */
export type PorteeLimite = "plateau" | "empire";

/** Vrai tant que le jeu ne sait pas compter sur tous les plateaux du joueur. */
export function porteePasEncoreAppliquee(r: ReglePlacement): boolean {
  return r.regle === "limite" && r.portee === "empire";
}

export interface ReglePlacement {
  regle: TypeRegle;
  // --- support ---
  base: BaseSupport;
  /** `base: "liste"` — les tuiles autorisées. `0` = la case vide. */
  tileIds: number[];
  /** `base: "tout"` — les tuiles interdites. `0` = la case vide. */
  sauf: number[];
  // --- limite ---
  /**
   * Nombre maximum d'exemplaires. `0` = pas de limite (la règle est alors
   * ignorée : un max de zéro rendrait la tuile impossible à poser, ce qui n'est
   * jamais une intention).
   */
  max: number;
  /**
   * Sur quoi porte le maximum.
   *
   * - `plateau` : sur le plateau courant. La colonie et la station comptent
   *   séparément, comme tout le reste du modèle. **C'est le seul cas qu'Unity
   *   sait appliquer aujourd'hui.**
   * - `empire` : tous plateaux confondus.
   *
   * ⚠️ **`empire` n'est PAS encore appliqué en jeu** — `PlacementValidator`
   * compte le seul plateau courant. Le champ est saisi et enregistré, mais
   * l'écran le dit en orange sous la règle : c'est la différence entre un champ
   * qui ment et un champ pas encore branché. **Retirer cet avertissement en
   * même temps que le rattrapage Unity, pas avant** — voir
   * [[feedback-filtre-nest-pas-regle]].
   */
  portee: PorteeLimite;
  // --- gratuite ---
  /**
   * Nombre d'exemplaires offerts. **Tant que le joueur en possède moins de
   * `offerts` sur ce plateau, la pose au palier 1 ne coûte rien.** `0` = jamais
   * gratuit.
   *
   * ⚠️ **Le compte est celui du MOMENT, pas un historique** : détruire son
   * dernier entrepôt rend le suivant à nouveau gratuit. C'est un filet de
   * sécurité, pas une promotion de bienvenue — sans ce ré-armement, un joueur
   * qui démolit son unique entrepôt resterait bloqué définitivement.
   *
   * ⚠️ **Palier 1 seulement** : poser est offert, améliorer se paie.
   *
   * ⚠️ Revenu sur la tuile le 2026-08-26, sur demande de l'utilisateur, APRÈS
   * en être parti le 24/08 (« une tuile est générique, la gratuité appartient
   * au scénario »). La gratuité portée par le modèle de plateau
   * (`amorcage.gratuites`) a été retirée en même temps : **il ne doit y en
   * avoir qu'une seule, sinon un jour la question « laquelle gagne ? ».**
   */
  offerts: number;
}

export function regleVide(regle: TypeRegle): ReglePlacement {
  return {
    regle,
    base: "liste",
    tileIds: [],
    sauf: [],
    max: regle === "limite" ? 1 : 0,
    portee: "plateau",
    offerts: regle === "gratuite" ? 1 : 0,
  };
}

/**
 * Un champ json jamais renseigné revient `null` de PocketBase, et un objet
 * ancien peut manquer une clé ajoutée depuis. On normalise à la lecture pour
 * que le reste du code n'ait jamais à se demander si une liste existe.
 */
export function normaliserRegle(r: Partial<ReglePlacement>): ReglePlacement {
  const liste = (v: unknown) =>
    Array.isArray(v) ? Array.from(new Set(v.filter((n) => typeof n === "number"))).sort((a, b) => a - b) : [];
  const entier = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0);
  const connu = (v: unknown): TypeRegle =>
    v === "limite" || v === "gratuite" ? v : "support";
  return {
    regle: connu(r.regle),
    base: r.base === "tout" ? "tout" : "liste",
    tileIds: liste(r.tileIds),
    sauf: liste(r.sauf),
    max: Math.max(0, entier(r.max)),
    portee: r.portee === "empire" ? "empire" : "plateau",
    offerts: Math.max(0, entier(r.offerts)),
  };
}

/**
 * Vrai si la règle dit réellement quelque chose. Une règle inutile est
 * **ignorée en jeu, pas bloquante** — et signalée en orange sur le site, avec
 * le même mot des deux côtés : « ignorée ».
 *
 * Une liste blanche vide interdirait tout, partout : c'est une saisie inachevée,
 * pas une règle de jeu. Une base « tout » sans exception n'interdit rien.
 */
export function regleUtile(r: ReglePlacement): boolean {
  if (r.regle === "gratuite") return r.offerts > 0;
  if (r.regle === "limite") return r.max > 0;
  return r.base === "liste" ? r.tileIds.length > 0 : r.sauf.length > 0;
}

/**
 * La règle relue en français. C'est là qu'une saisie malheureuse se voit — pas
 * dans le formulaire. La même phrase doit exister côté Unity, dans le message
 * de refus montré au joueur.
 */
export function decrireRegle(r: ReglePlacement, nomDe: (tileId: number) => string): string {
  const enumerer = (ids: number[], liaison: string) =>
    ids.map((id) => `« ${nomDe(id)} »`).join(` ${liaison} `);
  if (r.regle === "limite") {
    if (r.max <= 0)
      return "Aucun maximum — cette règle n'interdit rien, elle sera ignorée en jeu.";
    const ou = r.portee === "empire" ? "dans tout l'empire, tous plateaux confondus" : "sur ce plateau";
    return `Au plus ${r.max} exemplaire${r.max > 1 ? "s" : ""} ${ou}.`;
  }
  if (r.regle === "gratuite") {
    if (r.offerts <= 0)
      return "Aucun exemplaire offert — cette règle ne change rien, elle sera ignorée en jeu.";
    return (
      `Gratuite tant que le joueur en possède moins de ${r.offerts} sur ce plateau ` +
      "(pose au palier 1 seulement ; détruire ré-arme la gratuité)."
    );
  }
  if (r.base === "liste") {
    if (r.tileIds.length === 0) return "Aucune tuile cochée — cette règle sera ignorée en jeu.";
    return `Se pose seulement sur ${enumerer(r.tileIds, "ou")}.`;
  }
  if (r.sauf.length === 0) return "Aucune exception — cette règle n'interdit rien, elle sera ignorée en jeu.";
  return `Se pose n'importe où, sauf sur ${enumerer(r.sauf, "ni")}.`;
}

export function placementDe(tuile: { placement?: unknown }): ReglePlacement[] {
  const brutes = Array.isArray(tuile.placement) ? tuile.placement : [];
  return brutes
    .filter((r): r is Partial<ReglePlacement> => !!r && typeof r === "object")
    .map(normaliserRegle);
}

/**
 * Ce qui part en base. Les règles inutiles sont gardées telles quelles : les
 * jeter à l'enregistrement ferait disparaître sous les yeux de l'admin une
 * ligne qu'il était en train de remplir.
 */
export function placementPourEnregistrer(regles: ReglePlacement[]): ReglePlacement[] {
  return regles.map(normaliserRegle);
}

// --- Coûts : ce qu'une tuile demande, par palier ----------------------------

/**
 * Reconstruit le 2026-08-26 après la page blanche, sur trois décisions de
 * l'utilisateur prises le même jour :
 *
 * 1. **Les paliers tout de suite**, mais **tout dans un seul onglet « Coût »** —
 *    pas un onglet par sujet.
 * 2. **Deux modes de coût seulement.** Le troisième, `requis` (vérifié sans être
 *    prélevé), est **supprimé** : une seule tuile s'en servait, en doublon d'un
 *    `mobilisé` identique. Ne pas le réintroduire sans raison neuve.
 * 3. **La veille rend TOUT ce qui est mobilisé**, sans réglage par ligne. Le
 *    drapeau `libere_si_inactif` de l'ancien modèle a disparu avec lui.
 */
export type ModeCout = "paye" | "mobilise";

export const MODES_COUT: { valeur: ModeCout; libelle: string; aide: string }[] = [
  { valeur: "paye", libelle: "payé", aide: "prélevé du stock et perdu" },
  {
    valeur: "mobilise",
    libelle: "mobilisé",
    aide: "retenu tant que le bâtiment vit ; rendu à la destruction ET en veille",
  },
];

export interface LigneCout {
  ressource: string;
  quantite: number;
  mode: ModeCout;
}

/**
 * Un débit dans le temps. Volontairement `{quantite, periode_s}` et **jamais un
 * taux décimal** : la progression hors ligne se recalcule en multipliant des
 * entiers, sans dérive d'arrondi sur douze heures.
 *
 * ⚠️ **Garder la MÊME `periode_s` partout** (120 s avait été retenu) : le
 * ralenti de satisfaction est exact à 1 unité près avec une période commune, à
 * 3–4 quand elles sont mélangées.
 */
export interface LigneFlux {
  ressource: string;
  quantite: number;
  periode_s: number;
}

/**
 * Un palier de la tuile. Le champ `niveau` est **explicite en plus** de la
 * position dans le tableau : un réordonnancement accidentel se voit alors, au
 * lieu de tout décaler en silence.
 *
 * `cout` = une fois, à la construction. `utilisation` = tant que le bâtiment
 * tourne.
 */
export interface Palier {
  niveau: number;
  /** À la construction, une fois. */
  cout: LigneCout[];
  /** Pendant qu'il tourne. Rien n'est prélevé quand il est en veille. */
  utilisation: LigneFlux[];
}

/** Période par défaut d'un flux, en secondes. Voir l'avertissement de `LigneFlux`. */
export const PERIODE_PAR_DEFAUT = 120;

export function palierVide(numero: number): Palier {
  return { niveau: numero, cout: [], utilisation: [] };
}

/**
 * ⚠️ **La règle de veille, écrite à un seul endroit.** Mettre un bâtiment en
 * veille (`EtatCase.actif = false`) :
 *
 * - **rend tout ce qu'il mobilise** — les ouvriers d'abord ;
 * - **arrête sa consommation** : plus rien de son `utilisation` n'est prélevé ;
 * - **arrête sa production**.
 *
 * Ce qui a été **payé** ne revient jamais, ni en veille ni à la destruction.
 *
 * C'est le joueur qui décide, et lui seul : la pénurie fait **ralentir** au
 * prorata (voir la satisfaction), elle n'éteint rien. Un problème, un
 * mécanisme.
 */
export function rendEnVeille(p: Palier): LigneCout[] {
  return p.cout.filter((l) => l.mode === "mobilise");
}

/** Vrai si mettre cette tuile en veille change quelque chose. */
export function peutSeMettreEnVeille(paliers: Palier[]): boolean {
  return paliers.some((p) => rendEnVeille(p).length > 0 || p.utilisation.length > 0);
}

export function paliersDe(tuile: { niveaux?: unknown }): Palier[] {
  const bruts = Array.isArray(tuile.niveaux) ? tuile.niveaux : [];
  if (bruts.length === 0) return [palierVide(1)];
  return bruts.map((n, i) => normaliserPalier(n, i + 1));
}

export function normaliserPalier(n: unknown, position: number): Palier {
  const o = (n ?? {}) as Partial<Palier>;
  const entier = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0);
  return {
    niveau: entier(o.niveau) || position,
    cout: Array.isArray(o.cout)
      ? o.cout.map((l) => ({
          ressource: typeof l?.ressource === "string" ? l.ressource : "",
          quantite: Math.max(0, entier(l?.quantite)),
          mode: l?.mode === "mobilise" ? "mobilise" : "paye",
        }))
      : [],
    utilisation: Array.isArray(o.utilisation)
      ? o.utilisation.map((l) => ({
          ressource: typeof l?.ressource === "string" ? l.ressource : "",
          quantite: Math.max(0, entier(l?.quantite)),
          periode_s: Math.max(1, entier(l?.periode_s) || PERIODE_PAR_DEFAUT),
        }))
      : [],
  };
}

/**
 * Renumérotation de sécurité avant l'envoi : la position dans le tableau et le
 * champ `niveau` restent d'accord. Les lignes sans ressource sont écartées —
 * le jeu les ignorerait, autant ne pas laisser croire qu'elles agissent.
 */
export function paliersPourEnregistrer(paliers: Palier[]): Palier[] {
  return paliers.map((p, i) => ({
    niveau: i + 1,
    cout: p.cout.filter((l) => l.ressource !== "" && l.quantite > 0),
    utilisation: p.utilisation.filter((l) => l.ressource !== "" && l.quantite > 0),
  }));
}

/** Résumé d'une durée en secondes, pour l'affichage. */
export function formatDuree(secondes: number): string {
  if (!secondes) return "immédiat";
  if (secondes < 60) return `${secondes} s`;
  if (secondes < 3600) return `${Math.round(secondes / 60)} min`;
  return `${(secondes / 3600).toFixed(1).replace(".0", "")} h`;
}

// --- Le record --------------------------------------------------------------

export type Tuile = {
  id: string;
  collectionId: string;
  collectionName: string;
  tileId: number;
  nom: string;
  /** Id du record `tuile3dmodel`. */
  modele: string;
  typeOfPlateau: TypePlateau;
  categorie: string;
  description: string;
  /**
   * Couleur de la tuile sur la grille de l'editeur, en `#rrggbb`.
   * Vide = la couleur automatique deduite du tileId.
   */
  couleur: string;
  actif: boolean;
  /**
   * tileId laisse sur la case quand cette tuile est detruite.
   * `0` = case vide, la meme convention que dans `tilesBase64`.
   */
  tileId_apres_destruction: number;
  /**
   * `true` = le joueur ne peut pas detruire cette tuile. Le champ
   * `tileId_apres_destruction` devient alors sans objet.
   */
  indestructible: boolean;
  /**
   * `true` = on ne peut pas non plus poser une autre tuile a sa place.
   * N'a de sens qu'avec `indestructible` : c'est le cran au-dessus.
   *
   * Les deux sont **negatifs** a dessein : un booleen PocketBase vaut `false`
   * par defaut, donc toutes les tuiles deja en base restent destructibles et
   * remplacables sans migration.
   */
  non_remplacable: boolean;
  /** Les règles de pose. Reconstruites depuis le 26/08 — voir `ReglePlacement`. */
  placement: ReglePlacement[] | null;
  /** Les paliers de coût. Reconstruits depuis le 26/08 — voir `Palier`. */
  niveaux: Palier[] | null;
  /*
   * ⚠️ `logistique` existe encore comme colonne json sur la collection, mais
   * elle est VIDE et ce type ne la declare pas. La redeclarer, c'est se
   * redonner le droit de la lire a moitie.
   */
  created: string;
  updated: string;
  expand?: { modele?: Modele3D };
};

/**
 * Ce que le formulaire renvoie — l'identite, et rien d'autre.
 *
 * ⚠️ `logistique` n'y est **volontairement pas** : une cle absente n'est pas
 * envoyee a PocketBase, donc le champ reste vide tant que son ecran n'existe
 * pas. `placement` et `niveaux` y sont revenus le 26/08, quand leurs onglets
 * ont ete refaits.
 */
export interface ValeursTuile {
  tileId: number;
  nom: string;
  modele: string;
  typeOfPlateau: TypePlateau;
  categorie: string;
  description: string;
  couleur: string;
  actif: boolean;
  tileId_apres_destruction: number;
  indestructible: boolean;
  non_remplacable: boolean;
  placement: ReglePlacement[];
  niveaux: Palier[];
}

// --- Destruction -------------------------------------------------------------

/**
 * Les trois etats possibles d'une tuile face au joueur qui veut liberer la case.
 * Une seule fonction pour que la liste, le formulaire et le jeu disent la meme
 * chose a partir des deux booleens.
 */
export type Contrainte = "destructible" | "indestructible" | "figee";

export function contrainteDe(tuile: {
  indestructible?: boolean;
  non_remplacable?: boolean;
}): Contrainte {
  if (!tuile.indestructible) return "destructible";
  return tuile.non_remplacable ? "figee" : "indestructible";
}

// --- Chargement et helpers --------------------------------------------------

export function loadTuiles(): Promise<Tuile[]> {
  return pb.collection(COLLECTION_TUILES).getFullList<Tuile>({ sort: "tileId", expand: "modele" });
}

/**
 * Prochain id à proposer : **max + 1**, pas le plus petit trou libre.
 * Un `tileId` ne doit jamais être recyclé : une règle de placement qui citait
 * l'ancienne tuile pointerait silencieusement vers la nouvelle.
 */
export function prochainTileId(tuiles: Tuile[]): number | null {
  const max = tuiles.reduce((m, t) => Math.max(m, t.tileId ?? 0), 0);
  const suivant = Math.max(max + 1, TILE_ID_MIN);
  return suivant > TILE_ID_MAX ? null : suivant;
}

/** Tuiles regroupées par modèle 3D, pour afficher les réutilisations. */
export function tuilesParModele(tuiles: Tuile[]): Map<string, Tuile[]> {
  const index = new Map<string, Tuile[]>();
  for (const tuile of tuiles) {
    const liste = index.get(tuile.modele);
    if (liste) liste.push(tuile);
    else index.set(tuile.modele, [tuile]);
  }
  return index;
}

/**
 * Nombre de cases couvertes par un rayon sur une grille hexagonale : 3r(r+1).
 * Utilisé par le pinceau de l'éditeur de plateaux — il survit donc à la remise
 * à zéro des règles de pose.
 */
export function casesCouvertes(rayon: number): number {
  return 3 * rayon * (rayon + 1);
}

/**
 * Tuiles dont une règle de placement cite `tileId`, dans un sens ou dans
 * l'autre. Sert de garde-fou : supprimer une tuile référencée casserait ces
 * règles en silence.
 */
export function tuilesCitant(tuiles: Tuile[], tileId: number): Tuile[] {
  return tuiles.filter((t) =>
    placementDe(t).some((r) => r.tileIds.includes(tileId) || r.sauf.includes(tileId)),
  );
}

// --- Couleurs ---------------------------------------------------------------

/**
 * Couleur de repli, deduite du `tileId` et de lui seul.
 *
 * L'angle d'or en degres repartit les teintes sans jamais retomber juste : deux
 * tuiles creees a la suite ne se ressemblent pas, et une tuile garde sa couleur
 * d'une session a l'autre puisqu'un `tileId` n'est jamais recycle.
 *
 * Le resultat est en `#rrggbb` plutot qu'en `hsl()` : c'est le seul format
 * qu'accepte `<input type="color">`, qui doit pouvoir afficher la couleur
 * effective d'une tuile meme quand le catalogue ne dit rien.
 */
export function couleurAuto(tileId: number): string {
  return hslVersHex((tileId * 137.508) % 360, 0.55, 0.45);
}

/** Couleur retenue : celle du catalogue si elle est renseignee, sinon l'automatique. */
export function couleurDe(tuile: { tileId: number; couleur?: string }): string {
  const choisie = tuile.couleur?.trim();
  return choisie ? choisie : couleurAuto(tuile.tileId);
}

/** Vrai pour `#rrggbb` et pour la chaine vide — ce qu'accepte le champ en base. */
export function couleurValide(valeur: string): boolean {
  return /^(#[0-9a-fA-F]{6})?$/.test(valeur.trim());
}

function hslVersHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const canal = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const octet = (n: number) =>
    Math.round(canal(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${octet(0)}${octet(8)}${octet(4)}`;
}
