// ============================================================
//  guildes.ts
//  LES GUILDES (15/09) — le client des routes du serveur Go.
//
//  · `GET  /api/sysb/guildes`            l'état : réglages, âge de jeu, liste
//                                        des guildes, MA guilde, mes demandes
//  · `POST /api/sysb/guilde/{action}`    creer · demander · inviter ·
//                                        repondre · quitter · exclure · role ·
//                                        modifier · dissoudre · salon
//  · `GET  /api/sysb/guilde/salon`       le salon de MA guilde
//
//  ⚠️ AUCUNE COLLECTION DE GUILDE N'EST LISIBLE PAR UN JOUEUR : tout passe par
//  ces routes, qui jugent (`serveur-go/routes/guildes.go`). Les fonctions
//  `peut…` d'ici ne servent qu'à AFFICHER un bouton ; elles répètent la règle
//  du serveur, qui reste seule juge.
//
//  ⚠️ L'ADMIN, LUI, lit et écrit `reglages_guildes`, lit `guildes` et
//  `membres_guilde`, et DISSOUT une guilde en supprimant son record (cascade :
//  membres, demandes, salon). Voir l'onglet « Guildes ».
// ============================================================

import { messageErreur, pb } from "@/lib/pb";

export type RoleGuilde = "chef" | "officier" | "membre";
export type SensDemande = "demande" | "invitation";

export type Reglages = {
  membres_max: number;
  officiers_max: number;
  delai_salon_s: number;
  age_min_creation: number;
};

/** Les défauts du serveur (`routes.ReglagesParDefaut`) — tant qu'aucune fiche n'existe. */
export const REGLAGES_DEFAUT: Reglages = { membres_max: 20, officiers_max: 3, delai_salon_s: 10, age_min_creation: 1 };

export type Guilde = { id: string; nom: string; description: string; chef: string; created: string };
export type Membre = { id: string; guilde: string; joueur: string; nom: string; role: RoleGuilde };
export type Demande = {
  id: string;
  guilde: string;
  guilde_nom: string;
  joueur: string;
  joueur_nom: string;
  sens: SensDemande;
  created: string;
};
export type ResumeGuilde = {
  id: string;
  nom: string;
  description: string;
  chef_nom: string;
  membres: number;
  created: string;
};
export type MessageGuilde = {
  id: string;
  guilde: string;
  auteur: string;
  auteur_nom: string;
  contenu: string;
  created: string;
};

export type EtatGuildes = {
  reglages: Reglages;
  age: number;
  peut_creer: boolean;
  guildes: ResumeGuilde[];
  ma_guilde?: { guilde: Guilde; role: RoleGuilde; membres: Membre[]; demandes?: Demande[] };
  mes_demandes: Demande[];
};

export const NOM_MIN = 3;
export const NOM_MAX = 30;
export const DESCRIPTION_MAX = 500;
export const MESSAGE_MAX = 500;

/* ------------------------------------------------------------------ */
/* Appels                                                              */
/* ------------------------------------------------------------------ */

export async function chargerEtat(): Promise<EtatGuildes> {
  return pb.send<EtatGuildes>("/api/sysb/guildes", { method: "GET" });
}

type Action =
  | "creer"
  | "demander"
  | "inviter"
  | "repondre"
  | "quitter"
  | "exclure"
  | "role"
  | "modifier"
  | "dissoudre"
  | "salon";

export type ReponseAction = { ok: boolean; verdict?: string; attente?: number; message?: MessageGuilde };

export async function agir(action: Action, corps: Record<string, unknown> = {}): Promise<ReponseAction> {
  return pb.send<ReponseAction>(`/api/sysb/guilde/${action}`, { method: "POST", body: corps });
}

export const creer = (nom: string, description: string) => agir("creer", { nom, description });
export const demander = (guilde: string) => agir("demander", { guilde });
export const inviter = (cible: string) => agir("inviter", { cible });
export const repondre = (demande: string, accepter: boolean) => agir("repondre", { demande, accepter });
export const quitter = () => agir("quitter");
export const exclure = (cible: string) => agir("exclure", { cible });
export const changerRole = (cible: string, role: RoleGuilde) => agir("role", { cible, role });
export const modifierDescription = (description: string) => agir("modifier", { description });
export const dissoudre = () => agir("dissoudre");
export const ecrireSalon = (contenu: string) => agir("salon", { contenu });

export type EtatSalon = {
  messages: MessageGuilde[];
  guilde: Guilde | null;
  delai_salon_s: number;
  attente: number;
};

export async function lireSalon(apres = ""): Promise<EtatSalon> {
  const q = apres ? `?apres=${encodeURIComponent(apres)}` : "";
  return pb.send<EtatSalon>(`/api/sysb/guilde/salon${q}`, { method: "GET" });
}

/** Chercher un joueur par son pseudo (route partagée avec les messages privés). */
export async function chercherJoueurs(q: string): Promise<{ id: string; pseudo: string }[]> {
  if (q.trim().length < 2) return [];
  const r = await pb.send<{ joueurs?: { id: string; pseudo: string }[] }>(
    `/api/sysb/joueurs?q=${encodeURIComponent(q.trim())}`,
    { method: "GET" },
  );
  return r.joueurs ?? [];
}

/**
 * La phrase d'un refus du serveur. Les routes des guildes répondent
 * `{ ok: false, verdict }` — pas le `message` habituel de PocketBase.
 */
