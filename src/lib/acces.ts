// ============================================================
//  acces.ts
//  QUI VOIT QUOI sur le site — la seule source de vérité.
//
//  Jusqu'au 2026-09-13 la question ne se posait pas : seul un compte
//  `role = "admin"` pouvait se connecter, tout le reste était refusé dès
//  `signIn`. Le site s'ouvre maintenant à **tout compte `users`**, parce que
//  l'onglet Conception doit être lisible par un joueur.
//
//  ⚠️ CE QUI N'A PAS CHANGÉ : un joueur ne voit AUCUN écran de contenu. Le
//  partage se décide ici, et nulle part ailleurs — la barre latérale, le menu
//  mobile et le routeur lisent tous les trois ces fonctions. Ajouter un écran
//  sans passer par `ECRANS_CONTENU`, c'est le rendre visible à tout le monde.
//
//  ⚠️ ET SURTOUT : ce fichier cache des écrans, il ne PROTÈGE rien. Ce qui
//  protège les données, ce sont les règles d'API PocketBase
//  (`@request.auth.role = 'admin'` en écriture). Un joueur qui tape l'URL à la
//  main est renvoyé sur /conception par le routeur, mais s'il forgeait une
//  requête HTTP, c'est PocketBase qui dirait non — pas ce fichier.
// ============================================================

import type { Role } from "@/lib/auth";

/** Une entrée de navigation : son adresse et son libellé. */
export type Lien = { to: string; label: string };

/**
 * Les écrans qui pilotent une collection. **Réservés aux admins.**
 *
 * L'ordre suit la chaîne de fabrication : on déclare un modèle 3D et ses
 * icônes, on nomme les ressources, on pose les âges, puis on en fait des tuiles jouables — et
 * les technologies rangent ces tuiles par palier.
 *
 * ⚠️ « Âges » est placé AVANT « Tuiles » parce qu'il en est la base : une
 * tuile se range dans un âge, et une techno prend celui de son bâtiment.
 */
export const ECRANS_CONTENU: Lien[] = [
  { to: "/3dmodeltuile", label: "3DmodelTuile" },
  { to: "/icones", label: "Icônes" },
  { to: "/ressources", label: "Ressources" },
  { to: "/ages", label: "Âges" },
  { to: "/tuiles", label: "Tuiles" },
  { to: "/technologies", label: "Technologie" },
  { to: "/modeles", label: "Modèles" },
  { to: "/plateaux", label: "Plateaux joueurs" },
  { to: "/joueurs", label: "Joueurs" },
];

/**
 * **Les écrans ouverts à TOUT COMPTE CONNECTÉ** — c'est par eux que le joueur
 * entre sur le site.
 *
 * ⚠️ Pas d'écran « Ma planète » (retiré le 15/09) : la planète d'un joueur est
 * créée d'office par le serveur à l'inscription. Il ne l'édite pas sur le
 * site : depuis le 15/09 au soir, seul l'admin crée et modifie (le partage de
 * modèle et le rôle de concepteur ont été retirés).
 */
export const ECRANS_DOCUMENT: Lien[] = [{ to: "/conception", label: "Conception" }];

/**
 * Le rôle donne-t-il les écrans de contenu ?
 *
 * ⚠️ `role` n'est pas requis sur `users` : un compte créé par l'inscription du
 * jeu l'a vide. Seule la chaîne exacte `"admin"` ouvre — « testeur » est un
 * joueur de plus, c'est ce que dit sa fiche dans l'onglet Joueurs.
 */
export function roleEstAdmin(role: Role | "" | undefined | null): boolean {
  return role === "admin";
}

/**
 * Les deux groupes de la barre latérale, pour le compte en cours.
 *
 * Deux cas : l'admin a tout, le joueur n'a que les documents.
 */
export function ecransVisibles(admin: boolean): { contenu: Lien[]; documents: Lien[] } {
  return {
    contenu: admin ? ECRANS_CONTENU : [],
    documents: ECRANS_DOCUMENT,
  };
}

/**
 * Où mène « SysB » en haut de la barre, et où retombe une adresse inconnue.
 *
 * ⚠️ Pour un joueur ce n'est PAS `/` : le tableau de bord compte les records
 * de huit collections, dont `users`, qu'il n'a pas le droit de lister. Il y
 * verrait huit tuiles vides — et une adresse inconnue le renverrait en boucle
 * dessus.
 */
export function accueil(admin: boolean): string {
  if (admin) return "/";
  return ECRANS_DOCUMENT[0].to;
}
