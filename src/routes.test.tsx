// ============================================================
//  routes.test.tsx
//  Le filet du ROUTEUR — posé le 2026-09-09, à la montée en
//  react-router-dom 7 (avis GHSA-wrjc-x8rr-h8h6 et GHSA-337j-9hxr-rhxg).
//
//  ⚠️ POURQUOI CE FICHIER EXISTE. `tsc` a validé la montée v6 → v7 parce que la
//  SIGNATURE des composants n'a pas bougé ; ce qui aurait pu bouger, c'est leur
//  COMPORTEMENT, et aucun type ne le dit. Il ne teste donc pas le code du site :
//  il teste que les primitives employées par `App.tsx` (`Routes`/`Route`, le
//  paramètre `:id`, le joker `*`, `Link`) font toujours ce que l'application
//  attend d'elles.
//
//  ⚠️ DEUX OUTILS, ET C'EST VOULU. `matchRoutes` juge le CHOIX de la route —
//  sans React, sans rendu. `renderToStaticMarkup` juge ce qui SORT. Le mélange
//  des deux est ce qui évite d'installer jsdom pour quelques assertions.
//
//  ⚠️ **`StaticRouter`, pas `MemoryRouter`** : le routeur mémoire est fait pour
//  le navigateur, et rendu en chaîne il inonde le log de « useLayoutEffect does
//  nothing on the server » — un bruit qui, dans le build Docker, finirait par
//  faire ignorer les vraies alertes.
//
//  ⚠️ **`<Navigate>` ne se teste PAS au rendu statique** : il redirige dans un
//  effet, et aucun effet ne s'exécute ici — il rendrait une chaîne VIDE, ce qui
//  ferait croire à une page blanche. C'est `matchRoutes` qui vérifie que le
//  joker attrape bien l'adresse inconnue.
//
//  ⚠️ Le jour où les écrans passeront aux routes « data » (`createBrowserRouter`,
//  loaders), c'est ce fichier qui dira si le joker et le `:id` se comportent
//  encore pareil. Le mettre à jour AVEC la bascule, pas après.
// ============================================================

import { renderToStaticMarkup } from "react-dom/server";
import { Link, Route, Routes, StaticRouter, matchRoutes, useParams } from "react-router-dom";
import { describe, expect, it } from "vitest";

/** Les formes de route employées par `App.tsx`, et elles seules. */
const routes = [{ path: "/" }, { path: "/tuiles" }, { path: "/modeles/:id" }, { path: "*" }];

/** La route CHOISIE pour un chemin, et ses paramètres. */
function choisie(chemin: string) {
  const trouve = matchRoutes(routes, chemin);
  const dernier = trouve?.[trouve.length - 1];
  return { path: dernier?.route.path, params: dernier?.params ?? {} };
}

describe("le choix de la route", () => {
  it("sert la route exacte plutôt que le joker", () => {
    expect(choisie("/").path).toBe("/");
    expect(choisie("/tuiles").path).toBe("/tuiles");
  });

  it("extrait le paramètre `:id`", () => {
    expect(choisie("/modeles/abc123")).toEqual({ path: "/modeles/:id", params: { id: "abc123" } });
  });

  it("attrape une adresse inconnue par le joker", () => {
    // ⚠️ C'est le seul filet du site contre un lien mort : sans le joker, une
    // URL fautive rendrait une page BLANCHE, sans erreur nulle part.
    expect(choisie("/nimportequoi").path).toBe("*");
    expect(choisie("/modeles").path).toBe("*"); // `:id` ne matche pas le vide
  });
});

describe("le rendu", () => {
  function Ecran({ nom }: { nom: string }) {
    return <p>écran {nom}</p>;
  }

  function Editeur() {
    // Le vrai `PlateauEditeur` lit son id exactement comme ça.
    const { id } = useParams();
    return <p>édite {id}</p>;
  }

  const rendu = (chemin: string) =>
    renderToStaticMarkup(
      <StaticRouter location={chemin}>
        <Routes>
          <Route path="/" element={<Ecran nom="accueil" />} />
          <Route path="/tuiles" element={<Ecran nom="tuiles" />} />
          <Route path="/modeles/:id" element={<Editeur />} />
        </Routes>
      </StaticRouter>,
    );

  it("monte l'écran de la route, et lui passe son paramètre", () => {
    expect(rendu("/")).toContain("écran accueil");
    expect(rendu("/tuiles")).toContain("écran tuiles");
    expect(rendu("/modeles/abc123")).toContain("édite abc123");
  });

  it("rend un `Link` en `<a href>` — ce que les cartes de l'accueil attendent", () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <Link to="/tuiles">Tuiles</Link>
      </StaticRouter>,
    );
    expect(html).toContain('href="/tuiles"');
  });
});
