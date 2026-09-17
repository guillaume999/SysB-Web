// ============================================================
//  categories.ts
//  L'ORDRE des catégories de tuiles (17/09) — la collection `categories`.
//
//  ⚠️⚠️ CETTE COLLECTION N'EST PAS LA LISTE DES CATÉGORIES. Ce qui fait
//  exister une catégorie reste le champ texte `tuiles.categorie` (décision du
//  30/08, et elle tient : c'est lui qu'on renomme, lui qui les crée). Ici on ne
//  stocke qu'une chose : le RANG d'un nom. D'où les deux cas, tous les deux
//  normaux :
//
//   · une rangée sans aucune tuile → elle ne fait apparaître aucune ligne ;
//   · une catégorie portée par des tuiles mais sans rangée → elle s'affiche
//     quand même, À LA FIN, par ordre alphabétique.
//
//  ⚠️ POURQUOI ÇA EXISTE. Le rang se décidait tout seul, et PAS de la même
//  façon des deux côtés : alphabétique sur le site, ordre d'apparition dans le
//  catalogue (donc par tileId) dans le magasin du jeu. Aucun des deux ne se
//  réglait. Depuis le 17/09 c'est le même ordre des deux côtés, et il se range
//  aux flèches ↑/↓ de la grille des tuiles.
//
//  ⚠️ LA CASSE NE FAIT PAS DEUX CATÉGORIES, ici comme dans `categoriesDe`
//  (tuiles.ts) et `Categories.Lister` (C#). Toutes les comparaisons de ce
//  fichier passent par `cleCategorie`.
//
//  ⚠️ CÔTÉ JEU, le même ordre est lu par `CategorieCatalogue` (Unity), qui
//  applique la MÊME règle pour les inconnues : après les rangées, dans l'ordre
//  où elles étaient. Changer la règle ici sans la changer là-bas ferait mentir
//  l'un des deux écrans, sans rien dire.
// ============================================================

import { pb } from "@/lib/pb";

export const COLLECTION_CATEGORIES = "categories";

/** Une catégorie rangée : un nom et son rang. */
export type CategorieRangee = {
  id: string;
  nom: string;
  /** Espacé de 10 en 10 à la création ; renuméroté à chaque déplacement. */
  ordre?: number;
};

/** Ce qu'on compare : deux orthographes qui ne diffèrent que par la casse sont la même. */
export function cleCategorie(nom: string): string {
  return (nom ?? "").trim().toLocaleLowerCase("fr");
}

/**
 * ⚠️ TOLÉRANT À L'ABSENCE : tant que `patch-categories-2026-09-17.js` n'est pas
 * passé, la collection n'existe pas et l'appel rend 404. L'appelant retombe
 * alors sur l'ordre alphabétique — l'écran reste ouvrable, ce n'est pas une
 * panne.
 */
export function loadCategoriesRangees(): Promise<CategorieRangee[]> {
  return pb.collection(COLLECTION_CATEGORIES).getFullList<CategorieRangee>({ sort: "ordre,nom" });
}

/**
 * L'ordre complet des catégories : les rangées d'abord (par `ordre`, puis par
 * nom à égalité), puis celles qu'aucune rangée ne cite, par ordre alphabétique.
 *
 * ⚠️ Les noms rendus sont ceux **en usage** quand la catégorie est portée par
 * une tuile : c'est l'orthographe que montrent les écrans. Le nom de la rangée
 * ne sert qu'à la retrouver.
 */
export function ordreCategories(rangees: CategorieRangee[], enUsage: string[]): string[] {
  const nomEnUsage = new Map<string, string>();
  for (const n of enUsage) {
    const cle = cleCategorie(n);
    if (cle !== "" && !nomEnUsage.has(cle)) nomEnUsage.set(cle, n.trim());
  }

  const rangs = [...rangees]
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const oa = Number.isFinite(Number(a.r.ordre)) ? Number(a.r.ordre) : Number.MAX_SAFE_INTEGER;
      const ob = Number.isFinite(Number(b.r.ordre)) ? Number(b.r.ordre) : Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      const parNom = String(a.r.nom).localeCompare(String(b.r.nom), "fr");
      // ⚠️ Le départage par index d'origine n'est pas cosmétique : sans lui,
      //    deux rangées de même `ordre` ET de même nom (impossible en base,
      //    possible en test) rendraient un ordre instable d'un appel à l'autre.
      return parNom !== 0 ? parNom : a.i - b.i;
    })
    .map(({ r }) => r);

  const vues = new Set<string>();
  const liste: string[] = [];
  for (const r of rangs) {
    const cle = cleCategorie(r.nom);
    if (cle === "" || vues.has(cle)) continue;
    vues.add(cle);
    liste.push(nomEnUsage.get(cle) ?? String(r.nom).trim());
  }

  const restantes = [...nomEnUsage.entries()]
    .filter(([cle]) => !vues.has(cle))
    .map(([, nom]) => nom)
    .sort((a, b) => a.localeCompare(b, "fr"));

  return [...liste, ...restantes];
}

/** Le rang d'une catégorie dans un ordre, ou `Infinity` si elle n'y est pas. */
export function rangCategorie(ordre: string[], nom: string): number {
  const cle = cleCategorie(nom);
  const i = ordre.findIndex((n) => cleCategorie(n) === cle);
  return i === -1 ? Infinity : i;
}

