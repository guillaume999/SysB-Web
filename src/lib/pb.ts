import PocketBase from "pocketbase";

// URL injectée au build par Vite (ARG VITE_PB_URL du Dockerfile).
// Fallback sur l'instance SysB pour le `npm run dev` local.
export const PB_URL: string =
  (import.meta.env.VITE_PB_URL as string | undefined) || "https://pb-sysb.physiooffice.com";

export const pb = new PocketBase(PB_URL);

// L'admin fait beaucoup de requêtes concurrentes (une par collection au chargement) :
// sans ça, PocketBase annule automatiquement les requêtes "doublons".
pb.autoCancellation(false);

/**
 * Message d'erreur lisible à partir d'un échec PocketBase.
 * Les erreurs de validation arrivent dans `response.data`, champ par champ —
 * sans ça l'utilisateur ne voit qu'un « Failed to create record » inutile.
 */
export function messageErreur(e: unknown, defaut: string): string {
  const err = e as { message?: string; response?: { data?: Record<string, { message?: string }> } };
  const details = Object.entries(err.response?.data ?? {})
    .map(([champ, info]) => `${champ} : ${info?.message ?? "invalide"}`)
    .join(" · ");
  return details || err.message || defaut;
}