export function verdict(e: unknown, defaut: string): string {
  const err = e as { status?: number; response?: { verdict?: unknown } };
  const v = err.response?.verdict;
  if (typeof v === "string" && v.trim()) return v;
  if (err.status === 404) return "Les guildes ne sont pas encore en service (route ou patch absent).";
  return messageErreur(e, defaut);
}

/** Les secondes d'attente d'un refus d'anti-spam (429), 0 sinon. */
export function attenteDuRefus(e: unknown): number {
  const err = e as { status?: number; response?: { attente?: unknown } };
  if (err.status !== 429) return 0;
  const n = Number(err.response?.attente);
  return Number.isFinite(n) && n > 0 ? Math.ceil(n) : 0;
}

/* ------------------------------------------------------------------ */
/* Réglages (admin)                                                    */
/* ------------------------------------------------------------------ */

export const COLLECTION_REGLAGES = "reglages_guildes";

export type FicheReglages = Reglages & { id?: string };

/** La fiche en service : la plus ancienne. Aucune = les défauts du serveur. */
export async function chargerReglages(): Promise<FicheReglages> {
  const l = await pb.collection(COLLECTION_REGLAGES).getList<FicheReglages>(1, 1, { sort: "created" });
  const f = l.items[0];
  if (!f) return { ...REGLAGES_DEFAUT };
  return {
    id: f.id,
    membres_max: Number(f.membres_max) || 0,
    officiers_max: Number(f.officiers_max) || 0,
    delai_salon_s: Number(f.delai_salon_s) || 0,
    age_min_creation: Number(f.age_min_creation) || 0,
  };
}

/** Ce qui ne va pas dans une saisie de réglages, ou null. */
export function erreurReglages(r: Reglages): string | null {
  const entier = (n: number) => Number.isInteger(n);
  if (!entier(r.membres_max) || r.membres_max < 1) return "Membres max : un entier, au moins 1.";
  if (!entier(r.officiers_max) || r.officiers_max < 0) return "Officiers max : un entier, 0 ou plus.";
  if (r.officiers_max >= r.membres_max) return "Il faut moins d'officiers que de membres (le chef compte).";
  if (!entier(r.delai_salon_s) || r.delai_salon_s < 0) return "Anti-spam : un nombre entier de secondes, 0 ou plus.";
  if (!entier(r.age_min_creation) || r.age_min_creation < 0 || r.age_min_creation > 7)
    return "Âge minimum : de 0 (aucune condition) à 7.";
  return null;
}

export async function enregistrerReglages(f: FicheReglages): Promise<FicheReglages> {
  const valeurs: Reglages = {
    membres_max: f.membres_max,
    officiers_max: f.officiers_max,
    delai_salon_s: f.delai_salon_s,
    age_min_creation: f.age_min_creation,
  };
  const col = pb.collection(COLLECTION_REGLAGES);
  const r = f.id ? await col.update<FicheReglages>(f.id, valeurs) : await col.create<FicheReglages>(valeurs);
  return { ...valeurs, id: r.id };
}

/** Admin : les membres de toutes les guildes (lecture directe, règle admin). */
export async function chargerTousMembres(): Promise<Membre[]> {
  const l = await pb.collection("membres_guilde").getFullList<Membre & { joueur_nom: string }>({ sort: "role" });
  return l.map((m) => ({ id: m.id, guilde: m.guilde, joueur: m.joueur, nom: m.joueur_nom, role: m.role }));
}

/** Admin : dissoudre une guilde (cascade : membres, demandes, salon). */
export async function dissoudreAdmin(guildeId: string): Promise<void> {
  await pb.collection("guildes").delete(guildeId);
}

/* ------------------------------------------------------------------ */
/* Qui peut quoi — le miroir des routes                                */
/* ------------------------------------------------------------------ */

export const gere = (role: RoleGuilde | undefined) => role === "chef" || role === "officier";

/** Le chef exclut tout le monde ; un officier, un simple membre. */
export function peutExclure(moi: RoleGuilde | undefined, cible: RoleGuilde): boolean {
  if (moi === "chef") return cible !== "chef";
  return moi === "officier" && cible === "membre";
}

export function libelleRole(r: RoleGuilde): string {
  return r === "chef" ? "Chef" : r === "officier" ? "Officier" : "Membre";
}

export function officiersRestants(membres: Membre[], reglages: Reglages): number {
  return Math.max(0, reglages.officiers_max - membres.filter((m) => m.role === "officier").length);
}

/** Pourquoi le joueur ne peut pas fonder de guilde, ou null. */
export function raisonCreation(etat: Pick<EtatGuildes, "age" | "reglages" | "ma_guilde">): string | null {
  if (etat.ma_guilde) return "Tu fais déjà partie d'une guilde.";
  if (etat.age < etat.reglages.age_min_creation)
    return `Il faut avoir atteint l'âge ${etat.reglages.age_min_creation} pour fonder une guilde (tu es à l'âge ${etat.age}).`;
  return null;
}

/** Le nom tel que le serveur le retiendra (espaces réduits), et s'il est valable. */
export function nomValide(nom: string): { nom: string; ok: boolean } {
  const n = nom.trim().split(/\s+/).filter(Boolean).join(" ");
  const long = [...n].length;
  return { nom: n, ok: long >= NOM_MIN && long <= NOM_MAX };
}

/** Le lien du joueur avec une guilde de la liste : membre, demande, invitation, ou rien. */
export function lienAvec(etat: EtatGuildes, guildeId: string): "membre" | SensDemande | null {
  if (etat.ma_guilde?.guilde.id === guildeId) return "membre";
  const d = etat.mes_demandes.find((x) => x.guilde === guildeId);
  return d ? d.sens : null;
}
