/* eslint-disable react-refresh/only-export-components --
 * ⚠️ Ce fichier porte les RÈGLES du partage (pures, testées) ET le fournisseur
 * qui les applique — un seul sujet, un seul fichier, comme `lib/auth.tsx`. Les
 * séparer ne servirait qu'au rechargement à chaud en développement, au prix de
 * deux fichiers à tenir d'accord. Le prix assumé : éditer ce module recharge la
 * page entière en dev.
 */
// ============================================================
//  partage.ts
//  LE RATTACHEMENT À UN MODÈLE, ET QUI A LE DROIT D'Y TOUCHER — 2026-09-13.
//
//  *« pour l'admin dans modèle, une option qui permet de partager à un joueur
//  les outils de création pour ce modèle […] le modèle que l'admin lui a
//  partagé et les bâtiments ressources technos rattachés à ce modèle »*.
//
//  Deux champs neufs en base, et rien d'autre :
//
//  - **`templates.partages`** — les joueurs à qui CE modèle est ouvert ;
//  - **`rattachement`** sur `tuiles`, `ressources` et `technologies` — le
//    modèle de plateau auquel l'enregistrement appartient.
//
//  ⚠️⚠️ **`rattachement` NE DIT PAS OÙ LA TUILE SE JOUE.** Ça, c'est
//  `typeOfPlateau`, et le moteur ne lit que celui-là. `rattachement` dit **qui
//  a le droit d'écrire ce record** — rien de plus. Confondre les deux ferait
//  disparaître des bâtiments du jeu le jour où on range une tuile ailleurs.
//
//  ⚠️ **Le site ne PROTÈGE rien** : ce qui refuse l'écriture, ce sont les
//  règles d'API PocketBase (`rattachement.partages.id ?= @request.auth.id`).
//  Ce fichier décide de ce qu'on AFFICHE, et évite au joueur de se heurter à
//  un 403 qu'il ne comprendrait pas.
//
//  ⚠️ Un record **sans rattachement** (tout ce qui date d'avant le patch du
//  13/09) n'est visible que de l'admin. C'est volontaire : « rattaché à rien »
//  n'appartient à aucun joueur. Le patch en range tout sur le modèle ground.
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";
import { type TypePlateau } from "@/lib/modeles3d";
import { type Plateau, loadTemplates } from "@/lib/plateaux";

/** Le nom du champ, dit une fois — il est le même sur les trois collections. */
export const CHAMP_RATTACHEMENT = "rattachement";

/** Tout record qui porte un rattachement : une tuile, une ressource, une techno. */
export interface Rattachable {
  rattachement?: string;
}

/**
 * Ce qu'on a le droit d'éditer, et sur quels modèles.
 *
 * `modeles` est **vide pour un admin** : il n'est borné à rien, et lui faire
 * porter la liste des 12 modèles rendrait chaque test ambigu (« vide parce
 * qu'il n'a rien, ou parce qu'il a tout ? »). La question se pose toujours
 * dans l'ordre : admin d'abord, modèles ensuite.
 */
export interface Portee {
  estAdmin: boolean;
  modeles: Plateau[];
}

/** Les modèles ouverts à ce compte. Un admin n'est jamais « partagé » : il a tout. */
export function modelesPartages(templates: Plateau[], userId: string | undefined): Plateau[] {
  if (!userId) return [];
  return templates.filter((t) => (t.partages ?? []).includes(userId));
}

/**
 * Un **concepteur** est un compte à qui au moins un modèle est ouvert. C'est ce
 * statut, et lui seul, qui fait apparaître les écrans de création chez un
 * joueur.
 *
 * ⚠️ **Il n'y a PAS de second contrôle sur `estAdmin` ici**, et c'est
 * délibéré : `porteeDe` laisse déjà la liste vide pour un admin, donc un
 * `!portee.estAdmin` de plus serait un garde-fou qui ne peut jamais se
 * déclencher — le genre de ligne qu'on retire dans ce projet. La décision est
 * prise à UN endroit, `porteeDe`, et son essai la tient.
 */
export function estConcepteur(portee: Portee): boolean {
  return portee.modeles.length > 0;
}

export function porteeDe(
  estAdmin: boolean,
  templates: Plateau[],
  userId: string | undefined,
): Portee {
  return { estAdmin, modeles: estAdmin ? [] : modelesPartages(templates, userId) };
}

/** Le rattachement d'un record, `""` quand il n'en a pas encore. */
export function rattachementDe(record: Rattachable): string {
  return (record.rattachement ?? "").trim();
}

/**
 * Ce que cette portée a le droit de VOIR dans une liste.
 *
 * ⚠️ L'admin voit tout, **y compris les records sans rattachement** — sinon
 * une tuile oubliée par le patch disparaîtrait de son écran sans un mot, et
 * c'est précisément ce qu'il faut voir pour la ranger.
 */
