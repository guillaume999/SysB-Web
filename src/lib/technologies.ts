/**
 * Les technologies du jeu.
 *
 * ⚠️ **Cette collection ne porte pour l'instant que l'IDENTITÉ d'une techno** :
 * son code, son nom, l'âge auquel elle appartient, son ordre d'affichage et ce
 * qu'elle fait en une phrase. Ce qu'elle COÛTE et ce qu'elle DÉBLOQUE n'est pas
 * encore décidé — l'utilisateur dictera la règle, et les champs viendront à ce
 * moment-là. Pas de `chemin_icone` non plus : il n'y a pas de dossier d'icônes
 * de techno, et un champ qui ne peut afficher aucune image est du champ mort.
 *
 * Conséquence, dite en toutes lettres dans l'écran : **le jeu ne lit pas encore
 * cette collection**. On saisit un vocabulaire, comme on l'a fait pour les
 * ressources avant que le moteur ne s'en serve. Retirer l'avertissement le jour
 * où le mécanisme existe, pas avant — voir [[feedback-filtre-nest-pas-regle]].
 *
 * Déclaré en `type` et non en `interface`, comme `Ressource` : le SDK PocketBase
 * attend un `RecordModel` indexable, auquel une interface n'est pas assignable.
 */

import { pb } from "@/lib/pb";

export const COLLECTION_TECHNOLOGIES = "technologies";

/**
 * Les sept âges de l'arbre (`SysB/arbre/arbre_sysb.json`). Écrits ici plutôt que
 * saisis librement : une techno qui se réclamerait d'un « âge 9 » ne trouverait
 * jamais sa colonne.
 */
export const AGES = [1, 2, 3, 4, 5, 6, 7] as const;
export type Age = (typeof AGES)[number];

/**
 * Le nom de chaque âge, **recopié de `arbre_sysb.json`** — la source de vérité
 * de l'arbre. Ne pas les réinventer ici : deux jeux de noms pour les mêmes sept
 * âges, et plus personne ne sait lequel est le bon.
 */
export const NOMS_AGES: Record<Age, string> = {
  1: "Pionniers",
  2: "Secteur artisanal",
  3: "Société urbaine",
  4: "Ère industrielle",
  5: "Ère spatiale primordiale",
  6: "Métropole spatiale",
  7: "Cité spatiale transhumaine",
};

export function libelleAge(age: number): string {
  return age in NOMS_AGES ? `Âge ${age} — ${NOMS_AGES[age as Age]}` : "sans âge";
}

export type Technologie = {
  id: string;
  collectionId: string;
  collectionName: string;
  code: string;
  nom: string;
  /** 1 à 7. `0` quand rien n'a été choisi — l'écran le montre comme « sans âge ». */
  age: number;
  ordre: number;
  /** À quoi elle sert, en une phrase. Texte libre, lu par l'humain seulement. */
  description: string;
  created: string;
  updated: string;
};

export interface ValeursTechnologie {
  code: string;
  nom: string;
  age: number;
  ordre: number;
  description: string;
}

/**
 * L'ordre du jeu : par âge, puis par le champ `ordre`, puis par nom. C'est
 * l'ordre dans lequel un arbre se lit — jamais l'alphabet.
 */
export function loadTechnologies(): Promise<Technologie[]> {
  return pb.collection(COLLECTION_TECHNOLOGIES).getFullList<Technologie>({
    sort: "age,ordre,nom",
  });
}
