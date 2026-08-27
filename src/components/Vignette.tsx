/**
 * L'image d'un `chemin_icone`.
 *
 * La base stocke le chemin que **Unity** attend — `Icones_Tuiles/<code>` ou
 * `Icones_Ressources/<code>`, sans extension et sans `Assets/Resources/`, parce que
 * c'est ce que `Resources.Load` reclame. Le site sert les MEMES dessins, mais en SVG
 * depuis `public/`. La traduction est donc mecanique, et elle vit ici, en un seul point.
 *
 * ⚠️ Un chemin qui ne suit pas la convention ne casse rien : on n'affiche pas d'image
 * et le texte du champ reste lisible a cote. C'est un catalogue en cours de saisie.
 */

const DOSSIERS: Record<string, string> = {
  Icones_Tuiles: "icones_tuiles",
  Icones_Ressources: "icones",
};

export function urlVignette(chemin: string | null | undefined): string | null {
  const c = (chemin ?? "").trim();
  const m = /^(Icones_Tuiles|Icones_Ressources)\/([A-Za-z0-9_-]+)$/.exec(c);
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
  if (!url) {
    return (
      <span
        aria-hidden
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
      className="inline-block shrink-0 rounded bg-ink/40"
      style={{ width: taille, height: taille }}
    />
  );
}
