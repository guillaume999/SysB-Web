/**
 * Schéma des collections SysB, décrit en dur.
 *
 * Pourquoi en dur : l'endpoint `/api/collections` de PocketBase est réservé aux
 * superusers, et ce site se connecte avec un compte **joueur `role = admin`**.
 * Le schéma est donc maintenu ici, en miroir de la base. Si un champ est ajouté
 * côté PocketBase, il faut l'ajouter dans ce fichier (et redéployer).
 */

export interface PbField {
  name: string;
  type: "text" | "number" | "bool" | "json" | "select" | "date" | "editor";
  required?: boolean;
  onlyInt?: boolean;
  values?: string[];
  /** Rendu en zone de texte multiligne plutôt qu'en champ simple. */
  multiline?: boolean;
  /** Aide affichée sous le champ. */
  hint?: string;
}

export interface PbCollection {
  id: string;
  name: string;
  label: string;
  hint: string;
  fields: PbField[];
}

/**
 * Aucune collection générique pour l'instant.
 *
 * `config`, `fiches`, `templates`, `productions`, `evolutions` et `plateaux` ont
 * été supprimées de PocketBase le 2026-08-22 : la logique tuiles est refaite
 * depuis zéro (3DmodelTuile → catalogue de tuiles), et ces tables décrivaient
 * l'ancien découpage. Elles reviendront une par une, avec leur écran, quand
 * leur contenu sera arrêté. Les écrans génériques (`CollectionPage`,
 * `RecordForm`, `JsonField`) sont conservés pour ce moment-là.
 */
export const COLLECTIONS: PbCollection[] = [];

export function collectionByName(name: string): PbCollection | undefined {
  return COLLECTIONS.find((c) => c.name === name);
}

/** Colonne « parlante » d'une collection, utilisée dans les confirmations. */
export function titleFieldOf(collection: PbCollection): string {
  const names = collection.fields.map((f) => f.name);
  for (const candidate of ["nom", "key", "nomPersonnalise", "nomTile", "tileId"]) {
    if (names.includes(candidate)) return candidate;
  }
  return "id";
}

/** Valeur initiale cohérente avec le type du champ, pour un nouveau record. */
export function emptyValue(field: PbField): unknown {
  switch (field.type) {
    case "number":
      return "";
    case "bool":
      return false;
    default:
      return "";
  }
}
