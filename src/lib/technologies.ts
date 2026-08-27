/**
 * Les technologies du jeu.
 *
 * **La règle, dictée par l'utilisateur le 2026-08-27 au soir :** une techno est
 * liée à l'existence d'un ou plusieurs bâtiments, elle coûte des ressources, et
 * elle débloque ou améliore quelque chose. D'où quatre champs en plus de son
 * identité :
 *
 * - `batiment` — le bâtiment **où elle existe**. C'est LUI qui donne son âge et
 *   sa catégorie : on ne les saisit plus. Vide = brouillon (voir plus bas) ;
 * - `batiments_requis` — les bâtiments qu'il faut **posséder** pour pouvoir la
 *   chercher ;
 * - `technos_requises` — les technos qu'il faut avoir **acquises** avant celle-ci
 *   (c'est ce qui fait un arbre, et pas une liste) ;
 * - `debloque` — les bâtiments qu'elle rend **constructibles** ;
 * - `debloque_technos` — les technos qu'elle ouvre ;
 * - `cout` — `achat` payé UNE FOIS (acquise tout de suite, pas de durée de
 *   recherche), et `entretien` **consommé** à chaque période, définitivement ;
 * - `effets` — sur une tuile, sur une de ses productions : `+N` ou `+N %`.
 *
 * ⚠️ **Les bâtiments sont désignés par `tileId`**, comme les règles de
 * placement, parce que c'est ce que le moteur lit. Le `code` ne sert qu'au
 * rapprochement avec l'arbre ; l'écran, lui, ne montre que des noms.
 *
 * ⚠️ **En cas de manque, la techno se met EN VEILLE** — ses effets s'arrêtent et
 * ses bâtiments redeviennent inconstructibles, mais elle reste acquise et repart
 * dès que la ressource rentre. Même logique que la mise en veille d'une tuile.
 * C'est une règle de MOTEUR : rien ici ne l'applique.
 *
 * Pas de `chemin_icone` : il n'y a pas de dossier d'icônes de techno, et un
 * champ qui ne peut afficher aucune image est du champ mort.
 *
 * ⚠️ Conséquence, dite en toutes lettres dans l'écran : **le jeu ne lit toujours
 * pas cette collection**. Le magasin ne sait pas refuser un bâtiment non
 * débloqué, `MoteurProduction` ne sait pas appliquer un bonus, et rien ne met une
 * techno en veille. On pose le vocabulaire ; le faire agir est un second
 * chantier, dans le moteur. Retirer l'avertissement le jour où le mécanisme
 * existe, pas avant — voir [[feedback-filtre-nest-pas-regle]].
 *
 * Déclaré en `type` et non en `interface`, comme `Ressource` : le SDK PocketBase
 * attend un `RecordModel` indexable, auquel une interface n'est pas assignable.
 */

import { pb } from "@/lib/pb";
import { PERIODE_PAR_DEFAUT } from "@/lib/tuiles";

export const COLLECTION_TECHNOLOGIES = "technologies";

/**
 * ⚠️ **Les âges ne vivent plus ici.** Ils étaient écrits en dur (`AGES`,
 * `NOMS_AGES`, `libelleAge`), recopiés de `arbre_sysb.json` ; depuis le
 * 2026-08-27 au soir ils sont une collection à part — `src/lib/ages.ts`, onglet
 * « Âges ». Ne pas en remettre une seconde liste ici : c'est exactement la
 * double source qu'on vient de supprimer.
 */

// --- Le bâtiment où la techno existe, et ce qu'il donne ----------------------

/**
 * Une techno **sans bâtiment relié est un brouillon** : elle n'a ni âge ni
 * catégorie, parce que ces deux-là viennent du bâtiment. Elle reste saisissable
 * et visible — dans son propre groupe, en tête de l'écran — pour qu'on puisse
 * poser une idée avant de savoir où elle vit.
 */
export function estBrouillon(t: { batiment?: number }): boolean {
  return !t.batiment;
}

