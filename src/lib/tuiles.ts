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
 * ⚠️ Le voisinage d'une CONSOMMATION ou d'une PRODUCTION, lui, n'est pas ici :
 * il vit sur la ligne elle-même, en `Proximite` — voir `LigneFlux` et
 * `LigneProduction`.
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

// `pasEncoreAppliqueeEnJeu()` a vécu du 28/08 au matin au 28/08 au soir : ses
// trois cas (limite « empire », `batiments`, `technologie`) sont appliqués par
// le moteur Unity depuis le rattrapage du 28/08 (PlacementValidator,
// CoutConstruction, TechnosJoueur). Une fonction sans cas est du code mort —
// elle reviendra sous ce nom si une future règle est saisie avant d'être
// branchée.

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
   *   séparément, comme tout le reste du modèle.
   * - `empire` : tous plateaux confondus.
   *
   * ⚠️ **Les deux sont appliqués depuis le 28/08**, et des deux côtés :
   * `PlacementValidator` avec la liste des plateaux que lui passe
   * `PlateauGenerator.PlateauxVus()`, et `compterEmpire`
   * (`pb_hooks/moteur/placement.js`) côté serveur. L'avertissement orange qui
   * vivait sous la règle est parti le même jour, AVEC le mécanisme.
   *
   * ⚠️ Un seul repli subsiste : **sans la liste des autres plateaux**, la
   * limite se compte sur le seul plateau courant, et les deux moteurs le
   * disent en avertissement plutôt que de l'appliquer en silence — une limite
   * trop stricte se voit, une limite muette ne se voit jamais.
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
 * ⚠️⚠️ **LE MODÈLE À CYCLES (2026-09-11, `SysB/SPEC_MOTEUR_CYCLES.md` §2ter).**
 * Un bâtiment n'est plus un débit : il **démarre** un cycle quand ses
 * ressources sont là, il **dure** `cycle_minutes`, il **livre d'un coup**. Une
 * ligne porte donc une **quantité ENTIÈRE par cycle**, et la période vit sur le
 * PALIER, jamais sur la ligne — un bâtiment a UN rythme.
 *
 * ⚠️ **`par_minute` N'EXISTE PLUS**, ni `periode_s` sur une ligne, ni `part` :
 * le serveur REFUSE de charger une tuile qui porte les deux premiers
 * (`pb_hooks/moteur/cycles/tuiles.js`, `chargerLigne`). Ils ne sont ni lus ni
 * écrits ici — une ligne d'avant le 11/09 revient avec une quantité à 0, que
 * l'écran signale et que l'enregistrement retire. On ne les relit pas « au cas
 * où » : on repart de zéro.
 *
 * ⚠️ Ce n'est PAS le retour du couple `quantite` + `periode_s` tué le 08/09 :
 * dans un modèle à cycles, 10 par 60 s ne se comporte pas comme 5 par 30 s —
 * l'un bloque deux fois plus longtemps, l'autre sert deux fois plus souvent.
 * Et le 1/3600 a disparu avec le débit : une quantité par cycle est déjà un
 * entier d'unités réelles, il n'y a plus rien à convertir (§3).
 */
/**
 * **La règle de proximité** — posée le 2026-08-28 sur les consommations
 * (*« 10 bovin × 120 s × (besoin de 5 tuiles bovin à 2 rayon = 100 %) »*),
 * étendue le 2026-08-30 aux **productions**, à **plusieurs tuiles au choix**
 * et à **plusieurs règles par ligne**.
 *
 * Elle dit combien de bâtiments il faut **autour de la tuile** pour que la
 * ligne tourne à plein. C'est ce qui attache un abattoir à ses pâturages :
 * posé tout seul, il n'a rien à abattre.
 *
 * ⚠️ **Les tuiles cochées sont un OU, et leurs présences s'ADDITIONNENT**
 * (demande du 30/08 : *« il faut pouvoir choisir différentes tuiles, dont le
 * total fait X, et c'est un OU »*). « 5 au total parmi Pâturage ou Bergerie »
 * est rempli par 3 pâturages + 2 bergeries. Le **ET** s'écrit avec **deux
 * règles** sur la même ligne — c'est tout le sens de `Proximite[]`.
 *
 * ⚠️ **Au prorata, jamais tout-ou-rien** (choix du 28/08) : 3 tuiles à portée
 * sur les 5 demandées valent **60 %**. Un seuil brutal rendrait la 4ᵉ tuile
 * inutile, et le reste du modèle compte déjà partout au prorata.
 *
 * ⚠️ **Plusieurs règles se cumulent par le MINIMUM** (choix du 30/08) : 80 %
 * d'un côté et 50 % de l'autre donnent **50 %**. C'est le maillon faible qui
 * commande — ni le produit (qui s'effondrerait dès trois règles), ni la
 * moyenne (qui laisserait une règle à zéro ne coûter que la moitié).
 *
 * ⚠️ **Sa portée n'est PAS la même des deux côtés** (choix du 30/08) :
 *
 * - sur une **consommation**, le facteur porte sur SA ligne : elle ne demande
 *   plus que `quantite × facteur` — 6 bovins au lieu de 10 — et sa
 *   contribution à la couverture de la tuile se calcule **sur les 10
 *   nominaux**, donc la tuile plafonne à 60 %. Sans cette seconde moitié, une
 *   ligne servie à plein de sa demande réduite donnerait 100 % de production
 *   avec 3 pâturages : la règle ne servirait à rien ;
 * - sur une **production**, le facteur plafonne **tout le palier** — toutes
 *   ses lignes, productions comme consommations. Ce n'est donc pas vraiment
 *   une règle « de ligne » : la ligne n'est que l'endroit où on l'écrit.
 *
 * ⚠️ **Le format a changé le 30/08, et les deux bouts ont suivi** : `tileId`
 * (un seul) est devenu `tileIds` (une liste), et le champ d'une ligne est passé
 * de `proximite` (un objet) à `proximites` (une liste). Les TROIS lecteurs
 * ⚠️ SEUL LE SITE relit encore l'ancien format, et c'est le chemin de
 * migration : le serveur et le jeu ne lisent plus que `tileIds`/`proximites`
 * depuis le 11/09. Rouvrir puis enregistrer une vieille tuile la convertit —
 * et il faut de toute facon toutes les rouvrir, puisque `par_minute` est
 * refusé. Seul le nouveau format s'écrit.
 *
 * ⚠️ **Le moteur à cycles LES APPLIQUE** (spec §4bis, 11/09) : le facteur
 * redéfinit la taille du cycle — `quantité × min(compté, nombre) / nombre`,
 * arrondi vers le bas — et il plafonne **TOUT LE PALIER**, pas la seule ligne
 * qui le porte. Plusieurs `tileIds` dans une règle : les cibles s'ADDITIONNENT
 * (OU). Plusieurs règles sur une ligne : on garde le **MINIMUM** (ET).
 */
