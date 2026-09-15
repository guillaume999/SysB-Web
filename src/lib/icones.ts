// ============================================================
//  icones.ts
//  L'ONGLET ICÔNES (15/09) — les dessins que le site connaît, rangés par
//  dossier, et leur fiche `icones` (nom, catégorie, partage).
//
//  ⚠️⚠️ DEUX SOURCES, ET AUCUNE N'EST COMPLÈTE :
//    · les FICHIERS : les SVG de `public/icones*` — ce que le site sait
//      dessiner. Relevés au build par le module virtuel `virtual:icones-du-site`
//      (voir `vite.config.ts`), puisque le site ne lit pas le projet Unity ;
//    · les RECORDS : la collection `icones`, créée par
//      `patch-icones-2026-09-14.js` à partir des seuls chemins DÉJÀ cités.
//  Un dessin sans record s'affiche quand même (« pas encore déclarée ») et sa
//  fiche le CRÉE à l'enregistrement. Un record sans dessin (les planètes,
//  qui n'ont pas de SVG sur le site) s'affiche aussi, sous son dossier Unity.
//
//  ⚠️ LE CHEMIN EST CELUI D'UNITY — `Icones_Ressources/ble`, sans extension —
//  parce que c'est ce que `Resources.Load` attend. La table `DOSSIERS_SITE`
//  est la seule traduction dossier du site ↔ dossier Unity ; `Vignette.tsx`
//  porte la même, dans l'autre sens.
// ============================================================

import { pb } from "@/lib/pb";
import {
  COLLECTION_ICONES,
  type Icone,
  type Partageable,
  type UsageIcone,
} from "@/lib/planetes";

/** Les catégories, dans l'ordre d'affichage, avec le mot que l'admin lit. */
export const CATEGORIES_ICONE: { valeur: UsageIcone; libelle: string }[] = [
  { valeur: "ressource", libelle: "Ressource" },
  { valeur: "tuile", libelle: "Bâtiment" },
  { valeur: "techno", libelle: "Technologie" },
  { valeur: "planete", libelle: "Planète" },
  { valeur: "autre", libelle: "Autre" },
];

export function libelleCategorie(usage: string | undefined | null): string {
  return CATEGORIES_ICONE.find((c) => c.valeur === usage)?.libelle ?? "—";
}

/**
 * Dossier du site (sous `public/`) → dossier Unity (sous `Assets/Resources/`)
 * et la catégorie qu'on PROPOSE à une icône pas encore déclarée.
 */
export const DOSSIERS_SITE: Record<string, { unity: string; usage: UsageIcone }> = {
  icones: { unity: "Icones_Ressources", usage: "ressource" },
  icones_tuiles: { unity: "Icones_Tuiles", usage: "tuile" },
  icones_technos: { unity: "Icones_Technos", usage: "techno" },
};

/**
 * ⚠️ Deux écritures existent pour les ressources (`Icones/` et
 * `Icones_Ressources/`, cf. patch 3) : un record à l'ancienne écriture doit
 * être RETROUVÉ, sinon on créerait un doublon à la première fiche ouverte.
 */
const ALIAS_UNITY: Record<string, string[]> = {
  Icones_Ressources: ["Icones"],
};

/** Un fichier relevé : `dossier` du site et nom sans extension. */
export type FichierIcone = { dossier: string; nom: string };

/** Une ligne de l'onglet : un dessin, un record, ou les deux. */
export type LigneIcone = {
  /** Le chemin Unity — la clé de la ligne. */
  chemin: string;
  /** Le dossier Unity, pour le regroupement. */
  dossier: string;
  /** L'image servie par le site, ou null quand il n'a pas de dessin. */
  url: string | null;
  /** La fiche en base, ou null quand l'icône n'est pas encore déclarée. */
  record: Icone | null;
  /** La catégorie à proposer si le record n'existe pas encore. */
  usageParDefaut: UsageIcone;
};

export type GroupeIcones = { dossier: string; lignes: LigneIcone[] };

