// ============================================================
//  compte.ts
//  « MON COMPTE » (15/09) — ce qu'un compte connecté, joueur OU admin, peut
//  lire et changer sur LUI-MÊME : lire sa fiche, lire son email, changer son
//  mot de passe. Rien d'autre (pseudo, email et rôle restent l'affaire de
//  l'onglet Joueurs, côté admin).
//
//  ⚠️ CE QUI LE PERMET CÔTÉ SERVEUR — les règles de `users`, inchangées :
//   - view   = `id = @request.auth.id || @request.auth.role = 'admin'`
//              → chacun relit sa propre fiche, email compris (PocketBase montre
//                toujours l'email au propriétaire, même `emailVisibility` off) ;
//   - update = `… || (id = @request.auth.id && @request.body.role:isset = false)`
//              → chacun modifie SA fiche, jamais son rôle. On n'envoie donc
//                JAMAIS `role` d'ici.
//
//  ⚠️ L'ANCIEN MOT DE PASSE EST VÉRIFIÉ POUR TOUT LE MONDE, ICI. PocketBase
//  l'exige d'un joueur (`oldPassword`), mais PAS d'un admin : la manage rule
//  (`@request.auth.role = 'admin'`) l'en dispense. Sans la reconnexion
//  préalable, un admin dont on a laissé la session ouverte pourrait se faire
//  changer son mot de passe sans que personne ne connaisse l'ancien.
//
//  ⚠️ CHANGER SON MOT DE PASSE INVALIDE LE JETON EN COURS (PocketBase change la
//  clé du compte). On se reconnecte aussitôt avec le nouveau : la session
//  continue au lieu de tomber à la requête suivante.
// ============================================================

import { pb } from "@/lib/pb";
import { COLLECTION_JOUEURS, LONGUEUR_MOT_DE_PASSE, type Joueur } from "@/lib/joueurs";

/** PocketBase refuse au-delà (limite du champ `password` par défaut). */
export const LONGUEUR_MAX_MOT_DE_PASSE = 71;

export interface SaisieMotDePasse {
  ancien: string;
  nouveau: string;
  confirmation: string;
}

/** La fiche du compte connecté, relue au serveur (pas la copie de la session). */
export function loadMonCompte(id: string): Promise<Joueur> {
  return pb.collection(COLLECTION_JOUEURS).getOne<Joueur>(id);
}

/**
 * Ce qui ne va pas dans la saisie, AVANT d'appeler le serveur — ou `null`.
 * Écrit pour un humain : c'est ce texte-là qui s'affiche sous le formulaire.
 */
export function problemeSaisie(s: SaisieMotDePasse): string | null {
  if (s.ancien === "") return "Saisis ton mot de passe actuel.";
  if (s.nouveau.length < LONGUEUR_MOT_DE_PASSE)
    return `Le nouveau mot de passe doit faire au moins ${LONGUEUR_MOT_DE_PASSE} caractères.`;
  if (s.nouveau.length > LONGUEUR_MAX_MOT_DE_PASSE)
    return `Le nouveau mot de passe doit faire au plus ${LONGUEUR_MAX_MOT_DE_PASSE} caractères.`;
  if (s.nouveau !== s.confirmation) return "Les deux saisies du nouveau mot de passe ne sont pas identiques.";
  if (s.nouveau === s.ancien) return "Le nouveau mot de passe est identique à l'actuel.";
  return null;
}

/** L'erreur levée quand le mot de passe actuel est faux — distinguée pour l'écran. */
export class AncienMotDePasseFaux extends Error {
  constructor() {
    super("Mot de passe actuel incorrect.");
    this.name = "AncienMotDePasseFaux";
  }
}

/**
 * Change le mot de passe du compte connecté, en trois temps :
 *  1. reconnexion avec l'ANCIEN — la preuve, pour l'admin comme pour le joueur ;
 *  2. écriture, avec `oldPassword` (exigé du joueur par PocketBase) ;
 *  3. reconnexion avec le NOUVEAU — le jeton d'avant ne vaut plus rien.
 *
 * Renvoie `false` si l'étape 3 a échoué : le mot de passe EST changé, mais la
 * session est perdue et l'appelant doit le dire.
 */
export async function changerMonMotDePasse(compte: Pick<Joueur, "id" | "email">, s: SaisieMotDePasse): Promise<boolean> {
  const probleme = problemeSaisie(s);
  if (probleme) throw new Error(probleme);

  const users = pb.collection(COLLECTION_JOUEURS);

  try {
    await users.authWithPassword(compte.email, s.ancien);
  } catch (e) {
    if ((e as { status?: number }).status === 400) throw new AncienMotDePasseFaux();
    throw e;
  }

  try {
    await users.update(compte.id, {
      oldPassword: s.ancien,
      password: s.nouveau,
      passwordConfirm: s.confirmation,
    });
  } catch (e) {
    if (erreurSurAncien(e)) throw new AncienMotDePasseFaux();
    throw e;
  }

  try {
    await users.authWithPassword(compte.email, s.nouveau);
    return true;
  } catch {
    pb.authStore.clear();
    return false;
  }
}

/** PocketBase signale un `oldPassword` faux comme une erreur de validation sur ce champ. */
export function erreurSurAncien(e: unknown): boolean {
  const data = (e as { response?: { data?: Record<string, unknown> } } | null)?.response?.data;
  return Boolean(data && "oldPassword" in data);
}
