// ============================================================
//  conception.ts
//  QUI CONÇOIT QUOI (15/09) — l'admin range le jeu, le joueur conçoit sa
//  planète.
//
//  Décisions de Guillaume :
//    · le joueur crée SES tuiles, SES ressources et SES technos, sur SA
//      planète, et ses tuiles n'utilisent QUE les siennes ;
//    · il MODIFIE ses deux modèles de plateau (ground, space), il n'en crée
//      ni n'en supprime ;
//    · l'admin fixe des LIMITES (onglet Limites), pour tous ou joueur par
//      joueur : taille des plateaux, nombre de tuiles / ressources / technos.
//
//  ⚠️ CE FICHIER CACHE ET PROPOSE, IL NE PROTÈGE RIEN. Les refus vivent dans
//  les règles d'API (`patch-conception-joueur-2026-09-15.js`) et dans le
//  serveur Go (`routes/conception.go`, `routes/catalogue_planete.go`). Les
//  fonctions ci-dessous en sont le MIROIR — mêmes cas, mêmes essais — pour que
//  le site ne propose jamais ce que le serveur refuserait.
// ============================================================

import { NOM_GAME, estPlaneteGame, type Planete } from "@/lib/planetes";

export const COLLECTION_LIMITES = "limites";

/** Une fiche de l'onglet Limites. */
export type FicheLimites = {
  id: string;
  nom: string;
  /** Vaut pour tous les joueurs qu'aucune fiche ne nomme. */
  general: boolean;
  /** Les joueurs nommés — relation multiple → `users`. */
  joueurs: string[];
  largeur_max: number;
  hauteur_max: number;
  tuiles_max: number;
  ressources_max: number;
  technos_max: number;
  created?: string;
  updated?: string;
};

export type ValeursLimites = Omit<FicheLimites, "id" | "created" | "updated">;

/** Ce qu'un joueur peut concevoir. 0 = rien. */
export interface Limites {
  largeur_max: number;
  hauteur_max: number;
  tuiles_max: number;
  ressources_max: number;
  technos_max: number;
  /** D'où elles viennent : une fiche qui le nomme, la générale, ou aucune. */
  source: "joueur" | "general" | "aucune";
}

export const AUCUNE_LIMITE: Limites = {
  largeur_max: 0,
  hauteur_max: 0,
  tuiles_max: 0,
  ressources_max: 0,
  technos_max: 0,
  source: "aucune",
};

export const CHAMPS_LIMITES = [
  { cle: "largeur_max", libelle: "Largeur max", court: "largeur" },
  { cle: "hauteur_max", libelle: "Hauteur max", court: "hauteur" },
  { cle: "tuiles_max", libelle: "Tuiles", court: "tuiles" },
  { cle: "ressources_max", libelle: "Ressources", court: "ressources" },
  { cle: "technos_max", libelle: "Technologies", court: "technos" },
] as const;

export type CleLimite = (typeof CHAMPS_LIMITES)[number]["cle"];

