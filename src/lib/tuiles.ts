/**
 * Catalogue de tuiles — ce que le joueur peut réellement poser sur un plateau.
 *
 * ⚠️ **REMISE À ZÉRO DU 2026-08-26**, puis reconstruction en cours. Le rôle
 * logistique reste retiré du site. Sont revenus : les **règles de pose**
 * (`support`, `limite`, `gratuite`, puis `batiments` et `technologie` le
 * 2026-08-28) et les **paliers de coût** — voir plus bas.
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

/**
 * Une liste de tileIds venue de la base : dédoublonnée, triée, sans zéro ni
 * valeur non numérique.
 *
 * ⚠️ Vit ici plutôt que dans `technologies.ts`, où elle est née le 27/08 : les
 * âges désignent eux aussi des bâtiments par tileId, et deux nettoyages
 * légèrement différents finiraient par diverger.
 */
export function tileIdsDe(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return Array.from(
    new Set(
      v
        .map((x) => (typeof x === "number" && Number.isFinite(x) ? Math.trunc(x) : 0))
        .filter((n) => n > 0),
    ),
  ).sort((a, b) => a - b);
}

// --- Placement : les règles de pose ----------------------------------------

/**
 * Reconstruit le 2026-08-26, à partir d'une page blanche. Cinq types :
 * **`support`** (ce que la case porte), **`limite`** (combien on peut en
 * avoir), **`gratuite`** (les premiers ne coûtent rien), et depuis le
 * 2026-08-28 **`batiments`** (il faut déjà en posséder N d'un type) et
 * **`technologie`** (il faut avoir cherché, jusqu'à un niveau). Les autres —
 * le voisinage d'une case, surtout — sont ajoutés au fur et à mesure : le
 * tableau `placement` les accueille sans rien casser, puisque chaque règle
 * porte son champ `regle`.
 *
 * ⚠️ Le voisinage d'une CONSOMMATION, lui, n'est pas ici : il vit sur la ligne
 * de consommation, en `Proximite` — voir `LigneFlux`.
 *
 * ⚠️ **Toutes les règles ne sont PAS de même nature.** `support` et `limite`
 * sont des CONDITIONS : elles disent oui ou non, et doivent toutes être vraies
 * en même temps (ET simple). `gratuite` ne conditionne rien — elle change le
 * PRIX. Côté Unity, les deux premières sont l'affaire de `PlacementValidator`,
 * la troisième celle de `CoutConstruction`, et le validateur doit **ignorer
 * explicitement** `gratuite` au lieu de la traiter en règle inconnue.
 */
export type TypeRegle = "support" | "limite" | "gratuite" | "batiments" | "technologie";

