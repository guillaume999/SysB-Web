// ============================================================
//  tuto.ts
//  LES CARTES DE TUTORIEL (18/09) — la collection `tuto_messages`, que le jeu
//  affiche la PREMIÈRE FOIS qu'un joueur ouvre une planète.
//
//  Une carte = un écran : un titre, un texte, et c'est tout. Le jeu les
//  enchaîne dans l'ordre, sur fond assombri, avec « Suivant » et « Passer ».
//
//  ⚠️ LE GROUPE EST LE NOM DE LA PLANÈTE EN MINUSCULES (`terre`). EarthScene
//  est la même scène pour toutes les planètes : c'est la planète ouverte qui
//  choisit la suite à jouer. Écrire des cartes sous `jupiter` suffit à donner
//  son tutoriel à Jupiter — il n'y a rien à recoder.
//
//  ⚠️ PAS DE MARKDOWN dans le texte, à la différence des news : il est rendu
//  par TextMeshPro dans Unity, qui ne lit ni `**gras**` ni les liens. Ce que
//  l'aperçu montre est donc ce que le joueur verra, aux polices près.
//
//  ⚠️ CE FICHIER NE PROTÈGE RIEN : ce sont les règles d'API de
//  `tuto_messages` (patch `patch-tuto-2026-09-18.js`) qui réservent l'écriture
//  à l'admin.
// ============================================================

import { pb } from "@/lib/pb";

export const COLLECTION_TUTO = "tuto_messages";

/** La planète par défaut — celle de `PlaneteChoisie.NomParDefaut`, en minuscules. */
export const GROUPE_PAR_DEFAUT = "terre";

/** Le motif du groupe, le même que celui posé en base par le patch. */
export const MOTIF_GROUPE = /^[a-z0-9_-]+$/;

/** Ce que le jeu ne dépassera pas à l'affichage — la carte n'est pas une page. */
export const MAX_TITRE = 120;
export const MAX_TEXTE = 2000;

/** Une carte du tutoriel. */
export type CarteTuto = {
  id: string;
  /** Nom de planète en minuscules : `terre`, `jupiter`… */
  groupe: string;
  /** Rang d'affichage. Deux cartes au même rang s'affichent dans l'ordre de création. */
  ordre: number;
  titre: string;
  /** Texte brut, sans Markdown. */
  texte: string;
  /** Décochée, la carte reste en base mais le jeu l'ignore. */
  actif: boolean;
  created?: string;
  updated?: string;
};

/** Ce que le formulaire renvoie. */
export type ValeursCarte = {
  groupe: string;
  titre: string;
  texte: string;
  actif: boolean;
};

export const CARTE_VIDE: ValeursCarte = {
  groupe: GROUPE_PAR_DEFAUT,
  titre: "",
  texte: "",
  actif: true,
};

