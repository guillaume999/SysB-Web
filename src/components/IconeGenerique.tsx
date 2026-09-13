/**
 * **L'icône d'attente** — un seul dessin, posé devant CHAQUE entrée de la barre
 * latérale en attendant les vraies (2026-09-13, à sa demande : *« un icône
 * générique simple monochrome pour les futures différentes entrées avant que
 * l'officiel soit fait »*).
 *
 * ⚠️ **Monochrome par construction** : elle est dessinée en `currentColor`,
 * donc elle prend la couleur du texte de l'entrée — grise au repos, blanche
 * quand l'onglet est actif — sans une ligne de code de plus. Lui donner une
 * couleur à elle ferait un troisième ton à tenir d'accord avec le thème.
 *
 * ⚠️ **Elle est la MÊME partout, et c'est voulu** : une icône d'attente
 * différente par écran donnerait à croire qu'elle veut dire quelque chose. Ici
 * elle dit « il y aura un dessin ici », rien d'autre. Le jour où les vraies
 * arrivent, c'est ce composant qu'on remplace par un choix par entrée — et
 * `Lien` (dans `lib/acces.ts`) gagnera son champ `icone`.
 *
 * Le dessin : un carré aux coins arrondis, en trait, avec un point au centre.
 * Rien qui ressemble à un contenu précis, et lisible à 16 px.
 */
export default function IconeGenerique({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      // ⚠️ Décorative : le libellé est juste à côté, le lecteur d'écran le lit
      //    déjà. L'annoncer une seconde fois ne dirait rien de plus.
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="3" />
      <circle cx="8" cy="8" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}