export interface Proximite {
  /**
   * Les `tileId` qui comptent, en **OU** : on additionne leurs présences à
   * portée. Liste vide = pas encore choisi.
   *
   * ⚠️ **Pas de case vide ici**, contrairement aux règles de `support` : on
   * compte des bâtiments construits, pas du terrain.
   */
  tileIds: number[];
  /** Combien il en faut à portée, **tous types cochés confondus**, pour 100 %. */
  nombre: number;
  /**
   * Rayon en cases, sur la grille **hexagonale** (voir l'en-tête du fichier) :
   * un rayon r couvre 3r(r+1) cases autour du centre.
   */
  rayon: number;
}

/** Le défaut proposé par « + proximité » : les chiffres de l'exemple. */
export function proximiteParDefaut(): Proximite {
  return { tileIds: [], nombre: 5, rayon: 2 };
}

/**
 * Vrai si l'admin a commencé à en poser une. Une règle entièrement vide n'est
 * pas une règle : elle part à l'enregistrement.
 */
export function proximitePosee(p: Proximite): boolean {
  return p.tileIds.length > 0 || p.nombre > 0 || p.rayon > 0;
}

/** Vrai si elle est complète, donc si elle agirait. Sinon : ignorée, en orange. */
export function proximiteUtile(p: Proximite): boolean {
  return p.tileIds.length > 0 && p.nombre > 0 && p.rayon > 0;
}

/**
 * Ce que vaut UNE règle, en %, avec `presentes` bâtiments à portée (les tuiles
 * cochées additionnées). Plafonné à 100 : en avoir huit quand cinq suffisent
 * ne fait pas produire davantage.
 */
export function pourcentageProximite(p: Proximite, presentes: number): number {
  if (!proximiteUtile(p)) return 100;
  return Math.min(100, Math.round((Math.max(0, presentes) * 100) / p.nombre));
}

/**
 * Ce que valent **toutes** les règles d'une ligne : la plus contraignante
 * commande (voir l'en-tête). `presentes[i]` va avec `regles[i]`.
 */
export function pourcentageProximites(regles: Proximite[], presentes: number[]): number {
  let pct = 100;
  regles.forEach((p, i) => {
    if (proximiteUtile(p)) pct = Math.min(pct, pourcentageProximite(p, presentes[i] ?? 0));
  });
  return pct;
}

/**
 * Relit le champ d'une ligne, dans les **deux** formats : `proximites` (depuis
 * le 30/08) ou l'ancien `proximite` unique, replié dans une liste d'un
 * élément. Les règles entièrement vides sont écartées — c'était la façon
 * d'écrire « pas de règle » avant qu'une liste puisse être vide.
 */
export function normaliserProximites(ligne: unknown): Proximite[] {
  const o = (ligne ?? {}) as { proximites?: unknown; proximite?: unknown };
  const bruts = Array.isArray(o.proximites)
    ? o.proximites
    : o.proximite != null
      ? [o.proximite]
      : [];
  return bruts.map(normaliserProximite).filter(proximitePosee);
}

function normaliserProximite(brut: unknown): Proximite {
  const p = (brut ?? {}) as {
    tileIds?: unknown;
    tileId?: unknown;
    nombre?: unknown;
    rayon?: unknown;
  };
  const entier = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0);
  // ⚠️ L'ancien `tileId` unique devient une liste d'un élément : sans ça, toute
  // proximité saisie avant le 30/08 perdrait son bâtiment en silence.
  const ids = Array.isArray(p.tileIds) ? p.tileIds.map(entier) : [entier(p.tileId)];
  return {
    tileIds: Array.from(new Set(ids.filter((n) => n > 0))).sort((a, b) => a - b),
    nombre: Math.max(0, entier(p.nombre)),
    rayon: Math.max(0, entier(p.rayon)),
  };
}

/**
 * Une ligne de CONSOMMATION : ce que le bâtiment mange à chaque cycle.
 *
 * ⚠️ **`part` a disparu le 2026-09-11** (§5.4) : la satisfaction ne se
 * DÉCLARE plus, elle se CONSTATE. Tout bâtiment qui consomme publie la sienne,
 * `servi / demandé` sur l'ensemble de ses lignes — 15 blé servis sur 20
 * demandés donnent 75 %, sans rien saisir. Les parts déclarées étaient
 * précisément ce qui portait le bug mesuré le 11/09 : cinq maisons
 * parfaitement nourries dont les parts totalisaient 50 % rendaient 60 % pour
 * toujours.
 */
export interface LigneFlux {
  ressource: string;
  /** Combien, PAR CYCLE. Un entier d'unités réelles (§3). */
  quantite: number;
  /**
   * **« en direct »** (§4) : la ressource est prise **sans navette**, sur
   * **tout le plateau** — sauf chez un bâtiment qui la consomme lui aussi.
   *
   * ⚠️ Une ressource consommée en direct **n'est jamais allée chercher par une
   * navette** : c'est tout l'intérêt, elle arrive sans transport donc sans
   * aléa. Une règle d'appro de ce bâtiment qui la cite n'envoie rien pour elle.
   *
   * ⚠️ Tous les preneurs en direct d'un même type ne font **qu'un** : ils
   * consomment et produisent comme un seul bâtiment, et publient une seule
   * satisfaction. C'est ce qui lisse les indices.
   *
   * Sur une consommation SEULEMENT : une production n'a pas ce champ.
   */
  direct: boolean;
  /**
   * **Le BONUS de satisfaction de cette ligne**, en pour cent (§5.5, 13/09).
   * `0` = ligne ordinaire, et rien ne change pour elle.
   *
   * Une ligne bonus **n'entre pas dans la demande de base** : elle AJOUTE son
   * pourcentage au prorata de ce qu'elle reçoit. 10 nourriture (ordinaire) +
   * 5 gibier (bonus 20) donnent **120 %** quand les deux sont servis, 108 %
   * si le gibier n'arrive qu'aux deux cinquièmes, et 100 % sans gibier du
   * tout.
   *
   * ⚠️ **Ce n'est PAS le retour de `part`.** `part` déclarait le poids de
   * CHAQUE ligne, et des maisons parfaitement nourries plafonnaient pour
   * toujours à la somme de leurs parts. Un bonus ne se déclare que sur les
   * lignes en plus : il ne peut que monter.
   *
   * ⚠️ Une ligne bonus **ne bloque jamais un cycle** — sans quoi le « en
   * plus » deviendrait un « obligatoire ». Elle se consomme quand même : elle
   * coûte vraiment son gibier.
   *
   * ⚠️ Le surplus ne paie **que par l'escalier** d'une production, avec une
   * tranche écrite au-dessus de 100 (« de 120 → 130 % »). Une ligne
   * ordinaire, elle, reste plafonnée à sa quantité déclarée.
   */
  bonus: number;
  /**
   * **Les règles de proximité** de cette consommation — voir `Proximite`, et
   * son avertissement : HORS MOTEUR depuis le 11/09.
   */
  proximites: Proximite[];
}

export function fluxVide(ressource: string): LigneFlux {
  return {
    ressource,
    quantite: 1,
    direct: false,
    bonus: 0,
    proximites: [],
  };
}

/**
 * **La satisfaction MAXIMALE qu'un palier peut atteindre**, en pour cent :
 * 100 pour ses lignes ordinaires, plus les bonus de ses lignes bonus (§5.5).
 *
 * ⚠️ C'est ce que l'escalier d'une production doit savoir : une tranche dont
 * le seuil dépasse ce nombre ne se déclenchera JAMAIS, et l'écran doit le dire
 * — un escalier muet qui ne s'ouvre pas est le genre de faute qui se découvre
 * trois semaines plus tard, en jeu.
 */
