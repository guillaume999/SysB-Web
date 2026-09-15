// ============================================================
//  forum.ts
//  LE FORUM (15/09) — salons → sujets → réponses.
//
//  · Lecture : TOUT LE MONDE, connecté ou pas.
//  · Salons : l'admin seul les crée, et coche pour chacun si les joueurs
//    peuvent y OUVRIR un sujet (`sujets_joueurs`) et y RÉPONDRE
//    (`reponses_joueurs`). L'admin, lui, peut toujours les deux.
//  · Écrire demande un compte connecté.
//
//  ⚠️ Les fonctions `peut…` ci-dessous ne servent qu'à AFFICHER ou non un
//  bouton. Ce qui protège, ce sont les règles d'API de `sujets` et `messages`
//  (patch `patch-news-forum-2026-09-15.js`) — elles disent exactement la même
//  chose. Changer l'une sans l'autre donne un bouton qui répond 403, ou un
//  bouton caché pour un geste permis.
//
//  ⚠️ `auteur_nom` est une COPIE du pseudo, obligatoire pour la règle
//  (`@request.body.auteur_nom = @request.auth.pseudo`) : un visiteur n'a pas le
//  droit de lire `users`, il ne verrait aucun nom sans elle.
// ============================================================

import { messageErreur, pb } from "@/lib/pb";
import type { CompteUser } from "@/lib/auth";

export type Salon = {
  id: string;
  nom: string;
  description: string;
  ordre: number;
  sujets_joueurs: boolean;
  reponses_joueurs: boolean;
  created: string;
};

export type Sujet = {
  id: string;
  salon: string;
  titre: string;
  contenu: string;
  auteur: string;
  auteur_nom: string;
  created: string;
  updated: string;
};

export type Message = {
  id: string;
  sujet: string;
  contenu: string;
  auteur: string;
  auteur_nom: string;
  created: string;
  updated: string;
};

export type ValeursSalon = Pick<Salon, "nom" | "description" | "ordre" | "sujets_joueurs" | "reponses_joueurs">;

/** Le compte vu par le forum : son id, son pseudo, et s'il est admin. */
export type Participant = { id: string; pseudo: string; admin: boolean } | null;

export function participant(user: CompteUser | null, admin: boolean): Participant {
  if (!user) return null;
  return { id: user.id, pseudo: String(user.pseudo ?? ""), admin };
}

/** Le nom affiché d'un auteur — un compte sans pseudo reste lisible. */
export function nomAuteur(nom: string | undefined | null): string {
  return nom?.trim() || "joueur sans pseudo";
}

/* ------------------------------------------------------------------ */
/* Qui peut quoi — le miroir des règles d'API                          */
/* ------------------------------------------------------------------ */

export function peutOuvrirSujet(salon: Pick<Salon, "sujets_joueurs">, qui: Participant): boolean {
  if (!qui) return false;
  return qui.admin || salon.sujets_joueurs === true;
}

export function peutRepondre(salon: Pick<Salon, "reponses_joueurs">, qui: Participant): boolean {
  if (!qui) return false;
  return qui.admin || salon.reponses_joueurs === true;
}

/** Modifier ou supprimer un sujet / une réponse : son auteur, ou l'admin. */
export function peutModifier(post: Pick<Sujet | Message, "auteur">, qui: Participant): boolean {
  if (!qui) return false;
  return qui.admin || post.auteur === qui.id;
}

/**
 * Pourquoi le bouton n'est pas là — une phrase, pour ne pas laisser croire à
 * une panne. `null` quand le geste est permis.
 */
export function raisonRefus(permis: boolean, qui: Participant, geste: "sujet" | "reponse"): string | null {
  if (permis) return null;
  if (!qui) return "Connecte-toi pour participer.";
  return geste === "sujet"
    ? "Dans ce salon, seul l'admin ouvre des sujets."
    : "Dans ce salon, les réponses sont réservées à l'admin.";
}

/* ------------------------------------------------------------------ */
/* Tri et activité                                                     */
/* ------------------------------------------------------------------ */

export function trierSalons<T extends Pick<Salon, "ordre" | "nom">>(salons: T[]): T[] {
  return [...salons].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0) || a.nom.localeCompare(b.nom, "fr"));
}

export type Activite = { reponses: number; derniere: string; dernierAuteur: string };

/**
 * Pour chaque sujet : son nombre de réponses et sa dernière activité (le sujet
 * lui-même s'il n'a pas de réponse). Les dates PocketBase (`2026-09-15
 * 21:04:00.000Z`) se comparent comme des chaînes.
 */
export function activiteDesSujets(
  sujets: Pick<Sujet, "id" | "created" | "auteur_nom">[],
  messages: Pick<Message, "sujet" | "created" | "auteur_nom">[],
): Map<string, Activite> {
  const carte = new Map<string, Activite>();
  for (const s of sujets) carte.set(s.id, { reponses: 0, derniere: s.created, dernierAuteur: s.auteur_nom });
  for (const m of messages) {
    const a = carte.get(m.sujet);
    if (!a) continue;
    a.reponses += 1;
    if (m.created > a.derniere) {
      a.derniere = m.created;
      a.dernierAuteur = m.auteur_nom;
    }
  }
  return carte;
}

