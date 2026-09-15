/// <reference types="vitest/config" />
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * `virtual:icones-du-site` — la liste des SVG de `public/icones*`, relevée au
 * build (15/09, onglet Icônes).
 *
 * ⚠️ POURQUOI PAS `import.meta.glob` : Vite refuse d'importer un fichier de
 * `public/` depuis le code. On ne veut pas l'importer, seulement savoir qu'il
 * existe — d'où ce module qui ne rend que des NOMS. Un SVG ajouté dans
 * `public/` apparaît dans l'onglet au prochain build (ou au prochain
 * lancement de `npm run dev`), pas avant.
 */
function iconesDuSite(): Plugin {
  const ID = "virtual:icones-du-site";
  const RESOLU = "\0" + ID;
  return {
    name: "icones-du-site",
    resolveId: (source) => (source === ID ? RESOLU : undefined),
    load(id) {
      if (id !== RESOLU) return undefined;
      const racine = path.resolve(import.meta.dirname, "public");
      const fichiers: { dossier: string; nom: string }[] = [];
      for (const dossier of fs.readdirSync(racine).sort()) {
        const complet = path.join(racine, dossier);
        if (!dossier.startsWith("icones") || !fs.statSync(complet).isDirectory()) continue;
        for (const f of fs.readdirSync(complet).sort()) {
          if (f.endsWith(".svg")) fichiers.push({ dossier, nom: f.slice(0, -4) });
        }
      }
      return `export default ${JSON.stringify(fichiers)};`;
    },
  };
}

export default defineConfig({
  server: { host: "::", port: 5173 },

  // ⚠️ `@vitejs/plugin-react`, PAS `-swc` (2026-09-09, montée en Vite 8). Vite 8
  // transforme avec Rolldown/oxc : le plugin SWC devient un aller-retour de
  // plus, et Vite l'annonce lui-même à chaque build tant qu'aucun plugin SWC
  // n'est utilisé — ce qui est notre cas. Ne le remettre que le jour où on aura
  // besoin d'un plugin SWC précis.
  plugins: [react(), iconesDuSite()],

  // ⚠️ `import.meta.dirname`, PAS `__dirname` : le chargeur de config natif de
  // Vite 8 ne connaît pas les globales CommonJS et le dit à chaque lancement.
  // ⚠️ Et surtout pas `new URL(...).pathname` : sous Windows il rend
  // `/C:/Users/...`, un chemin que rien ne sait résoudre.
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },

  // ⚠️ CE QUI A CHANGÉ DANS LA SORTIE avec Vite 8 : la cible par défaut est
  // « baseline widely available », donc le CSS sort en syntaxe d'intervalle
  // (`@media (width>=640px)` au lieu de `@media (min-width: 640px)`) et pèse
  // ~1,5 Ko de moins. C'est lu par Chrome 104+, Safari 16.4+, Firefox 102+.
  // Pour un vieux navigateur, poser `build.target` — pas revenir en arrière.

  // Les tests vivent A COTE du fichier qu'ils couvrent (`tuiles.test.ts`), pas
  // dans un dossier `tests/` a part : un test range ailleurs finit par ne plus
  // suivre le fichier qu'il surveille. `node` et non `jsdom` : on ne teste que
  // de la logique pure, aucun composant n'a besoin d'un DOM.
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