export function dossierDe(chemin: string): string {
  const i = chemin.lastIndexOf("/");
  return i < 0 ? "" : chemin.slice(0, i);
}

export function nomDeFichier(chemin: string): string {
  return chemin.slice(chemin.lastIndexOf("/") + 1);
}

/**
 * Fusionne fichiers et records en groupes par dossier Unity, triés.
 * Chaque record n'apparaît qu'UNE fois, même trouvé par un alias.
 */
export function grouperIcones(fichiers: FichierIcone[], records: Icone[]): GroupeIcones[] {
  const parChemin = new Map(records.map((r) => [r.chemin, r]));
  const utilises = new Set<string>();
  const lignes: LigneIcone[] = [];

  for (const f of fichiers) {
    const d = DOSSIERS_SITE[f.dossier];
    if (!d) continue;
    const chemin = `${d.unity}/${f.nom}`;
    let record = parChemin.get(chemin) ?? null;
    if (!record) {
      for (const alias of ALIAS_UNITY[d.unity] ?? []) {
        record = parChemin.get(`${alias}/${f.nom}`) ?? null;
        if (record) break;
      }
    }
    if (record) utilises.add(record.id);
    lignes.push({
      chemin: record?.chemin ?? chemin,
      dossier: d.unity,
      url: `/${f.dossier}/${f.nom}.svg`,
      record,
      usageParDefaut: d.usage,
    });
  }

  for (const r of records) {
    if (utilises.has(r.id)) continue;
    lignes.push({
      chemin: r.chemin,
      dossier: dossierDe(r.chemin) || "(sans dossier)",
      url: null,
      record: r,
      usageParDefaut: r.usage,
    });
  }

  const groupes = new Map<string, LigneIcone[]>();
  for (const l of lignes) {
    const g = groupes.get(l.dossier) ?? [];
    g.push(l);
    groupes.set(l.dossier, g);
  }
  return [...groupes.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([dossier, l]) => ({
      dossier,
      lignes: l.sort((a, b) => a.chemin.localeCompare(b.chemin, "fr")),
    }));
}

/** Le nom à afficher : celui saisi, sinon le nom du fichier. */
export function nomAffiche(l: LigneIcone): string {
  return l.record?.nom?.trim() || nomDeFichier(l.chemin);
}

export type FiltreIcones = {
  texte: string;
  dossier: string;
  /** `""` = toutes · `"aucune"` = pas encore déclarées · sinon un usage. */
  categorie: string;
};

export const FILTRE_ICONES_VIDE: FiltreIcones = { texte: "", dossier: "", categorie: "" };

export function filtrerLignes(lignes: LigneIcone[], f: FiltreIcones): LigneIcone[] {
  const q = f.texte.trim().toLowerCase();
  return lignes.filter((l) => {
    if (f.dossier && l.dossier !== f.dossier) return false;
    if (f.categorie === "aucune" && l.record) return false;
    if (f.categorie && f.categorie !== "aucune" && l.record?.usage !== f.categorie) return false;
    if (q && !`${nomAffiche(l)} ${l.chemin}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Ce que la fiche d'une icône enregistre. */
export type ValeursIcone = {
  nom: string;
  usage: UsageIcone;
} & Required<Pick<Partageable, "toutes_planetes" | "joueurs_autorises">>;

/**
 * Crée le record s'il n'existe pas encore, le met à jour sinon.
 * ⚠️ `planetes_autorisees` n'est JAMAIS envoyé : il appartient au panneau
 * Planète, et PocketBase remplacerait la liste par ce qu'on lui donne.
 */
export async function enregistrerIcone(ligne: LigneIcone, v: ValeursIcone): Promise<void> {
  const corps = {
    nom: v.nom.trim(),
    usage: v.usage,
    toutes_planetes: v.toutes_planetes,
    joueurs_autorises: v.joueurs_autorises,
  };
  if (ligne.record) await pb.collection(COLLECTION_ICONES).update(ligne.record.id, corps);
  else await pb.collection(COLLECTION_ICONES).create({ chemin: ligne.chemin, ...corps });
}
