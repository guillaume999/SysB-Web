import { useMemo, useState } from "react";
import source from "@/docs/conception-tri-axes.md?raw";
import Markdown, { extraireTitres } from "@/components/Markdown";
import Aide, { Terme } from "@/components/Aide";

/**
 * Le document de conception « Tri-Axes », en lecture seule.
 *
 * Le texte vit dans `src/docs/conception-tri-axes.md` et est inliné au build
 * (`?raw`). Volontairement : c'est un document de référence, pas du contenu de
 * jeu. Le mettre dans PocketBase l'aurait rendu éditable en ligne — donc
 * modifiable sans trace et sans revue — alors qu'il se corrige au même endroit
 * que le code, dans un commit qu'on peut relire.
 *
 * Conséquence à connaître : **le mettre à jour demande un push + un rebuild**
 * (Portainer poll le repo toutes les minutes). C'est le prix assumé.
 *
 * La page est chargée en `lazy()` depuis App.tsx : ~115 Ko de texte qui ne
 * doivent pas peser sur le premier écran des six autres onglets.
 */
export default function Conception() {
  const titres = useMemo(() => extraireTitres(source, 2), []);
  const [filtre, setFiltre] = useState("");

  const sommaire = useMemo(() => {
    const q = filtre.trim().toLowerCase();
    if (!q) return titres;
    return titres.filter((t) => t.texte.toLowerCase().includes(q));
  }, [titres, filtre]);

  const telecharger = () => {
    const url = URL.createObjectURL(new Blob([source], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "CONCEPTION_TRI-AXES.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-white">Document de conception</h1>
          <p className="mt-1 text-sm text-slate-500">
            Les sept notes de travail « Tri-Axes » fusionnées en un seul texte, regroupées par sections.
          </p>
        </div>
        <button className="btn-ghost shrink-0" onClick={telecharger}>
          Télécharger le .md
        </button>
      </div>

      <Aide titre="À quoi sert cette page">
        <p>
          C'est la <span className="text-slate-200">référence de design</span>, pas du contenu de jeu : rien
          ici n'est lu par Unity ni par PocketBase. On y vient pour retrouver une statistique d'unité, une
          règle de biome ou la raison d'un choix, quand on reprend le projet après quelques semaines.
        </p>
        <Terme nom="Source">
          <code className="text-accent">src/docs/conception-tri-axes.md</code> dans le repo SysB-Web. Le
          corriger demande un commit puis un rebuild Portainer — c'est voulu : un document de référence qui
          se modifie sans trace ne vaut plus rien.
        </Terme>
        <Terme nom="Sommaire">
          Reprend les titres de niveau 1 et 2. Le champ au-dessus le filtre — il ne cherche pas dans le
          corps du texte, pour ça il y a le <code className="text-accent">Ctrl+F</code> du navigateur.
        </Terme>
        <Terme nom="Divergences">
          L'<span className="text-slate-200">annexe B</span>, tout en bas, liste les points où les notes
          d'origine se contredisaient — nombre de paliers, unités hybrides, paliers des unités homonymes.
          Rien n'a été tranché à leur place.
        </Terme>
      </Aide>

      <div className="mt-6 gap-6 lg:flex lg:items-start">
        {/* Sommaire */}
        <nav className="card mb-6 shrink-0 p-3 lg:sticky lg:top-6 lg:mb-0 lg:max-h-[calc(100vh-3rem)] lg:w-72 lg:overflow-y-auto">
          <input
            className="input mb-2 py-1.5 text-xs"
            placeholder="Filtrer le sommaire…"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
          />
          <ul className="space-y-0.5">
            {sommaire.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  title={t.texte}
                  className={`block truncate rounded px-2 py-1 text-xs transition-colors hover:bg-ink hover:text-white ${
                    t.niveau === 1 ? "font-medium text-slate-200" : "pl-4 text-slate-500"
                  }`}
                >
                  {t.texte}
                </a>
              </li>
            ))}
            {sommaire.length === 0 && (
              <li className="px-2 py-1 text-xs text-slate-600">Aucun titre ne correspond.</li>
            )}
          </ul>
        </nav>

        {/* Le document */}
        <article className="card min-w-0 flex-1 px-4 py-2 sm:px-6 sm:py-4">
          <Markdown source={source} />
        </article>
      </div>
    </div>
  );
}