/** `« Terre »` → `terre`. La même règle que celle du jeu, écrite une fois. */
export function normaliserGroupe(valeur: string): string {
  return (valeur ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // Les accents partent : le groupe doit tenir dans le motif de la base.
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-");
}

export function loadCartes(): Promise<CarteTuto[]> {
  return pb.collection(COLLECTION_TUTO).getFullList<CarteTuto>({ sort: "groupe,ordre,created" });
}

/** Les groupes présents, plus celui par défaut — pour le sélecteur de l'écran. */
export function groupes(cartes: CarteTuto[]): string[] {
  const vus = new Set<string>([GROUPE_PAR_DEFAUT]);
  for (const c of cartes) if (c.groupe) vus.add(c.groupe);
  return [...vus].sort();
}

/**
 * Les cartes d'un groupe, dans l'ordre où le jeu les montrera.
 *
 * ⚠️ Le second critère est la DATE DE CRÉATION, pas l'identifiant : deux
 * cartes au même rang doivent s'afficher ici exactement comme là-bas, et
 * `sort: "groupe,ordre,created"` est ce que demande la collection.
 */
export function ordonner(cartes: CarteTuto[], groupe: string): CarteTuto[] {
  return cartes
    .filter((c) => c.groupe === groupe)
    .sort((a, b) => a.ordre - b.ordre || (a.created ?? "").localeCompare(b.created ?? ""));
}

/** Ce que le jeu affichera vraiment : les cartes actives, dans l'ordre. */
export function cartesJouees(cartes: CarteTuto[], groupe: string): CarteTuto[] {
  return ordonner(cartes, groupe).filter((c) => c.actif);
}

/** Le rang d'une carte qu'on ajoute : après la dernière du groupe. */
export function prochainOrdre(cartes: CarteTuto[], groupe: string): number {
  const dansLeGroupe = cartes.filter((c) => c.groupe === groupe);
  if (dansLeGroupe.length === 0) return 1;
  return Math.max(...dansLeGroupe.map((c) => c.ordre || 0)) + 1;
}

/**
 * Monter (`-1`) ou descendre (`+1`) une carte, et rendre **les seuls records
 * dont le rang change**.
 *
 * ⚠️ ON RENUMÉROTE 1…n AU LIEU D'ÉCHANGER DEUX RANGS. Un échange suppose que
 * les rangs sont propres ; ils ne le sont pas forcément (deux cartes au même
 * nombre, un trou laissé par une suppression), et l'échange n'y ferait alors
 * rien du tout — un bouton qui ne bouge pas, sans erreur. La renumérotation
 * répare en passant, et ne coûte que quelques PATCH sur une poignée de cartes.
 */
export function deplacer(
  cartes: CarteTuto[],
  groupe: string,
  id: string,
  sens: -1 | 1,
): { id: string; ordre: number }[] {
  const liste = ordonner(cartes, groupe);
  const i = liste.findIndex((c) => c.id === id);
  const j = i + sens;
  if (i < 0 || j < 0 || j >= liste.length) return [];

  const [carte] = liste.splice(i, 1);
  liste.splice(j, 0, carte);

  return liste
    .map((c, k) => ({ id: c.id, ordre: k + 1 }))
    .filter((r, k) => liste[k].ordre !== r.ordre);
}

/** Ce qui empêche d'enregistrer. Liste vide = saisie correcte. */
export function erreursCarte(v: ValeursCarte): string[] {
  const erreurs: string[] = [];
  const groupe = v.groupe.trim();

  if (!groupe) erreurs.push("La planète est obligatoire.");
  else if (!MOTIF_GROUPE.test(groupe))
    erreurs.push("La planète s'écrit en minuscules, sans accent ni espace (ex. « terre »).");

  if (v.titre.trim().length > MAX_TITRE) erreurs.push(`Le titre dépasse ${MAX_TITRE} caractères.`);

  if (!v.texte.trim()) erreurs.push("Le texte est obligatoire — une carte sans texte n'apprend rien.");
  else if (v.texte.length > MAX_TEXTE) erreurs.push(`Le texte dépasse ${MAX_TEXTE} caractères.`);

  return erreurs;
}

/** Le corps envoyé à PocketBase. `ordre` n'y est que pour une carte NEUVE. */
export function corpsCarte(v: ValeursCarte, ordre?: number): Record<string, unknown> {
  const champs: Record<string, unknown> = {
    groupe: v.groupe.trim(),
    titre: v.titre.trim(),
    texte: v.texte.trim(),
    actif: v.actif,
  };
  if (ordre !== undefined) champs.ordre = ordre;
  return champs;
}

export async function enregistrerCarte(
  existante: CarteTuto | null,
  v: ValeursCarte,
  cartes: CarteTuto[],
): Promise<CarteTuto> {
  const col = pb.collection(COLLECTION_TUTO);
  if (existante) {
    // ⚠️ Le rang ne se retape pas dans la fiche : il se règle avec les flèches
    // de la liste. On ne l'envoie donc PAS ici — sauf si la carte change de
    // planète, où son ancien rang n'a plus de sens.
    const change = existante.groupe !== v.groupe.trim();
    return col.update<CarteTuto>(
      existante.id,
      corpsCarte(v, change ? prochainOrdre(cartes, v.groupe.trim()) : undefined),
    );
  }
  return col.create<CarteTuto>(corpsCarte(v, prochainOrdre(cartes, v.groupe.trim())));
}

export async function appliquerOrdres(rangs: { id: string; ordre: number }[]): Promise<void> {
  const col = pb.collection(COLLECTION_TUTO);
  for (const r of rangs) await col.update(r.id, { ordre: r.ordre });
}

export async function supprimerCarte(id: string): Promise<void> {
  await pb.collection(COLLECTION_TUTO).delete(id);
}
