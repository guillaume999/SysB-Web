import { pb } from "@/lib/pb";

/** Un champ de collection PocketBase (0.23+ : les options sont aplaties sur le champ). */
export interface PbField {
  id?: string;
  name: string;
  type: string;
  required?: boolean;
  hidden?: boolean;
  system?: boolean;
  presentable?: boolean;
  // options aplaties selon le type
  values?: string[];        // select
  maxSelect?: number;       // select / relation / file
  collectionId?: string;    // relation
  onlyInt?: boolean;        // number
  [key: string]: unknown;
}

export interface PbCollection {
  id: string;
  name: string;
  type: "base" | "auth" | "view";
  fields?: PbField[];
  schema?: PbField[]; // compat < 0.23
  system?: boolean;
  listRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
}

/** Ordre d'affichage voulu dans la barre latérale : le contenu du jeu d'abord. */
const ORDER = ["config", "fiches", "templates", "productions", "evolutions", "plateaux", "users"];

/** Libellés lisibles + une phrase de contexte, tirés du schéma SysB. */
export const COLLECTION_INFO: Record<string, { label: string; hint: string }> = {
  config: { label: "Config", hint: "Configuration globale : catégories, ressources de départ." },
  fiches: { label: "Fiches", hint: "Cartes / unités jouables et leurs ressources." },
  templates: { label: "Plateaux modèles", hint: "Plateaux de base (ground, space) encodés en base64." },
  productions: { label: "Productions", hint: "Production par tuile et par niveau." },
  evolutions: { label: "Évolutions", hint: "Évolutions du contenu." },
  plateaux: { label: "Plateaux joueurs", hint: "Plateaux sauvegardés par les joueurs (lecture)." },
  users: { label: "Joueurs", hint: "Comptes joueurs (auth PocketBase)." },
};

export function fieldsOf(collection: PbCollection): PbField[] {
  return (collection.fields ?? collection.schema ?? []).filter((f) => !f.hidden);
}

/** Champs réellement éditables (on écarte l'id et les autodate gérés par PocketBase). */
export function editableFields(collection: PbCollection): PbField[] {
  return fieldsOf(collection).filter(
    (f) => f.type !== "autodate" && f.name !== "id" && !(f.system && f.type !== "text"),
  );
}

/** Colonne à afficher en premier dans les tableaux : le champ "parlant" de la collection. */
export function titleFieldOf(collection: PbCollection): string {
  const names = fieldsOf(collection).map((f) => f.name);
  for (const candidate of ["nom", "key", "pseudo", "email", "nomPersonnalise", "tileId"]) {
    if (names.includes(candidate)) return candidate;
  }
  return "id";
}

/**
 * Charge les collections visibles dans l'admin.
 * Nécessite une session superuser : l'API `/api/collections` n'est pas publique.
 */
export async function loadCollections(): Promise<PbCollection[]> {
  const all = (await pb.collections.getFullList({ sort: "name" })) as unknown as PbCollection[];
  return all
    .filter((c) => !c.name.startsWith("_") && c.type !== "view")
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.name);
      const ib = ORDER.indexOf(b.name);
      if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
}

/** Valeur initiale cohérente avec le type du champ, pour un nouveau record. */
export function emptyValue(field: PbField): unknown {
  switch (field.type) {
    case "number":
      return 0;
    case "bool":
      return false;
    case "json":
      return "";
    case "select":
    case "relation":
    case "file":
      return (field.maxSelect ?? 1) > 1 ? [] : "";
    default:
      return "";
  }
}
