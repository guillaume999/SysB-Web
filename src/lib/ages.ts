/**
 * Les âges du jeu — la base sur laquelle les tuiles et les technologies se
 * rangent.
 *
 * **Demande de l'utilisateur, le 2026-08-27 :** *« fais moi un onglet des ages !
 * qui servira de base pour les techno et les tuiles »*. Jusque-là les sept âges
 * étaient écrits **en dur** dans `technologies.ts` (`AGES`, `NOMS_AGES`),
 * recopiés de `arbre_sysb.json`. Ils sont devenus une collection :
 *
 * - on peut en **ajouter un huitième**, en renommer un, corriger un ordre ;
 * - un âge porte une **description** et les **bâtiments qui l'ouvrent** ;
 * - et surtout il n'y a **plus qu'une seule liste** : l'écran des tuiles et
 *   celui des technologies lisent la même.
 *
 * ⚠️ **Le `numero` est la clé, pas l'id PocketBase.** C'est lui qui est stocké
 * dans `tuiles.age` et `technologies.age`, comme un `code` de ressource : un id
 * de record ne survivrait pas à une base recréée. Le renuméroter décroche donc
 * toutes les tuiles de cet âge — l'écran le dit avant d'enregistrer.
 *
 * ⚠️ **`0` n'est pas un âge**, c'est l'absence d'âge : les cases de terrain
 * (eau, forêt, volcan) et les tuiles pas encore classées. Aucun record ne peut
 * porter le numéro 0 — voir `NUMERO_MIN`.
 *
 * ⚠️ **Le jeu ne lit pas encore cette table**, pas plus que `technologies` :
 * rien ne verrouille un âge tant que ses bâtiments ne sont pas debout, et rien
 * ne refuse de construire hors de son âge. L'écran le dit en orange. Retirer
 * l'avertissement AVEC le mécanisme, pas avant.
 *
 * Déclaré en `type` et non en `interface`, comme `Ressource` : le SDK
 * PocketBase attend un `RecordModel` indexable, auquel une interface n'est pas
 * assignable.
 */

import { pb } from "@/lib/pb";
import { tileIdsDe } from "@/lib/tuiles";

export const COLLECTION_AGES = "ages";

/** Ce que porte une tuile ou une techno qui n'appartient à aucun âge. */
export const SANS_AGE = 0;

/** Le plus petit numéro qu'un âge puisse porter : `0` veut dire « aucun ». */
export const NUMERO_MIN = 1;

export type Age = {
  id: string;
  collectionId: string;
  collectionName: string;
  /**
   * Le numéro de l'âge, ≥ 1. **C'est la clé** : `tuiles.age` et
   * `technologies.age` stockent ce nombre.
   */
  numero: number;
  nom: string;
  /** Une phrase : ce que l'âge change. Lue par l'humain seulement. */
  description: string;
  /**
   * tileIds des bâtiments qu'il faut **posséder** pour que l'âge s'ouvre.
   *
   * ⚠️ **Tous, pas un seul.** L'utilisateur a demandé « un bâtiment qui le
   * débloque, ou plusieurs » : plusieurs sont permis, et ils se lisent comme une
   * liste de conditions — le jour où le moteur les appliquera. Vide = l'âge
   * n'est conditionné à rien.
   *
   * Par `tileId`, comme les règles de placement et les technos : c'est ce que
   * le moteur lit.
   */
  batiments_requis: number[];
  created: string;
  updated: string;
};

export interface ValeursAge {
  numero: number;
  nom: string;
  description: string;
  batiments_requis: number[];
}

/** Les bâtiments qui ouvrent cet âge, nettoyés (dédoublonnés, triés, sans zéro). */
export function batimentsRequisDe(a: { batiments_requis?: unknown }): number[] {
  return tileIdsDe(a.batiments_requis);
}

/** L'âge portant ce numéro, ou `undefined` — numéro 0, ou âge supprimé. */
export function ageDe(numero: number, ages: Age[]): Age | undefined {
  return numero > 0 ? ages.find((a) => a.numero === numero) : undefined;
}

/**
 * Le libellé d'un âge, dit **une fois** pour que les trois écrans concordent.
 *
 * ⚠️ Un numéro qui n'est déclaré nulle part n'est PAS masqué : il s'affiche
 * « non déclaré ». Une tuile rangée sous un âge inexistant est une erreur de
 * saisie qu'il faut voir, pas une ligne à faire disparaître.
 */
export function libelleAge(numero: number, ages: Age[]): string {
  if (numero <= 0) return "sans âge";
  const a = ageDe(numero, ages);
  return a ? `Âge ${a.numero} — ${a.nom}` : `Âge ${numero} — non déclaré`;
}

/** Les numéros déclarés, dans l'ordre. Ce que les listes déroulantes proposent. */
export function numerosDeclares(ages: Age[]): number[] {
  return ages.map((a) => a.numero).sort((x, y) => x - y);
}

/** Le premier numéro libre, pour proposer un défaut à la création. */
export function prochainNumero(ages: Age[]): number {
  return Math.max(NUMERO_MIN - 1, ...ages.map((a) => a.numero)) + 1;
}

/**
 * Par numéro, jamais par nom : un âge est un palier, et un palier se lit dans
 * l'ordre où on le franchit.
 */
export function loadAges(): Promise<Age[]> {
  return pb.collection(COLLECTION_AGES).getFullList<Age>({ sort: "numero" });
}
