/**
 * Un lien qu'on accepte de rendre cliquable dans un texte saisi sur le site
 * (News, 15/09) : http(s), mailto, une adresse du site (`/forum`) ou une ancre.
 * ⚠️ Tout le reste — `javascript:`, `data:`, `//autre-site` — reste du texte.
 */
export function lienSur(url: string): boolean {
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url);
}
