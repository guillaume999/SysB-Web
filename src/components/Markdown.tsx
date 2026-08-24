import { Fragment, type ReactNode } from "react";

/**
 * Un rendu Markdown minimal, écrit à la main.
 *
 * Pourquoi pas `react-markdown` : le site n'a que quatre dépendances et le
 * document de conception n'utilise qu'une poignée de constructions — titres,
 * listes, tableaux, blocs de code, gras/italique. Une bibliothèque de rendu
 * (et ses ~15 paquets transitifs) coûterait plus cher que ces 150 lignes, et
 * chaque `npm install` se paie sur le NAS au moment du rebuild Portainer.
 *
 * Ce que ce rendu couvre, et rien d'autre :
 *   #..###### titres · ``` blocs de code · > citations · --- filets
 *   listes à puces et numérotées (imbrication par l'indentation)
 *   tableaux « pipe » avec leur ligne de séparation
 *   en ligne : **gras**, *italique*, `code`, [texte](url)
 *
 * ⚠️ Les blocs ``` sont rendus tels quels dans un <pre> : c'est ce qui garde
 * lisibles les schémas ASCII et les tableaux dessinés à la main du document,
 * qui ne sont pas du Markdown mais du dessin.
 */

export interface Titre {
  id: string;
  niveau: number;
  texte: string;
}

