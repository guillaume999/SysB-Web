// ============================================================
//  unites.ts
//  LES UNITÉS DE BATAILLE (19/09) — la collection `unites`, saisie ici et lue
//  par le champ de bataille.
//
//  ⚠️⚠️ UNE UNITÉ N'EST PAS UNE TUILE. Elle ne s'écrit pas dans la grille : elle
//  bouge. Elle se désigne donc par son `code`, comme une ressource, et n'a NI
//  `tileId`, NI `typeOfPlateau`, NI règle de placement. Lui en donner un
//  reviendrait à la ranger dans un catalogue qui n'est pas le sien.
//
//  ⚠️ ET ELLE NE DÉPEND PAS DE LA PLANÈTE (décidé le 19/09) : deux joueurs
//  venus de planètes différentes ont les mêmes unités. Seul l'ÂGE du plateau
//  Univers borne ce qu'on peut produire — son âge et tous les précédents
//  (`accessiblesA`). C'est la seule découpe, il n'y a pas de territoire ici.
//
//  ⚠️ DEUX CHAMPS DE CIBLE, ET C'EST VOULU :
//    `cible_auto` — ce que vise une unité AUTOMATIQUE quand elle avance seule
//                   (les vagues gratuites, CDC 1.22). Sans objet pour une unité
//                   jouée à la main.
//    `contre`     — la famille que l'unité DOMINE, la triangulation du
//                   Tri-Axes §15. Elle vaut pour toutes, auto ou non.
//  Les avoir confondus sous un seul « cible_prioritaire » aurait donné un seul
//  champ à deux règles : la première codée aurait écrasé l'autre en silence.
//
//  ⚠️ UNE UNITÉ `auto` EST GRATUITE (CDC 1.37) — son coût doit rester vide, et
//  `erreursUnite` le refuse plutôt que de laisser un prix que rien ne prélève.
//
//  ⚠️ L'AXE N'APPARAÎT QU'À PARTIR DE L'ÂGE 5 (`AGE_DES_AXES`), là où la
//  conception fait apparaître les bâtiments d'axe (Tri-Axes §8). Avant, il est
//  VIDE — une valeur, pas un oubli.
//
//  Le catalogue de départ (89 unités) est versé par
//  `serveur-go/patches/patch-unites-2026-09-19.js`, en `actif = false` : c'est
//  ici qu'on relit et qu'on coche.
// ============================================================

import { pb } from "@/lib/pb";

export const COLLECTION_UNITES = "unites";

/** L'âge à partir duquel une unité appartient à un axe. Avant : commune. */
export const AGE_DES_AXES = 5;

export type AxeUnite = "" | "science" | "genetique" | "archeomages" | "trinite";
export type Pilotage = "joueur" | "auto";
export type CibleAuto = "" | "batiment" | "unite" | "plus_proche";
export type Contre =
  | ""
  | "infanterie"
  | "blinde"
  | "organique"
  | "arcanique"
  | "batiment"
  | "volant"
  | "distance";

/** Une ligne de coût : un code de `ressources` et une quantité. */
export type LigneCoutUnite = { ressource: string; quantite: number };

export type Unite = {
  id: string;
  code: string;
  nom: string;
  description?: string;
  /** Relation → `tuile3dmodel`. Facultative : aucun prefab d'unité n'existe encore. */
  modele?: string;
  /** Relation → `icones`. */
  icone?: string;
  /** 0 à 7. `0` = hors âge, comme pour une tuile. */
  age: number;
  axe: AxeUnite;
  cout?: unknown;
  pilotage: Pilotage;
  vie: number;
  degats: number;
  portee: number;
  vitesse: number;
  cible_auto: CibleAuto;
  contre: Contre;
  actif: boolean;
  created?: string;
  updated?: string;
};

/** Ce que le formulaire renvoie. */
export type ValeursUnite = {
  code: string;
  nom: string;
  description: string;
  modele: string;
  icone: string;
  age: number;
  axe: AxeUnite;
  pilotage: Pilotage;
  vie: number;
  degats: number;
  portee: number;
  vitesse: number;
  cible_auto: CibleAuto;
  contre: Contre;
  cout: LigneCoutUnite[];
  actif: boolean;
};

