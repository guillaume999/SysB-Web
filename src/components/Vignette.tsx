/**
 * L'image d'un `chemin_icone`.
 *
 * La base stocke le chemin que **Unity** attend — `Icones_Tuiles/<code>`,
 * `Icones_Ressources/<code>` ou `Icones_Technos/<code>`, sans extension et sans
 * `Assets/Resources/`, parce que c'est ce que `Resources.Load` reclame. Le site
 * sert les MEMES dessins, mais en SVG depuis `public/`. La traduction est donc
 * mecanique, et elle vit ici, en un seul point.
 *
 * ⚠️ Un chemin qui ne suit pas la convention ne casse rien : on n'affiche pas
 * d'image et le texte du champ reste lisible a cote. C'est un catalogue en cours
 * de saisie.
 *
 * ⚠️ Et un chemin CONFORME dont le fichier n'existe pas retombe sur le meme
 * carre pointille, grace a `onError` — releve le 2026-09-06 : une techno dont le
 * code n'avait pas de dessin affichait l'icone d'image cassee du navigateur,
 * alors que le commentaire d'a cote promettait deja le carre vide. La promesse
 * etait fausse : la convention dit seulement comment le nom se fabrique, pas si
 * le fichier est la.
 */

import { useEffect, useState } from "react";

const DOSSIERS: Record<string, string> = {
  Icones_Tuiles: "icones_tuiles",
  Icones_Ressources: "icones",
  Icones_Technos: "icones_technos",
};

export function urlVignette(chemin: string | null | undefined): string | null {
  const c = (chemin ?? "").trim();
  const m = /^(Icones_Tuiles|Icones_Ressources|Icones_Technos)\/([A-Za-z0-9_-]+)$/.exec(c);
  if (!m) return null;
  return `/${DOSSIERS[m[1]]}/${m[2]}.svg`;
}

export function Vignette({
  chemin,
  alt,
  taille = 28,
}: {
  chemin: string | null | undefined;
  alt: string;
  taille?: number;
}) {
  const url = urlVignette(chemin);
  // Le 404 d'un chemin conforme. Remis a zero des que le chemin change, sinon
  // corriger une faute de frappe dans le formulaire garderait le carre vide.
  const [manquant, setManquant] = useState(false);
  useEffect(() => setManquant(false), [url]);

  if (!url || manquant) {
    return (
      <span
        aria-hidden
        title={manquant ? `Aucun fichier ne porte ce nom : ${chemin}` : undefined}
        className="inline-block shrink-0 rounded border border-dashed border-edge"
        style={{ width: taille, height: taille }}
      />
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      title={chemin ?? undefined}
      loading="lazy"
      onError={() => setManquant(true)}
      className="inline-block shrink-0 rounded bg-ink/40"
      style={{ width: taille, height: taille }}
    />
  );
}