export function satisfactionMax(utilisation: LigneFlux[]): number {
  return utilisation
    .filter(ligneQuiAgit)
    .reduce((somme, l) => somme + Math.max(0, Math.trunc(l.bonus || 0)), 100);
}

/**
 * Un **cran** de l'escalier de rendement : « à partir de `seuil` %
 * d'indicateur, la ligne rend `rendement` % de sa quantité par cycle ».
 *
 * ⚠️ Des **pour cent** (0–100), jamais des pour mille (§3). Le moteur ne
 * calcule d'ailleurs jamais le pourcentage pour le comparer au seuil : il
 * multiplie en croix (`servi × 100 >= seuil × demandé`). Le pourcentage n'est
 * arrondi qu'à l'affichage.
 *
 * ⚠️ Seul le **seuil bas** se saisit. Le haut est celui de la tranche du
 * dessus, ou 100. C'est ce qui rend impossible un trou entre deux tranches, ou
 * un recouvrement — deux fautes qui feraient dépendre le résultat de l'ordre de
 * lecture, et donc diverger le site et le jeu.
 */
export interface Tranche {
  /** Valeur de l'indicateur, en %, à partir de laquelle cette tranche vaut. */
  seuil: number;
  /** Ce que la ligne rend dans cette tranche, en % de sa quantité par cycle. */
  rendement: number;
}

/**
 * Les deux tranches de l'exemple de l'utilisateur, proposées quand il ajoute un
 * indice : *« 60 nourriture × 100 % pour satisfaction 100–80 %, 60 × 80 % pour
 * satisfaction 80–0 % »*.
 */
export const TRANCHES_PAR_DEFAUT: Tranche[] = [
  { seuil: 80, rendement: 100 },
  { seuil: 0, rendement: 80 },
];

/**
 * ⚠️ **QUAND l'indicateur est lu** — l'ordre du cycle (§2), sans exception :
 *
 * 1. ARRIVÉE — les livraisons et récoltes qui atterrissent maintenant ;
 * 2. INDICE — les indicateurs sont relus, depuis les satisfactions à jour ;
 * 3. CONSO/PROD — le bâtiment mange et livre, dans le même geste ;
 * 4. DÉPART — les navettes repartent.
 *
 * ⚠️ Relu à **CHAQUE cycle**, jamais une fois pour toutes, et **avant** la
 * production : évaluée après, la satisfaction faisait tourner à plein régime
 * un bâtiment qui produit plus vite qu'il ne mange (150 unités d'écart sur une
 * heure, mesuré au miroir le 25/08).
 */
export const INDICE_LU =
  "à chaque cycle, juste avant que le bâtiment consomme et produise — jamais celle d'un cycle précédent";

/**
 * Valeur d'un indicateur quand personne ne vote encore — **100, pas 0** : un
 * plateau sans consommateur n'est pas un plateau affamé, et une colonie neuve
 * démarrerait sinon à rendement minimal, sans jamais pouvoir construire de
 * quoi remonter.
 */
export const INDICE_AU_DEMARRAGE = 100;

/**
 * Tranches du haut vers le bas, seuils entiers et positifs. Ordre de lecture
 * unique.
 *
 * ⚠️⚠️ **PLUS DE PLAFOND À 100 depuis le 13/09** (§5.5). Une satisfaction peut
 * dépasser 100 grâce aux lignes bonus, et c'est une tranche au-dessus de 100
 * — « de 120 → 130 % » — qui la fait payer. Le rendement non plus n'est pas
 * borné : c'est ce qui permet à un bâtiment comblé de produire plus que sa
 * quantité déclarée. Remettre un `Math.min(100, …)` ici rendrait le bonus
 * inutilisable, en silence et sans un mot à la saisie.
 */
