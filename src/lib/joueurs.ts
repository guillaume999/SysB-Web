/**
 * Les comptes joueurs — la collection d'authentification `users` de PocketBase.
 *
 * Le site sait maintenant faire trois choses de plus que lire : **créer** un compte,
 * corriger sa fiche (pseudo, email, mot de passe) et **changer son rôle**.
 *
 * Ce qu'il ne fait toujours pas : **supprimer** un compte. La règle `delete` de la
 * collection est `id = @request.auth.id` — même un admin ne peut effacer que le sien —
 * et c'est voulu : un compte effacé laisserait ses plateaux orphelins. Ça se fait à la
 * main dans l'admin PocketBase, après avoir regardé ce qui lui appartient.
 *
 * Côté serveur, trois règles rendent tout ça possible. Les toucher casse cet écran :
 *
 * - **manage rule** = `@request.auth.role = "admin"` : sans elle, PocketBase exige
 *   `oldPassword` pour changer un mot de passe et refuse le changement d'email d'un
 *   autre compte.
 * - **create rule** = `@request.body.role:isset = false || @request.auth.role = "admin"` :
 *   la première branche est l'inscription depuis le jeu (personne ne peut se donner un
 *   rôle en s'inscrivant), la seconde laisse un admin poser le rôle à la création.
 * - **update rule** = `@request.auth.role = "admin" || (id = @request.auth.id && @request.body.role:isset = false)` :
 *   un admin écrit tout, un joueur ne modifie que lui-même et jamais son rôle.
 */

import { pb } from "@/lib/pb";
import type { Role } from "@/lib/auth";

export const COLLECTION_JOUEURS = "users";

/** PocketBase refuse plus court, et son message d'erreur est peu parlant. */
export const LONGUEUR_MOT_DE_PASSE = 8;

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
  role: Role;
  /** À la création : obligatoire. En modification : vide = on n'y touche pas. */
  motDePasse: string;
}

export const ROLES: { valeur: Role; libelle: string; aide: string }[] = [
  { valeur: "player", libelle: "joueur", aide: "compte ordinaire, ne voit que ses propres plateaux" },
  { valeur: "admin", libelle: "admin", aide: "peut écrire tout le contenu du jeu et ouvrir ce site" },
  { valeur: "tester", libelle: "testeur", aide: "compte de test, mêmes droits qu'un joueur" },
];

export const ROLE_PAR_DEFAUT: Role = "player";

export function libelleRole(role: Role | ""): string {
  return ROLES.find((r) => r.valeur === role)?.libelle || role || "?";
}

export function loadJoueurs(): Promise<Joueur[]> {
  return pb.collection(COLLECTION_JOUEURS).getFullList<Joueur>({ sort: "-created" });
}

/**
 * Crée un compte depuis le site.
 *
 * Le compte naît **vérifié** : il n'y a pas de mail de confirmation à cliquer puisque
 * c'est l'admin qui saisit l'adresse et transmet le mot de passe. Le badge
 * « non vérifié » de la liste reste ainsi réservé aux inscriptions faites dans le jeu.
 *
 * `verified` est un champ système : PocketBase ne le laisse écrire qu'au superuser ou
 * à qui satisfait la *manage rule*. On tente donc de le poser dès la création, et si le
 * serveur le refuse **sur ce champ précis**, on recrée sans lui puis on le pose par un
 * `update` — chemin qui, lui, passe à coup sûr par la manage rule. Toute autre erreur
 * (email déjà pris, mot de passe trop court…) remonte telle quelle à l'appelant.
 */
export async function creerJoueur(valeurs: ValeursJoueur): Promise<{ id: string; verifie: boolean }> {
  const base = {
    email: valeurs.email.trim(),
    password: valeurs.motDePasse,
    passwordConfirm: valeurs.motDePasse,
    pseudo: valeurs.pseudo.trim(),
    role: valeurs.role,
    emailVisibility: false,
  };

  try {
    const cree = await pb.collection(COLLECTION_JOUEURS).create({ ...base, verified: true });
    return { id: cree.id, verifie: true };
  } catch (e) {
    if (!erreurPorteSur(e, "verified")) throw e;

    const cree = await pb.collection(COLLECTION_JOUEURS).create(base);
    try {
      await pb.collection(COLLECTION_JOUEURS).update(cree.id, { verified: true });
      return { id: cree.id, verifie: true };
    } catch {
      // Le compte existe et il est utilisable : autant le signaler « non vérifié »
      // plutôt que de faire échouer une création qui a bel et bien eu lieu.
      return { id: cree.id, verifie: false };
    }
  }
}

/** Vrai si l'erreur PocketBase est une erreur de validation portant sur ce champ. */
function erreurPorteSur(e: unknown, champ: string): boolean {
  const err = e as { response?: { data?: Record<string, unknown> } };
  return Boolean(err.response?.data && champ in err.response.data);
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

  if (valeurs.role !== joueur.role) data.role = valeurs.role;

  if (valeurs.motDePasse !== "") {
    data.password = valeurs.motDePasse;
    data.passwordConfirm = valeurs.motDePasse;
  }

  if (Object.keys(data).length === 0) return;
  await pb.collection(COLLECTION_JOUEURS).update(joueur.id, data);
}

/** Le geste rapide de la liste : donner ou retirer le rôle admin sans ouvrir la fiche. */
export async function changerRole(joueur: Joueur, role: Role): Promise<void> {
  if (role === joueur.role) return;
  await pb.collection(COLLECTION_JOUEURS).update(joueur.id, { role });
}

/**
 * Un admin ne doit pas pouvoir se retirer son propre rôle : il perdrait l'accès au site
 * dans la seconde, et s'il est le dernier admin plus personne ne pourrait le lui rendre
 * autrement que par l'admin PocketBase.
 */
export function peutChangerLeRole(joueur: Joueur, moiId: string | undefined): boolean {
  return joueur.id !== moiId;
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
