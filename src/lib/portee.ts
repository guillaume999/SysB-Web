// ============================================================
//  portee.ts
//  La PORTÉE du compte connecté, chargée UNE fois pour toute l'application :
//  l'admin a tout, le joueur a sa planète et ses limites.
//
//  ⚠️ Pas de JSX ici (le fournisseur vit dans `components/PorteeProvider.tsx`)
//  : un fichier qui exporte un composant ET autre chose casse le rechargement
//  à chaud.
// ============================================================

import { createContext, useContext } from "react";
import { pb } from "@/lib/pb";
import { loadPlanetes, type Planete } from "@/lib/planetes";
import {
  COLLECTION_LIMITES,
  PORTEE_ADMIN,
  limitesDe,
  normaliserFiche,
  planeteDuJoueur,
  type FicheLimites,
  type Portee,
} from "@/lib/conception";

export interface ContextePortee {
  portee: Portee;
  /** Toutes les planètes, lues avec la portée : les écrans en ont besoin. */
  planetes: Planete[];
  chargement: boolean;
  erreur: string | null;
  recharger: () => void;
}

export const PorteeContexte = createContext<ContextePortee | null>(null);

export function usePortee(): ContextePortee {
  const c = useContext(PorteeContexte);
  if (!c) throw new Error("usePortee doit être utilisé dans <PorteeProvider>");
  return c;
}

export function loadLimites(): Promise<FicheLimites[]> {
  return pb
    .collection(COLLECTION_LIMITES)
    .getFullList<FicheLimites>({ sort: "nom" })
    .then((l) => l.map(normaliserFiche));
}

/**
 * ⚠️ UNE COLLECTION `limites` ABSENTE (patch pas encore passé) se lit « aucune
 * fiche » : le joueur ne crée rien, et l'écran le dit. Ce n'est pas une panne.
 */
export async function chargerPortee(uid: string, admin: boolean): Promise<{ portee: Portee; planetes: Planete[] }> {
  const planetes = await loadPlanetes().catch(() => [] as Planete[]);
  if (admin) return { portee: PORTEE_ADMIN, planetes };
  const fiches = await loadLimites().catch(() => [] as FicheLimites[]);
  return {
    portee: { admin: false, uid, planete: planeteDuJoueur(planetes, uid), limites: limitesDe(uid, fiches) },
    planetes,
  };
}