export const UNITE_VIDE: ValeursUnite = {
  code: "",
  nom: "",
  description: "",
  modele: "",
  icone: "",
  age: 1,
  axe: "",
  pilotage: "joueur",
  vie: 100,
  degats: 0,
  portee: 1,
  vitesse: 2,
  cible_auto: "plus_proche",
  contre: "",
  cout: [],
  // ⚠️ Une unité neuve est INACTIVE : on la relit avant de l'envoyer au combat.
  actif: false,
};

/** Le motif du `code`, le même qu'en base. Minuscules, chiffres, `_`. */
export const MOTIF_CODE = /^[a-z0-9_]+$/;

/** Les valeurs d'un select, avec de quoi les afficher et les expliquer. */
export type Choix<T> = { valeur: T; libelle: string; aide: string };

export const AXES: Choix<AxeUnite>[] = [
  { valeur: "", libelle: "commun", aide: "Avant l'âge 5 : l'unité n'appartient à aucun axe." },
  { valeur: "science", libelle: "Science", aide: "Équipement et balistique : perce la chair, cale devant la magie." },
  { valeur: "genetique", libelle: "Génétique", aide: "Masse biologique : étouffe la magie, fond sous les munitions." },
  { valeur: "archeomages", libelle: "Archéomages", aide: "Phasique : traverse le blindage, s'écroule au corps à corps." },
  { valeur: "trinite", libelle: "Trinité", aide: "Les trois axes réunis — les suprêmes de l'âge 7, une par bataille." },
];

export const PILOTAGES: Choix<Pilotage>[] = [
  { valeur: "joueur", libelle: "Le joueur la produit", aide: "Elle coûte des ressources envoyées depuis l'empire, et le joueur lui donne ses ordres." },
  { valeur: "auto", libelle: "Vague automatique", aide: "Elle sort seule du bâtiment de chaque camp et suit son chemin. GRATUITE par règle : son coût reste vide." },
];

export const CIBLES_AUTO: Choix<CibleAuto>[] = [
  { valeur: "", libelle: "— (non réglé)", aide: "Sans objet tant que l'unité n'est pas jouée en automatique." },
  { valeur: "plus_proche", libelle: "la plus proche", aide: "Elle frappe ce qu'elle rencontre en avançant." },
  { valeur: "unite", libelle: "une unité", aide: "Elle ignore les structures et cherche les unités." },
  { valeur: "batiment", libelle: "le bâtiment", aide: "Elle fonce sur le bâtiment adverse sans se laisser distraire." },
];

export const CONTRES: Choix<Contre>[] = [
  { valeur: "", libelle: "— aucune", aide: "Elle n'a pas de proie désignée." },
  { valeur: "infanterie", libelle: "infanterie", aide: "Les unités de ligne, nombreuses et peu blindées." },
  { valeur: "blinde", libelle: "blindé", aide: "Les châssis et les armures lourdes." },
  { valeur: "organique", libelle: "organique", aide: "Tout ce qui est vivant, donc l'axe Génétique." },
  { valeur: "arcanique", libelle: "arcanique", aide: "Les lanceurs de sorts, donc l'axe Archéomages." },
  { valeur: "batiment", libelle: "bâtiment", aide: "Les structures : le bâtiment de production, les obstacles." },
  { valeur: "volant", libelle: "volant", aide: "La couche air du damier." },
  { valeur: "distance", libelle: "à distance", aide: "Les tireurs, l'artillerie et les soutiens, qu'il faut aller chercher." },
];

const libelleDe = <T,>(choix: Choix<T>[], v: T): string =>
  choix.find((c) => c.valeur === v)?.libelle ?? String(v);

export const libelleAxe = (v: AxeUnite) => libelleDe(AXES, v);
export const libelleContre = (v: Contre) => libelleDe(CONTRES, v);
export const libelleCibleAuto = (v: CibleAuto) => libelleDe(CIBLES_AUTO, v);