/** Le bâtiment où elle existe, ou `undefined` — brouillon, ou tuile supprimée. */
export function batimentDe<T extends { tileId: number }>(
  t: { batiment?: number },
  tuiles: T[],
): T | undefined {
  return t.batiment ? tuiles.find((x) => x.tileId === t.batiment) : undefined;
}

/**
 * L'âge que la techno DOIT porter, lu sur son bâtiment. `0` si elle n'en a pas —
 * ou si le bâtiment n'a pas d'âge, ce qui arrive aux cases de terrain.
 *
 * ⚠️ Plus de borne 1–7 depuis que les âges sont une collection : c'est l'onglet
 * « Âges » qui dit lesquels existent, et il peut en compter huit demain. Un
 * numéro qui n'y figure pas n'est pas ramené à zéro en silence — l'écran le
 * montre « non déclaré », ce qui se corrige ; un zéro muet se cherche.
 */
export function ageDeduit(batiment: { age?: number } | undefined): number {
  const a = batiment?.age ?? 0;
  return a > 0 ? Math.trunc(a) : 0;
}

/** La catégorie, lue sur le bâtiment. Vide = pas de bâtiment, ou tuile sans catégorie. */
export function categorieDe(batiment: { categorie?: string } | undefined): string {
  return (batiment?.categorie ?? "").trim();
}

/** Le libellé d'une catégorie vide, dit une fois pour que les écrans concordent. */
export const SANS_CATEGORIE = "sans catégorie";

export type Technologie = {
  id: string;
  collectionId: string;
  collectionName: string;
  code: string;
  nom: string;
  /**
   * tileId du bâtiment **où la techno existe**. `0` = aucun, c'est un brouillon.
   *
   * ⚠️ Décision du 2026-08-27 au soir : c'est lui la source de l'`age` et de la
   * `categorie`. Ni l'un ni l'autre ne se saisit — voir `ageDeduit` et
   * `categorieDe`.
   */
  batiment: number;
  /**
   * 1 à 7, **recopié du bâtiment** à l'enregistrement ; `0` pour un brouillon.
   *
   * ⚠️ Il est stocké alors qu'il se déduit, et c'est assumé : `loadTechnologies`
   * trie côté PocketBase (`sort: "age,ordre,nom"`), ce qui exige un vrai champ.
   * Ne JAMAIS le saisir à la main — `valeursAvecBatiment()` le recalcule, et
   * l'écran le montre en lecture seule.
   */
  age: number;
  ordre: number;
  /** À quoi elle sert, en une phrase. Texte libre, lu par l'humain seulement. */
  description: string;
  /** tileIds des bâtiments qu'il faut posséder pour pouvoir la chercher. */
  batiments_requis: number[];
  /**
   * `code`s des technos qu'il faut avoir acquises avant celle-ci.
   *
   * ⚠️ Par `code`, pas par id de record : le code est ce que l'utilisateur fixe
   * une fois et ne change plus, et c'est lui qu'on relit dans un export. Un id
   * PocketBase ne survivrait pas à une base recréée.
   */
  technos_requises: string[];
  /** tileIds des bâtiments qu'elle rend constructibles. */
  debloque: number[];
  /**
   * `code`s des technos qu'elle ouvre.
   *
   * ⚠️ **C'est la MÊME flèche que `technos_requises`, vue de l'autre bout.**
   * « A débloque B » et « B exige A » disent la chose. Ce n'est pas une
   * contradiction en puissance parce qu'on les lit en **UNION**, jamais en
   * concurrence : les prérequis effectifs de B sont ce que B déclare PLUS ce qui
   * se déclare comme la débloquant (voir `prerequisEffectifs`). Écrire la flèche
   * des deux côtés est donc redondant, jamais faux.
   *
   * ⚠️ Corollaire : **tout ce qui raisonne sur le graphe doit passer par
   * `prerequisEffectifs`**, jamais lire `technos_requises` seul — sinon la
   * moitié des arêtes est invisible, et le garde-fou des cycles laisse passer
   * un cycle sur deux.
   */
  debloque_technos: string[];
  cout: CoutTechno;
  effets: EffetTechno[];
  created: string;
  updated: string;
};