/** Identifiant d'ancre stable, dérivé du texte du titre. */
export function ancre(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Les titres du document, pour le sommaire.
 *
 * Saute les lignes situées dans un bloc ``` : le document contient des schémas
 * où un `#` en début de ligne n'est pas un titre.
 */
export function extraireTitres(source: string, niveauMax = 2): Titre[] {
  const titres: Titre[] = [];
  let dansUnBloc = false;
  const vus = new Set<string>();

  for (const ligne of source.split("\n")) {
    if (/^\s*```/.test(ligne)) {
      dansUnBloc = !dansUnBloc;
      continue;
    }
    if (dansUnBloc) continue;

    const m = /^(#{1,6})\s+(.*)$/.exec(ligne);
    if (!m) continue;
    const niveau = m[1].length;
    if (niveau > niveauMax) continue;

    const texte = nettoyer(m[2]);
    let id = ancre(texte);
    let n = 2;
    while (vus.has(id)) id = `${ancre(texte)}-${n++}`;
    vus.add(id);

    titres.push({ id, niveau, texte });
  }
  return titres;
}

/** Retire le balisage en ligne — pour le sommaire et les attributs `title`. */
function nettoyer(texte: string): string {
  return texte
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/* ------------------------------------------------------------------ */
/* Rendu en ligne                                                      */
/* ------------------------------------------------------------------ */

const EN_LIGNE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function inline(texte: string, cle: string): ReactNode {
  const morceaux = texte.split(EN_LIGNE).filter((m) => m !== "" && m !== undefined);

  return morceaux.map((morceau, i) => {
    const k = `${cle}-${i}`;

    if (morceau.startsWith("**") && morceau.endsWith("**"))
      return (
        <strong key={k} className="font-semibold text-slate-100">
          {morceau.slice(2, -2)}
        </strong>
      );

    if (morceau.startsWith("`") && morceau.endsWith("`"))
      return (
        <code key={k} className="rounded bg-ink px-1 py-0.5 font-mono text-[0.85em] text-accent">
          {morceau.slice(1, -1)}
        </code>
      );

    if (morceau.startsWith("*") && morceau.endsWith("*"))
      return (
        <em key={k} className="text-slate-400">
          {morceau.slice(1, -1)}
        </em>
      );

    const lien = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(morceau);
    if (lien)
      return (
        <a
          key={k}
          href={lien[2]}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline decoration-dotted underline-offset-2 hover:text-blue-400"
        >
          {lien[1]}
        </a>
      );

    return <Fragment key={k}>{morceau}</Fragment>;
  });
}

/* ------------------------------------------------------------------ */
/* Rendu des blocs                                                     */
/* ------------------------------------------------------------------ */

const CLASSES_TITRE: Record<number, string> = {
  1: "mt-10 border-b border-edge pb-2 text-2xl font-semibold text-white",
  2: "mt-8 text-xl font-semibold text-white",
  3: "mt-6 text-base font-semibold text-slate-100",
  4: "mt-4 text-sm font-semibold uppercase tracking-wide text-slate-300",
  5: "mt-3 text-sm font-semibold text-slate-300",
  6: "mt-3 text-sm font-medium text-slate-400",
};

interface Item {
  profondeur: number;
  marqueur: string | null;
  texte: string;
}

export default function Markdown({ source }: { source: string }) {
  const lignes = source.split("\n");
  const blocs: ReactNode[] = [];
  const vus = new Set<string>();
  let i = 0;

  const idUnique = (texte: string) => {
    let id = ancre(texte);
    let n = 2;
    while (vus.has(id)) id = `${ancre(texte)}-${n++}`;
    vus.add(id);
    return id;
  };

  while (i < lignes.length) {
    const ligne = lignes[i];

    /* Ligne vide */
    if (ligne.trim() === "") {
      i += 1;
      continue;
    }

    /* Bloc de code / schéma ASCII */
    if (/^\s*```/.test(ligne)) {
      const contenu: string[] = [];
      i += 1;
      while (i < lignes.length && !/^\s*```/.test(lignes[i])) {
        contenu.push(lignes[i]);
        i += 1;
      }
      i += 1; // la clôture
      blocs.push(
        <pre
          key={`pre-${i}`}
          className="my-4 overflow-x-auto rounded-lg border border-edge bg-ink p-3 font-mono text-[11px] leading-[1.45] text-slate-300 sm:text-xs"
        >
          {contenu.join("\n")}
        </pre>,
      );
      continue;
    }

    /* Titre */
    const titre = /^(#{1,6})\s+(.*)$/.exec(ligne);
    if (titre) {
      const niveau = titre[1].length;
      const texte = titre[2];
      const id = niveau <= 2 ? idUnique(nettoyer(texte)) : undefined;
      const Balise = `h${niveau}` as "h1";
      blocs.push(
        <Balise key={`h-${i}`} id={id} className={`scroll-mt-6 ${CLASSES_TITRE[niveau]}`}>
          {inline(texte, `h-${i}`)}
        </Balise>,
      );
      i += 1;
      continue;
    }

    /* Filet */
    if (/^\s*(---|\*\*\*|___)\s*$/.test(ligne)) {
      blocs.push(<hr key={`hr-${i}`} className="my-8 border-edge" />);
      i += 1;
      continue;
    }

    /* Citation */
    if (/^\s*>/.test(ligne)) {
      const contenu: string[] = [];
      while (i < lignes.length && /^\s*>/.test(lignes[i])) {
        contenu.push(lignes[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocs.push(
        <blockquote
          key={`bq-${i}`}
          className="my-4 space-y-2 border-l-2 border-accent/50 bg-panel/40 py-2 pl-4 pr-3 text-sm text-slate-400"
        >
          {paragraphes(contenu).map((p, n) => (
            <p key={n}>{inline(p, `bq-${i}-${n}`)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    /* Tableau « pipe » */
    if (/^\s*\|/.test(ligne) && i + 1 < lignes.length && /^\s*\|[\s:|-]+\|\s*$/.test(lignes[i + 1])) {
      const entete = cellules(ligne);
      i += 2;
      const corps: string[][] = [];
      while (i < lignes.length && /^\s*\|/.test(lignes[i])) {
        corps.push(cellules(lignes[i]));
        i += 1;
      }
      blocs.push(
        <div key={`tb-${i}`} className="my-4 overflow-x-auto rounded-lg border border-edge">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-panel">
                {entete.map((c, n) => (
                  <th key={n} className="border-b border-edge px-3 py-2 text-left font-medium text-slate-200">
                    {inline(c, `th-${i}-${n}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corps.map((rangee, r) => (
                <tr key={r} className="align-top odd:bg-panel/30">
                  {rangee.map((c, n) => (
                    <td key={n} className="border-b border-edge/60 px-3 py-2 text-slate-400">
                      {inline(c, `td-${i}-${r}-${n}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    /* Liste — à puces ou numérotée, imbriquée par l'indentation */
    if (/^\s*([-*+]|\d+\.)\s+/.test(ligne)) {
      const items: Item[] = [];
      while (i < lignes.length) {
        const courante = lignes[i];
        const m = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(courante);
        if (m) {
          items.push({
            profondeur: Math.min(3, Math.floor(m[1].length / 2)),
            marqueur: /\d/.test(m[2]) ? m[2] : null,
            texte: m[3],
          });
          i += 1;
          continue;
        }
        // Ligne de continuation : indentée, sans marqueur, sous un item existant.
        if (items.length > 0 && /^\s+\S/.test(courante) && !/^\s*```/.test(courante)) {
          items[items.length - 1].texte += ` ${courante.trim()}`;
          i += 1;
          continue;
        }
        break;
      }

      blocs.push(
        <ul key={`ul-${i}`} className="my-3 space-y-1.5 text-sm text-slate-400">
          {items.map((item, n) => (
            <li
              key={n}
              className="flex gap-2 leading-relaxed"
              style={{ paddingLeft: `${item.profondeur * 1.1}rem` }}
            >
              <span className="mt-[0.15rem] shrink-0 select-none text-xs text-slate-600">
                {item.marqueur ?? (item.profondeur === 0 ? "•" : "◦")}
              </span>
              <span className="min-w-0">{inline(item.texte, `li-${i}-${n}`)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    /* Paragraphe : les lignes consécutives se recollent en un seul bloc. */
    const contenu: string[] = [];
    while (
      i < lignes.length &&
      lignes[i].trim() !== "" &&
      !/^\s*(```|#{1,6}\s|>|\||---|\*\*\*|___)/.test(lignes[i]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lignes[i])
    ) {
      contenu.push(lignes[i].trim());
      i += 1;
    }
    if (contenu.length > 0)
      blocs.push(
        <p key={`p-${i}`} className="my-3 text-sm leading-relaxed text-slate-400">
          {inline(contenu.join(" "), `p-${i}`)}
        </p>,
      );
    else i += 1; // sécurité : ne jamais boucler sur une ligne non consommée
  }

  return <div className="max-w-none">{blocs}</div>;
}

/** Découpe une ligne de tableau en cellules, sans les barres de bord. */
function cellules(ligne: string): string[] {
  return ligne
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/** Regroupe des lignes en paragraphes, séparés par les lignes vides. */
function paragraphes(lignes: string[]): string[] {
  const sortie: string[] = [];
  let courant: string[] = [];
  for (const ligne of lignes) {
    if (ligne.trim() === "") {
      if (courant.length) sortie.push(courant.join(" "));
      courant = [];
    } else courant.push(ligne.trim());
  }
  if (courant.length) sortie.push(courant.join(" "));
  return sortie;
}
