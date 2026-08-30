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
import { categoriesDe, logistiqueDe, paliersDe, type Tuile } from "@/lib/tuiles";
/**
 * Le libellé d'une catégorie vide vient de là pour qu'il n'en existe qu'un.
 * ⚠️ Sa vraie place serait `tuiles.ts` — la catégorie appartient à la tuile —
 * mais il y est né avec l'écran des technos ; le déplacer le jour où on touchera
 * ces deux fichiers pour autre chose.
 */
import { SANS_CATEGORIE } from "@/lib/technologies";

export const COLLECTION_RESSOURCES = "ressources";

/**
 * - `stock` : s'accumule et se dépense (bois, or, viande).
 * - `mobilise` : **se mobilise et se libère**, jamais consommé. Un bâtiment
 *   occupe 6 habitants — ou 20 d'électricité — et les rend quand on l'éteint ou
 *   qu'on le détruit.
 * - `indicateur` : **calculé, jamais transporté** (la satisfaction). Ajouté le
 *   2026-08-26 sur la demande d'une « ressource utilisée comme indicateur » :
 *   elle garde son nom, son icône et sa place dans la barre de ressources, mais
 *   le genre marque qu'elle ne se stocke pas et ne monte dans aucune navette.
 *
 * ⚠️ **Le genre décrit un MÉCANISME, pas un sujet** : `mobilise` vaut pour tout
 * ce qui s'occupe et se rend, pas seulement pour des habitants. (Il s'appelait
 * `population` jusqu'au 2026-08-26 ; base et code ont été migrés le jour même,
 * il ne reste aucune trace de l'ancien nom nulle part.)
 *
 * ⚠️ **Un quatrième genre `flux` a existé jusqu'au 2026-08-27.** Il promettait
 * « n'existe qu'en débit, ne s'accumule pas », mais le moteur le traitait comme
 * un `stock` : la livraison de SysB passe par les coffres, et une ressource sans
 * coffre ne peut pas être acheminée. Les cinq flux (eau, vapeur, électricité,
 * énergie, foi) sont devenus des `mobilise` : une centrale DÉCLARE 20 places
 * d'électricité, une usine en OCCUPE 5 tant qu'elle tourne, et les rend en
 * veille. Aucune géométrie, aucun réseau à tracer — c'est le choix assumé.
 *
 * ⚠️ **Un genre `mobilise` ne se déclare PAS en production : il se déclare en
 * STOCKAGE.** Une tuile qui stocke 12 population loge 12 habitants, présents dès
 * la pose. Le jeu lit ce plafond (`Tresorerie.Places`), il ne remplit aucun
 * coffre.
 *
 * ⚠️ **Deux genres sur trois ne voyagent jamais : `mobilise` et `indicateur`.**
 * Les listes d'approvisionnement les excluent — voir `GENRES_TRANSPORTABLES`.
 * Un habitant ne prend pas la navette, un pourcentage non plus.
 */
export type GenreRessource = "stock" | "mobilise" | "indicateur";

export const GENRES: { valeur: GenreRessource; libelle: string; aide: string }[] = [
  { valeur: "stock", libelle: "stock", aide: "s'accumule et se dépense" },
  {
    valeur: "mobilise",
    libelle: "mobilisé",
    aide: "s'occupe et se rend ; déclaré en places, jamais produit ni transporté",
  },
  {
    valeur: "indicateur",
    libelle: "indicateur",
    aide: "calculé, jamais stocké ni transporté (la satisfaction)",
  },
];

/** Les genres qu'une navette peut porter. Ni les habitants, ni un pourcentage. */
export const GENRES_TRANSPORTABLES: GenreRessource[] = ["stock"];

export function estTransportable(r: { genre: GenreRessource | "" }): boolean {
  return GENRES_TRANSPORTABLES.includes(r.genre as GenreRessource);
}