export interface ValeursTechnologie {
  code: string;
  nom: string;
  batiment: number;
  age: number;
  ordre: number;
  description: string;
  batiments_requis: number[];
  technos_requises: string[];
  debloque: number[];
  debloque_technos: string[];
  cout: CoutTechno;
  effets: EffetTechno[];
}

// --- Le coût ----------------------------------------------------------------

/** Une ligne payée UNE FOIS, à l'acquisition. */
export interface LigneAchat {
  ressource: string;
  quantite: number;
}

/**
 * Une ligne **consommée** à chaque période — dépensée, pas immobilisée.
 *
 * ⚠️ Ne pas confondre avec le genre `mobilise` des ressources, qui s'occupe et
 * se rend. Ici la ressource part pour de bon, comme les vivres d'un habitat.
 * C'est le choix de l'utilisateur, dit en ces termes le 27/08.
 */
export interface LigneEntretien {
  ressource: string;
  quantite: number;
  periode_s: number;
}

export interface CoutTechno {
  achat: LigneAchat[];
  entretien: LigneEntretien[];
}

/**
 * Recopie l'âge du bâtiment dans les valeurs à enregistrer.
 *
 * ⚠️ Le POINT UNIQUE : appeler ça partout où l'on écrit une techno, sinon `age`
 * et le bâtiment divergent — et c'est `age` qui trie la liste, donc la techno
 * irait se ranger sous un âge qui n'est pas le sien.
 */
export function valeursAvecBatiment(
  v: ValeursTechnologie,
  batiment: { age?: number } | undefined,
): ValeursTechnologie {
  return { ...v, age: ageDeduit(batiment) };
}

export function coutVide(): CoutTechno {
  return { achat: [], entretien: [] };
}

export function ligneAchatVide(ressource: string): LigneAchat {
  return { ressource, quantite: 10 };
}

export function ligneEntretienVide(ressource: string): LigneEntretien {
  return { ressource, quantite: 1, periode_s: PERIODE_PAR_DEFAUT };
}

/** Vrai si la techno ne coûte rien du tout — l'écran le signale. */
export function coutVideEnFait(c: CoutTechno): boolean {
  return c.achat.length === 0 && c.entretien.length === 0;
}

// --- Les effets --------------------------------------------------------------

export type ModeEffet = "pourcentage" | "absolu";

export const MODES_EFFET: { valeur: ModeEffet; libelle: string; aide: string }[] = [
  { valeur: "pourcentage", libelle: "%", aide: "un pourcentage de ce que la tuile produit déjà" },
  { valeur: "absolu", libelle: "+N", aide: "un nombre ajouté à ce que la tuile produit par cycle" },
];

/**
 * Ce qu'une techno améliore : **une production, sur une tuile**.
 *
 * ⚠️ Volontairement étroit. « Toutes les mines », « le rayon de récolte », « le
 * coût de construction » ne sont PAS exprimables aujourd'hui : ça demanderait un
 * champ « quoi » et une notion de cible large, et l'utilisateur a décrit un
 * chiffre ou un pourcentage sur une tuile et une production. Élargir le jour où
 * il le demandera, pas avant.
 */
export interface EffetTechno {
  /** tileId de la tuile touchée. */
  tuile: number;
  /** Code de la ressource produite dont la cadence change. */
  ressource: string;
  valeur: number;
  mode: ModeEffet;
}

export function effetVide(): EffetTechno {
  return { tuile: 0, ressource: "", valeur: 10, mode: "pourcentage" };
}

/** Vrai si l'effet dit réellement quelque chose. Signalé en orange, jamais bloquant. */
export function effetUtile(e: EffetTechno): boolean {
  return e.tuile > 0 && e.ressource !== "" && e.valeur !== 0;
}

// --- Lecture : ce que PocketBase rend n'est pas forcément ce qu'on attend -----

const entier = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0);
const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Une liste de codes de techno : dédoublonnée, triée, sans vide. */
export function codesDe(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.map(texte).filter((c) => c !== ""))).sort();
}

/**
 * Les prérequis RÉELS d'une techno : ce qu'elle déclare, **plus** ce qui se
 * déclare comme la débloquant. C'est le seul point où le graphe se lit.
 */
