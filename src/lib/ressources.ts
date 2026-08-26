/**
 * Le vocabulaire des ressources du jeu.
 *
 * Une dizaine de records, saisis une fois. Partout ailleurs — coûts, productions,
 * consommations — une ressource est désignée par son `code`, jamais par un texte
 * libre : les formulaires n'offrent que des listes alimentées par cette collection,
 * pour qu'il soit impossible d'écrire un code que le jeu ne connaîtra pas.
 *
 * Déclaré en `type` et non en `interface` : le SDK PocketBase attend un
 * `RecordModel` indexable, auquel une interface n'est pas assignable.
 */

import { pb } from "@/lib/pb";

export const COLLECTION_RESSOURCES = "ressources";

/**
 * - `stock` : s'accumule et se dépense (bois, or, viande).
 * - `flux` : n'existe qu'en débit, ne s'accumule pas (énergie, eau courante).
 * - `population` : cas particulier, se mobilise et se libère plutôt que se consommer.
 * - `indicateur` : **calculé, jamais transporté** (la satisfaction). Ajouté le
 *   2026-08-26 sur la demande d'une « ressource utilisée comme indicateur » :
 *   elle garde son nom, son icône et sa place dans la barre de ressources, mais
 *   le genre marque qu'elle ne se stocke pas et ne monte dans aucune navette.
 *
 * ⚠️ **Deux genres ne voyagent jamais : `population` et `indicateur`.** Les
 * listes d'approvisionnement les excluent — voir `RESSOURCES_TRANSPORTABLES`.
 * Un habitant ne prend pas la navette, un pourcentage non plus.
 */
export type GenreRessource = "stock" | "flux" | "population" | "indicateur";

export const GENRES: { valeur: GenreRessource; libelle: string; aide: string }[] = [
  { valeur: "stock", libelle: "stock", aide: "s'accumule et se dépense" },
  { valeur: "flux", libelle: "flux", aide: "n'existe qu'en débit, ne s'accumule pas" },
  { valeur: "population", libelle: "population", aide: "se mobilise et se libère" },
  {
    valeur: "indicateur",
    libelle: "indicateur",
    aide: "calculé, jamais stocké ni transporté (la satisfaction)",
  },
];

/** Les genres qu'une navette peut porter. Ni les habitants, ni un pourcentage. */
export const GENRES_TRANSPORTABLES: GenreRessource[] = ["stock", "flux"];

export function estTransportable(r: { genre: GenreRessource | "" }): boolean {
  return GENRES_TRANSPORTABLES.includes(r.genre as GenreRessource);
}

export type Ressource = {
  id: string;
  collectionId: string;
  collectionName: string;
  code: string;
  nom: string;
  genre: GenreRessource | "";
  ordre: number;
  /** Chemin de la vignette sous `Assets/Resources/`, ex. `Icones/ble`. Vide pour l'instant. */
  chemin_icone: string;
  created: string;
  updated: string;
};

export interface ValeursRessource {
  code: string;
  nom: string;
  genre: GenreRessource;
  ordre: number;
  chemin_icone: string;
}

export function loadRessources(): Promise<Ressource[]> {
  return pb.collection(COLLECTION_RESSOURCES).getFullList<Ressource>({ sort: "ordre,nom" });
}

/**
 * Les ressources **par ordre alphabétique**, pour toutes les listes où l'on
 * CHERCHE une ressource : menus déroulants, cases à cocher, tableau de
 * stockage.
 *
 * ⚠️ À ne pas confondre avec le tri de `loadRessources()`, qui suit le champ
 * `ordre` : celui-là est l'ordre d'affichage **en jeu**, dans la barre de
 * ressources, et l'écran Ressources doit le montrer tel quel — sinon le champ
 * `ordre` devient impossible à régler.
 *
 * `localeCompare` en français : les accents ne partent pas en fin de liste.
 */
export function parAlphabet(ressources: Ressource[]): Ressource[] {
  return [...ressources].sort((a, b) =>
    (a.nom ?? "").localeCompare(b.nom ?? "", "fr", { sensitivity: "base" }),
  );
}

/** Libellé lisible d'un code, avec repli sur le code quand la ressource a disparu. */
export function libelleRessource(ressources: Ressource[], code: string): string {
  return ressources.find((r) => r.code === code)?.nom || code;
}

/** Vrai si le code n'existe plus dans le vocabulaire — à signaler dans les écrans. */
export function codeInconnu(ressources: Ressource[], code: string): boolean {
  return code !== "" && !ressources.some((r) => r.code === code);
}
