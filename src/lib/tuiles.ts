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
export interface LigneFlux {
  ressource: string;
  quantite: number;
  periode_s: number;
}

export function fluxVide(ressource: string): LigneFlux {
  return { ressource, quantite: 1, periode_s: PERIODE_PAR_DEFAUT };
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
  return { niveau: numero, duree_construction_s: 0, cout: [], utilisation: [] };
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
export type SensAppro = "entrant" | "sortant";

/**
 * ⚠️ Les libellés ont changé le 26/08 : « je reçois de » / « je fournis » sont
 * devenus **« je prends » / « je produis »**, mot de l'utilisateur. Les valeurs
 * stockées, elles, restent `entrant` / `sortant` — renommer les données pour
 * suivre un libellé d'écran ne vaut jamais la migration qu'elle coûte.
 */
export const SENS_APPRO: { valeur: SensAppro; libelle: string; aide: string }[] = [
  { valeur: "entrant", libelle: "je prends", aide: "la ressource vient jusqu'ici" },
  {
    valeur: "sortant",
    libelle: "je produis",
    aide: "la tuile fabrique la ressource, et la rend disponible dans son rayon",
  },
];

/**
 * ⚠️ **« je produis » EST la déclaration de production.** Décidé le 26/08 : le
 * débit d'une règle `sortant` n'est pas seulement un circuit de distribution,
 * c'est **combien la tuile fabrique**. Et ce chiffre est un **maximum** :
 *
 * ```
 * production réelle = débit déclaré
 *                   × couverture des intrants   (0 → 1)
 *                   × satisfaction du plateau   (0 → 1)
 * ```
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
 * ⚠️ Un `rayon` de **0** est légitime et utile ici : « je produis chez moi et
 * je ne livre personne — on vient m'y chercher ». C'est le cas de la ferme dont
 * l'entrepôt vient ramasser la récolte.
 */
export const FORMULE_PRODUCTION =
  "débit déclaré × couverture des intrants × satisfaction du plateau";

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
   * Le **rayon de récolte** (`entrant`) ou d'**envoi** (`sortant`), en distance
   * hexagonale. ⚠️ `null` = **tout le plateau**. Jamais `0` pour ça : zéro a
   * déjà le sens légitime de « la case elle-même ».
   */
  rayon: number | null;
  /** ⚠️ **Liste vide = toutes les ressources.** Sinon, seulement celles-ci. */
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
  /**
   * `sortant` seulement : **la satisfaction du plateau s'applique-t-elle à
   * cette production ?**
   *
   * Demandé par l'utilisateur le 26/08 — *« et on choisit si la satisfaction
   * entre en compte ou non »*. Coché (le défaut), la production est multipliée
   * par la satisfaction ; décoché, elle n'en dépend pas.
   *
   * ⚠️ **C'est le garde-fou contre la spirale, réduit à une case à cocher.**
   * Décoche-la sur les fermes et elles continuent de nourrir même quand tout va
   * mal ; laisse-la sur l'industrie et elle tousse avec le reste. Sans au moins
   * une production insensible quelque part, la boucle
   * `satisfaction → production → nourriture → satisfaction` s'effondre toute
   * seule pendant que le joueur dort, et il ne peut plus rien reconstruire
   * puisque construire coûte ce qu'il ne produit plus.
   *
   * C'est la version simple du `plancher_efficacite` en pourcentage, conçu puis
   * retiré le même jour — voir [[sysb-satisfaction-v2]]. Un booléen suffit tant
   * qu'on n'a pas besoin d'un « à moitié soumis ».
   */
  soumis_satisfaction: boolean;
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
    // Recevoir suppose d'aller chercher, donc une portee ; fournir se fait a
    // l'echelle du plateau, comme un entrepot qui dessert tout le monde.
    rayon: sens === "entrant" ? 3 : null,
    ressources: [],
    debit: { navettes: 1, quantite: 10, periode_s: PERIODE_PAR_DEFAUT },
    soumis_satisfaction: true,
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
}

export function logistiqueVide(): Logistique {
  return { stockage: [], appros: [] };
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
    stockage: Array.isArray(l.stockage)
      ? l.stockage
          .filter((x) => x && typeof x.ressource === "string" && x.ressource !== "")
          .map((x) => ({ ressource: x.ressource, max: Math.max(0, entier(x.max)) }))
      : [],
    appros: Array.isArray(l.appros)
      ? l.appros.map((r) => ({
          sens: r?.sens === "sortant" ? ("sortant" as const) : ("entrant" as const),
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
          // Absent = soumis : le defaut doit etre le cas ordinaire, pas
          // l'exception. Une regle ancienne relue reste donc soumise.
          soumis_satisfaction: r?.soumis_satisfaction !== false,
        }))
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
    : `Produit ${quoi} pour ${qui} ${ou} — ${combien}.`;
}

/** Une tuile qui reçoit ET fournit : c'est ce qu'on appelle un entrepôt. */
export function estEntrepot(l: Logistique): boolean {
  return (
    l.appros.some((r) => r.sens === "entrant") && l.appros.some((r) => r.sens === "sortant")
  );
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
