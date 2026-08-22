/**
 * Les comptes joueurs — la collection d'authentification `users` de PocketBase.
 *
 * Le site les lit et les corrige ; il ne les crée pas : un compte naît dans le jeu,
 * à l'inscription. Deux champs seulement sont modifiables ici, le pseudo et l'email,
 * plus la remise à zéro du mot de passe quand un joueur a perdu le sien.
 *
 * Le **rôle** n'est volontairement pas éditable depuis cet écran : il ouvre l'écriture
 * sur tout le contenu du jeu, donc il se change à la main dans l'admin PocketBase
 * (pb-sysb.physiooffice.com/_/), là où le geste est délibéré.
 *
 * Côté serveur, ces écritures ne passent que grâce au **manage rule** de la collection
 * `users` (`@request.auth.role = "admin"`) : sans lui, PocketBase exige `oldPassword`
 * pour changer un mot de passe et refuse le changement d'email d'un autre compte.
 */

import { pb } from "@/lib/pb";
import type { Role } from "@/lib/auth";

export const COLLECTION_JOUEURS = "users";

/**
 * Déclaré en `type` et non en `interface` : le SDK PocketBase attend un `RecordModel`
 * indexable, auquel une interface n'est pas assignable.
 */
export type Joueur = {
  id: string;
  collectionId: string;
  collectionName: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  pseudo: string;
  role: Role | "";
  created: string;
  updated: string;
};

export interface ValeursJoueur {
  pseudo: string;
  email: string;
  /** Vide = on ne touche pas au mot de passe existant. */
  motDePasse: string;
}

export const ROLES: { valeur: Role; libelle: string; aide: string }[] = [
  { valeur: "player", libelle: "joueur", aide: "compte ordinaire, ne voit que ses propres plateaux" },
  { valeur: "admin", libelle: "admin", aide: "peut écrire tout le contenu du jeu et ouvrir ce site" },
  { valeur: "tester", libelle: "testeur", aide: "compte de test, mêmes droits qu'un joueur" },
];

export function libelleRole(role: Role | ""): string {
  return ROLES.find((r) => r.valeur === role)?.libelle || role || "?";
}

export function loadJoueurs(): Promise<Joueur[]> {
  return pb.collection(COLLECTION_JOUEURS).getFullList<Joueur>({ sort: "-created" });
}

/**
 * N'envoie que ce qui a bougé : réémettre l'email inchangé ferait repasser le compte
 * en non vérifié pour rien, et un mot de passe vide serait refusé par PocketBase.
 */
export async function enregistrerJoueur(joueur: Joueur, valeurs: ValeursJoueur): Promise<void> {
  const data: Record<string, unknown> = {};

  const pseudo = valeurs.pseudo.trim();
  if (pseudo !== (joueur.pseudo ?? "")) data.pseudo = pseudo;

  const email = valeurs.email.trim();
  if (email.toLowerCase() !== (joueur.email ?? "").toLowerCase()) data.email = email;

  if (valeurs.motDePasse !== "") {
    data.password = valeurs.motDePasse;
    data.passwordConfirm = valeurs.motDePasse;
  }

  if (Object.keys(data).length === 0) return;
  await pb.collection(COLLECTION_JOUEURS).update(joueur.id, data);
}

/** Date PocketBase (`2026-08-22 19:04:11.123Z`) en date lisible, sans dépendance. */
export function dateLisible(valeur: string): string {
  if (!valeur) return "—";
  const d = new Date(valeur.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return valeur;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Filtre de recherche : pseudo, email ou identifiant, sans casse ni accents. */
export function correspond(joueur: Joueur, recherche: string): boolean {
  const q = normaliser(recherche);
  if (q === "") return true;
  return [joueur.pseudo, joueur.email, joueur.id].some((champ) => normaliser(String(champ ?? "")).includes(q));
}

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
