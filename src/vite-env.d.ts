/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Les SVG de `public/icones*`, relevés au build — voir `vite.config.ts`. */
declare module "virtual:icones-du-site" {
  const fichiers: { dossier: string; nom: string }[];
  export default fichiers;
}
