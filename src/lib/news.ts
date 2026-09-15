// ============================================================
//  news.ts
//  LES NEWS (15/09) — lisibles SANS connexion, écrites par l'admin seul.
//
//  ⚠️ Ce qui protège, c'est la règle d'API de `news` (patch
//  `patch-news-forum-2026-09-15.js`) : lecture `publiee = true || admin`,
//  écriture `admin`. Un brouillon n'arrive donc jamais chez un visiteur, même
//  s'il forge la requête — le filtre côté site n'est qu'un confort.
// ============================================================

import { pb } from "@/lib/pb";

export const COLLECTION_NEWS = "news";

export type News = {
  id: string;
  titre: string;
  /** Markdown — rendu par `components/Markdown.tsx`. */
  contenu: string;
  /** Nom du fichier dans PocketBase, vide s'il n'y a pas d'image. */
  image: string;
  publiee: boolean;
  auteur: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
};

export type ValeursNews = {
  titre: string;
  contenu: string;
  publiee: boolean;
  /** `File` = nouvelle image ; `null` = retirer l'image ; `undefined` = n'y pas toucher. */
  image?: File | null;
};

/** Combien de news une page affiche avant « Voir plus ». */
export const NEWS_PAR_PAGE = 10;

export async function chargerNews(page: number): Promise<{ items: News[]; fin: boolean }> {
  const r = await pb.collection(COLLECTION_NEWS).getList<News>(page, NEWS_PAR_PAGE, {
    sort: "-created",
  });
  return { items: r.items, fin: page >= r.totalPages };
}

/** L'URL de l'image, ou `null`. */
export function urlImage(n: Pick<News, "image" | "id" | "collectionId" | "collectionName">): string | null {
  if (!n.image) return null;
  return pb.files.getURL(n, n.image);
}

/**
 * Le corps envoyé à PocketBase. Un `FormData` seulement quand une image part
 * (le SDK l'exige pour un fichier) ; sinon un objet simple.
 */
export function corpsNews(v: ValeursNews, auteur: string | null): FormData | Record<string, unknown> {
  const champs: Record<string, unknown> = {
    titre: v.titre.trim(),
    contenu: v.contenu,
    publiee: v.publiee,
  };
  if (auteur) champs.auteur = auteur;
  if (v.image === null) champs.image = null;
  if (!(v.image instanceof File)) return champs;

  const fd = new FormData();
  for (const [k, val] of Object.entries(champs)) fd.append(k, String(val));
  fd.append("image", v.image);
  return fd;
}

export function erreurNews(v: ValeursNews): string | null {
  if (!v.titre.trim()) return "Le titre est obligatoire.";
  if (v.titre.trim().length > 200) return "Le titre dépasse 200 caractères.";
  if (v.contenu.length > 50000) return "Le texte dépasse 50 000 caractères.";
  return null;
}

export async function enregistrerNews(
  existante: News | null,
  v: ValeursNews,
  auteur: string | null,
): Promise<News> {
  const col = pb.collection(COLLECTION_NEWS);
  // L'auteur d'une news ne change pas quand un autre admin la corrige.
  if (existante) return col.update<News>(existante.id, corpsNews(v, null));
  return col.create<News>(corpsNews(v, auteur));
}

export async function supprimerNews(id: string): Promise<void> {
  await pb.collection(COLLECTION_NEWS).delete(id);
}

/** « 15 septembre 2026 à 21:04 » — la date affichée partout (news et forum). */
export function dateLisible(iso: string): string {
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
