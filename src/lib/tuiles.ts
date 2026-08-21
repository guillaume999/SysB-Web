/**
 * Catalogue de tuiles.
 *
 * Deux collections travaillent ensemble :
 *
 *  - `modeles` — l'inventaire des modèles 3D **réellement présents dans le build**
 *    Unity (un prefab sous `Assets/Resources/Tile/`). Il est poussé depuis Unity
 *    par le menu `SySB → Exporter les modèles`, vignette comprise. Ce site ne le
 *    remplit jamais lui-même : un chemin de prefab inventé ici donnerait une case
 *    vide dans le jeu.
 *
 *  - `tuiles` — le catalogue de jeu : un `tileId` (l'octet écrit dans
 *    `templates.tilesBase64`), un nom libre, et le modèle 3D à instancier.
 *    Plusieurs tuiles peuvent viser le même `prefabPath` : c'est ce qui permet
 *    d'avoir « Ferme du nord » et « Ferme du sud » sur le même modèle.
 *
 * Les deux sont déclarées en `type` et non en `interface` : le SDK PocketBase
 * attend un `RecordModel` indexable, auquel une interface n'est pas assignable.
 */

import { pb } from "@/lib/pb";

export type TypePlateau = "ground" | "space";

export type Modele = {
  id: string;
  collectionId: string;
  collectionName: string;
  prefabPath: string;
  nom: string;
  source: string;
  typeSuggere: TypePlateau | "";
  vignette: string;
  updated: string;
};

export type Tuile = {
  id: string;
  collectionId: string;
  collectionName: string;
  tileId: number;
  nom: string;
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

export function loadModeles(): Promise<Modele[]> {
  return pb.collection("modeles").getFullList<Modele>({ sort: "nom" });
}

export function loadTuiles(): Promise<Tuile[]> {
  return pb.collection("tuiles").getFullList<Tuile>({ sort: "tileId" });
}

/** URL de la vignette d'un modèle, ou null s'il n'en a pas encore. */
export function vignetteUrl(modele: Modele, thumb?: string): string | null {
  if (!modele.vignette) return null;
  return pb.files.getURL(modele, modele.vignette, thumb ? { thumb } : undefined);
}

/** Plus petit `tileId` libre. Renvoie null si les 255 sont pris. */
export function prochainTileIdLibre(tuiles: Tuile[]): number | null {
  const pris = new Set(tuiles.map((t) => t.tileId));
  for (let id = TILE_ID_MIN; id <= TILE_ID_MAX; id++) {
    if (!pris.has(id)) return id;
  }
  return null;
}

/** Tuiles regroupées par modèle, pour afficher les réutilisations. */
export function tuilesParPrefab(tuiles: Tuile[]): Map<string, Tuile[]> {
  const index = new Map<string, Tuile[]>();
  for (const tuile of tuiles) {
    const liste = index.get(tuile.prefabPath);
    if (liste) liste.push(tuile);
    else index.set(tuile.prefabPath, [tuile]);
  }
  return index;
}

/**
 * Message d'erreur lisible à partir d'un échec PocketBase.
 * Les erreurs de validation arrivent dans `response.data`, champ par champ.
 */
export function messageErreur(e: unknown, defaut: string): string {
  const err = e as { message?: string; response?: { data?: Record<string, { message?: string }> } };
  const details = Object.entries(err.response?.data ?? {})
    .map(([champ, info]) => `${champ} : ${info?.message ?? "invalide"}`)
    .join(" · ");
  return details || err.message || defaut;
}
