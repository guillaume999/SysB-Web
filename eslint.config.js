// ============================================================
//  eslint.config.js
//  Le lint du site d'administration — posé le 2026-09-09.
//
//  Jusqu'ici il n'y en avait AUCUN : le seul filet était `tsc`, et il ne
//  regarde que les types. Un `useEffect` sans sa dépendance, une variable
//  jamais lue, un `catch` qui avale tout : rien ne les voyait passer.
//
//  ⚠️ Ce fichier N'EST PAS un règlement de style. Pas de guillemets imposés,
//  pas de largeur de ligne : ça, c'est du bruit dans les diffs. On ne garde
//  que les règles qui attrapent un BUG.
//
//  ⚠️ Les règles des hooks React sont en ERREUR, pas en avertissement. Un
//  avertissement que le Dockerfile ne fait pas échouer n'est lu par personne.
// ============================================================

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Ce qui n'est pas du code source : le build, les dépendances, et le
    // dossier d'attente `_a_supprimer` — qui, lui, part bientôt en entier.
    ignores: ["dist", "node_modules", "_a_supprimer", ".cache_bust_5", "public"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Un composant exporté à côté d'autre chose casse le rechargement à
      // chaud. Avertissement seulement : ça ne casse pas la prod.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Une variable jamais lue est presque toujours un reste de refonte —
      // exactement le code mort qu'on s'est promis de retirer au moment où il
      // le devient. Le préfixe `_` reste la porte de sortie explicite.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // `any` désactive le seul filet qu'on avait avant celui-ci. Avertissement
      // pour l'instant : les quelques `any` en place datent d'avant le lint.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Le lint tourne aussi sur ses propres fichiers de config, qui sont du
    // Node et pas du navigateur.
    files: ["*.config.{js,ts}", "*.config.*.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
);