/** True si cette ressource s'occupe et se rend au lieu de se dépenser. */
export function estMobilise(r: { genre: GenreRessource | "" } | undefined): boolean {
  return r?.genre === "mobilise";
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

// ---------------------------------------------------------------------------
// Où une ressource APPARAÎT dans l'arbre — déduit des tuiles, jamais stocké
// ---------------------------------------------------------------------------

/**
 * **Demande du 2026-08-27 :** *« un affichage pour ressources comme pour
 * technologie, avec les âges où ils apparaissent (en lien avec les tuiles) et
 * catégories à l'intérieur »*.
 *
 * Une ressource ne porte **ni âge ni catégorie** — et il n'est pas question de
 * lui en ajouter : ce serait deux champs de plus à saisir, à tenir à jour, et à
 * voir diverger du catalogue le jour où un bâtiment change d'âge. Les deux se
 * **déduisent** des tuiles qui la citent, exactement comme une technologie lit
 * les siens sur son bâtiment hôte.
 *
 * ⚠️ **Le critère est « produite ou consommée », choisi explicitement** : seules
 * les lignes de flux d'un palier (`production`, `utilisation`) comptent. Le coût
 * de construction, le stockage et les règles d'appro **ne rangent pas** une
 * ressource dans un âge — sinon la population, citée dans 105 coûts, remonterait
 * à l'âge 1 en prétendant y être fabriquée.
 *
 * Corollaire assumé : ce qui n'est ni produit ni consommé nulle part **n'a pas
 * d'âge**. Ces ressources-là ne disparaissent pas de l'écran, elles forment leur
 * propre groupe en fin de liste, avec le décompte de ce qui les cite quand
 * même — c'est ainsi qu'on voit qu'un code est orphelin (`gibier`, cité par
 * personne) ou qu'il double un autre (`briques`, 37 coûts, zéro producteur,
 * pendant que `brique` est produite une fois).
 */

/** `0` : la ressource n'est produite ni consommée nulle part. Pas un âge. */
export const HORS_ARBRE = 0;

export type SensUsage = "produit" | "consomme";

/** Un bâtiment qui fabrique ou qui consomme cette ressource. */
export interface UsageRessource {
  tileId: number;
  nom: string;
  categorie: string;
  age: number;
  sens: SensUsage;
}

/**
 * Les usages de chaque code, en **un seul balayage** du catalogue : 78
 * ressources × 140 tuiles × leurs paliers, refait à chaque rendu, se sentirait.
 *
 * ⚠️ Dédoublonné sur (tuile, sens) : une ferme qui produit du blé à ses trois
 * paliers est **un** producteur, pas trois.
 */
export function usagesParRessource(tuiles: Tuile[]): Map<string, UsageRessource[]> {
  const par = new Map<string, UsageRessource[]>();

  const ajouter = (code: string, usage: UsageRessource) => {
    const c = (code ?? "").trim();
    if (c === "") return;
    const liste = par.get(c);
    if (!liste) {
      par.set(c, [usage]);
      return;
    }
    if (!liste.some((u) => u.tileId === usage.tileId && u.sens === usage.sens)) liste.push(usage);
  };

  for (const t of tuiles) {
    const base = {
      tileId: t.tileId,
      nom: t.nom,
      categorie: (t.categorie ?? "").trim(),
      age: t.age ?? 0,
    };
    for (const palier of paliersDe(t)) {
      for (const l of palier.production) ajouter(l.ressource, { ...base, sens: "produit" });
      for (const l of palier.utilisation) ajouter(l.ressource, { ...base, sens: "consomme" });
    }
  }
  return par;
}

/**
 * Ce qui cite une ressource **sans la faire vivre** : le coût d'un chantier, une
 * ligne de coffre, une navette. Compté en nombre de TUILES, pas de lignes.
 *
 * Sert uniquement au groupe « hors arbre » : sans ce décompte, une ressource
 * sans âge se lirait « inutilisée », alors que la population en est le contraire
 * exact — elle est mobilisée partout et fabriquée nulle part, par construction.
 */
export interface CitationsHorsFlux {
  cout: number;
  stockage: number;
  appro: number;
}

export function citationsHorsFlux(code: string, tuiles: Tuile[]): CitationsHorsFlux {
  let cout = 0;
  let stockage = 0;
  let appro = 0;
  for (const t of tuiles) {
    if (paliersDe(t).some((p) => p.cout.some((l) => l.ressource === code))) cout += 1;
    const l = logistiqueDe(t);
    if (l.stockage.some((s) => s.ressource === code)) stockage += 1;
    if (l.appros.some((a) => a.ressources.includes(code))) appro += 1;
  }
  return { cout, stockage, appro };
}

/** Une ressource, rangée : son âge d'apparition, sa catégorie, et pourquoi. */
export interface RessourceRangee {
  ressource: Ressource;
  /** Le plus petit âge où un bâtiment la produit ou la consomme. `0` = aucun. */
  age: number;
  /**
   * La catégorie du bâtiment qui la fait apparaître — producteur d'abord.
   *
   * ⚠️ Depuis le 2026-08-30 un bâtiment peut en porter PLUSIEURS : ce champ est
   * alors la ligne entière, « Vivres, Confort ». Le découper avec
   * `categoriesDe` avant de s'en servir comme d'une clé — la ressource se range
   * sous CHACUNE, comme le bâtiment lui-même.
   */
  categorie: string;
  usages: UsageRessource[];
  /** Les âges suivants où elle sert encore, pour le badge « aussi 3, 4 ». */
  autresAges: number[];
  /** Renseigné seulement quand `age === HORS_ARBRE`. */
  citations: CitationsHorsFlux | null;
}

/**
 * L'âge d'apparition et la catégorie d'une ressource.
 *
 * ⚠️ **Le producteur l'emporte sur le consommateur** à âge égal : la ressource
 * est rangée là où elle NAÎT. Une viande fabriquée par l'abattoir (Vivres) et
 * mangée par les habitations (Habitat) au même âge se lit sous Vivres — sinon
 * l'écran raconterait la consommation avant la production.
 *
 * À sens égal, le plus petit `tileId` tranche : il faut un départage stable,
 * sinon deux chargements ne rendent pas le même écran.
 */
export function rangerRessource(
  ressource: Ressource,
  usages: UsageRessource[],
  tuiles: Tuile[],
): RessourceRangee {
  const dansUnAge = usages.filter((u) => u.age > 0);
  const ages = [...new Set(dansUnAge.map((u) => u.age))].sort((a, b) => a - b);
  const age = ages[0] ?? HORS_ARBRE;

  const auPremierAge = dansUnAge.filter((u) => u.age === age);
  const ordonnes = [...auPremierAge].sort(
    (a, b) =>
      (a.sens === "produit" ? 0 : 1) - (b.sens === "produit" ? 0 : 1) || a.tileId - b.tileId,
  );

  return {
    ressource,
    age,
    categorie: ordonnes[0]?.categorie || SANS_CATEGORIE,
    usages,
    autresAges: ages.slice(1),
    citations: age === HORS_ARBRE ? citationsHorsFlux(ressource.code, tuiles) : null,
  };
}

export interface GroupeCategorie {
  categorie: string;
  ressources: RessourceRangee[];
}

export interface GroupeAge {
  numero: number;
  total: number;
  categories: GroupeCategorie[];
}

/**
 * L'écran, du haut vers le bas : un cadre par âge, les catégories en onglets
 * dedans, et le groupe « hors arbre » à la fin.
 *
 * ⚠️ **Les âges affichés sont l'union des âges DÉCLARÉS et de ceux TROUVÉS dans
 * le catalogue.** Un âge déclaré mais vide reste visible — il n'attend qu'une
 * saisie. Et un âge porté par une tuile mais absent de la collection s'affiche
 * quand même : le masquer ferait disparaître ses ressources sans rien dire, et
 * c'est une faute de saisie qu'on veut voir.
 */
export function rangerParAge(
  ressources: Ressource[],
  tuiles: Tuile[],
  numerosDeclares: number[],
): GroupeAge[] {
  const usages = usagesParRessource(tuiles);
  const rangees = ressources.map((r) => rangerRessource(r, usages.get(r.code) ?? [], tuiles));

  const numeros = [
    ...new Set([...numerosDeclares, ...rangees.map((r) => r.age)].filter((n) => n > 0)),
  ].sort((a, b) => a - b);

  const groupe = (numero: number): GroupeAge => {
    const liste = rangees.filter((r) => r.age === numero);
    const par = new Map<string, RessourceRangee[]>();
    // ⚠️ Une ressource née d'un bâtiment à plusieurs catégories se range sous
    //    CHACUNE (2026-08-30). `total` reste le compte de ressources DISTINCTES
    //    de l'âge : c'est lui qui ne doit pas bouger, pas la somme des groupes.
    for (const r of liste)
      for (const c of categoriesDe(r.categorie)) par.set(c, [...(par.get(c) ?? []), r]);
    const categories = [...par.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "fr", { sensitivity: "base" }))
      .map(([categorie, dedans]) => ({
        categorie,
        // Dans un onglet, l'ordre du JEU : c'est le seul endroit où le champ
        // `ordre` reste lisible depuis que la table triable a disparu.
        ressources: [...dedans].sort(
          (a, b) =>
            (a.ressource.ordre || 0) - (b.ressource.ordre || 0) ||
            a.ressource.nom.localeCompare(b.ressource.nom, "fr", { sensitivity: "base" }),
        ),
      }));
    return { numero, total: liste.length, categories };
  };

  const horsArbre = groupe(HORS_ARBRE);
  return [...numeros.map(groupe), ...(horsArbre.total > 0 ? [horsArbre] : [])];
}
