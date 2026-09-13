import { useEffect, useMemo, useState } from "react";
import source from "@/docs/conception-tri-axes.md?raw";
import Markdown, { extraireTitres } from "@/components/Markdown";
import Aide, { Terme } from "@/components/Aide";
import { type DonneesCatalogue, chargerCatalogue, sectionsDuCatalogue } from "@/lib/encyclopedie";
import { messageErreur } from "@/lib/pb";

/**
 * Le document de conception « Tri-Axes », en lecture seule — **suivi du
 * catalogue réel, relu dans la base**.
 *
 * Le texte vit dans `src/docs/conception-tri-axes.md` et est inliné au build
 * (`?raw`). Volontairement : c'est un document de référence, pas du contenu de
 * jeu. Le mettre dans PocketBase l'aurait rendu éditable en ligne — donc
 * modifiable sans trace et sans revue — alors qu'il se corrige au même endroit
 * que le code, dans un commit qu'on peut relire.
 *
 * ⚠️ **AJOUT DU 2026-09-13 : les trois dernières sections ne sont pas dans le
 * .md.** Elles sont fabriquées par `lib/encyclopedie.ts` depuis `ressources`,
 * `tuiles`, `technologies` et `ages`, et **collées à la fin du texte** — donc
 * rendues, mises au sommaire et téléchargées par le même chemin que le reste.
 * C'est ce qui fait qu'il n'y a rien à tenir à jour : le document dit ce qu'on
 * a voulu faire, la base dit ce que le jeu contient.
 *
 * La page est chargée en `lazy()` depuis App.tsx : ~115 Ko de texte qui ne
 * doivent pas peser sur le premier écran des huit autres onglets.
 */
export default function Conception() {
  const [catalogue, setCatalogue] = useState<DonneesCatalogue | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    let annule = false;
    chargerCatalogue().then(
      (donnees) => {
        if (!annule) setCatalogue(donnees);
      },
      (e) => {
        if (!annule) setErreur(messageErreur(e, "Lecture du catalogue impossible."));
      },
    );
    return () => {
      annule = true;
    };
  }, []);

  // ⚠️ Surtout pas `document` : le nom est déjà pris par le DOM, et
  // `telecharger()` s'en sert deux lignes plus bas.
  const complet = useMemo(
    () => (catalogue ? source + sectionsDuCatalogue(catalogue) : source),
    [catalogue],
  );
  const titres = useMemo(() => extraireTitres(complet, 2), [complet]);

  const sommaire = useMemo(() => {
    const q = filtre.trim().toLowerCase();
    if (!q) return titres;
    return titres.filter((t) => t.texte.toLowerCase().includes(q));
  }, [titres, filtre]);

  const telecharger = () => {
    const url = URL.createObjectURL(new Blob([complet], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "CONCEPTION_TRI-AXES.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const enChargement = !catalogue && !erreur;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-white">Document de conception</h1>
          <p className="mt-1 text-sm text-slate-500">
            Les sept notes de travail « Tri-Axes » fusionnées en un seul texte, puis le contenu
            réel du jeu, relu dans la base.
          </p>
        </div>
        {/*
          ⚠️ Désactivé tant que la base n'a pas répondu : sinon le fichier
          téléchargé serait amputé de ses trois dernières sections, sans que
          rien ne le dise.
        */}
        <button
          className="btn-ghost shrink-0"
          onClick={telecharger}
          disabled={enChargement}
          title={enChargement ? "Le catalogue n'est pas encore lu." : undefined}
        >
          Télécharger le .md
        </button>
      </div>

      {enChargement && (
        <p className="mt-3 text-xs text-slate-500">Lecture du catalogue dans la base…</p>
      )}
      {erreur && (
        <p className="mt-3 rounded border border-amber-900/60 bg-amber-950/30 p-2 text-sm text-amber-300">
          Catalogue illisible — {erreur} Le document de conception, lui, est complet : seules les
          trois sections finales manquent.
        </p>
      )}

      <Aide titre="À quoi sert cette page">
        <p>
          Deux textes à la suite : la <span className="text-slate-200">référence de design</span>,
          puis le <span className="text-slate-200">contenu réel</span>. On y vient pour retrouver
          une statistique d'unité, une règle de biome ou la raison d'un choix — et pour savoir ce
          que le jeu contient vraiment aujourd'hui.
        </p>
        <Terme nom="Source">
          <code className="text-accent">src/docs/conception-tri-axes.md</code> dans le repo SysB-Web. Le
          corriger demande un commit puis un rebuild Portainer — c'est voulu : un document de référence qui
          se modifie sans trace ne vaut plus rien.
        </Terme>
        <Terme nom="Le contenu réel">
          Les trois dernières sections — ressources, bâtiments, technologies — ne sont écrites par
          personne : elles sont <span className="text-slate-200">relues dans la base</span> à chaque
          ouverture de la page, avec la même fiche qu'un admin voit dans les écrans de contenu.
          Elles ne peuvent donc pas être en retard, et <strong>là où les deux textes se
          contredisent, c'est le second qui dit ce que le jeu fait</strong>.
        </Terme>
        <Terme nom="Sommaire">
          Reprend les titres de niveau 1 et 2. Le champ au-dessus le filtre — il ne cherche pas dans le
          corps du texte, pour ça il y a le <code className="text-accent">Ctrl+F</code> du navigateur.
          Les bâtiments et les technos sont en niveau 4 : cent quarante entrées le rendraient
          illisible.
        </Terme>
        <Terme nom="Divergences">
          L'<span className="text-slate-200">annexe B</span> liste les points où les notes
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
          <Markdown source={complet} />
        </article>
      </div>
    </div>
  );
}
