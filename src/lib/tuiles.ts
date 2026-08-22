/**
 * Catalogue de tuiles — ce que le joueur peut réellement poser sur un plateau.
 *
 * Une tuile n'est pas un modèle 3D : c'est un modèle 3D (`tuile3dmodel`, voir
 * `lib/modeles3d.ts`) **plus** les règles du jeu qui vont avec — nom, tileId,
 * et à terme conditions d'utilisation, coûts, productions.
 *
 * Le lien vers le modèle passe par le champ `prefabPath`, qui contient la même
 * valeur que `cheminJeu(modele)`, c'est-à-dire `Prefabs/<chemin_prefab>/<nom_prefab>`.
 * Le nom du champ est hérité, il sera aligné quand le catalogue sera repris
 * (les règles de jeu restent à faire).
 *
 * Déclaré en `type` et non en `interface` : le SDK PocketBase attend un
 * `RecordModel` indexable, auquel une interface n'est pas assignable.
 */

import { pb } from "@/lib/pb";
import type { TypePlateau } from "@/lib/modeles3d";

export type { TypePlateau };

export type Tuile = {
  id: string;
  collectionId: string;
  collectionName: string;
  tileId: number;
  nom: string;
  /** Miroir de `cheminJeu(modele)` — le chemin que `Resources.Load` reçoit. */
  prefabPath: string;
  typeOfPlateau: TypePlateau;
  updated: string;
};

/**
 * `tilesBase64` est un `byte[]` brut : un octet par case. L'id 0 est réservé à
 * la case vide côté `PlateauGenerator`, donc les tuiles vont de 1 à 255.
 */
export const TILE_ID_MIN = 1;
export const TILE_ID_MAX = 255;

export function loadTuiles(): Promise<Tuile[]> {
  return pb.collection("tuiles").getFullList<Tuile>({ sort: "tileId" });
}

/** Plus petit `tileId` libre. Renvoie null si les 255 sont pris. */
export function prochainTileIdLibre(tuiles: Tuile[]): number | null {
  const pris = new Set(tuiles.map((t) => t.tileId));
  for (let id = TILE_ID_MIN; id <= TILE_ID_MAX; id++) {
    if (!pris.has(id)) return id;
  }
  return null;
}

/** Tuiles regroupées par modèle 3D, pour afficher les réutilisations. */
export function tuilesParPrefab(tuiles: Tuile[]): Map<string, Tuile[]> {
  const index = new Map<string, Tuile[]>();
  for (const tuile of tuiles) {
    const liste = index.get(tuile.prefabPath);
    if (liste) liste.push(tuile);
    else index.set(tuile.prefabPath, [tuile]);
  }
  return index;
}