export function visiblesPour<T extends Rattachable>(liste: T[], portee: Portee): T[] {
  if (portee.estAdmin) return liste;
  const miens = new Set(portee.modeles.map((m) => m.id));
  return liste.filter((r) => miens.has(rattachementDe(r)));
}

/** Les modèles de la portée, pour les écrans de plateaux. */
export function modelesVisibles(templates: Plateau[], portee: Portee): Plateau[] {
  if (portee.estAdmin) return templates;
  const miens = new Set(portee.modeles.map((m) => m.id));
  return templates.filter((t) => miens.has(t.id));
}

/**
 * **À quel modèle un enregistrement NEUF se rattache.**
 *
 * - un concepteur : son modèle — le premier, s'il en a plusieurs ;
 * - un admin : le modèle du **même type de plateau** que ce qu'il crée, le
 *   plus ancien de ce type (`created` croissant, la règle de tout le projet),
 *   et à défaut le premier modèle tout court.
 *
 * ⚠️ Rend `""` quand il n'existe aucun modèle : l'écran doit alors le DIRE
 * plutôt que d'enregistrer un record que personne ne pourra plus éditer.
 *
 * ⚠️ Ce n'est pas un choix définitif — c'est un défaut. Déplacer un record
 * d'un modèle à l'autre n'a pas encore d'écran (13/09).
 */
export function rattachementParDefaut(
  portee: Portee,
  templates: Plateau[],
  // ⚠️ `ground` par défaut, et ce n'est pas arbitraire : c'est là que le patch
  //    du 13/09 a rattaché TOUT l'existant. Un nouvel enregistrement tombe donc
  //    au même endroit que ses voisins, pas dans un modèle au hasard.
  type: TypePlateau = "ground",
): string {
  if (!portee.estAdmin) return portee.modeles[0]?.id ?? "";
  const parAnciennete = [...templates].sort((a, b) => (a.created < b.created ? -1 : 1));
  const duType = parAnciennete.filter((t) => t.typeOfPlateau === type);
  return (duType[0] ?? parAnciennete[0])?.id ?? "";
}

/** Le nom d'un modèle d'après son id — pour les écrans, jamais pour décider. */
export function nomDuModele(templates: Plateau[], id: string): string {
  if (!id) return "aucun modèle";
  return templates.find((t) => t.id === id)?.nom ?? "modèle inconnu";
}

/** Vrai si ce compte peut écrire ce record précis. Le serveur tranche, pas nous. */
export function peutEcrire(record: Rattachable, portee: Portee): boolean {
  if (portee.estAdmin) return true;
  return portee.modeles.some((m) => m.id === rattachementDe(record));
}

/* ------------------------------------------------------------------ */
/* La portée du compte connecté, une fois pour toute l'application      */
/* ------------------------------------------------------------------ */

/**
 * ⚠️ **Les modèles sont chargés UNE fois, ici.** Trois écrans et la barre
 * latérale ont besoin de savoir ce qui est partagé ; chacun le demandant de
 * son côté, c'est quatre requêtes au chargement et quatre vérités qui peuvent
 * diverger d'une seconde.
 *
 * ⚠️ `templates` est **public en lecture** : un joueur peut donc les lister
 * sans être admin, et c'est ce qui permet à cet appel de marcher pour lui.
 */
interface PartageContextValue {
  /** Ce que le compte a le droit d'éditer. */
  portee: Portee;
  /** Tous les modèles lisibles — la liste complète, non filtrée. */
  templates: Plateau[];
  chargement: boolean;
  /** À rappeler après avoir changé un partage, pour que la barre suive. */
  recharger: () => Promise<void>;
}

const PartageContext = createContext<PartageContextValue | undefined>(undefined);

export function PartageProvider({ children }: { children: ReactNode }) {
  const { user, estAdmin } = useAuth();
  const [templates, setTemplates] = useState<Plateau[]>([]);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    try {
      setTemplates(await loadTemplates());
    } catch {
      // ⚠️ On ne bloque pas l'application : sans modèles, la portée est vide,
      //    donc un joueur voit exactement ce qu'il voyait avant le partage.
      setTemplates([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setChargement(false);
      return;
    }
    void recharger();
  }, [user, recharger]);

  const valeur = useMemo<PartageContextValue>(
    () => ({
      portee: porteeDe(estAdmin, templates, user?.id),
      templates,
      chargement,
      recharger,
    }),
    [estAdmin, templates, user?.id, chargement, recharger],
  );

  return <PartageContext.Provider value={valeur}>{children}</PartageContext.Provider>;
}

export function usePartage(): PartageContextValue {
  const ctx = useContext(PartageContext);
  if (!ctx) throw new Error("usePartage doit être utilisé dans <PartageProvider>");
  return ctx;
}