/** Les sujets, le plus récemment actif en tête. */
export function trierSujets<T extends Pick<Sujet, "id" | "created">>(sujets: T[], activite: Map<string, Activite>): T[] {
  const cle = (s: T) => activite.get(s.id)?.derniere ?? s.created;
  return [...sujets].sort((a, b) => cle(b).localeCompare(cle(a)));
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export const MAX_TITRE = 200;
export const MAX_TEXTE = 20000;

export function erreurPost(titre: string | null, contenu: string): string | null {
  if (titre !== null) {
    if (!titre.trim()) return "Le titre est obligatoire.";
    if (titre.trim().length > MAX_TITRE) return `Le titre dépasse ${MAX_TITRE} caractères.`;
  }
  if (!contenu.trim()) return "Le message est vide.";
  if (contenu.length > MAX_TEXTE) return `Le message dépasse ${MAX_TEXTE} caractères.`;
  return null;
}

export function erreurSalon(v: ValeursSalon): string | null {
  if (!v.nom.trim()) return "Le nom du salon est obligatoire.";
  if (v.nom.trim().length > 100) return "Le nom dépasse 100 caractères.";
  if (v.description.length > 1000) return "La description dépasse 1 000 caractères.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Accès PocketBase                                                    */
/* ------------------------------------------------------------------ */

const salons = () => pb.collection("salons");
const sujets = () => pb.collection("sujets");
const messages = () => pb.collection("messages");

/** Un id PocketBase n'a que [a-z0-9] — le vérifier évite toute injection dans un filtre. */
function idSur(id: string): string {
  if (!/^[a-z0-9]+$/i.test(id)) throw new Error("Identifiant invalide.");
  return id;
}

export async function chargerSalons(): Promise<Salon[]> {
  return trierSalons(await salons().getFullList<Salon>());
}

export async function chargerSalon(id: string): Promise<Salon> {
  return salons().getOne<Salon>(idSur(id));
}

export async function enregistrerSalon(existant: Salon | null, v: ValeursSalon): Promise<Salon> {
  const corps = { ...v, nom: v.nom.trim(), description: v.description.trim(), ordre: Math.round(v.ordre || 0) };
  return existant ? salons().update<Salon>(existant.id, corps) : salons().create<Salon>(corps);
}

export async function supprimerSalon(id: string): Promise<void> {
  await salons().delete(idSur(id));
}

/** Les sujets d'un salon, avec leur activité (une requête pour tous les messages du salon). */
export async function chargerSujets(salonId: string): Promise<{ sujets: Sujet[]; activite: Map<string, Activite> }> {
  const filtre = pb.filter("salon = {:s}", { s: idSur(salonId) });
  const [liste, reponses] = await Promise.all([
    sujets().getFullList<Sujet>({ filter: filtre }),
    messages().getFullList<Message>({
      filter: pb.filter("sujet.salon = {:s}", { s: salonId }),
      fields: "sujet,created,auteur_nom",
    }),
  ]);
  const activite = activiteDesSujets(liste, reponses);
  return { sujets: trierSujets(liste, activite), activite };
}

/** Nombre de sujets par salon, pour la page d'accueil du forum. */
export async function compterSujetsParSalon(): Promise<Map<string, number>> {
  const liste = await sujets().getFullList<Pick<Sujet, "salon">>({ fields: "salon" });
  const carte = new Map<string, number>();
  for (const s of liste) carte.set(s.salon, (carte.get(s.salon) ?? 0) + 1);
  return carte;
}

export async function chargerSujet(id: string): Promise<{ sujet: Sujet; salon: Salon; reponses: Message[] }> {
  const sujet = await sujets().getOne<Sujet>(idSur(id));
  const [salon, reponses] = await Promise.all([
    chargerSalon(sujet.salon),
    messages().getFullList<Message>({ filter: pb.filter("sujet = {:s}", { s: sujet.id }), sort: "created" }),
  ]);
  return { sujet, salon, reponses };
}

/** Les deux champs que la règle d'API exige d'un auteur. */
function signature(qui: NonNullable<Participant>) {
  return { auteur: qui.id, auteur_nom: qui.pseudo };
}

export async function ouvrirSujet(salonId: string, titre: string, contenu: string, qui: NonNullable<Participant>): Promise<Sujet> {
  return sujets().create<Sujet>({ salon: salonId, titre: titre.trim(), contenu, ...signature(qui) });
}

export async function modifierSujet(id: string, titre: string, contenu: string): Promise<Sujet> {
  // ⚠️ Ni auteur, ni auteur_nom, ni salon : la règle refuse qu'un joueur les envoie.
  return sujets().update<Sujet>(idSur(id), { titre: titre.trim(), contenu });
}

export async function supprimerSujet(id: string): Promise<void> {
  await sujets().delete(idSur(id));
}

export async function repondre(sujetId: string, contenu: string, qui: NonNullable<Participant>): Promise<Message> {
  return messages().create<Message>({ sujet: sujetId, contenu, ...signature(qui) });
}

export async function modifierReponse(id: string, contenu: string): Promise<Message> {
  return messages().update<Message>(idSur(id), { contenu });
}

export async function supprimerReponse(id: string): Promise<void> {
  await messages().delete(idSur(id));
}

/**
 * Le message d'un refus PocketBase, traduit. Un 403/400 sur une création veut
 * presque toujours dire « le salon ne le permet plus » ou « pseudo changé
 * depuis la connexion ».
 */
export function messageRefus(e: unknown, defaut: string): string {
  const err = e as { status?: number; response?: { data?: Record<string, unknown> } };
  // Une erreur de validation nomme son champ : la montrer telle quelle.
  if (Object.keys(err.response?.data ?? {}).length > 0) return messageErreur(e, defaut);
  if (err.status === 403 || err.status === 400)
    return "Refusé par le serveur : le salon ne le permet peut-être plus, ou ton pseudo a changé — recharge la page.";
  if (err.status === 404) return "Introuvable — il a peut-être été supprimé.";
  return defaut;
}