export function prerequisEffectifs(code: string, technologies: Technologie[]): string[] {
  const propre = codesDe(technologies.find((t) => t.code === code)?.technos_requises);
  const parEnFace = technologies
    .filter((t) => t.code !== code && codesDe(t.debloque_technos).includes(code))
    .map((t) => t.code);
  return Array.from(new Set([...propre, ...parEnFace])).sort();
}

/** Ceux qui ne viennent PAS de la fiche elle-même — l'écran les montre à part. */
export function prerequisDeclaresAilleurs(code: string, technologies: Technologie[]): string[] {
  const propre = new Set(codesDe(technologies.find((t) => t.code === code)?.technos_requises));
  return prerequisEffectifs(code, technologies).filter((c) => !propre.has(c));
}

/**
 * Les technos dont `code` dépend, directement ou non.
 *
 * ⚠️ Sert à REFUSER un cycle à la saisie : « A exige B qui exige A » est un
 * arbre qu'aucun joueur ne peut gravir, et rien dans le moteur ne le détectera —
 * il bouclerait ou ne débloquerait jamais rien. On l'attrape ici, au moment où
 * quelqu'un peut encore corriger.
 *
 * Parcours en largeur, avec un garde `vus` : le graphe peut déjà contenir un
 * cycle si la base a été remplie par un script, et une récursion naïve
 * n'en reviendrait pas.
 */
export function dependancesDe(code: string, technologies: Technologie[]): Set<string> {
  const vus = new Set<string>();
  const file = [...prerequisEffectifs(code, technologies)];
  while (file.length) {
    const c = file.shift() as string;
    if (vus.has(c)) continue;
    vus.add(c);
    file.push(...prerequisEffectifs(c, technologies));
  }
  return vus;
}

/**
 * Les codes qu'on ne peut PAS exiger sans fabriquer un cycle : soi-même, et tout
 * ce qui dépend déjà de soi.
 */
export function codesInterdits(code: string, technologies: Technologie[]): Set<string> {
  const interdits = new Set<string>();
  if (code) interdits.add(code);
  for (const t of technologies) {
    if (t.code !== code && dependancesDe(t.code, technologies).has(code)) interdits.add(t.code);
  }
  return interdits;
}

export function coutDe(t: { cout?: unknown }): CoutTechno {
  const c = (t.cout ?? {}) as { achat?: unknown; entretien?: unknown };
  const achat = Array.isArray(c.achat) ? c.achat : [];
  const entretien = Array.isArray(c.entretien) ? c.entretien : [];
  return {
    achat: achat
      .map((l) => {
        const o = l as Partial<LigneAchat>;
        return { ressource: texte(o?.ressource), quantite: Math.max(0, entier(o?.quantite)) };
      })
      .filter((l) => l.ressource !== ""),
    entretien: entretien
      .map((l) => {
        const o = l as Partial<LigneEntretien>;
        return {
          ressource: texte(o?.ressource),
          quantite: Math.max(0, entier(o?.quantite)),
          // Une période à zéro ferait une division par zéro dans le moteur.
          periode_s: Math.max(1, entier(o?.periode_s) || PERIODE_PAR_DEFAUT),
        };
      })
      .filter((l) => l.ressource !== ""),
  };
}

export function effetsDe(t: { effets?: unknown }): EffetTechno[] {
  if (!Array.isArray(t.effets)) return [];
  return t.effets.map((e) => {
    const o = e as Partial<EffetTechno>;
    return {
      tuile: Math.max(0, entier(o?.tuile)),
      ressource: texte(o?.ressource),
      valeur: entier(o?.valeur),
      mode: o?.mode === "absolu" ? "absolu" : "pourcentage",
    };
  });
}

/**
 * L'ordre du jeu : par âge, puis par le champ `ordre`, puis par nom. C'est
 * l'ordre dans lequel un arbre se lit — jamais l'alphabet.
 */
export function loadTechnologies(): Promise<Technologie[]> {
  return pb.collection(COLLECTION_TECHNOLOGIES).getFullList<Technologie>({
    sort: "age,ordre,nom",
  });
}