function positif(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

/** Une relation multiple, quelle que soit la forme rendue (texte ou liste). */
function liste(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string" && x !== "");
  if (typeof v === "string" && v !== "") return [v];
  return [];
}

/**
 * ⚠️ LA RÈGLE DES FICHES — miroir exact de `routes.LimitesDe` (Go).
 *
 *  1. les fiches qui NOMMENT le joueur d'abord ;
 *  2. sinon les fiches GÉNÉRALES ;
 *  3. sinon rien : il ne crée rien.
 * Plusieurs fiches du même rang : la PLUS LARGE, champ par champ. Une fiche
 * personnelle remplace la générale EN ENTIER, même plus petite.
 */
export function limitesDe(uid: string, fiches: Partial<FicheLimites>[]): Limites {
  const perso = fiches.filter((f) => uid !== "" && liste(f.joueurs).includes(uid));
  const generales = fiches.filter((f) => !perso.includes(f) && f.general === true);
  const choix = perso.length > 0 ? perso : generales;
  if (choix.length === 0) return AUCUNE_LIMITE;
  const l: Limites = { ...AUCUNE_LIMITE, source: perso.length > 0 ? "joueur" : "general" };
  for (const f of choix) {
    for (const { cle } of CHAMPS_LIMITES) l[cle] = Math.max(l[cle], positif(f[cle]));
  }
  return l;
}

export function normaliserFiche(f: Partial<FicheLimites> & { id: string }): FicheLimites {
  return {
    id: f.id,
    nom: f.nom ?? "",
    general: f.general === true,
    joueurs: liste(f.joueurs),
    largeur_max: positif(f.largeur_max),
    hauteur_max: positif(f.hauteur_max),
    tuiles_max: positif(f.tuiles_max),
    ressources_max: positif(f.ressources_max),
    technos_max: positif(f.technos_max),
    created: f.created,
    updated: f.updated,
  };
}

export function ficheVide(): ValeursLimites {
  return {
    nom: "",
    general: false,
    joueurs: [],
    largeur_max: 60,
    hauteur_max: 60,
    tuiles_max: 10,
    ressources_max: 10,
    technos_max: 5,
  };
}

export function erreurFiche(v: ValeursLimites): string | null {
  if (!v.nom.trim()) return "Donne un nom à la fiche.";
  if (!v.general && v.joueurs.length === 0)
    return "Coche « tous les joueurs » ou choisis au moins un joueur : sinon la fiche ne vaut pour personne.";
  if (v.largeur_max > 200 || v.hauteur_max > 200) return "Un plateau fait 200 cases au plus de côté.";
  return null;
}

// ─── Les collections conçues ──────────────────────────────────────────────────

export type CollectionConcue = "tuiles" | "ressources" | "technologies";

const MOT: Record<CollectionConcue, [string, string]> = {
  tuiles: ["tuile", "tuiles"],
  ressources: ["ressource", "ressources"],
  technologies: ["technologie", "technologies"],
};

export function quotaDe(l: Limites, c: CollectionConcue): number {
  return c === "tuiles" ? l.tuiles_max : c === "ressources" ? l.ressources_max : l.technos_max;
}

/**
 * Ce qu'il reste à créer, et la phrase à montrer quand c'est fini. Même texte
 * que le serveur, pour que la bannière et le refus disent la même chose.
 */
export function etatQuota(
  l: Limites,
  c: CollectionConcue,
  deja: number,
): { max: number; deja: number; reste: number; refus: string | null } {
  const max = quotaDe(l, c);
  const reste = Math.max(0, max - deja);
  let refus: string | null = null;
  if (max <= 0) refus = `L'administrateur ne t'a ouvert aucune ${MOT[c][0]} à créer (onglet Limites).`;
  else if (deja >= max) refus = `Limite atteinte : ${deja} ${MOT[c][1]} sur ${max}.`;
  return { max, deja, reste, refus };
}

// ─── La portée : ce que le compte connecté édite ───────────────────────────────

export type Portee =
  | { admin: true }
  | {
      admin: false;
      uid: string;
      /** Sa planète, `null` tant que le serveur ne l'a pas créée. */
      planete: Planete | null;
      limites: Limites;
    };

export const PORTEE_ADMIN: Portee = { admin: true };

/** La planète perso d'un joueur — une seule, tenue par le serveur. */
export function planeteDuJoueur(planetes: Planete[], uid: string): Planete | null {
  return planetes.find((p) => (p.proprietaire ?? "").trim() === uid && uid !== "") ?? null;
}

/** Ce qu'un joueur voit et édite : ce qui est rangé sur SA planète. */
export function dansLaPortee<T extends { planete?: string }>(portee: Portee, liste: T[]): T[] {
  if (portee.admin) return liste;
  if (!portee.planete) return [];
  const id = portee.planete.id;
  return liste.filter((x) => (x.planete ?? "") === id);
}

/**
 * ⚠️ LE CATALOGUE D'UNE PLANÈTE — miroir de `routes.PlanetesDuCatalogue`.
 *
 *   planète de joueur → ses records seuls ;
 *   planète game      → les siens + « Game » + ceux qui ne sont rangés nulle part ;
 *   planète inconnue  → tout le jeu de l'admin, jamais un joueur ;
 *   aucune planète en base → tout.
 *
 * Sert aux listes d'une fiche (les ressources qu'une tuile peut citer, les
 * tuiles qu'une règle peut viser) : proposer ce qui ne jouera pas sur sa
 * planète, c'est fabriquer une tuile que le serveur refusera.
 */
export function planetesDuCatalogue(planetes: Planete[], planeteId: string): Set<string> | null {
  if (planetes.length === 0) return null;
  const cible = planetes.find((p) => p.id === planeteId && planeteId !== "");
  if (cible && !estPlaneteGame(cible)) return new Set([cible.id]);
  const garde = new Set<string>([""]);
  const game = planetes.find((p) => estPlaneteGame(p) && p.nom === NOM_GAME);
  if (game) garde.add(game.id);
  if (cible) {
    garde.add(cible.id);
    return garde;
  }
  for (const p of planetes) if (estPlaneteGame(p)) garde.add(p.id);
  return garde;
}

export function duCatalogue<T extends { planete?: string }>(
  liste: T[],
  planetes: Planete[],
  planeteId: string,
): T[] {
  const garde = planetesDuCatalogue(planetes, planeteId);
  if (!garde) return liste;
  return liste.filter((x) => garde.has(x.planete ?? ""));
}

/** La valeur du filtre « sans planète » des écrans de l'admin. */
export const SANS_PLANETE = "__sans__";

/** Le filtre de planète de l'admin : une planète, ou « sans planète ». */
export function filtrerParPlanete<T extends { planete?: string }>(liste: T[], filtre: string): T[] {
  if (!filtre) return liste;
  const voulu = filtre === SANS_PLANETE ? "" : filtre;
  return liste.filter((x) => (x.planete ?? "") === voulu);
}

/**
 * La planète proposée à la création d'un record par l'ADMIN : celle du filtre
 * s'il en a choisi une, sinon « Game » pour une ressource ou une techno (le
 * contenu commun), et rien pour une tuile (elle se joue sur UNE planète, il la
 * choisit).
 */
export function planeteParDefaut(
  planetes: Planete[],
  collection: CollectionConcue,
  filtre: string,
): string {
  if (filtre && planetes.some((p) => p.id === filtre)) return filtre;
  if (collection === "tuiles") return "";
  return planetes.find((p) => estPlaneteGame(p) && p.nom === NOM_GAME)?.id ?? "";
}

/** Les planètes qu'un admin peut choisir : le jeu d'abord, puis les joueurs. */
export function planetesChoisissables(planetes: Planete[]): Planete[] {
  const rang = (p: Planete) => (p.nom === NOM_GAME && estPlaneteGame(p) ? 0 : estPlaneteGame(p) ? 1 : 2);
  return [...planetes].sort((a, b) => rang(a) - rang(b) || a.nom.localeCompare(b.nom, "fr"));
}

/**
 * L'étiquette `typeOfPlateau2` qui accompagne `planete` le temps de la bascule
 * (le jeu d'avant la lit encore) : le NOM de la planète, rien pour « Game »
 * (le contenu commun ne se joue nulle part en propre).
 */
export function etiquettePourPlanete(planete: Planete | null | undefined): string {
  if (!planete || planete.nom === NOM_GAME) return "";
  return planete.nom;
}

/**
 * Une taille de plateau permise ? Miroir de `routes.RefusModele` : chaque côté
 * ne dépasse pas le plus grand de (sa valeur actuelle, la limite). Un modèle
 * né en 60 × 60 reste donc peignable, et se réduit un côté à la fois.
 */
export function refusTaille(
  avant: { largeur: number; hauteur: number },
  apres: { largeur: number; hauteur: number },
  l: Limites,
): string | null {
  if (apres.largeur < 1 || apres.hauteur < 1) return "Un plateau a au moins une case de large et de haut.";
  if (apres.largeur > Math.max(avant.largeur, l.largeur_max) || apres.hauteur > Math.max(avant.hauteur, l.hauteur_max))
    return `Taille refusée : ta limite est ${l.largeur_max} × ${l.hauteur_max}.`;
  return null;
}
