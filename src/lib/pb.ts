import PocketBase from "pocketbase";

// URL injectée au build par Vite (ARG VITE_PB_URL du Dockerfile).
// Fallback sur l'instance SysB pour le `npm run dev` local.
export const PB_URL: string =
  (import.meta.env.VITE_PB_URL as string | undefined) || "https://pb-sysb.physiooffice.com";

export const pb = new PocketBase(PB_URL);

// L'admin fait beaucoup de requêtes concurrentes (une par collection au chargement) :
// sans ça, PocketBase annule automatiquement les requêtes "doublons".
pb.autoCancellation(false);
