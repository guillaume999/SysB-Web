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

const RESSOURCES_HINT = 'tableau de { ressource, type: "per_minute" | "once", valeur }';

export const COLLECTIONS: PbCollection[] = [
  {
    id: "config",
    name: "config",
    label: "Config",
    hint: "Configuration globale du jeu : deux records attendus, `categories` et `ressources_depart`.",
    fields: [
      { name: "key", type: "text", required: true, hint: "categories · ressources_depart" },
      { name: "value", type: "json", hint: 'ex. { "categories": [{ "imageId": "…", "nom": "Commune" }] }' },
    ],
  },
  {
    id: "fiches",
    name: "fiches",
    label: "Fiches",
    hint: "Cartes / unités jouables, leur production et leur consommation.",
    fields: [
      { name: "nom", type: "text", required: true },
      { name: "categorie", type: "text", hint: "doit correspondre à un nom dans config → categories" },
      { name: "niveau", type: "number", onlyInt: true },
      { name: "tileId", type: "number", onlyInt: true },
      { name: "typeBoard", type: "text", hint: "ground · space" },
      { name: "obtention", type: "json", hint: "conditions d'obtention" },
      { name: "production", type: "json", hint: RESSOURCES_HINT },
      // Orthographe volontaire : le champ s'appelle bien « consomation » en base.
      { name: "consomation", type: "json", hint: RESSOURCES_HINT },
    ],
  },
  {
    id: "templates",
    name: "templates",
    label: "Plateaux modèles",
    hint: "Plateaux de base proposés aux joueurs (ground, space).",
    fields: [
      { name: "nom", type: "text", required: true },
      { name: "typeOfPlateau", type: "text", hint: "ground · space" },
      { name: "hauteur", type: "number", onlyInt: true },
      { name: "largeur", type: "number", onlyInt: true },
      { name: "tilesBase64", type: "text", multiline: true, hint: "grille encodée en base64" },
    ],
  },
  {
    id: "productions",
    name: "productions",
    label: "Productions",
    hint: "Production par tuile, déclinée par niveau.",
    fields: [
      { name: "tileId", type: "number", onlyInt: true, required: true },
      { name: "nomPersonnalise", type: "text" },
      { name: "niveaux", type: "json", hint: "tableau des niveaux de production" },
    ],
  },
  {
    id: "evolutions",
    name: "evolutions",
    label: "Évolutions",
    hint: "Paliers d'évolution des tuiles et leurs conditions.",
    fields: [
      { name: "tileId", type: "number", onlyInt: true },
      { name: "nomTile", type: "text" },
      { name: "palier", type: "number", onlyInt: true },
      { name: "conditions", type: "json" },
    ],
  },
];

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
