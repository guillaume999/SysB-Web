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
 * L'ordre suit la chaîne de fabrication : on déclare un modèle 3D, on nomme
 * les ressources, on pose les âges, puis on en fait des tuiles jouables — et
 * les technologies rangent ces tuiles par palier.
 *
 * ⚠️ « Âges » est placé AVANT « Tuiles » parce qu'il en est la base : une
 * tuile se range dans un âge, et une techno prend celui de son bâtiment.
 */
export const ECRANS_CONTENU: Lien[] = [
  { to: "/3dmodeltuile", label: "3DmodelTuile" },
  { to: "/ressources", label: "Ressources" },
  { to: "/ages", label: "Âges" },
  { to: "/tuiles", label: "Tuiles" },
  { to: "/technologies", label: "Technologie" },
  { to: "/modeles", label: "Modèles" },
  { to: "/plateaux", label: "Plateaux joueurs" },
  { to: "/joueurs", label: "Joueurs" },
];

/**
 * Les écrans qui n'écrivent dans aucune collection. **Ouverts à tout compte
 * connecté** — c'est par eux que le joueur entre sur le site.
 */
export const ECRANS_DOCUMENT: Lien[] = [{ to: "/conception", label: "Conception" }];

/**
 * **Les écrans d'un CONCEPTEUR** — un joueur à qui l'admin a ouvert un modèle
 * (13/09). Ce sont les mêmes écrans que ceux de l'admin, pas des copies : même
 * code, mêmes aides, mêmes garde-fous. Ce qui change est ce qu'ils MONTRENT,
 * et ça se décide dans `lib/partage.ts`, pas ici.
 *
 * ⚠️ Les adresses sont reprises de `ECRANS_CONTENU` au lieu d'être réécrites :
 * renommer « Technologie » en un seul endroit doit suffire. Une adresse qui
 * n'y figurerait pas est une faute de frappe — l'essai le vérifie.
 */
const ADRESSES_CONCEPTEUR = ["/modeles", "/tuiles", "/ressources", "/technologies"];

/**
 * ⚠️ **L'ordre n'est pas celui de l'admin, et c'est voulu** : un concepteur
 * entre par LE MODÈLE qu'on lui a ouvert — c'est l'objet du partage, et c'est
 * aussi `accueil()`. L'admin, lui, part du modèle 3D parce qu'il fabrique la
 * chaîne dans l'autre sens.
 *
 * ⚠️ On ne réécrit pas les libellés : chaque entrée est CHERCHÉE dans
 * `ECRANS_CONTENU`. Une adresse absente serait une faute de frappe — la liste
 * rendue serait alors plus courte, et l'essai le voit.
 */
export const ECRANS_CONCEPTEUR: Lien[] = ADRESSES_CONCEPTEUR.map((to) =>
  ECRANS_CONTENU.find((l) => l.to === to),
).filter((l): l is Lien => l !== undefined);

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
 * Trois cas, et un seul ordre de lecture : **admin**, puis **concepteur**,
 * puis joueur ordinaire. Un admin n'est jamais traité en concepteur — il ne
 * passe par aucun partage.
 */
export function ecransVisibles(
  admin: boolean,
  concepteur = false,
): { contenu: Lien[]; documents: Lien[] } {
  return {
    contenu: admin ? ECRANS_CONTENU : concepteur ? ECRANS_CONCEPTEUR : [],
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
export function accueil(admin: boolean, concepteur = false): string {
  if (admin) return "/";
  // ⚠️ Un concepteur entre par SES MODÈLES, pas par le document : c'est ce
  //    qu'on lui a ouvert, et le tableau de bord lui reste refusé (il compte
  //    `users`).
  if (concepteur) return ECRANS_CONCEPTEUR[0].to;
  return ECRANS_DOCUMENT[0].to;
}
