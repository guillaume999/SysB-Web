import { useMemo, useState } from "react";
import {
  HAUTEUR_CASE,
  LARGEUR_CASE,
  PAS_VERTICAL,
  TILE_VIDE,
  centreCase,
  cleCase,
  index,
  type EtatCase,
} from "@/lib/plateaux";
import type { Tuile } from "@/lib/tuiles";

/**
 * La grille du plateau, en SVG : des **cases carrées posées en quinconce**.
 *
 * Le repère reste celui du jeu — offset odd-r, rangées impaires décalées d'une
 * demi-case, espacement vertical sqrt(3)/2 comme
 * `PlateauGenerator.CalculerPosition`. Seul le dessin change : des carrés se
 * visent et se lisent mieux qu'un pavage hexagonal à l'écran, et le décalage
 * suffit à montrer le voisinage réel.
 *
 * ⚠️ Les **distances** du jeu, elles, restent hexagonales : un rayon se calcule
 * avec `distanceHex`, pas avec un delta de lignes et de colonnes. Le rendu ne
 * change rien aux règles de placement.
 *
 * Le SVG plutôt qu'un canvas : chaque case reste un élément avec son `title`,
 * donc survolable et accessible, et la mise à l'échelle est gratuite.
 */

/** Couleur stable déduite du tileId : deux tuiles voisines restent distinctes. */
export function couleurTuile(tileId: number): string {
  if (tileId === TILE_VIDE) return "transparent";
  // Nombre d'or en degrés : répartit les teintes sans jamais retomber juste.
  const teinte = (tileId * 137.508) % 360;
  return `hsl(${teinte.toFixed(0)} 55% 45%)`;
}

export default function GrillePlateau({
  largeur,
  hauteur,
  octets,
  etats,
  tuiles,
  selection,
  onPeindre,
  onSelectionner,
}: {
  largeur: number;
  hauteur: number;
  octets: Uint8Array;
  etats: Map<string, EtatCase>;
  tuiles: Tuile[];
  /** Case mise en évidence, ou null. */
  selection: { x: number; z: number } | null;
  /** Appelé au clic et au glissé. null = mode inspection. */
  onPeindre: ((x: number, z: number) => void) | null;
  onSelectionner: (x: number, z: number) => void;
}) {
  const [enTrain, setEnTrain] = useState(false);

  const parTileId = useMemo(() => new Map(tuiles.map((t) => [t.tileId, t])), [tuiles]);

  // La géométrie ne dépend que des dimensions : inutile de la recalculer à
  // chaque coup de pinceau, alors qu'elle pèse une entrée par case.
  const cases = useMemo(() => {
    const liste: { x: number; z: number; gx: number; gy: number; cx: number; cy: number }[] = [];
    for (let z = 0; z < hauteur; z++) {
      for (let x = 0; x < largeur; x++) {
        const { cx, cy } = centreCase(x, z);
        liste.push({ x, z, gx: cx - LARGEUR_CASE / 2, gy: cy - HAUTEUR_CASE / 2, cx, cy });
      }
    }
    return liste;
  }, [largeur, hauteur]);

  const marge = 0.15;
  const boite = {
    x: -LARGEUR_CASE / 2 - marge,
    y: -HAUTEUR_CASE / 2 - marge,
    // +0.5 pour la demi-case dont débordent les rangées impaires
    w: largeur + 0.5 + 2 * marge,
    h: (hauteur - 1) * PAS_VERTICAL + HAUTEUR_CASE + 2 * marge,
  };

  const agir = (x: number, z: number, glisse: boolean) => {
    onSelectionner(x, z);
    if (onPeindre && (!glisse || enTrain)) onPeindre(x, z);
  };

  return (
    <svg
      viewBox={`${boite.x} ${boite.y} ${boite.w} ${boite.h}`}
      className="w-full select-none"
      style={{ maxHeight: "70vh", touchAction: "none" }}
      onPointerDown={() => setEnTrain(true)}
      onPointerUp={() => setEnTrain(false)}
      onPointerLeave={() => setEnTrain(false)}
    >
      {cases.map(({ x, z, gx, gy, cx, cy }) => {
        const tileId = octets[index(largeur, x, z)] ?? TILE_VIDE;
        const tuile = parTileId.get(tileId);
        const etat = etats.get(cleCase(x, z));
        const choisie = selection?.x === x && selection?.z === z;
        return (
          <g key={`${x},${z}`}>
            <rect
              x={gx}
              y={gy}
              width={LARGEUR_CASE}
              height={HAUTEUR_CASE}
              rx={0.06}
              fill={tileId === TILE_VIDE ? "#0f172a" : couleurTuile(tileId)}
              stroke={choisie ? "#f8fafc" : "#1e293b"}
              strokeWidth={choisie ? 0.06 : 0.02}
              onPointerDown={() => agir(x, z, false)}
              onPointerEnter={() => agir(x, z, true)}
              style={{ cursor: onPeindre ? "crosshair" : "pointer" }}
            >
              <title>
                {`(${x}, ${z}) — ${tileId === TILE_VIDE ? "vide" : (tuile?.nom ?? `id ${tileId}`)}` +
                  (etat ? ` — niveau ${etat.niveau}${etat.actif ? "" : ", éteint"}` : "")}
              </title>
            </rect>
            {/* Un point signale une case qui porte un état : niveau, stock, activité. */}
            {etat && (
              <circle
                cx={cx}
                cy={cy}
                r={0.1}
                fill={etat.actif ? "#f8fafc" : "#94a3b8"}
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