/**
 * Le coût d'une unité, quoi qu'il y ait dans le champ json.
 *
 * ⚠️ PocketBase ne valide RIEN dans un `json` : ce qu'on relit peut être un
 * objet, une chaîne, `null`, ou un tableau avec des lignes à moitié saisies.
 * Tout ce qui n'est pas une ligne lisible est écarté ici, en un seul endroit —
 * un écran qui ferait `.map` sur ce champ planterait sur le premier record
 * bricolé à la main dans l'admin PocketBase.
 */
export function coutDe(u: { cout?: unknown }): LigneCoutUnite[] {
  if (!Array.isArray(u.cout)) return [];
  return u.cout
    .filter((l): l is { ressource: unknown; quantite: unknown } => !!l && typeof l === "object")
    .map((l) => ({
      ressource: typeof l.ressource === "string" ? l.ressource : "",
      quantite: Number.isFinite(Number(l.quantite)) ? Math.trunc(Number(l.quantite)) : 0,
    }))
    .filter((l) => l.ressource !== "");
}

/** Le coût en une ligne : « 20 bois + 10 gibier », ou « gratuite ». */
export function resumeCout(lignes: LigneCoutUnite[]): string {
  if (lignes.length === 0) return "gratuite";
  return lignes.map((l) => `${l.quantite} ${l.ressource}`).join(" + ");
}