export const TYPES_REGLE: { valeur: TypeRegle; libelle: string; aide: string }[] = [
  { valeur: "support", libelle: "support", aide: "ce que la case elle-même doit porter" },
  { valeur: "limite", libelle: "limite", aide: "nombre maximum d'exemplaires sur le plateau" },
  { valeur: "gratuite", libelle: "gratuité", aide: "les premiers exemplaires sont offerts" },
  {
    valeur: "batiments",
    libelle: "bâtiments requis",
    aide: "il faut déjà posséder N exemplaires d'un type de bâtiment",
  },
  {
    valeur: "technologie",
    libelle: "technologie requise",
    aide: "il faut avoir cherché une technologie, jusqu'à un niveau donné",
  },
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

/**
 * Ce qu'une règle est **enregistrée mais pas encore capable de faire en jeu**,
 * en une phrase — chaîne vide quand tout est branché.
 *
 * ⚠️ **C'est la différence entre un champ pas encore branché et un champ qui
 * ment.** Un champ saisi, affiché et jamais vérifié au moment d'agir est le
 * piège qu'on s'est déjà tendu deux fois : ici il l'annonce, sous la règle, au
 * moment où l'admin le choisit.
 *
 * ⚠️ **Retirer chaque phrase le jour où le mécanisme existe, jamais avant.**
 * A remplacé `porteePasEncoreAppliquee()` le 2026-08-28, qui ne portait que le
 * cas `empire` : même rôle, trois cas.
 */
export function pasEncoreAppliqueeEnJeu(r: ReglePlacement): string {
  if (r.regle === "limite" && r.portee === "empire")
    return (
      "« dans tout l'empire » est enregistré mais pas encore appliqué en jeu : le jeu compte " +
      "pour l'instant le seul plateau où tu poses."
    );
  if (r.regle === "batiments")
    return (
      "Enregistré mais pas encore appliqué en jeu : le jeu ne regarde pas encore ce que tu " +
      "possèdes déjà avant de laisser poser."
    );
  if (r.regle === "technologie")
    return (
      "Enregistré mais pas encore appliqué en jeu : le jeu ne lit pas encore la collection des " +
      "technologies — rien ne sait si une recherche est acquise, ni à quel niveau."
    );
  return "";
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
  // --- batiments (28/08) ---
  /**
   * `tileId` du bâtiment qu'il faut **déjà posséder** pour pouvoir poser
   * celui-ci. `0` = aucun choisi, la règle est ignorée.
   *
   * ⚠️ **Un seul type par règle**, choix de l'utilisateur le 2026-08-28 :
   * *« plusieurs règles, chaque règle un type, un nombre »*. « 3 fermes ET
   * 2 moulins » s'écrit donc en deux règles — et non en une liste cochée avec
   * un nombre commun, qui aurait laissé ambigu si le nombre valait par type ou
   * au total.
   *
   * ⚠️ Contrairement au `support`, **`0` n'est pas la case vide ici** : une
   * case vide ne se construit pas, on ne peut pas en « posséder trois ». Le
   * sélecteur ne la propose pas.
   */
  batiment: number;
  /** Combien d'exemplaires de `batiment` il faut posséder. `0` = règle ignorée. */
  nombre: number;
  // --- technologie (28/08) ---
  /**
   * `code` de la technologie qu'il faut avoir cherchée. Vide = règle ignorée.
   *
   * ⚠️ Par `code`, comme `technos_requises` dans `technologies` : le code est
   * ce que l'utilisateur fixe une fois, un id PocketBase ne survivrait pas à
   * une base recréée.
   */
  techno: string;
  /**
   * Niveau **minimal** de cette technologie. `1` = il suffit de l'avoir.
   *
   * Une techno déclare son nombre de niveaux dans l'onglet Technologie
   * (`technologies.niveaux`) ; en demander plus rendrait la tuile impossible à
   * poser, et l'écran le dit en orange.
   */
  niveau: number;
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
    batiment: 0,
    nombre: regle === "batiments" ? 1 : 0,
    techno: "",
    niveau: regle === "technologie" ? 1 : 0,
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
    v === "limite" || v === "gratuite" || v === "batiments" || v === "technologie" ? v : "support";
  return {
    regle: connu(r.regle),
    base: r.base === "tout" ? "tout" : "liste",
    tileIds: liste(r.tileIds),
    sauf: liste(r.sauf),
    max: Math.max(0, entier(r.max)),
    portee: r.portee === "empire" ? "empire" : "plateau",
    offerts: Math.max(0, entier(r.offerts)),
    batiment: Math.max(0, entier(r.batiment)),
    nombre: Math.max(0, entier(r.nombre)),
    techno: typeof r.techno === "string" ? r.techno : "",
    niveau: Math.max(0, entier(r.niveau)),
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
  if (r.regle === "batiments") return r.batiment > 0 && r.nombre > 0;
  if (r.regle === "technologie") return r.techno !== "";
  return r.base === "liste" ? r.tileIds.length > 0 : r.sauf.length > 0;
}

/**
 * La règle relue en français. C'est là qu'une saisie malheureuse se voit — pas
 * dans le formulaire. La même phrase doit exister côté Unity, dans le message
 * de refus montré au joueur.
 */
export function decrireRegle(
  r: ReglePlacement,
  nomDe: (tileId: number) => string,
  /** Le nom d'une techno d'après son `code`. Par défaut le code lui-même. */
  nomTechno: (code: string) => string = (c) => c,
): string {
  const enumerer = (ids: number[], liaison: string) =>
    ids.map((id) => `« ${nomDe(id)} »`).join(` ${liaison} `);
  if (r.regle === "batiments") {
    if (r.batiment <= 0)
      return "Aucun bâtiment choisi — cette règle n'exige rien, elle sera ignorée en jeu.";
    if (r.nombre <= 0)
      return "Aucun nombre demandé — cette règle n'exige rien, elle sera ignorée en jeu.";
    return (
      `Il faut déjà posséder ${r.nombre} « ${nomDe(r.batiment)} » sur ce plateau ` +
      "pour pouvoir poser celle-ci."
    );
  }
  if (r.regle === "technologie") {
    if (r.techno === "")
      return "Aucune technologie choisie — cette règle n'exige rien, elle sera ignorée en jeu.";
    const n = Math.max(1, r.niveau);
    return (
      `Il faut avoir cherché « ${nomTechno(r.techno)} »` +
      (n > 1 ? `, au moins jusqu'au niveau ${n}.` : ".")
    );
  }
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
 *
 *    ⚠️ Le 26/08 aussi, remarque de l'utilisateur : *« pendant qu'il tourne, ne
 *    consomme pas mais occupe X de pop »*. Le mode n'est donc plus un menu
 *    déroulant : **c'est la SECTION de l'écran qui le porte**. `paye` vit sous
 *    « à la construction », `mobilise` sous « pendant qu'il tourne ». Un
 *    ouvrier n'est pas dépensé à la construction, il est occupé tant que ça
 *    tourne — l'écran doit le dire avant que l'utilisateur ait à le déduire.
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
/**
 * **La règle de proximité d'une consommation** — demandée le 2026-08-28 :
 * *« 10 bovin × 120 s × (besoin de 5 tuiles bovin à 2 rayon = 100 %) »*.
 *
 * Elle dit combien de bâtiments d'un type il faut **autour de la tuile** pour
 * que la ligne tourne à plein. C'est ce qui attache un abattoir à ses
 * pâturages : posé tout seul, il n'a rien à abattre.
 *
 * ⚠️ **Au prorata, jamais tout-ou-rien** (choix de l'utilisateur le 28/08) :
 * 3 tuiles à portée sur les 5 demandées valent **60 %**. Un seuil brutal
 * rendrait la 4ᵉ tuile inutile, et le reste du modèle compte déjà partout au
 * prorata.
 *
 * ⚠️ **Le facteur porte sur la ligne, pas sur le stock.** Pour le moteur : la
 * ligne ne **demande** plus que `quantite × facteur` — 6 bovins au lieu de
 * 10 — et sa contribution à la couverture de la tuile se calcule **sur les 10
 * nominaux**, donc la tuile plafonne à 60 %. Sans cette seconde moitié, une
 * ligne servie à plein de sa demande réduite donnerait 100 % de production avec
 * 3 pâturages : la règle ne servirait à rien.
 *
 * ⚠️ **Rien n'est appliqué en jeu aujourd'hui** — le moteur ne regarde pas le
 * voisinage. L'écran le dit en orange sous la ligne ; retirer l'avertissement
 * avec le mécanisme, pas avant.
 */
export interface Proximite {
  /**
   * `tileId` du bâtiment qu'il faut avoir autour. `0` = aucun choisi.
   *
   * ⚠️ **Pas de case vide ici**, contrairement aux règles de `support` : on
   * compte des bâtiments construits, pas du terrain.
   */
  tileId: number;
  /** Combien il en faut à portée pour valoir 100 %. `0` = pas de règle. */
  nombre: number;
  /**
   * Rayon en cases, sur la grille **hexagonale** (voir l'en-tête du fichier) :
   * un rayon r couvre 3r(r+1) cases autour du centre.
   */
  rayon: number;
}

/** Le défaut proposé par « + proximité » : les chiffres de l'exemple. */
export function proximiteParDefaut(): Proximite {
  return { tileId: 0, nombre: 5, rayon: 2 };
}

/** Aucune proximité du tout — ce que le « × » remet sur la ligne. */
export function proximiteVide(): Proximite {
  return { tileId: 0, nombre: 0, rayon: 0 };
}

/** Vrai si l'admin a commencé à en poser une : c'est ce qui affiche le bloc. */
export function proximitePosee(p: Proximite): boolean {
  return p.tileId > 0 || p.nombre > 0 || p.rayon > 0;
}

/** Vrai si elle est complète, donc si elle agirait. Sinon : ignorée, en orange. */
export function proximiteUtile(p: Proximite): boolean {
  return p.tileId > 0 && p.nombre > 0 && p.rayon > 0;
}

/**
 * Ce que vaut la ligne, en %, avec `presentes` bâtiments à portée. Plafonné à
 * 100 : en avoir huit quand cinq suffisent ne fait pas produire davantage.
 */
export function pourcentageProximite(p: Proximite, presentes: number): number {
  if (!proximiteUtile(p)) return 100;
  return Math.min(100, Math.round((Math.max(0, presentes) * 100) / p.nombre));
}

export interface LigneFlux {
  ressource: string;
  quantite: number;
  periode_s: number;
  /**
   * **Part de satisfaction couverte par cette consommation**, en pourcentage.
   * `0` = consommation ordinaire, elle ne produit pas de satisfaction.
   *
   * Modèle de l'utilisateur, avec ses chiffres (26/08) :
   * *« je consomme 20 nourriture / 120 s = 100 % satisfaction ; si ça ne
   * consomme que 15 car pas assez de stock : satisfaction à 75 %. Plus on
   * ajoute d'autres consommations : je consomme 10 de pierre / 120 s =
   * satisfaction +10 % »*.
   *
   * Donc, ligne par ligne : `part × (reçu / demandé)`, et on additionne.
   * 15 nourriture sur 20 demandées, part 100 % → **75 %**.
   * En ajoutant 10 pierre servies à plein, part 10 % → 75 + 10 = **85 %**.
   *
   * ⚠️ Ce champ avait été posé puis retiré le 26/08 (il encombrait l'onglet
   * Coût). Il est revenu le même jour, l'utilisateur ayant redonné le modèle
   * avec ses chiffres. **Ne pas le re-retirer sans le remplacer.**
   */
  part: number;
  /**
   * **La règle de proximité**, facultative — voir `Proximite`. Un
   * `proximiteVide()` (tout à zéro) veut dire « pas de règle », et c'est le cas
   * normal : la plupart des consommations n'en ont pas.
   */
  proximite: Proximite;
}

export function fluxVide(ressource: string): LigneFlux {
  return {
    ressource,
    quantite: 1,
    periode_s: PERIODE_PAR_DEFAUT,
    part: 0,
    proximite: proximiteVide(),
  };
}

/**
 * Un palier de la tuile. Le champ `niveau` est **explicite en plus** de la
 * position dans le tableau : un réordonnancement accidentel se voit alors, au
 * lieu de tout décaler en silence.
 *
 * `cout` = une fois, à la construction. `utilisation` = tant que le bâtiment
 * tourne.
 */
/**
 * Un **cran** de l'escalier de rendement : « à partir de `seuil` %
 * d'indicateur, la ligne rend `rendement` % de son débit ».
 *
 * ⚠️ Seul le **seuil bas** se saisit. Le haut est celui de la tranche du
 * dessus, ou 100. C'est ce qui rend impossible un trou entre deux tranches, ou
 * un recouvrement — deux fautes qui feraient dépendre le résultat de l'ordre de
 * lecture, et donc diverger le site et le jeu.
 */
export interface Tranche {
  /** Valeur de l'indicateur, en %, à partir de laquelle cette tranche vaut. */
  seuil: number;
  /** Ce que la ligne rend dans cette tranche, en % de son débit déclaré. */
  rendement: number;
}

/**
 * Les deux tranches de l'exemple de l'utilisateur, proposées quand il ajoute un
 * indice : *« 60 nourriture × 100 % par 120 s pour satisfaction 100–80 %,
 * 60 × 80 % pour satisfaction 80–0 % »*.
 */
export const TRANCHES_PAR_DEFAUT: Tranche[] = [
  { seuil: 80, rendement: 100 },
  { seuil: 0, rendement: 80 },
];

/**
 * ⚠️ **QUAND l'indicateur est lu**, question posée par l'utilisateur le 26/08 :
 * *« ça prendra l'indice de la période d'avant pour calculer le rendement ? »*.
 *
 * La boucle **a l'air** circulaire : l'habitation consomme la nourriture →
 * produit la satisfaction → la satisfaction freine la ferme → la ferme produit
 * la nourriture. Mais elle se défait par l'**ordre**, parce que la consommation
 * ne dépend d'aucun indicateur. Dans une passe du moteur :
 *
 * 1. toutes les tuiles consomment — chacune mémorise sa satisfaction ;
 * 2. on calcule les indicateurs du plateau ;
 * 3. toutes les tuiles produisent, avec la valeur qu'on vient d'établir.
 *
 * Pas de période précédente, donc — ce serait moins bon : une nuit sans vivres
 * résolue en une seule passe produirait à plein régime, puisque personne
 * n'aurait eu le temps d'avoir faim.
 */
export const INDICE_LU = "après la consommation de la passe, avant la production";

/**
 * Valeur d'un indicateur avant qu'une seule habitation existe. **100, pas 0** :
 * une colonie neuve démarrerait sinon à rendement minimal, sans jamais pouvoir
 * construire de quoi remonter — la spirale du 25/08 dès la première seconde.
 */
export const INDICE_AU_DEMARRAGE = 100;

/** Tranches du haut vers le bas, seuils bornés et entiers. Ordre de lecture unique. */
export function tranchesTriees(tranches: Tranche[]): Tranche[] {
  return [...tranches]
    .map((t) => ({
      seuil: Math.min(100, Math.max(0, Math.trunc(t?.seuil || 0))),
      rendement: Math.min(100, Math.max(0, Math.trunc(t?.rendement || 0))),
    }))
    .sort((a, b) => b.seuil - a.seuil);
}

/**
 * Le rendement, en %, pour une valeur d'indicateur donnée.
 *
 * ⚠️ Aucune tranche atteinte = **la plus basse**, jamais 100. Sinon une
 * satisfaction catastrophique rendrait la production maximale, exactement le
 * contraire de l'intention. Liste vide = 100 : rien ne freine.
 */
export function rendementPourIndicateur(tranches: Tranche[], valeur: number): number {
  const triees = tranchesTriees(tranches);
  if (triees.length === 0) return 100;
  for (const t of triees) if (valeur >= t.seuil) return t.rendement;
  return triees[triees.length - 1].rendement;
}

/**
 * Vrai si l'escalier descend jusqu'à 0. Sinon la tranche la plus basse
 * s'applique quand même en dessous de son seuil, et l'écran doit le dire — un
 * champ qui ment ne dit rien.
 */
export function tranchesCouvrentZero(tranches: Tranche[]): boolean {
  const triees = tranchesTriees(tranches);
  return triees.length === 0 || triees[triees.length - 1].seuil === 0;
}

/** Deux tranches au même seuil : le résultat dépendrait de l'ordre. À signaler. */
export function seuilsEnDouble(tranches: Tranche[]): boolean {
  const seuils = tranchesTriees(tranches).map((t) => t.seuil);
  return new Set(seuils).size !== seuils.length;
}

function normaliserTranches(l: unknown): Tranche[] {
  const o = l as { tranches?: unknown; rendement?: unknown };
  if (Array.isArray(o?.tranches)) return tranchesTriees(o.tranches as Tranche[]);
  // Lecture des enregistrements du matin : un `rendement` seul devient une
  // tranche unique a seuil 0, soit exactement le plafond fixe qu'il etait.
  const ancien = Math.min(100, Math.max(0, Math.trunc(Number(o?.rendement) || 0)));
  return ancien > 0 ? [{ seuil: 0, rendement: ancien }] : [];
}

/**
 * Une ligne de PRODUCTION : ce que la tuile fabrique pendant qu'elle tourne.
 *
 * ⚠️ Déplacée ici depuis l'onglet Stock & appro le 26/08, sur la remarque de
 * l'utilisateur : *« du coup tu peux même rentrer la production, en fait, avec
 * le choix d'une ressource quelconque »*. Sa place est à côté des
 * consommations : c'est ce que le bâtiment **fait** pendant qu'il tourne.
 * Stock & appro ne garde que ce qui **bouge** — le stockage, la récolte,
 * l'envoi.
 *
 * ⚠️ **Un producteur ne livre pas.** Il fabrique dans son propre coffre, et
 * c'est le preneur qui vient — avec sa règle « je récolte » et SON rayon. Une
 * ligne de production n'a donc ni cible ni rayon.
 */
export interface LigneProduction {
  ressource: string;
  quantite: number;
  periode_s: number;
  /**
   * **L'escalier de rendement** de cette ligne. Liste vide = rien ne freine
   * cette production, elle tourne à plein (dans la limite de ses intrants).
   *
   * ⚠️ **Troisième forme du même champ en une journée**, et c'est celle-ci qui
   * tient : booléen → prorata `rendement% × indice` → **tranches**. Le prorata
   * a été essayé le 26/08 au matin et refusé l'après-midi : *« escalier par
   * ligne »*. Ne pas le remettre en continu sans que l'utilisateur le
   * redemande — le chemin a déjà été parcouru dans les deux sens.
   *
   * Une tranche ne porte que son **seuil bas** ; le haut est déduit de la
   * tranche du dessus. Impossible, donc, de laisser un trou ou de faire se
   * chevaucher deux tranches — ce qui donnerait un rendement différent selon
   * l'ordre de lecture.
   *
   *     à partir de 80 %  → rendement 100 %   → 60 par période
   *     à partir de  0 %  → rendement  80 %   → 48 par période
   *
   * Sans indicateur, une tranche unique à seuil 0 est un **plafond fixe**.
   */
  tranches: Tranche[];
  /**
   * **Quel indicateur pilote ce rendement.** Vide = le rendement est un plafond
   * fixe, il ne suit rien.
   *
   * ⚠️ Ajouté le 26/08 juste après le champ `rendement` : *« et je veux pouvoir
   * choisir l'indice ! »*. Le pourcentage seul ne disait pas **de quoi** il
   * dépendait — avec plusieurs indicateurs un jour (satisfaction, santé…), il
   * faut le nommer.
   *
   * Le rendement effectif se lit dans l'escalier ci-dessus :
   * `rendementPourIndicateur(tranches, valeur)`. Ce n'est **pas** un prorata —
   * une satisfaction à 79 % et une à 12 % donnent le même rendement si elles
   * tombent dans la même tranche.
   */
  indicateur: string;
}

export function productionVide(ressource: string): LigneProduction {
  return { ressource, quantite: 10, periode_s: PERIODE_PAR_DEFAUT, tranches: [], indicateur: "" };
}

export interface Palier {
  niveau: number;
  /**
   * Durée du chantier, en secondes. `0` = instantané.
   *
   * ⚠️ **Pas encore appliqué en jeu** : tout se construit instantanément, et
   * `EtatCase` n'a aucun champ de fin de chantier — il n'a que `niveau`,
   * `actif`, `stock` et `t`. Le champ est saisi et enregistré, mais l'écran le
   * dit en orange dès qu'on met autre chose que zéro. Même traitement que
   * `portee: "empire"` : un champ **pas encore branché** l'annonce, un champ
   * **qui ment** ne dit rien. **Retirer l'avertissement avec le mécanisme, pas
   * avant.**
   */
  duree_construction_s: number;
  /**
   * Ce que le palier demande en ressources. Le champ `mode` dit **quand** :
   * `paye` à la construction, `mobilise` tant que ça tourne. Une seule liste en
   * base, deux sections à l'écran.
   */
  cout: LigneCout[];
  /** Ce qu'il consomme pendant qu'il tourne. Rien n'est prélevé en veille. */
  utilisation: LigneFlux[];
  /** Ce qu'il fabrique pendant qu'il tourne. Rien n'est produit en veille. */
  production: LigneProduction[];
}

/*
 * ⚠️ **RETIRÉ le 2026-08-26, le jour même où c'était posé.** Un palier portait
 * aussi `indicateur` (la ressource calculée qu'il produit — la satisfaction) et
 * `plancher_efficacite` (l'efficacité minimale garantie, garde-fou contre la
 * spirale). L'utilisateur les a fait retirer de l'écran en les voyant :
 * *« on supprime produit l'indicateur, efficacité minimale, totalement soumise
 * à la satisfaction »*. Les champs sont partis avec, plutôt que de rester
 * saisis nulle part et lus par personne.
 *
 * Le MODÈLE, lui, reste décidé et vaut toujours — parts de satisfaction par
 * consommation, malus par plateau, plancher par tuile. Il attend seulement un
 * autre endroit où vivre. Tout est dans la note mémoire `sysb-satisfaction-v2`,
 * y compris pourquoi le plancher est indispensable : sans lui la boucle
 * satisfaction → production → nourriture → satisfaction est mortelle.
 */

/** Somme des parts de satisfaction d'un palier. Devrait faire 100 sur une habitation. */
export function totalParts(p: Palier): number {
  return p.utilisation.reduce((n, l) => n + Math.max(0, l.part), 0);
}

/** Ce qui est payé une fois, à la construction. */
export function coutConstruction(p: Palier): LigneCout[] {
  return p.cout.filter((l) => l.mode === "paye");
}

/** Vrai tant que les chantiers ne sont pas implémentés côté jeu. */
export function chantierPasEncoreApplique(p: Palier): boolean {
  return p.duree_construction_s > 0;
}

/** Période par défaut d'un flux, en secondes. Voir l'avertissement de `LigneFlux`. */
export const PERIODE_PAR_DEFAUT = 120;

export function palierVide(numero: number): Palier {
  return { niveau: numero, duree_construction_s: 0, cout: [], utilisation: [], production: [] };
}

/**
 * ⚠️ **La règle de veille, écrite à un seul endroit.** Mettre un bâtiment en
 * veille (`EtatCase.actif = false`) :
 *
 * - **rend tout ce qu'il mobilise** — la population d'abord : les ouvriers
 *   repartent et redeviennent disponibles ailleurs ;
 * - **arrête sa consommation** : plus rien de son `utilisation` n'est prélevé ;
 * - **arrête sa production**, et ce n'est pas une règle de plus mais la
 *   conséquence de la première. Mot de l'utilisateur le 26/08 : *« la mise en
 *   veille libère la pop, si pas de pop pas de prod. »* Un bâtiment qui n'a
 *   plus ses ouvriers ne produit pas — la production suit la main-d'œuvre, pas
 *   le drapeau `actif`.
 *
 * ⚠️ **Corollaire à ne pas manquer côté jeu :** ce lien vaut aussi **hors
 * veille**. Un bâtiment actif dont la population mobilisée n'est plus
 * disponible ne produit pas non plus. Ce n'est donc pas `if (!actif) return;`
 * qu'il faut écrire, mais un contrôle de la main-d'œuvre réellement mobilisée.
 *
 * Ce qui a été **payé** ne revient jamais, ni en veille ni à la destruction.
 *
 * C'est le joueur qui décide de la veille, et lui seul : la pénurie de
 * ressources fait **ralentir** au prorata (voir la satisfaction), elle n'éteint
 * rien. Un problème, un mécanisme.
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
    duree_construction_s: Math.max(0, entier(o.duree_construction_s)),
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
          part: Math.min(100, Math.max(0, entier(l?.part))),
          // Une ligne enregistree avant le 28/08 n'a pas de proximite : elle
          // revient a zero, c'est-a-dire « aucune regle ».
          proximite: {
            tileId: Math.max(0, entier(l?.proximite?.tileId)),
            nombre: Math.max(0, entier(l?.proximite?.nombre)),
            rayon: Math.max(0, entier(l?.proximite?.rayon)),
          },
        }))
      : [],
    production: Array.isArray(o.production)
      ? o.production.map((l) => ({
          ressource: typeof l?.ressource === "string" ? l.ressource : "",
          quantite: Math.max(0, entier(l?.quantite)),
          periode_s: Math.max(1, entier(l?.periode_s) || PERIODE_PAR_DEFAUT),
          tranches: normaliserTranches(l),
          indicateur: typeof l?.indicateur === "string" ? l.indicateur : "",
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
    duree_construction_s: Math.max(0, Math.trunc(p.duree_construction_s || 0)),
    cout: p.cout.filter((l) => l.ressource !== "" && l.quantite > 0),
    utilisation: p.utilisation.filter((l) => l.ressource !== "" && l.quantite > 0),
    production: p.production
      .filter((l) => l.ressource !== "")
      // Tri a l'enregistrement : le jeu lit un escalier deja ordonne, il n'a
      // pas a re-trier pour tomber sur le meme rendement que l'ecran.
      .map((l) => ({ ...l, tranches: tranchesTriees(l.tranches) })),
  }));
}

/** Résumé d'une durée en secondes, pour l'affichage. */
export function formatDuree(secondes: number): string {
  if (!secondes) return "immédiat";
  if (secondes < 60) return `${secondes} s`;
  if (secondes < 3600) return `${Math.round(secondes / 60)} min`;
  return `${(secondes / 3600).toFixed(1).replace(".0", "")} h`;
}

// --- Stockage et approvisionnement ------------------------------------------

/**
 * Refait le 2026-08-26, dans son **propre onglet** — sorti de l'onglet Coût à la
 * demande de l'utilisateur, où il avait d'abord été greffé ligne par ligne.
 *
 * Deux sujets voisins mais distincts :
 *
 * - **le stockage** : ce que la tuile peut garder, et combien ;
 * - **l'approvisionnement** : par où ça entre et par où ça sort.
 *
 * ⚠️ **L'approvisionnement va dans les DEUX SENS**, et c'est le cas de
 * l'entrepôt qui l'impose : il *ramasse* chez les producteurs autour de lui, et
 * il *fournit* les consommateurs. Une seule règle avec un `sens` plutôt que deux
 * listes séparées, pour que le même écran serve aux deux.
 *
 * Ce bloc remplace l'ancien champ `logistique` `{role, rayon, ressources, debit,
 * capacite}`, où une tuile ne pouvait être QUE collecteur ou QUE consommateur.
 * Le rôle a disparu : il se déduit des règles. Une tuile qui n'a que des règles
 * `entrant` est un consommateur ; une tuile qui a les deux est un entrepôt.
 */
export type SensAppro = "entrant" | "envoi";

/**
 * ⚠️ **TROIS cas, pas deux** — précisé par l'utilisateur le 26/08 :
 *
 * - **`entrant` — « je récolte »** : cette tuile va chercher. Elle a un **rayon
 *   de récolte**, des navettes, et la liste de ce qu'elle peut prendre. (Mot de
 *   l'utilisateur ; il va mieux avec « rayon de récolte » que « je prends ».)
 * - **`envoi` — « j'envoie »** : cette tuile livre chez les autres. Elle a un
 *   **rayon d'envoi**. *« J'ai besoin d'envoi, seulement pour l'entrepôt qui va
 *   envoyer du bovin à l'abattoir. »* C'est le seul cas où quelque chose part
 *   de soi-même.
 *
 * ⚠️ **Il y a eu un troisième sens, `produit`, retiré le 26/08** : la
 * production a déménagé dans l'onglet Coût, à côté des consommations. Cet
 * onglet ne garde que ce qui **bouge**. Les anciennes règles `produit` (et leur
 * ancêtre `sortant`) sont **écartées à la lecture**.
 */
export const SENS_APPRO: { valeur: SensAppro; libelle: string; aide: string }[] = [
  { valeur: "entrant", libelle: "je récolte", aide: "cette tuile va chercher ailleurs" },
  { valeur: "envoi", libelle: "j'envoie", aide: "cette tuile livre chez les autres" },
];

/**
 * ⚠️ **Le débit déclaré d'une ligne de production est un MAXIMUM**, jamais une
 * garantie :
 *
 * ```
 * production réelle = quantité déclarée
 *                   × couverture des intrants          (0 → 1)
 *                   × rendement de la tranche atteinte (0 → 1)
 * ```
 *
 * ⚠️ Le sens `produit` (et son ancêtre `sortant`) a été **retiré le 26/08** :
 * la production ne se déclare plus ici mais dans l'onglet *Coût*, à côté des
 * consommations. Cette formule décrit donc une ligne de `Palier.production`,
 * plus une règle d'appro.
 *
 * Mot de l'utilisateur : *« on produit tant de ressources si on a les
 * ressources ou seulement un pourcentage en fonction de ce que les ressources
 * correspondent au pourcentage de besoin, puis on applique le % de
 * satisfaction »*.
 *
 * ⚠️ La couverture est un **pourcentage, pas un tout-ou-rien** : à moitié
 * approvisionné, on produit la moitié. Le tout-ou-rien n'était pas invariant
 * aux cadences — c'est la leçon du 25/08, ne pas la reperdre.
 *
 * ⚠️ Et il reste la porte : **sans main-d'œuvre mobilisée, production nulle**,
 * quelle que soit la couverture.
 *
 * ⚠️ **Une ligne de production n'a ni cible ni rayon** : un producteur ne livre
 * pas, il fabrique dans son propre coffre et c'est le preneur qui vient, avec
 * SON rayon. C'est le cas de la ferme dont l'entrepôt ramasse la récolte.
 */
export const FORMULE_PRODUCTION =
  "débit déclaré × couverture des intrants × rendement de la tranche d'indicateur";

/**
 * ⚠️ **L'ORDRE DES PASSES**, posé par l'utilisateur le 26/08 :
 * *« l'entrepôt doit passer APRÈS l'abattoir pour la récolte des bovins »*.
 *
 * Autrement dit : **les consommateurs directs se servent avant les entrepôts**
 * (le mot « collecteur » ne désigne plus rien : l'entrepôt se déduit d'avoir
 * les deux sens). Sans cette règle, l'entrepôt aspirerait tous les bovins du pré
 * avant que l'abattoir ait pu en prendre, et l'abattoir tomberait en panne à
 * côté d'un champ plein.
 *
 * C'est une règle de MOTEUR, elle ne se saisit nulle part. Et c'est exactement
 * la famille de bugs qui a déjà tué deux versions d'`Acheminement.cs` — voir
 * `sysb-resolution-hors-ligne`. À rejouer en Python avant de l'écrire en C#.
 */
export const ORDRE_DES_PASSES =
  "consommateurs directs, puis entrepôts, puis livraisons des entrepôts";

/** Qui est en face. `tout` = n'importe quelle tuile à portée qui a / veut la ressource. */
export type CibleAppro = "tout" | "tuiles";

export const CIBLES_APPRO: { valeur: CibleAppro; libelle: string }[] = [
  { valeur: "tout", libelle: "n'importe quelle tuile" },
  { valeur: "tuiles", libelle: "seulement ces tuiles" },
];

export interface RegleAppro {
  sens: SensAppro;
  cible: CibleAppro;
  /** `cible: "tuiles"` — avec qui, précisément. */
  tileIds: number[];
  /**
   * Le **rayon de récolte** (`entrant`) ou de **livraison** (`envoi`), en
   * distance hexagonale.
   *
   * ⚠️ Remarque de l'utilisateur le 26/08, et elle est juste : *« rayon de
   * récupération ? parce qu'on envoie rien là, et seulement les entrepôts vont
   * envoyer »*. Un producteur ne livre pas — il rend sa production
   * **disponible**, et c'est le preneur qui se déplace. Le mot « envoi » ne
   * vaut que pour un entrepôt, qui a justement les deux règles.
   *
   * ⚠️ `null` = **tout le plateau**. Jamais `0` pour ça : zéro a déjà le sens
   * légitime de « la case elle-même ».
   */
  rayon: number | null;
  /**
   * ⚠️ **Liste vide = toutes les ressources.** Sinon, seulement celles-ci.
   *
   * ⚠️ Pour `produit`, c'est **une seule ressource** : une quantité attachée à
   * plusieurs ressources serait ambiguë — 10 de chaque, ou 10 en tout ? Une
   * ligne par ressource produite, et la question ne se pose pas.
   */
  ressources: string[];
  /**
   * Le débit, écrit en **navettes** : `navettes` trajets par `periode_s`,
   * chacun portant `quantite`. Le débit réel est donc le produit
   * `navettes × quantite` par période.
   *
   * ⚠️ **Les navettes restent une ANIMATION, pas une simulation.** On ne
   * déplace aucun agent et on ne fait aucun pathfinding : la comptabilité est
   * une multiplication d'entiers, ce qui garde la progression hors ligne
   * calculable en forme fermée. Le nombre de navettes sert à *dessiner* le
   * trafic — et à donner à l'utilisateur un réglage qu'il visualise mieux
   * qu'un débit abstrait. Si la distance doit compter un jour, faire décroître
   * le débit avec elle ; surtout pas introduire du déplacement réel.
   */
  debit: { navettes: number; quantite: number; periode_s: number };
}

/** Le débit réel d'une règle : navettes × quantité, par période. */
export function debitParPeriode(r: RegleAppro): number {
  return Math.max(0, r.debit.navettes) * Math.max(0, r.debit.quantite);
}



export function regleApproVide(sens: SensAppro): RegleAppro {
  return {
    sens,
    cible: "tout",
    tileIds: [],
    // Aller chercher suppose une portee courte ; livrer se fait a l'echelle du
    // plateau, comme un entrepot qui dessert tout le monde. « Je produis » n'a
    // pas de rayon du tout — la valeur est la, inutilisee.
    rayon: sens === "entrant" ? 3 : null,
    ressources: [],
    debit: { navettes: 1, quantite: 10, periode_s: PERIODE_PAR_DEFAUT },
  };
}

/**
 * Ce que la tuile peut garder, **ressource par ressource**.
 *
 * ⚠️ Refait le 26/08 : c'était d'abord une capacité globale plus une liste de
 * ressources acceptées, où « vide = toutes ». L'utilisateur a demandé
 * *« un tableau avec les ressources, et une quantité max de stockage à cocher
 * et renseigner »* — donc un plafond PAR ressource, coché ou non.
 *
 * C'est plus juste : un entrepôt à grain et un coffre à minerai n'ont pas la
 * même contenance, et « 500 au total toutes ressources confondues » obligeait
 * à choisir un chiffre qui ne veut rien dire pour aucune.
 *
 * **Une ressource absente de la liste n'est pas stockée du tout** — sauf si la
 * ligne « toutes les ressources » est cochée (voir `TOUTES_RESSOURCES`).
 */
export interface LigneStockage {
  /** Un code de ressource, ou `TOUTES_RESSOURCES`. */
  ressource: string;
  /** Plafond. `0` = la ligne ne sert à rien, elle est jetée à l'enregistrement. */
  max: number;
}

/**
 * La ligne fourre-tout du tableau de stockage : **n'importe quelle ressource,
 * jusqu'à ce plafond, partagé entre toutes**.
 *
 * ⚠️ Demandée par l'utilisateur le 26/08 — *« pourtant si je voulais l'option
 * toutes les ressources et 500 par exemple »* — après que le passage au tableau
 * l'ait fait disparaître. Les deux se justifient et **cohabitent** : l'entrepôt
 * générique a un volume, le silo à grain a un plafond par denrée.
 *
 * Une ligne nominative **l'emporte** sur celle-ci pour sa ressource : c'est ce
 * qui permet « n'importe quoi jusqu'à 500, mais pas plus de 50 de bois ».
 *
 * `*` n'est pas un code de ressource valide (les codes sont en minuscules,
 * chiffres et underscore), donc aucune collision possible.
 */
export const TOUTES_RESSOURCES = "*";

export interface Logistique {
  stockage: LigneStockage[];
  appros: RegleAppro[];
  /**
   * **Les tuiles de ce type ne forment qu'UN seul stock.** Demandé par
   * l'utilisateur le 26/08 : *« je veux que les entrepôts tout soit en commun !
   * leur stock égale 1 stock, seulement leur nombre augmente la quantité du
   * stock ! »*
   *
   * - la **capacité** du commun est la SOMME des plafonds des instances posées ;
   * - n'importe quelle instance donne accès à **tout** le commun — l'entrepôt
   *   devient un point d'accès, il n'est plus un contenant ;
   * - le **débit** n'est PAS mis en commun : chacune garde ses navettes et son
   *   rayon. Trois entrepôts ramassent trois fois plus vite.
   *
   * ⚠️ Le commun est **par type**, jamais global : deux types cochés font deux
   * bourses distinctes.
   */
  stock_commun: boolean;
}

export function logistiqueVide(): Logistique {
  return { stockage: [], appros: [], stock_commun: false };
}

/**
 * Vrai si ce type partage un stock. Cocher la case sans déclarer le moindre
 * plafond ne veut rien dire — il n'y aurait aucun volume à mettre en commun.
 */
export function estCommun(l: Logistique): boolean {
  return l.stock_commun && l.stockage.some((x) => x.max > 0);
}

/**
 * Le plafond retenu pour une ressource : sa ligne nominative si elle existe,
 * sinon la ligne « toutes », sinon 0 (la tuile ne la stocke pas).
 */
export function maxStocke(l: Logistique, code: string): number {
  const propre = l.stockage.find((x) => x.ressource === code);
  if (propre) return propre.max;
  return l.stockage.find((x) => x.ressource === TOUTES_RESSOURCES)?.max ?? 0;
}

/** Le plafond de la ligne « toutes les ressources », ou 0 si elle n'est pas cochée. */
export function maxToutesRessources(l: Logistique): number {
  return l.stockage.find((x) => x.ressource === TOUTES_RESSOURCES)?.max ?? 0;
}

/** Les plafonds nominatifs, hors ligne « toutes ». */
export function lignesNominatives(l: Logistique): LigneStockage[] {
  return l.stockage.filter((x) => x.ressource !== TOUTES_RESSOURCES);
}

export function logistiqueDe(tuile: { logistique?: unknown }): Logistique {
  const l = (tuile.logistique ?? {}) as Partial<Logistique>;
  const entier = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0);
  const codes = (v: unknown) =>
    Array.isArray(v) ? Array.from(new Set(v.filter((c) => typeof c === "string" && c !== ""))) : [];
  return {
    stock_commun: l.stock_commun === true,
    stockage: Array.isArray(l.stockage)
      ? l.stockage
          .filter((x) => x && typeof x.ressource === "string" && x.ressource !== "")
          .map((x) => ({ ressource: x.ressource, max: Math.max(0, entier(x.max)) }))
      : [],
    appros: Array.isArray(l.appros)
      ? l.appros.map((r) => ({
          // ⚠️ `sortant` est l'ancien nom de `produit` (avant la scission du
          // 26/08 en trois sens). Relu, jamais reecrit — d'ou le passage par
          // `string` : le type n'a plus cette valeur, les donnees si.
          sens: ((brut) =>
            brut === "envoi"
              ? ("envoi" as const)
              : brut === "produit" || brut === "sortant"
                ? ("perime" as unknown as SensAppro)
                : ("entrant" as const))((r as { sens?: string })?.sens),
          cible: r?.cible === "tuiles" ? ("tuiles" as const) : ("tout" as const),
          tileIds: Array.isArray(r?.tileIds)
            ? Array.from(new Set(r.tileIds.filter((n: unknown) => typeof n === "number")))
            : [],
          rayon: r?.rayon === null || r?.rayon === undefined ? null : Math.max(0, entier(r.rayon)),
          ressources: codes(r?.ressources),
          debit: {
            navettes: Math.max(0, entier(r?.debit?.navettes) || 1),
            quantite: Math.max(0, entier(r?.debit?.quantite)),
            periode_s: Math.max(1, entier(r?.debit?.periode_s) || PERIODE_PAR_DEFAUT),
          },
        }))
          // ⚠️ Les anciennes regles « produit » / « sortant » sont ecartees :
          // la production a demenage dans l'onglet Cout le 26/08.
          .filter((r) => r.sens === "entrant" || r.sens === "envoi")
      : [],
  };
}

/**
 * Ce qui part en base. Une règle « seulement ces tuiles » sans aucune tuile
 * cochée ne dit rien : on la jette plutôt que de laisser croire qu'elle
 * achemine quelque chose.
 */
export function logistiquePourEnregistrer(l: Logistique): Logistique {
  return {
    // Un plafond nul ne dit rien : on jette la ligne plutot que de laisser
    // croire que la ressource est stockee.
    stockage: l.stockage.filter((x) => x.ressource !== "" && x.max > 0),
    appros: l.appros.filter((r) => r.cible === "tout" || r.tileIds.length > 0),
    // On garde la case cochée telle quelle : la décocher toute seule parce
    // qu'aucun plafond n'est encore saisi ferait perdre le réglage entre deux
    // enregistrements, sans rien dire.
    stock_commun: l.stock_commun === true,
  };
}

/** Vrai si la règle ne dit rien d'utile — signalée en orange, ignorée en jeu. */
export function regleApproUtile(r: RegleAppro): boolean {
  if (r.cible === "tuiles" && r.tileIds.length === 0) return false;
  return debitParPeriode(r) > 0;
}

/** La règle relue en français, telle qu'elle s'affiche sous chaque bloc. */
export function decrireAppro(
  r: RegleAppro,
  nomTuile: (tileId: number) => string,
  nomRessource: (code: string) => string,
): string {
  const quoi =
    r.ressources.length === 0
      ? "toutes les ressources"
      : r.ressources.map((c) => nomRessource(c)).join(", ");
  const qui =
    r.cible === "tout"
      ? "n'importe quelle tuile"
      : r.tileIds.length === 0
        ? "(aucune tuile cochée)"
        : r.tileIds.map((id) => `« ${nomTuile(id)} »`).join(" ou ");
  const ou =
    r.rayon === null
      ? "sur tout le plateau"
      : `à ${r.rayon} case${r.rayon > 1 ? "s" : ""} (${casesCouvertes(r.rayon)} cases)`;
  const combien =
    `${r.debit.navettes} navette${r.debit.navettes > 1 ? "s" : ""} × ${r.debit.quantite} = ` +
    `${debitParPeriode(r)} par ${formatDuree(r.debit.periode_s)}`;
  return r.sens === "entrant"
    ? `Prend ${quoi} chez ${qui} ${ou} — ${combien}.`
    : `Envoie ${quoi} vers ${qui} ${ou} — ${combien}.`;
}

/**
 * Une tuile qui **va chercher** ET qui **livre** : c'est un entrepôt. Produire
 * ne suffit pas — une ferme produit, elle n'est pas un entrepôt.
 */
export function estEntrepot(l: Logistique): boolean {
  return l.appros.some((r) => r.sens === "entrant") && l.appros.some((r) => r.sens === "envoi");
}

// --- Le record --------------------------------------------------------------

export type Tuile = {
  id: string;
  collectionId: string;
  collectionName: string;
  tileId: number;
  nom: string;
  /**
   * Le code de la tuile dans l'arbre techno (`SysB/arbre/arbre_sysb.json`) —
   * `cabane_bois`, `four_briques`… **C'est la seule jointure entre le catalogue
   * jouable et le document de conception**, et elle n'existait pas avant le 27/08 :
   * on rapprochait les deux par le `nom`, qui est en fait celui du modele 3D.
   *
   * ⚠️ Il ne sert PAS a charger le prefab : ca, c'est la relation `modele` vers
   * `tuile3dmodel` (voir `cheminJeu`). Vide est permis — les cases de terrain
   * (eau, foret, volcan) n'ont pas d'entree dans l'arbre.
   */
  code: string;
  /**
   * L'âge de l'arbre auquel ce bâtiment appartient, 1 à 7. `0` = pas d'âge, ce
   * qui est le cas normal des cases de terrain (eau, forêt, volcan).
   *
   * ⚠️ Rempli le 2026-08-27 par l'import de l'arbre. Depuis le soir même, c'est
   * **lui qui donne son âge à une technologie** (`technologies.batiment`) : le
   * corriger ici range les technos ailleurs.
   */
  age: number;
  /**
   * Chemin de la vignette sous `Assets/Resources/`, sans extension :
   * `Icones_Tuiles/<code>`. **Stocke en base depuis le 2026-08-27 au soir.**
   *
   * ⚠️ Il a fait l'aller-retour : deduit du `code` d'abord, puis stocke, sur
   * decision de l'utilisateur. Ne pas re-deduire ailleurs — `cheminIcone()` est
   * le seul point de lecture, et il lit CE champ. Vide est permis : les cases de
   * terrain (eau, foret, volcan) n'ont pas de dessin.
   */
  chemin_icone: string;
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
  /** Stockage et approvisionnement. Refaits le 26/08 — voir `Logistique`. */
  logistique: Logistique | null;
  created: string;
  updated: string;
  expand?: { modele?: Modele3D };
};

/**
 * Ce que le formulaire renvoie — l'identite, et rien d'autre.
 *
 * Les quatre champs json — `placement`, `niveaux`, `logistique` — y sont tous
 * revenus le 26/08, au fur et a mesure que leurs onglets ont ete refaits. Une
 * cle absente d'ici n'est pas envoyee a PocketBase : c'est ce qui a garde les
 * champs intacts pendant la remise a zero.
 */
export interface ValeursTuile {
  tileId: number;
  nom: string;
  code: string;
  age: number;
  chemin_icone: string;
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
  logistique: Logistique;
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
  return tuiles.filter(
    (t) =>
      placementDe(t).some(
        (r) =>
          r.tileIds.includes(tileId) ||
          r.sauf.includes(tileId) ||
          // ⚠️ Le bâtiment requis compte AUSSI : supprimer une ferme citée par
          // « il faut 3 fermes » casserait la règle en silence.
          (r.regle === "batiments" && r.batiment === tileId),
      ) ||
      // Et la proximité d'une consommation : « 5 pâturages à 2 cases ».
      paliersDe(t).some((p) =>
        p.utilisation.some((l) => proximiteUtile(l.proximite) && l.proximite.tileId === tileId),
      ),
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
/**
 * Le chemin de la vignette du batiment, dans la convention de `Resources.Load`
 * cote Unity : **`Icones_Tuiles/<code>`**, sans extension et sans
 * `Assets/Resources/`.
 *
 * ⚠️ **Il est STOCKE en base** (`tuiles.chemin_icone`), depuis le 2026-08-27 au
 * soir. Le champ avait ete retire le matin meme au profit d'une deduction sur le
 * `code` ; l'utilisateur est revenu dessus. Cette fonction ne DEDUIT donc plus
 * rien — elle lit — et reste le point unique pour que le jour ou la regle change
 * encore, un seul endroit bouge.
 *
 * ⚠️ Ne PAS remettre un repli `Icones_Tuiles/${code}` ici : ce serait exactement
 * la double source qu'on voulait eviter, et une tuile a la vignette volontairement
 * vide en retrouverait une.
 *
 * Chaine vide = pas de dessin, ce qui est le cas normal des cases de terrain
 * (eau, foret, volcan) : elles n'ont pas d'entree dans l'arbre.
 */
export function cheminIcone(tuile: { chemin_icone?: string }): string {
  return (tuile.chemin_icone ?? "").trim();
}

/**
 * Ce que `chemin_icone` VAUDRAIT pour ce code — la convention, pas la valeur.
 * Sert uniquement a proposer un defaut dans le formulaire ; ce qui part en base
 * reste ce que l'admin a sous les yeux.
 */
export function cheminIconeAttendu(code: string): string {
  const c = code.trim();
  return c ? `Icones_Tuiles/${c}` : "";
}

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