export function tranchesTriees(tranches: Tranche[]): Tranche[] {
  return [...tranches]
    .map((t) => ({
      seuil: Math.max(0, Math.trunc(t?.seuil || 0)),
      rendement: Math.max(0, Math.trunc(t?.rendement || 0)),
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

// ⚠️ L'ancien `rendement` seul (26/08 au matin) n'est plus relu : il devenait
// une tranche sans indicateur, le « plafond fixe » — mort le 11/09 avec la
// règle « une ligne a UN cadenceur » (voir `LigneProduction.tranches`).
function normaliserTranches(l: unknown): Tranche[] {
  const o = l as { tranches?: unknown };
  return Array.isArray(o?.tranches) ? tranchesTriees(o.tranches as Tranche[]) : [];
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
  /** Combien, PAR CYCLE, au maximum. Un entier d'unités réelles (§3). */
  quantite: number;
  /**
   * **L'escalier de rendement** de cette ligne. N'a de sens qu'avec un
   * `indicateur` : vide = ligne ordinaire.
   *
   * ⚠️⚠️ **UNE LIGNE A UN CADENCEUR, ET UN SEUL** (§4, 11/09) :
   *
   * - ligne **ordinaire** (sans indicateur) : elle livre `quantité ×
   *   satisfaction du bâtiment`, arrondi vers le bas — il a 80 % de ce qu'il
   *   attend, il livre 80 % ;
   * - ligne qui **suit un indicateur** : cadencée par l'escalier, et par lui
   *   seul. La remultiplier par la satisfaction propre du bâtiment compterait
   *   la pénurie deux fois — un bâtiment à 50 % rendrait 25 %.
   *
   * ⚠️ Le « plafond fixe » (des tranches sans indicateur) est donc MORT le
   * 11/09 : le moteur ignore l'escalier d'une ligne sans indicateur. L'écran
   * le dit, et l'enregistrement le retire.
   *
   * ⚠️ Un indicateur sans aucune tranche est REFUSÉ par le serveur au
   * chargement — c'est une erreur bloquante ici aussi (`erreursPalier`).
   *
   * ⚠️ **Lecture B de l'escalier** (§5) : chaque bâtiment qui consomme prend SA
   * tranche, et le rendement est leur moyenne **pondérée par la population**.
   * Ce n'est PAS `tranche(moyenne)` : les mal servis tirent le rendement vers
   * le bas sur leur part de population seulement.
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
   *     à partir de 80 %  → rendement 100 %   → 60 par cycle
   *     à partir de  0 %  → rendement  80 %   → 48 par cycle
   */
  tranches: Tranche[];
  /**
   * **Quel indicateur cette ligne SUIT.** Vide = ligne ordinaire, cadencée par
   * la satisfaction propre du bâtiment (voir `tranches`).
   *
   * ⚠️ Une ligne SUIT un indicateur, elle ne le FABRIQUE jamais (§5.4) : il n'y
   * a plus de ligne « produit X satisfaction ».
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
  /**
   * **Les règles de proximité** de cette production — ajoutées le 30/08 :
   * *« dans ce que produit un bâtiment, rajoute l'indice de proximité »*.
   *
   * ⚠️ Contrairement à celles d'une consommation, elles ne freinent pas que
   * leur ligne : le facteur plafonne **tout le palier**. La ligne n'est que
   * l'endroit où on l'écrit. ⚠️ HORS MOTEUR depuis le 11/09 — voir `Proximite`.
   */
  proximites: Proximite[];
}

export function productionVide(ressource: string): LigneProduction {
  return {
    ressource,
    quantite: 1,
    tranches: [],
    indicateur: "",
    proximites: [],
  };
}

export interface Palier {
  niveau: number;
  /**
   * Durée du chantier, en secondes. `0` = instantané.
   *
   * ⚠️ La pose écrit la fin du chantier dans l'état de la case
   * (`chantier_fin`, en heure serveur), et la case reste INERTE jusque-là :
   * elle ne produit pas, ne consomme pas, ses navettes ne partent pas, et elle
   * ne vote pas à l'escalier (§7).
   *
   * ⚠️ **Le prix est payé à la pose, pas à la livraison** (§6bis) : démolir en
   * plein chantier ne rembourse rien, même sanction qu'un bâtiment fini.
   */
  duree_construction_s: number;
  /**
   * **La durée d'UN cycle, en MINUTES ENTIÈRES** (§2ter) : `duree_cycle_s =
   * cycle_minutes × 60`. Le cycle le plus court est donc UNE minute — assumé.
   *
   * ⚠️ **Obligatoire dès que le palier consomme ou produit** : le serveur
   * refuse une tuile qui tourne sans rythme déclaré, et il n'y a volontairement
   * AUCUN défaut — un rythme choisi à la place de l'admin se découvrirait en
   * jeu. `0` = pas encore déclaré, dit en rouge et bloquant (`erreursPalier`).
   *
   * ⚠️ Un palier qui ne fait rien n'a pas de cycle : le champ n'est alors PAS
   * écrit en base (`paliersPourEnregistrer`). Surtout pas `0`, que le serveur
   * refuse — « 0 minute » n'est pas un rythme.
   */
  cycle_minutes: number;
  /**
   * ☑️ **« démarre avec ce qu'il y a »** (§2, tranché le 11/09) — DÉCOCHÉ par
   * défaut.
   *
   * - décoché : **tout ou rien**. Un four qui demande 20 blé et n'en a que 12
   *   ne démarre pas : il n'en mange aucun, il attend sa cargaison complète ;
   * - coché : un cycle part dès qu'il y a **quelque chose**, mange ce qu'il
   *   trouve et livre à proportion. Une ressource totalement absente bloque
   *   toujours.
   *
   * ⚠️ C'est l'UNIQUE réglage qui décide entre les deux modes, et aucun autre
   * comportement ne s'y accroche. Si un jour on veut y suspendre une deuxième
   * règle, c'est qu'il faut une deuxième case.
   *
   * ⚠️ Conséquence assumée du mode coché : un bâtiment qui a 1 unité sur 100 la
   * consomme à chaque cycle et ne produit rien (arrondi vers le bas). C'est
   * pour ça que ce n'est pas le défaut.
   */
  demarre_partiel: boolean;
  /**
   * Ce que le palier demande en ressources. Le champ `mode` dit **quand** :
   * `paye` à la construction, `mobilise` tant que ça tourne. Une seule liste en
   * base, deux sections à l'écran.
   */
  cout: LigneCout[];
  /** Ce qu'il consomme à chaque cycle. Rien n'est prélevé en veille. */
  utilisation: LigneFlux[];
  /** Ce qu'il livre à chaque cycle. Rien n'est produit en veille. */
  production: LigneProduction[];
}

/*
 * ⚠️ Un palier a porté `indicateur` et `plancher_efficacite` le 26/08, retirés
 * le jour même, puis ses consommations des `part` de satisfaction jusqu'au
 * 11/09. Tout ce vocabulaire est mort avec la décision du 11/09 (§5.4) : la
 * satisfaction NE SE DÉCLARE PAS, elle se CONSTATE — `servi / demandé`, sur
 * tout bâtiment qui consomme. Il n'y a plus rien à saisir pour elle.
 */

/** Ce qui est payé une fois, à la construction. */
export function coutConstruction(p: Palier): LigneCout[] {
  return p.cout.filter((l) => l.mode === "paye");
}

/**
 * La vitesse de navette qu'une règle NEUVE reçoit dans le formulaire :
 * **1 cran toutes les 20 s**, choisie par l'utilisateur le 2026-09-06.
 *
 * ⚠️ Ce n'est PLUS un défaut de LECTURE (2026-09-08 : *« règle sans vitesse
 * est une erreur »*). Une règle en base à qui il manque `vitesse` ou `debit`
 * est lue avec des zéros ET marquée `erreur` — elle s'affiche en rouge et ne
 * circule pas, jusqu'à ce qu'on l'enregistre avec des chiffres choisis.
 */
export const CRANS_INITIAL = 1;
export const PERIODE_VITESSE_INITIALE = 20;

export function palierVide(numero: number): Palier {
  return {
    niveau: numero,
    duree_construction_s: 0,
    cycle_minutes: 0,
    demarre_partiel: false,
    cout: [],
    utilisation: [],
    production: [],
  };
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
 * ressources fait **attendre** le cycle (§2), elle n'éteint rien. Un problème,
 * un mécanisme.
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
  const texte = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    niveau: entier(o.niveau) || position,
    duree_construction_s: Math.max(0, entier(o.duree_construction_s)),
    cycle_minutes: Math.max(0, entier(o.cycle_minutes)),
    demarre_partiel: o.demarre_partiel === true,
    cout: Array.isArray(o.cout)
      ? o.cout.map((l) => ({
          ressource: texte(l?.ressource),
          quantite: Math.max(0, entier(l?.quantite)),
          mode: l?.mode === "mobilise" ? "mobilise" : "paye",
        }))
      : [],
    // ⚠️ Seuls les champs du modèle à cycles sont lus : un `par_minute` ou une
    // `part` d'avant le 11/09 n'est PAS converti, la ligne revient à 0 par
    // cycle et l'écran le dit (voir le commentaire de `LigneFlux`).
    utilisation: Array.isArray(o.utilisation)
      ? o.utilisation.map((l) => ({
          ressource: texte(l?.ressource),
          quantite: Math.max(0, entier(l?.quantite)),
          direct: l?.direct === true,
          // §5.5 — absent (tout le catalogue d'avant le 13/09) = 0, c'est-a-dire
          // une ligne ordinaire. Rien a migrer.
          bonus: Math.max(0, entier(l?.bonus)),
          // Les DEUX formats de proximité sont relus : l'objet unique d'avant
          // le 30/08 et la liste d'aujourd'hui.
          proximites: normaliserProximites(l),
        }))
      : [],
    production: Array.isArray(o.production)
      ? o.production.map((l) => ({
          ressource: texte(l?.ressource),
          quantite: Math.max(0, entier(l?.quantite)),
          tranches: normaliserTranches(l),
          indicateur: texte(l?.indicateur),
          proximites: normaliserProximites(l),
        }))
      : [],
  };
}

/** Une ligne qui AGIT : elle nomme une ressource et en demande au moins une. */
function ligneQuiAgit(l: { ressource: string; quantite: number }): boolean {
  return l.ressource !== "" && l.quantite > 0;
}

/**
 * Vrai si le palier consomme ou produit quelque chose — donc s'il lui faut un
 * cycle. Jugé sur les lignes qui PARTIRONT en base (`ligneQuiAgit`), exactement
 * comme le serveur le juge sur ce qu'il reçoit : une ligne à 0 retirée à
 * l'enregistrement ne doit pas exiger un cycle qu'il ne demandera pas.
 */
export function palierTourne(p: Palier): boolean {
  return p.utilisation.some(ligneQuiAgit) || p.production.some(ligneQuiAgit);
}

/** Un entier positif ou nul — la seule forme d'une quantité depuis le 11/09 (§3). */
function entierPositif(v: number): boolean {
  return Number.isInteger(v) && v >= 0;
}

/**
 * **Ce que le serveur REFUSERAIT de charger**, en français — donc ce qui bloque
 * l'enregistrement. Liste vide = le palier passe.
 *
 * ⚠️ Rouge et BLOQUANT, contrairement aux avertissements orange de l'écran :
 * chacune de ces fautes fait refuser la tuile par
 * `pb_hooks/moteur/cycles/tuiles.js` (`chargerTuile` / `chargerLigne`), et une
 * tuile refusée ne se voit qu'en jeu, par un bâtiment qui ne fait rien.
 * Enregistrer quand même ne rendrait service à personne.
 */
export function erreursPalier(p: Palier): string[] {
  const erreurs: string[] = [];
  if (palierTourne(p) && !(Number.isInteger(p.cycle_minutes) && p.cycle_minutes >= 1)) {
    erreurs.push(
      "il consomme ou produit sans cycle : déclare sa durée, un entier de minutes ≥ 1.",
    );
  }
  const quantites = [...p.cout, ...p.utilisation, ...p.production];
  if (quantites.some((l) => !entierPositif(l.quantite))) {
    erreurs.push("une quantité n'est pas un entier ≥ 0.");
  }
  for (const l of p.production.filter(ligneQuiAgit)) {
    if (l.indicateur !== "" && l.tranches.length === 0) {
      erreurs.push(
        `la production « ${l.ressource} » suit l'indicateur « ${l.indicateur} » sans aucune tranche.`,
      );
    }
  }
  return erreurs;
}

/** Les erreurs de TOUS les paliers, préfixées de leur numéro — pour le bas de la fenêtre. */
export function erreursPaliers(paliers: Palier[]): string[] {
  return paliers.flatMap((p, i) => erreursPalier(p).map((e) => `Palier ${i + 1} : ${e}`));
}

/**
 * Un palier tel qu'il PART en base : `cycle_minutes` n'y figure que si le
 * palier tourne, et une consommation seule porte `direct`.
 */
export type PalierEnregistre = Omit<Palier, "cycle_minutes"> & { cycle_minutes?: number };

/**
 * Renumérotation de sécurité avant l'envoi : la position dans le tableau et le
 * champ `niveau` restent d'accord. Les lignes sans ressource ou à 0 par cycle
 * sont écartées — le jeu les ignorerait, autant ne pas laisser croire qu'elles
 * agissent. L'écran les signale en orange AVANT, pour que rien ne disparaisse
 * sans avoir été dit.
 */
export function paliersPourEnregistrer(paliers: Palier[]): PalierEnregistre[] {
  return paliers.map((p, i) => {
    const sortie: PalierEnregistre = {
      niveau: i + 1,
      duree_construction_s: Math.max(0, Math.trunc(p.duree_construction_s || 0)),
      demarre_partiel: p.demarre_partiel === true,
      cout: p.cout.filter(ligneQuiAgit),
      utilisation: p.utilisation.filter(ligneQuiAgit).map((l) => ({
        ressource: l.ressource,
        quantite: l.quantite,
        direct: l.direct === true,
        bonus: Math.max(0, Math.trunc(l.bonus || 0)),
        // Une proximite ouverte puis abandonnee n'est pas une regle : elle part
        // ici, plutot que d'aller occuper une place en base.
        proximites: l.proximites.filter(proximitePosee),
      })),
      production: p.production.filter(ligneQuiAgit).map((l) => ({
        ressource: l.ressource,
        quantite: l.quantite,
        indicateur: l.indicateur,
        // ⚠️ Sans indicateur, l'escalier ne cadence rien (« une ligne a UN
        // cadenceur ») : il part ici plutôt que de dormir en base, lu par
        // personne. Trié à l'enregistrement : le jeu lit un escalier déjà
        // ordonné, il n'a pas à re-trier pour tomber sur le même rendement.
        tranches: l.indicateur === "" ? [] : tranchesTriees(l.tranches),
        proximites: l.proximites.filter(proximitePosee),
      })),
    };
    if (palierTourne(p)) sortie.cycle_minutes = p.cycle_minutes;
    return sortie;
  });
}

/**
 * « par cycle de 2 min » — le rythme d'un palier, lu en français. C'est ce
 * qui remplace les « / min » du modèle à débit : une quantité n'a de sens
 * qu'avec la durée du cycle qui la livre.
 */
export function libelleCycle(p: Pick<Palier, "cycle_minutes">): string {
  return p.cycle_minutes >= 1
    ? `par cycle de ${formatDuree(p.cycle_minutes * 60)}`
    : "par cycle (durée non déclarée)";
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
 * ⚠️ **La quantité déclarée d'une ligne de production est un MAXIMUM**, jamais
 * une garantie. Dans le modèle à cycles (§4, tranché le 11/09) :
 *
 * ```
 * ligne ordinaire          livre  quantité × satisfaction du bâtiment
 * ligne qui suit un indice livre  quantité × rendement de sa tranche
 *                          — arrondi vers le bas, jamais les deux à la fois
 * ```
 *
 * `satisfaction = servi / demandé`, sur toutes ses lignes de consommation.
 *
 * ⚠️ **Le cycle ne démarre qu'avec TOUT ce qu'il demande** (§2), sauf si le
 * palier coche « démarre avec ce qu'il y a ». Sinon il ATTEND, inerte, et quand
 * ça débloque il repart pour UN cycle : le temps d'arrêt est perdu, on ne
 * rattrape pas soixante cycles d'un coup. La satisfaction partielle existe
 * quand même dans le mode par défaut — un cycle parti complet peut finir court
 * si une navette vide le coffre pendant qu'il tourne.
 *
 * ⚠️ C'est la règle « une ligne a UN cadenceur » qui empêche le mode « démarre
 * avec ce qu'il y a » de fabriquer de la matière : sans elle, un four avec 1
 * blé sur 10 sortirait un pain entier à chaque cycle.
 *
 * ⚠️ Et il reste la porte : **sans main-d'œuvre mobilisée, production nulle**.
 *
 * ⚠️ **Une ligne de production n'a ni cible ni rayon** : un producteur ne livre
 * pas, il fabrique dans son propre coffre et c'est le preneur qui vient, avec
 * SON rayon. C'est le cas de la ferme dont l'entrepôt ramasse la récolte.
 */
export const FORMULE_PRODUCTION =
  "quantité par cycle × satisfaction du bâtiment — ou × rendement de la tranche si la ligne suit un indicateur, jamais les deux — arrondi vers le bas";

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

/**
 * ⚠️ **DANS QUEL ORDRE UNE NAVETTE DÉPENSE SES CRANS**, posé par l'utilisateur
 * le 2026-09-06 : *« les cibles les plus remplies en premier »*.
 *
 * Cette règle n'existait pas avant : le budget d'une règle était une quantité
 * indifférente à la distance, donc l'ordre des cibles ne changeait rien et un
 * simple tri par (z, x) suffisait à rester déterministe. Depuis que **la
 * distance coûte des crans**, servir une cible en prive une autre — l'ordre
 * devient une règle de jeu.
 *
 * ⚠️ La **flotte**, elle, ne se dispute pas : depuis le 07/09 chaque cible à
 * portée a sa part fixe (`navettes / N`), parce que toute allocation qui lit le
 * stock pour choisir sa cible s'est révélée non invariante aux cadences. Ce
 * qui se partage encore, c'est le **coffre du preneur** (il se remplit une
 * fois pour toutes) et le **stock d'une source** que plusieurs preneurs se
 * disputent. L'ordre décide donc encore qui est servi.
 *
 * - **À la récolte** : les sources les plus REMPLIES d'abord. Un preneur au
 *   coffre presque plein le remplit de la source la mieux garnie, pas de celle
 *   qui n'a que deux unités.
 * - **À la livraison** : les destinations les plus EN MANQUE d'abord — le
 *   symétrique, validé le même jour. Servir « les plus remplies » aurait
 *   nourri ceux qui ont déjà du stock.
 * - **À égalité**, (z, x), comme partout : deux parties identiques doivent
 *   donner exactement le même résultat.
 */
export const ORDRE_DES_CIBLES =
  "à la récolte les sources les plus remplies, à la livraison les cibles les plus en manque, puis (z, x)";

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
   * La **flotte** : `navettes` navettes qui portent chacune `quantite` par
   * voyage. Une volée complète rapporte donc `navettes × quantite`.
   *
   * ⚠️ **`periode_s` a été RETIRÉ le 2026-09-06.** La cadence ne se saisit
   * plus ici : elle se DÉDUIT du trajet, donc de `vitesse` et de la distance
   * jusqu'à la cible. Décision de l'utilisateur, ses mots : *« enlève les
   * 120 s, c'est remplacé par 1 cran / 20 s ; quand une navette est dispo dans
   * le bâtiment elle peut repartir »*. Un débit fixe et une vitesse auraient
   * été deux cadences concurrentes dans le même bloc, et le joueur n'aurait
   * jamais su laquelle bride.
   */
  debit: { navettes: number; quantite: number };
  /**
   * ⚠️ **LA DISTANCE COMPTE, depuis le 2026-09-06.** `crans` cases franchies
   * toutes les `periode_s` secondes. **Un cran = une case.** Une navette fait
   * l'**aller-retour** : une cible à `d` cases coûte `2d` crans. À 1 cran /
   * 20 s, une cible à 4 cases occupe une navette 160 s.
   *
   * ⚠️⚠️ **« 2 navettes en tout, flotte PARTAGÉE » (2026-09-07).** `navettes`
   * est un PLAFOND : la flotte se répartit **à parts égales entre les N cibles
   * à portée** de la règle — géométrie seule, jamais le stock. La cible i
   * reçoit un aller-retour toutes les `2 d_i × periode_s × N / (crans ×
   * navettes)` secondes. Le modèle du 06/09, où chaque cible avait sa propre
   * flotte (10 sources = 10 flottes), est REFUSÉ ; un budget commun que les
   * cibles se disputent a été mesuré non invariant aux cadences (700 / 480 /
   * 700). Le moteur qui fait foi : `pb_hooks/moteur/acheminement.js`.
   *
   * ⚠️ Ceci **renverse** la note fondatrice « les navettes ne sont qu'une
   * animation » : elles restent sans pathfinding et sans agent déplacé, mais
   * elles ne sont plus décoratives — leur vitesse entre dans la comptabilité.
   * La forme close est préservée parce que le moteur ne compte pas une durée :
   * il compte des **crans** franchis en temps absolu, exactement comme il
   * comptait des périodes (`temps.ticks`).
   *
   * ⚠️ **`crans: 0` = navette bloquée, rien ne circule.** C'est le seul zéro
   * indulgent qui a été retiré : l'ancien « débit non renseigné = illimité »
   * disparaît en même temps, pour qu'un zéro veuille dire la même chose
   * partout dans ce bloc.
   */
  vitesse: { crans: number; periode_s: number };
  /**
   * **Sans limite** (2026-09-08, *« oui, le permettre au cas où »*) : ni
   * flotte ni trajet, tout ce qui est à portée part dans la passe. C'est un
   * drapeau EXPLICITE — la seule écriture de l'illimité depuis que « débit non
   * renseigné = illimité » a été supprimé le 06/09. Coché, `debit` et
   * `vitesse` ne sont pas enregistrés du tout.
   */
  illimite: boolean;
  /**
   * Posé à la LECTURE seulement, quand la règle en base n'a ni `illimite` ni
   * `debit` + `vitesse` complets : une erreur de saisie, pas un réglage. Elle
   * s'affiche en rouge, le moteur la signale dans ses alertes et ne la fait
   * pas circuler. Enregistrer la règle (avec des chiffres, ou « sans limite »)
   * la guérit — `logistiquePourEnregistrer` ne recopie jamais ce champ.
   */
  erreur?: string;
}

/** Ce qu'une volée de navettes rapporte en UN voyage : navettes × quantité. */
export function chargeParVolee(r: RegleAppro): number {
  if (r.illimite) return Infinity;
  return Math.max(0, r.debit.navettes) * Math.max(0, r.debit.quantite);
}

/**
 * Les secondes qu'il faut pour franchir UN cran. `null` = navette bloquée
 * (0 cran par période) — le seul cas où une règle ne transporte rien du tout.
 */
export function secondesParCran(r: RegleAppro): number | null {
  if (r.illimite) return 0;
  const crans = Math.max(0, r.vitesse.crans);
  if (crans <= 0) return null;
  return Math.max(1, r.vitesse.periode_s) / crans;
}

/**
 * Le coût d'un voyage vers une cible à `distance` cases, en crans.
 *
 * ⚠️ **Aller-RETOUR** : `2 × distance`. Une navette doit rentrer au bâtiment
 * avant de repartir — c'est ce qui fait qu'une cible lointaine est servie
 * moins souvent. Une cible sur sa propre case n'existe pas — le plancher est 1.
 *
 * ⚠️ C'est le coût en crans d'UN voyage, indépendant de la flotte. Ce que la
 * cible reçoit vraiment dépend du partage de la flotte — voir `dureeTrajet`.
 */
export function cransParTrajet(distance: number): number {
  return 2 * Math.max(1, Math.trunc(distance));
}

/**
 * La durée entre deux aller-retours vers UNE cible à `distance` cases, en
 * secondes, quand la règle voit `nCibles` cibles à portée.
 *
 * ⚠️⚠️ **La flotte se partage à parts égales (07/09)** : `navettes` est un
 * plafond, chaque cible en reçoit `navettes / nCibles`. La formule du moteur
 * (`pb_hooks/moteur/acheminement.js`) est
 * `T = 2 d × periode_s × nCibles / (crans × navettes)` — c'est exactement
 * celle-ci, et c'est la seule que le site montre : afficher la cadence « pour
 * une seule cible » laissait croire que chaque ferme avait toute la flotte,
 * le modèle mort du 06/09.
 *
 * Le site ne connaît pas le plateau, donc pas N : il montre plusieurs N à
 * titre de repère (`ApercuTrajets`). `null` = navette bloquée ou aucune
 * navette, rien ne circule.
 */
export function dureeTrajet(r: RegleAppro, distance: number, nCibles = 1): number | null {
  if (r.illimite) return 0;
  const parCran = secondesParCran(r);
  const navettes = Math.max(0, r.debit.navettes);
  if (parCran === null || navettes <= 0) return null;
  return (cransParTrajet(distance) * parCran * Math.max(1, nCibles)) / navettes;
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
    debit: { navettes: 1, quantite: 10 },
    vitesse: { crans: CRANS_INITIAL, periode_s: PERIODE_VITESSE_INITIALE },
    illimite: false,
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

/**
 * `illimite`, `debit`, `vitesse` et `erreur` d'une règle lue en base.
 *
 * ⚠️ PLUS AUCUN DÉFAUT (2026-09-08). Le « absent = 1 cran / 20 s » du 06/09
 * ne servait qu'à rattraper les règles d'avant le champ ; elles portent toutes
 * une vitesse explicite depuis le patch du 07/09. Un bloc manquant est
 * maintenant une ERREUR DE SAISIE, lue avec des zéros (rien ne circule) et
 * dite en rouge — jamais complétée en silence. ZÉRO SAISI reste distinct :
 * c'est un choix (« navette bloquée »), signalé en orange, pas en rouge.
 */
function lireFlotte(
  r: Partial<RegleAppro> | undefined,
  entier: (v: unknown) => number,
): Pick<RegleAppro, "illimite" | "debit" | "vitesse" | "erreur"> {
  const renseigne = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  if (r?.illimite === true) {
    return { illimite: true, debit: { navettes: 0, quantite: 0 }, vitesse: { crans: 0, periode_s: 1 } };
  }
  const deb = r?.debit;
  const vit = r?.vitesse;
  let erreur: string | undefined;
  if (!deb || !renseigne(deb.navettes) || !renseigne(deb.quantite)) {
    erreur = "débit non renseigné en base (navettes et quantité par voyage)";
  } else if (!vit || !renseigne(vit.crans) || !renseigne(vit.periode_s)) {
    erreur = "vitesse non renseignée en base (crans et période)";
  }
  if (erreur) {
    return { illimite: false, erreur, debit: { navettes: 0, quantite: 0 }, vitesse: { crans: 0, periode_s: 1 } };
  }
  return {
    illimite: false,
    debit: { navettes: Math.max(0, entier(deb!.navettes)), quantite: Math.max(0, entier(deb!.quantite)) },
    vitesse: { crans: Math.max(0, entier(vit!.crans)), periode_s: Math.max(1, entier(vit!.periode_s)) },
  };
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
          ...lireFlotte(r as Partial<RegleAppro>, entier),
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
/** Une règle telle qu'elle part en base : `illimite` seul, OU `debit` + `vitesse`. */
export type RegleApproEnregistree = Omit<RegleAppro, "debit" | "vitesse" | "illimite" | "erreur"> &
  ({ illimite: true } | { debit: RegleAppro["debit"]; vitesse: RegleAppro["vitesse"] });

export type LogistiqueEnregistree = Omit<Logistique, "appros"> & { appros: RegleApproEnregistree[] };

export function logistiquePourEnregistrer(l: Logistique): LogistiqueEnregistree {
  return {
    // Un plafond nul ne dit rien : on jette la ligne plutot que de laisser
    // croire que la ressource est stockee.
    stockage: l.stockage.filter((x) => x.ressource !== "" && x.max > 0),
    appros: l.appros
      .filter((r) => r.cible === "tout" || r.tileIds.length > 0)
      // ⚠️ `erreur` ne part JAMAIS en base : enregistrer, c'est guérir. Et une
      // règle « sans limite » n'emporte ni flotte ni vitesse — c'est le
      // drapeau seul que le moteur lit.
      .map(({ debit, vitesse, illimite, erreur: _erreur, ...reste }) =>
        illimite ? { ...reste, illimite: true as const } : { ...reste, debit, vitesse },
      ),
    // On garde la case cochée telle quelle : la décocher toute seule parce
    // qu'aucun plafond n'est encore saisi ferait perdre le réglage entre deux
    // enregistrements, sans rien dire.
    stock_commun: l.stock_commun === true,
  };
}

/**
 * Vrai si la règle ne dit rien d'utile — signalée en orange, ignorée en jeu.
 *
 * ⚠️ **L'INDULGENCE A ÉTÉ RETIRÉE le 2026-09-06.** Un débit à zéro valait
 * « illimité » depuis le 26/08 (« une règle saisie trop vite serait sinon
 * morte en silence »). Impossible à garder à côté de `crans: 0` qui, lui,
 * BLOQUE : deux zéros voisins dans le même bloc de formulaire auraient eu des
 * sens opposés. Un zéro veut désormais dire « rien ne circule », partout, et
 * le témoin orange le dit à l'écran plutôt que de le deviner.
 */
export function regleApproUtile(r: RegleAppro): boolean {
  if (r.cible === "tuiles" && r.tileIds.length === 0) return false;
  if (r.erreur) return false;
  if (r.illimite) return true;
  if (secondesParCran(r) === null) return false;
  return chargeParVolee(r) > 0;
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
  const combien = r.illimite
    ? "sans limite : ni flotte ni trajet, tout ce qui est à portée part dans la passe"
    : secondesParCran(r) === null
      ? "navette bloquée (0 cran par période)"
      : chargeParVolee(r) <= 0
        ? "aucune navette, ou rien par voyage : rien ne circule"
        : `${r.debit.navettes} navette${r.debit.navettes > 1 ? "s" : ""} × ${r.debit.quantite} = ` +
        `${chargeParVolee(r)} par voyage, à ${r.vitesse.crans} cran${
          r.vitesse.crans > 1 ? "s" : ""
        } / ${formatDuree(r.vitesse.periode_s)} aller-retour ` +
        `(flotte partagée : à 1 case, chaque cible reçoit ${r.debit.quantite} toutes les ` +
        `${formatDuree(Math.round(dureeTrajet(r, 1, 1) as number))} si elle est seule, ` +
        `${formatDuree(Math.round(dureeTrajet(r, 1, 5) as number))} à 5 cibles à portée)`;
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
  /**
   * **Le modèle de plateau auquel ce record est rattaché** (13/09) — id d'un
   * record `templates`.
   *
   * ⚠️⚠️ Il ne dit PAS où la tuile se joue : ça, c'est `typeOfPlateau`, et le
   * moteur ne lit que celui-là. Celui-ci dit **qui a le droit d'écrire** —
   * l'admin, et les joueurs listés dans `templates.partages` de ce modèle.
   *
   * ⚠️ **Optionnel, et ça compte** : aucun record d'avant le patch du 13/09 ne
   * le porte. Absent = rattaché à rien, donc visible du seul admin — lire par
   * `rattachementDe()`, jamais à cru.
   */
  rattachement?: string;
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
  /** Tels qu'ils PARTENT en base : `cycle_minutes` seulement sur un palier qui tourne. */
  niveaux: PalierEnregistre[];
  /** Telle qu'elle PART en base : une règle « sans limite » n'emporte ni flotte ni vitesse. */
  logistique: LogistiqueEnregistree;
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
 * Les tuiles rangées par NOM, pour les listes déroulantes de saisie.
 *
 * ⚠️ À ne pas confondre avec le tri de `loadTuiles()`, qui suit le `tileId` :
 * celui-là est l'ordre du catalogue, et les écrans qui le montrent (la liste
 * des tuiles, les cases à cocher de `ChoixTuiles`) doivent le garder tel quel.
 * Dans un `<select>`, en revanche, on cherche un nom : il faut l'alphabet.
 *
 * `localeCompare` en français : les accents ne partent pas en fin de liste.
 */
export function tuilesParAlphabet(tuiles: Tuile[]): Tuile[] {
  return [...tuiles].sort((a, b) =>
    (a.nom ?? "").localeCompare(b.nom ?? "", "fr", { sensitivity: "base" }),
  );
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
      // Et les proximités, des DEUX côtés : « 5 pâturages à 2 cases ».
      paliersDe(t).some((p) =>
        [...p.utilisation, ...p.production].some((l) =>
          l.proximites.some((x) => proximiteUtile(x) && x.tileIds.includes(tileId)),
        ),
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

// --- Categories --------------------------------------------------------------

/**
 * Le separateur entre deux categories d'une MEME tuile.
 *
 * ⚠️ **Decision du 2026-08-30 : une tuile peut porter PLUSIEURS categories**,
 * et elles sont TOUTES EGALES — aucune n'est « la principale ». Elles tiennent
 * dans le champ texte `tuiles.categorie` deja en base, separees par une
 * virgule : « Vivres, Confort ». Aucun champ nouveau, aucune migration, et une
 * tuile qui n'en a qu'une reste ecrite exactement comme avant.
 *
 * ⚠️ Consequence assumee, dite par l'utilisateur : dans le magasin, une tuile
 * apparait sous CHACUN de ses onglets. La somme des comptes d'onglets depasse
 * donc le total — c'est l'onglet « Tout » qui garde le nombre exact de
 * batiments, et lui seul compte des tuiles distinctes.
 *
 * ⚠️ Une categorie ne peut donc pas contenir de virgule. Le formulaire la
 * refuse a la saisie ; ne pas contourner ca en changeant le separateur ici
 * seulement — la meme decoupe existe en C# (`Categories.cs`) et les deux
 * doivent rester d'accord.
 */
export const SEPARATEUR_CATEGORIES = ",";

/**
 * Les categories d'une tuile, dans l'ordre saisi, nettoyees et sans doublon.
 * Une tuile sans categorie rend un tableau VIDE : c'est a l'ecran de decider
 * comment il nomme ce cas (« Divers » en jeu, `SANS_CATEGORIE` sur le site).
 */
export function categoriesDe(
  tuile: { categorie?: string } | string | null | undefined,
): string[] {
  const brut = typeof tuile === "string" ? tuile : (tuile?.categorie ?? "");
  const vues = new Set<string>();
  const liste: string[] = [];
  for (const morceau of brut.split(SEPARATEUR_CATEGORIES)) {
    const c = morceau.trim();
    if (c === "") continue;
    const cle = c.toLocaleLowerCase("fr");
    if (vues.has(cle)) continue;
    vues.add(cle);
    liste.push(c);
  }
  return liste;
}

/** Ce qui part en base : la liste remise en une ligne, nettoyee au passage. */
export function categoriesVersTexte(categories: string[]): string {
  return categoriesDe(categories.join(SEPARATEUR_CATEGORIES)).join(SEPARATEUR_CATEGORIES + " ");
}

/**
 * Toutes les categories deja employees par le catalogue, triees.
 *
 * Sert au formulaire, qui les propose en cases a cocher : c'est le seul moyen
 * d'eviter qu'une 141e tuile inaugure « Habitations » a cote d'« Habitat ».
 * Le dedoublonnage est insensible a la casse — deux orthographes qui ne
 * different QUE par la casse sont la meme categorie, ici comme en jeu.
 */
export function toutesLesCategories(tuiles: { categorie?: string }[]): string[] {
  const par = new Map<string, string>();
  for (const t of tuiles)
    for (const c of categoriesDe(t)) {
      const cle = c.toLocaleLowerCase("fr");
      if (!par.has(cle)) par.set(cle, c);
    }
  return [...par.values()].sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * La meme liste, avec `ancienne` renommee en `nouvelle` — ou RETIREE quand
 * `nouvelle` vaut `null`.
 *
 * ⚠️ **Renommer vers un nom deja porte est une FUSION**, et c'est voulu : c'est
 * exactement ce qui repare `Nourriture` / `Vivres`. Le dedoublonnage de
 * `categoriesDe` s'en charge — sans lui, une tuile qui portait les deux se
 * retrouverait avec « Vivres, Vivres ».
 *
 * ⚠️ La comparaison est insensible a la casse, comme partout ailleurs : c'est
 * ce qui permet de normaliser `PRODUCTION` en `Production`, qui est le cas le
 * plus courant et serait sinon refuse comme « meme nom ».
 */
export function categoriesRenommees(
  categories: string[],
  ancienne: string,
  nouvelle: string | null,
): string[] {
  const cle = ancienne.toLocaleLowerCase("fr");
  const apres: string[] = [];
  for (const c of categories) {
    if (c.toLocaleLowerCase("fr") !== cle) {
      apres.push(c);
      continue;
    }
    if (nouvelle !== null) apres.push(nouvelle);
  }
  return categoriesDe(apres.join(SEPARATEUR_CATEGORIES));
}

/**
 * Ce qu'il faut ecrire dans le champ `categorie` de cette tuile pour y renommer
 * (ou en retirer) une categorie — et **`null` si elle ne la portait pas**.
 *
 * Le `null` n'est pas un detail : c'est lui qui dit a l'appelant de ne PAS
 * ecrire. Renommer une categorie portee par 2 tuiles doit envoyer 2 requetes,
 * pas 141.
 */
export function categorieRenommeeDans(
  tuile: { categorie?: string },
  ancienne: string,
  nouvelle: string | null,
): string | null {
  const cle = ancienne.toLocaleLowerCase("fr");
  const avant = categoriesDe(tuile);
  if (!avant.some((c) => c.toLocaleLowerCase("fr") === cle)) return null;
  return categoriesVersTexte(categoriesRenommees(avant, ancienne, nouvelle));
}

/** Combien de tuiles du catalogue portent cette categorie. */
export function tuilesPortant(tuiles: { categorie?: string }[], categorie: string): number {
  const cle = categorie.toLocaleLowerCase("fr");
  let n = 0;
  for (const t of tuiles)
    if (categoriesDe(t).some((c) => c.toLocaleLowerCase("fr") === cle)) n += 1;
  return n;
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