/** Un entier lu dans un champ de saisie. Une saisie vide ou fautive vaut 0. */
export function entierDe(saisie: string): number {
  const n = Number.parseInt(saisie, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Ce qui EMPÊCHE d'enregistrer, en français. Liste vide = c'est bon.
 *
 * `autres` sont les unités déjà en base autres que celle qu'on édite : c'est
 * l'unicité du code qu'elles servent à vérifier (la base la tient aussi, mais
 * répondrait en anglais). `ressources` est la liste des codes déclarés : une
 * ligne de coût qui en cite un autre ne ferait pas d'erreur en base — elle
 * ferait un bâtiment qui ne produit jamais rien, et ça ne se verrait qu'en jeu.
 */
export function erreursUnite(
  v: ValeursUnite,
  autres: { code: string }[],
  ressources: { code: string }[],
): string[] {
  const erreurs: string[] = [];
  const code = v.code.trim();
  const connues = new Set(ressources.map((r) => r.code));

  if (code === "") erreurs.push("Le code est obligatoire : c'est lui que le reste du jeu cite.");
  else if (!MOTIF_CODE.test(code))
    erreurs.push("Le code ne prend que des minuscules, des chiffres et « _ ».");
  else if (autres.some((u) => u.code === code))
    erreurs.push(`Le code « ${code} » est déjà pris par une autre unité.`);

  if (v.nom.trim() === "") erreurs.push("Le nom est obligatoire.");
  if (!Number.isInteger(v.age) || v.age < 0 || v.age > 7)
    erreurs.push("L'âge va de 0 à 7 (0 = hors âge).");
  if (!Number.isInteger(v.vie) || v.vie < 1)
    erreurs.push("La vie est un entier d'au moins 1 : une unité à zéro serait morte à l'arrivée.");
  for (const [champ, n] of [["Les dégâts", v.degats], ["La portée", v.portee], ["La vitesse", v.vitesse]] as const)
    if (!Number.isInteger(n) || n < 0) erreurs.push(`${champ} : un entier positif ou nul.`);

  // ⚠️ LA RÈGLE 1.37 : une vague auto ne coûte rien. Un prix saisi ici ne
  // serait prélevé par personne — autant le refuser que le laisser mentir.
  if (v.pilotage === "auto" && v.cout.length > 0)
    erreurs.push(
      "Une vague automatique est gratuite (CDC 1.37) : retire son coût, ou passe-la en « le joueur la produit ».",
    );

  const vues = new Set<string>();
  for (const l of v.cout) {
    if (l.ressource === "") erreurs.push("Une ligne de coût n'a pas de ressource.");
    else if (!connues.has(l.ressource))
      erreurs.push(`« ${l.ressource} » n'est pas un code de ressource déclaré.`);
    else if (vues.has(l.ressource))
      erreurs.push(`« ${l.ressource} » est cité deux fois : mets tout sur une seule ligne.`);
    else vues.add(l.ressource);
    if (!Number.isInteger(l.quantite) || l.quantite < 1)
      erreurs.push("Une quantité de coût est un entier d'au moins 1.");
  }

  return erreurs;
}

/**
 * Ce qui n'empêche pas d'enregistrer mais mérite d'être dit — en orange, comme
 * les règles ignorées de l'onglet Tuile.
 *
 * ⚠️ Aucun de ces cas n'est une faute : une unité immobile (le totem), une
 * unité sans dégâts (un soigneur) et une unité d'âge 0 sont des choix. On les
 * montre parce qu'ils sont RAREMENT voulus, et qu'une faute de frappe sur la
 * vitesse ne se verrait sinon qu'en bataille.
 */
export function avertissementsUnite(v: ValeursUnite): string[] {
  const notes: string[] = [];
  if (v.age >= AGE_DES_AXES && v.axe === "")
    notes.push(
      `À partir de l'âge ${AGE_DES_AXES}, une unité appartient normalement à un axe — ` +
        "celle-ci est commune aux trois.",
    );
  if (v.age > 0 && v.age < AGE_DES_AXES && v.axe !== "")
    notes.push(
      `Avant l'âge ${AGE_DES_AXES}, les axes n'existent pas encore : cet axe ne veut rien dire ici.`,
    );
  if (v.degats > 0 && v.portee === 0)
    notes.push("Portée 0 avec des dégâts : elle ne pourra frapper personne.");
  if (v.vitesse === 0) notes.push("Vitesse 0 : elle ne bougera jamais de sa case.");
  if (v.pilotage === "joueur" && v.cout.length === 0)
    notes.push("Aucun coût : le joueur pourra en produire autant qu'il veut, gratuitement.");
  if (v.age === 0) notes.push("Âge 0 = hors âge : aucun plateau Univers ne l'admettra.");
  return notes;
}

/**
 * Les unités qu'un joueur peut produire sur un plateau Univers de cet âge —
 * **son âge et tous les précédents** (CDC 1.26), et seulement les actives.
 *
 * ⚠️ Miroir de la règle du serveur : si elle change là-bas, elle change ici.
 * L'écran s'en sert pour dire, sous le filtre, ce que voit vraiment un joueur.
 */
export function accessiblesA<T extends { age: number; actif: boolean }>(age: number, unites: T[]): T[] {
  return unites.filter((u) => u.actif && u.age > 0 && u.age <= age);
}

/** Par âge puis par nom : c'est l'ordre dans lequel on les relit. */
export function loadUnites(): Promise<Unite[]> {
  return pb.collection(COLLECTION_UNITES).getFullList<Unite>({ sort: "age,nom" });
}

/** Crée ou met à jour. Les nombres partent en entiers, le code sans espaces. */
export async function enregistrerUnite(existante: Unite | null, v: ValeursUnite): Promise<void> {
  const corps = {
    code: v.code.trim(),
    nom: v.nom.trim(),
    description: v.description.trim(),
    modele: v.modele,
    icone: v.icone,
    age: v.age,
    axe: v.axe,
    pilotage: v.pilotage,
    vie: v.vie,
    degats: v.degats,
    portee: v.portee,
    vitesse: v.vitesse,
    cible_auto: v.cible_auto,
    contre: v.contre,
    // ⚠️ Une vague auto est gratuite : on n'envoie rien plutôt que d'envoyer
    // un tableau que la règle interdit.
    cout: v.pilotage === "auto" ? [] : v.cout,
    actif: v.actif,
  };
  if (existante) await pb.collection(COLLECTION_UNITES).update(existante.id, corps);
  else await pb.collection(COLLECTION_UNITES).create(corps);
}

export async function supprimerUnite(id: string): Promise<void> {
  await pb.collection(COLLECTION_UNITES).delete(id);
}
