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
  { to: "/socles", label: "Socles" },
  { to: "/ressources", label: "Ressources" },
  { to: "/ages", label: "Âges" },
  { to: "/tuiles", label: "Tuiles" },
  { to: "/technologies", label: "Technologie" },
  { to: "/modeles", label: "Modèles" },
  { to: "/plateaux", label: "Plateaux joueurs" },
  { to: "/joueurs", label: "Joueurs" },
  { to: "/limites", label: "Limites" },
  { to: "/guildes", label: "Guildes" },
];

/**
 * **Les écrans de CONCEPTION d'un joueur (15/09)** — ceux de l'admin, bornés à
 * SA planète : ses modèles de plateau, ses tuiles, ses ressources, ses technos.
 *
 * ⚠️ Cherchés dans `ECRANS_CONTENU`, pas réécrits : un libellé changé là-bas
 * change ici aussi. L'ordre est celui de la fabrication : on crée ses
 * ressources, ses tuiles, ses technos, puis on peint ses modèles.
 *
 * ⚠️ Ce sont les MÊMES routes que l'admin : c'est la page qui borne ce qu'elle
 * montre (`lib/conception.ts`), et le serveur qui refuse le reste.
 */
const ADRESSES_CONCEPTION = ["/ressources", "/tuiles", "/technologies", "/modeles"];
export const ECRANS_CONCEPTION: Lien[] = ADRESSES_CONCEPTION.map(
  (to) => ECRANS_CONTENU.find((e) => e.to === to)!,
);

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
 * **Les écrans PUBLICS (15/09)** — lisibles SANS connexion : un visiteur
 * anonyme ne voit qu'eux, et un compte connecté les garde dans sa barre.
 *
 * ⚠️ Écrire y reste réglé par PocketBase : news → admin seul ; forum →
 * compte connecté, selon les deux cases de chaque salon (`lib/forum.ts`).
 */
export const ECRANS_PUBLICS: Lien[] = [
  { to: "/news", label: "News" },
  { to: "/forum", label: "Forum" },
];

/**
 * **Les écrans de GUILDE (15/09)** — pour tout compte connecté, admin compris ;
 * jamais pour le visiteur. Le salon n'est lisible que par les membres : c'est
 * le SERVEUR qui refuse les autres (403), la page ne fait que le dire.
 */
export const ECRANS_GUILDE: Lien[] = [
  { to: "/guilde", label: "Ma guilde" },
  { to: "/guilde/salon", label: "Salon de guilde" },
];

/**
 * **L'écran du COMPTE CONNECTÉ (15/09)** — sa fiche, son email, son mot de
 * passe. Pour tout compte connecté, admin compris ; jamais pour le visiteur
 * (il n'a pas de compte à montrer).
 */
export const ECRANS_COMPTE: Lien[] = [{ to: "/compte", label: "Mon compte" }];

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
 * Les groupes de la barre latérale, pour le compte en cours.
 *
 * Deux cas : l'admin a tout ; le joueur a SA conception, la communauté, sa
 * guilde, les documents et son compte. (Le visiteur anonyme n'a pas de barre latérale :
 * voir `PublicLayout`.)
 */
export function ecransVisibles(admin: boolean): {
  contenu: Lien[];
  communaute: Lien[];
  guilde: Lien[];
  documents: Lien[];
  compte: Lien[];
} {
  return {
    contenu: admin ? ECRANS_CONTENU : ECRANS_CONCEPTION,
    communaute: ECRANS_PUBLICS,
    guilde: ECRANS_GUILDE,
    documents: ECRANS_DOCUMENT,
    compte: ECRANS_COMPTE,
  };
}

/**
 * Où mène « SysB » en haut de la barre, et où retombe une adresse inconnue.
 *
 * ⚠️ Pour un joueur ce n'est PAS `/` : le tableau de bord compte les records
 * de huit collections, dont `users`, qu'il n'a pas le droit de lister. Il y
 * verrait huit tuiles vides — et une adresse inconnue le renverrait en boucle
 * dessus.
 *
 * Depuis le 15/09 le joueur entre par les News (avant : la Conception), comme
 * le visiteur anonyme — c'est la page qui change le plus souvent.
 */
export function accueil(admin: boolean): string {
  if (admin) return "/";
  return ECRANS_PUBLICS[0].to;
}
