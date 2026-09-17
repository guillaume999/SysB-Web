// ============================================================
//  socles.ts
//  LES COULEURS DE SOCLE (17/09) — la collection `socles`, et le champ
//  `tuiles.socle` qui la cite.
//
//  ⚠️⚠️ POURQUOI UNE COLLECTION ET PAS UNE COULEUR LIBRE SUR LA TUILE.
//  Dans le jeu, une couleur de socle est un MATÉRIAU PARTAGÉ
//  (`Assets/Resources/Materials/Socles/Socle_<code>.mat`) : toutes les cases
//  d'une même couleur et d'une même hauteur se dessinent alors en un seul lot.
//  Une couleur tapée tuile par tuile obligerait à teinter chaque case
//  séparément — un ordre de dessin PAR CASE, soit 10 000 au lieu d'une
//  trentaine sur un grand plateau. La liste fermée n'est pas une commodité de
//  saisie : c'est ce qui tient les images par seconde sur téléphone.
//
//  ⚠️ LE `code` EST UN NOM DE FICHIER. Il finit dans un `Resources.Load`
//  d'Unity, d'où le motif strict (minuscules, chiffres, `_` et `-`). Le
//  changer sur une couleur déjà utilisée rend le matériau du jeu introuvable
//  tant que « SySB → Synchroniser les socles » n'a pas été relancé.
//
//  ⚠️ CE QUI N'EST PAS ICI : la FORME du socle. Elle vient de l'altitude de la
//  case, pas de la tuile. Ce fichier ne parle que de couleur.
// ============================================================

import { pb } from "@/lib/pb";

export const COLLECTION_SOCLES = "socles";

/** Le code de repli, quand une tuile cite un socle que le jeu ne connaît pas. */
export const SOCLE_PAR_DEFAUT = "vert";

/** Une couleur de socle déclarée. */
export type Socle = {
  id: string;
  /** Minuscules, chiffres, `_` et `-` : c'est le nom du matériau dans Unity. */
  code: string;
  nom: string;
  /** `#rrggbb`. */
  couleur: string;
  created?: string;
  updated?: string;
};

/** Ce que le formulaire renvoie. */
export type ValeursSocle = {
  code: string;
  nom: string;
  couleur: string;
};

export const SOCLE_VIDE: ValeursSocle = { code: "", nom: "", couleur: "#04CC0D" };

/** Le motif du code, le même que celui posé en base par le patch. */
export const MOTIF_CODE = /^[a-z0-9_-]+$/;

const MOTIF_COULEUR = /^#[0-9a-fA-F]{6}$/;

export function loadSocles(): Promise<Socle[]> {
  return pb.collection(COLLECTION_SOCLES).getFullList<Socle>({ sort: "code" });
}

/** Le nom à afficher : celui saisi, sinon le code. */
export function libelleSocle(s: Socle): string {
  return s.nom?.trim() || s.code;
}

/**
 * Le chemin `Resources.Load` du matériau de cette couleur — **la même chaîne
 * que celle qu'Unity construit**. Elle vit ici pour que l'écran puisse la
 * montrer : c'est ce qu'on va chercher dans le projet quand une couleur
 * n'apparaît pas en jeu.
 */
export function cheminMateriau(code: string): string {
  return `Materials/Socles/Socle_${code.trim()}`;
}

/**
 * Nettoie une couleur saisie : `abc123`, `#ABC123` ou `  #abc123 ` donnent tous
 * `#ABC123`. Chaîne vide si ce n'est pas une couleur.
 *
 * Majuscules parce que c'est ainsi qu'Unity écrit `ColorUtility.ToHtmlStringRGB` :
 * comparer deux couleurs relevées des deux côtés doit être une égalité de
 * chaînes, pas un « à la casse près ».
 */
export function normaliserCouleur(saisie: string): string {
  const t = (saisie ?? "").trim();
  const avecDiese = t.startsWith("#") ? t : `#${t}`;
  return MOTIF_COULEUR.test(avecDiese) ? avecDiese.toUpperCase() : "";
}

/**
 * Ce qui empêche d'enregistrer, en français. Liste vide = c'est bon.
 *
 * `autres` sont les socles DÉJÀ en base autres que celui qu'on édite : c'est
 * l'unicité du code qu'ils servent à vérifier. La base la tient aussi (index
 * unique), mais elle répondrait par un message anglais illisible.
 */
export function erreursSocle(v: ValeursSocle, autres: Socle[]): string[] {
  const erreurs: string[] = [];
  const code = v.code.trim();

  if (code === "") erreurs.push("Le code est obligatoire : c'est le nom du matériau dans Unity.");
  else if (!MOTIF_CODE.test(code))
    erreurs.push(
      "Le code ne prend que des minuscules, des chiffres, « _ » et « - » — " +
        "il devient un nom de fichier dans le projet Unity.",
    );
  else if (autres.some((s) => s.code === code))
    erreurs.push(`Le code « ${code} » est déjà pris par une autre couleur.`);

  if (normaliserCouleur(v.couleur) === "")
    erreurs.push("La couleur s'écrit en hexadécimal, par exemple #04CC0D.");

  return erreurs;
}

/** Crée ou met à jour. La couleur est normalisée avant de partir en base. */
export async function enregistrerSocle(existant: Socle | null, v: ValeursSocle): Promise<void> {
  const corps = {
    code: v.code.trim(),
    nom: v.nom.trim(),
    couleur: normaliserCouleur(v.couleur),
  };
  if (existant) await pb.collection(COLLECTION_SOCLES).update(existant.id, corps);
  else await pb.collection(COLLECTION_SOCLES).create(corps);
}

export async function supprimerSocle(id: string): Promise<void> {
  await pb.collection(COLLECTION_SOCLES).delete(id);
}

/**
 * Combien de tuiles portent chaque socle, par id.
 *
 * ⚠️ Sert à INTERDIRE la suppression d'une couleur encore citée. PocketBase la
 * refuserait aussi (la relation n'est pas en cascade), mais après coup et en
 * anglais : ici on grise le bouton et on dit combien de tuiles il faudrait
 * changer d'abord.
 */
export function usagesParSocle(tuiles: { socle?: string }[]): Map<string, number> {
  const compte = new Map<string, number>();
  for (const t of tuiles) {
    const id = t.socle;
    if (!id) continue;
    compte.set(id, (compte.get(id) ?? 0) + 1);
  }
  return compte;
}