/**
 * Déplace une catégorie d'un cran vers le haut (`-1`) ou le bas (`+1`), et rend
 * l'ordre complet d'après.
 *
 * ⚠️ **Le cran se compte sur les lignes VISIBLES, pas sur l'ordre complet.** Un
 * filtre actif cache des lignes ; « monter » doit passer au-dessus de la ligne
 * qu'on VOIT au-dessus, sinon le clic n'a aucun effet apparent et on le répète.
 * La catégorie est donc RETIRÉE de la liste puis REPOSÉE contre sa voisine
 * visible — les lignes cachées entre les deux suivent le mouvement.
 *
 * Rend la liste inchangée quand il n'y a pas de voisine (première ou dernière).
 */
export function deplacerCategorie(
  ordre: string[],
  visibles: string[],
  nom: string,
  sens: -1 | 1,
): string[] {
  const cle = cleCategorie(nom);
  if (rangCategorie(ordre, nom) === Infinity) return ordre;

  const vus = visibles.filter((v) => rangCategorie(ordre, v) !== Infinity);
  const place = vus.findIndex((v) => cleCategorie(v) === cle);
  const voisine = place === -1 ? undefined : vus[place + sens];
  if (voisine === undefined) return ordre;

  const sansElle = ordre.filter((n) => cleCategorie(n) !== cle);
  const cible = sansElle.findIndex((n) => cleCategorie(n) === cleCategorie(voisine));
  if (cible === -1) return ordre;

  const apres = [...sansElle];
  apres.splice(sens === -1 ? cible : cible + 1, 0, ordre[rangCategorie(ordre, nom)]);
  return apres;
}

/** Une écriture à faire en base : une rangée à créer (`id` nul) ou à renuméroter. */
export type EcritureOrdre = { id: string | null; nom: string; ordre: number };

/**
 * Ce qu'il faut écrire pour que la base dise cet ordre — et RIEN pour les
 * rangées déjà au bon rang.
 *
 * ⚠️ C'est ce filtre qui fait qu'un déplacement coûte deux écritures et pas
 * trente : les rangs sont recalculés pour toute la liste (10, 20, 30…), mais
 * seules les lignes qui ont vraiment changé partent en base.
 */
export function ecrituresDOrdre(ordre: string[], rangees: CategorieRangee[]): EcritureOrdre[] {
  const parCle = new Map<string, CategorieRangee>();
  for (const r of rangees) {
    const cle = cleCategorie(r.nom);
    if (cle !== "" && !parCle.has(cle)) parCle.set(cle, r);
  }

  const aEcrire: EcritureOrdre[] = [];
  ordre.forEach((nom, i) => {
    const rang = (i + 1) * 10;
    const existante = parCle.get(cleCategorie(nom));
    if (existante === undefined) aEcrire.push({ id: null, nom: nom.trim(), ordre: rang });
    else if (Number(existante.ordre) !== rang)
      aEcrire.push({ id: existante.id, nom: existante.nom, ordre: rang });
  });
  return aEcrire;
}

/**
 * Écrit l'ordre. **En série**, jamais en `Promise.all` : PocketBase est en
 * SQLite derrière un tunnel Cloudflare, et une rafale d'écritures rend un 429 à
 * mi-chemin — un ordre à moitié écrit est pire que pas d'ordre du tout.
 */
export async function enregistrerOrdre(
  ordre: string[],
  rangees: CategorieRangee[],
): Promise<void> {
  for (const e of ecrituresDOrdre(ordre, rangees)) {
    if (e.id === null)
      await pb.collection(COLLECTION_CATEGORIES).create({ nom: e.nom, ordre: e.ordre });
    else await pb.collection(COLLECTION_CATEGORIES).update(e.id, { ordre: e.ordre });
  }
}

/**
 * Remet la collection d'accord après un renommage (`nouvelle`) ou un retrait
 * (`null`) de catégorie fait sur les tuiles.
 *
 * ⚠️ **Sans ça, le rang serait perdu au premier renommage** : la rangée
 * « Vivres » resterait en base sans tuile, et « Nourriture » repartirait à la
 * fin de la liste comme une inconnue.
 *
 * ⚠️ **Renommer vers un nom déjà rangé est une FUSION** (c'est le cas
 * `Nourriture` → `Vivres`, exactement ce à quoi sert le bouton) : on garde la
 * rangée d'arrivée, avec son rang, et on supprime celle de départ. Garder les
 * deux violerait l'index unique et ferait échouer l'écriture.
 */
export async function synchroniserRenommage(
  rangees: CategorieRangee[],
  ancienne: string,
  nouvelle: string | null,
): Promise<void> {
  const cleAvant = cleCategorie(ancienne);
  const depart = rangees.find((r) => cleCategorie(r.nom) === cleAvant);
  if (!depart) return;

  if (nouvelle === null) {
    await pb.collection(COLLECTION_CATEGORIES).delete(depart.id);
    return;
  }

  const cleApres = cleCategorie(nouvelle);
  const arrivee = rangees.find((r) => cleCategorie(r.nom) === cleApres);

  if (arrivee && arrivee.id !== depart.id) {
    await pb.collection(COLLECTION_CATEGORIES).delete(depart.id);
    return;
  }

  await pb.collection(COLLECTION_CATEGORIES).update(depart.id, { nom: nouvelle.trim() });
}
