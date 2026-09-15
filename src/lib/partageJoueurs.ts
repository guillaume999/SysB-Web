// ============================================================
//  partageJoueurs.ts
//  « À QUI C'EST OUVERT » — la logique pure de l'onglet Partage des fiches
//  3DmodelTuile et Icônes (15/09).
//
//  ⚠️ À NE PAS CONFONDRE avec l'ancien `partage.tsx` (partage de MODÈLE DE
//  PLATEAU à un concepteur), retiré le 15/09. Ici on ouvre un modèle 3D ou une
//  icône à des joueurs, pour leurs tuiles, technos et magasins.
//
//  La règle elle-même est `autoriseeSur` (lib/planetes.ts) : ce fichier ne
//  fait que l'écran.
// ============================================================

import type { Joueur } from "@/lib/joueurs";
import type { Partageable } from "@/lib/planetes";

/** Le nom qu'on montre d'un joueur : pseudo, sinon email, sinon id. */
export function nomJoueur(j: Pick<Joueur, "pseudo" | "email" | "id">): string {
  return j.pseudo?.trim() || j.email?.trim() || j.id;
}

/** Les joueurs dont le pseudo ou l'email contient le texte (casse et accents ignorés). */
export function chercherJoueurs<J extends Pick<Joueur, "pseudo" | "email" | "id">>(
  joueurs: J[],
  texte: string,
): J[] {
  const q = sansAccent(texte.trim());
  const tries = [...joueurs].sort((a, b) =>
    nomJoueur(a).localeCompare(nomJoueur(b), "fr", { sensitivity: "base" }),
  );
  if (!q) return tries;
  return tries.filter((j) => sansAccent(`${j.pseudo ?? ""} ${j.email ?? ""}`).includes(q));
}

function sansAccent(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Ajoute ou retire un joueur, sans doublon et sans réordonner. */
export function avecJoueur(liste: string[], id: string, ouvert: boolean): string[] {
  if (ouvert) return liste.includes(id) ? liste : [...liste, id];
  return liste.filter((x) => x !== id);
}

/**
 * Coche ou décoche d'un coup une série de joueurs (le bouton « cocher la
 * liste »), sans doublon et sans réordonner ce qui était déjà choisi.
 *
 * ⚠️ C'est une PHOTO des comptes du moment — le cadeau d'une période : un
 * joueur inscrit demain n'y sera pas. Pour « tout le monde, y compris
 * demain », c'est l'autre bouton radio (`toutes_planetes`).
 */
export function avecJoueurs(liste: string[], ids: string[], ouvert: boolean): string[] {
  if (!ouvert) {
    const retirer = new Set(ids);
    return liste.filter((x) => !retirer.has(x));
  }
  const deja = new Set(liste);
  return [...liste, ...ids.filter((id) => !deja.has(id) && (deja.add(id), true))];
}

/**
 * Le résumé d'une ligne, en quelques mots — pour les tableaux.
 * ⚠️ Un id de joueur disparu (compte supprimé) est COMPTÉ mais pas nommé :
 * il ne sert plus, et le taire ferait croire que la liste est plus courte.
 */
export function resumePartage(part: Partageable, joueurs: Pick<Joueur, "pseudo" | "email" | "id">[]): string {
  if (part.toutes_planetes) return "tous les joueurs";
  const ids = part.joueurs_autorises ?? [];
  const planetes = (part.planetes_autorisees ?? []).length;
  const morceaux: string[] = [];
  if (ids.length > 0) {
    const noms = ids
      .map((id) => joueurs.find((j) => j.id === id))
      .filter((j): j is Pick<Joueur, "pseudo" | "email" | "id"> => !!j)
      .map(nomJoueur);
    const inconnus = ids.length - noms.length;
    const affiches = noms.length > 2 ? `${noms.slice(0, 2).join(", ")} +${noms.length - 2}` : noms.join(", ");
    morceaux.push(inconnus > 0 ? `${affiches}${affiches ? " " : ""}(+${inconnus} inconnu${inconnus > 1 ? "s" : ""})` : affiches);
  }
  if (planetes > 0) morceaux.push(`${planetes} planète${planetes > 1 ? "s" : ""}`);
  return morceaux.length ? morceaux.join(" · ") : "personne";
}
