import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HAUTEUR_CASE,
  LARGEUR_CASE,
  PAS_VERTICAL,
  TILE_VIDE,
  casesDansRayon,
  centreCase,
  cleCase,
  index,
  type EtatCase,
} from "@/lib/plateaux";
import { couleurDe, type Tuile } from "@/lib/tuiles";

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
 * change rien aux règles de placement, ni à ce que couvre un pinceau large.
 *
 * Le SVG plutôt qu'un canvas : chaque case reste un élément avec son `title`,
 * donc survolable et accessible, et la mise à l'échelle est gratuite.
 */

/** Zoom, en pixels par case. En dessous on ne vise plus rien, au-dessus on ne voit plus rien. */
const ZOOM_MIN = 3;
const ZOOM_MAX = 96;
const PAS_ZOOM = 1.3;

/** Un coup de flèche déplace de cette fraction de la fenêtre : on garde un repère. */
const PAS_DEPLACEMENT = 0.6;

/**
 * Couleur d'une case.
 *
 * Celle du catalogue si l'admin l'a choisie, sinon la teinte automatique déduite
 * du `tileId`. La tuile est passée à part parce que la grille ne connaît que des
 * octets : sans elle, on ne peut que retomber sur l'automatique.
 */
export function couleurTuile(
  tileId: number,
  tuile?: { tileId: number; couleur?: string } | null,
): string {
  if (tileId === TILE_VIDE) return "transparent";
  return couleurDe(tuile ?? { tileId });
}

export default function GrillePlateau({
  largeur,
  hauteur,
  octets,
  etats,
  tuiles,
  selection,
  rayonPinceau = 0,
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
  /** Rayon hexagonal du pinceau, pour dessiner l'aperçu sous le curseur. */
  rayonPinceau?: number;
  /** Appelé au clic et au glissé. null = mode inspection. */
  onPeindre: ((x: number, z: number) => void) | null;
  onSelectionner: (x: number, z: number) => void;
}) {
  const fenetre = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(24);
  const [survol, setSurvol] = useState<{ x: number; z: number } | null>(null);
  const [bords, setBords] = useState({ gauche: false, droite: false, haut: false, bas: false });

  /** Glissé en cours. Un ref, pas un état : le savoir ne change rien au dessin. */
  const enTrain = useRef(false);

  /**
   * Les rappels du parent sont recréés à chaque rendu. En les gardant dans un ref,
   * `agir` reste stable, donc la liste des cases reste mémoïsée — sans quoi
   * survoler une case redessinerait les huit mille autres.
   */
  const rappels = useRef({ onPeindre, onSelectionner, suivreSurvol: false });
  rappels.current = {
    onPeindre,
    onSelectionner,
    suivreSurvol: rayonPinceau > 0 && onPeindre !== null,
  };

  const agir = useCallback((x: number, z: number, glisse: boolean) => {
    const { onPeindre: peindre, onSelectionner: choisir, suivreSurvol } = rappels.current;
    if (suivreSurvol) setSurvol({ x, z });
    if (glisse && !enTrain.current) return;
    choisir(x, z);
    if (peindre) peindre(x, z);
  }, []);

  // Relâcher hors de la grille doit arrêter le glissé : sinon le pinceau
  // continuerait à peindre au simple survol, sans que rien ne soit pressé.
  useEffect(() => {
    const stop = () => {
      enTrain.current = false;
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  const parTileId = useMemo(() => new Map(tuiles.map((t) => [t.tileId, t])), [tuiles]);

  const marge = 0.15;
  const boite = useMemo(
    () => ({
      x: -LARGEUR_CASE / 2 - marge,
      y: -HAUTEUR_CASE / 2 - marge,
      // +0.5 pour la demi-case dont débordent les rangées impaires
      w: largeur + 0.5 + 2 * marge,
      h: (hauteur - 1) * PAS_VERTICAL + HAUTEUR_CASE + 2 * marge,
    }),
    [largeur, hauteur],
  );

  const majBords = useCallback(() => {
    const el = fenetre.current;
    if (!el) return;
    setBords({
      gauche: el.scrollLeft > 1,
      droite: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      haut: el.scrollTop > 1,
      bas: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    });
  }, []);

  /** Le zoom qui fait tenir la largeur du plateau dans la fenêtre. */
  const ajuster = useCallback(() => {
    const el = fenetre.current;
    if (!el) return;
    const dispo = el.clientWidth - 2;
    if (dispo <= 0) return;
    setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, dispo / boite.w)));
  }, [boite.w]);

  // À l'ouverture et à chaque changement de dimensions : on repart d'un plateau
  // entièrement visible, plutôt que d'un cadrage hérité de la taille précédente.
  useEffect(() => {
    ajuster();
  }, [ajuster]);

  useEffect(() => {
    majBords();
  }, [zoom, boite.w, boite.h, majBords]);

  /**
   * Zoomer en gardant le centre de la fenêtre sur la même case : sans cela, on
   * perd de vue l'endroit où l'on travaillait dès le deuxième clic.
   */
  const changerZoom = (facteur: number) => {
    const nouveau = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * facteur));
    if (nouveau === zoom) return;
    const el = fenetre.current;
    const ratio = el
      ? {
          x: (el.scrollLeft + el.clientWidth / 2) / (boite.w * zoom),
          y: (el.scrollTop + el.clientHeight / 2) / (boite.h * zoom),
        }
      : null;
    setZoom(nouveau);
    if (el && ratio) {
      requestAnimationFrame(() => {
        el.scrollLeft = ratio.x * boite.w * nouveau - el.clientWidth / 2;
        el.scrollTop = ratio.y * boite.h * nouveau - el.clientHeight / 2;
        majBords();
      });
    }
  };

  const deplacer = (dx: number, dy: number) => {
    const el = fenetre.current;
    if (!el) return;
    el.scrollBy({
      left: dx * el.clientWidth * PAS_DEPLACEMENT,
      top: dy * el.clientHeight * PAS_DEPLACEMENT,
      behavior: "smooth",
    });
  };

  /**
   * Les cases, mémoïsées à part.
   *
   * Elles ne dépendent ni du zoom ni du survol : déplacer la souris avec un
   * pinceau large ne doit redessiner que l'aperçu, pas la grille entière.
   */
  const cellules = useMemo(() => {
    const liste = [];
    for (let z = 0; z < hauteur; z++) {
      for (let x = 0; x < largeur; x++) {
        const { cx, cy } = centreCase(x, z);
        const tileId = octets[index(largeur, x, z)] ?? TILE_VIDE;
        const tuile = parTileId.get(tileId);
        const etat = etats.get(cleCase(x, z));
        const choisie = selection?.x === x && selection?.z === z;
        liste.push(
          <g key={`${x},${z}`}>
            <rect
              x={cx - LARGEUR_CASE / 2}
              y={cy - HAUTEUR_CASE / 2}
              width={LARGEUR_CASE}
              height={HAUTEUR_CASE}
              rx={0.06}
              fill={tileId === TILE_VIDE ? "#0f172a" : couleurTuile(tileId, tuile)}
              stroke={choisie ? "#f8fafc" : "#1e293b"}
              strokeWidth={choisie ? 0.06 : 0.02}
              onPointerDown={() => agir(x, z, false)}
              onPointerEnter={() => agir(x, z, true)}
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
          </g>,
        );
      }
    }
    return liste;
  }, [largeur, hauteur, octets, etats, parTileId, selection, agir]);

  /** Ce que le pinceau couvrirait s'il cliquait ici. */
  const apercu = useMemo(
    () =>
      survol && rayonPinceau > 0 && onPeindre
        ? casesDansRayon(survol.x, survol.z, rayonPinceau, largeur, hauteur)
        : [],
    [survol, rayonPinceau, onPeindre, largeur, hauteur],
  );

  const bouton =
    "flex h-7 w-7 items-center justify-center rounded border border-edge text-xs text-slate-300 transition-colors hover:bg-ink hover:text-white disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={bouton}
          onClick={() => changerZoom(1 / PAS_ZOOM)}
          disabled={zoom <= ZOOM_MIN}
          title="Dézoomer"
        >
          −
        </button>
        <span className="w-14 text-center text-[11px] tabular-nums text-slate-500">
          {zoom.toFixed(0)} px
        </span>
        <button
          type="button"
          className={bouton}
          onClick={() => changerZoom(PAS_ZOOM)}
          disabled={zoom >= ZOOM_MAX}
          title="Zoomer"
        >
          +
        </button>
        <button
          type="button"
          className="rounded border border-edge px-2 py-1 text-[11px] text-slate-400 transition-colors hover:bg-ink hover:text-white"
          onClick={ajuster}
          title="Faire tenir tout le plateau dans la largeur"
        >
          Ajuster
        </button>

        <span className="mx-1 h-5 w-px bg-edge" />

        <button
          type="button"
          className={bouton}
          onClick={() => deplacer(-1, 0)}
          disabled={!bords.gauche}
          title="Vers la gauche"
        >
          ←
        </button>
        <button
          type="button"
          className={bouton}
          onClick={() => deplacer(0, -1)}
          disabled={!bords.haut}
          title="Vers le haut"
        >
          ↑
        </button>
        <button
          type="button"
          className={bouton}
          onClick={() => deplacer(0, 1)}
          disabled={!bords.bas}
          title="Vers le bas"
        >
          ↓
        </button>
        <button
          type="button"
          className={bouton}
          onClick={() => deplacer(1, 0)}
          disabled={!bords.droite}
          title="Vers la droite"
        >
          →
        </button>

        {!bords.gauche && !bords.droite && !bords.haut && !bords.bas && (
          <span className="text-[11px] text-slate-600">plateau entier visible</span>
        )}
      </div>

      <div
        ref={fenetre}
        className="overflow-auto rounded border border-edge bg-ink/30"
        style={{ maxHeight: "70vh", cursor: onPeindre ? "crosshair" : "pointer" }}
        onScroll={majBords}
        onPointerLeave={() => setSurvol(null)}
      >
        <svg
          width={boite.w * zoom}
          height={boite.h * zoom}
          viewBox={`${boite.x} ${boite.y} ${boite.w} ${boite.h}`}
          className="block select-none"
          style={{ touchAction: "none" }}
          onPointerDown={() => {
            enTrain.current = true;
          }}
        >
          {cellules}

          {/* L'aperçu du pinceau, en un seul calque : le survol ne touche pas aux cases. */}
          {apercu.length > 0 && (
            <g pointerEvents="none">
              {apercu.map(({ x, z }) => {
                const { cx, cy } = centreCase(x, z);
                return (
                  <rect
                    key={`a${x},${z}`}
                    x={cx - LARGEUR_CASE / 2}
                    y={cy - HAUTEUR_CASE / 2}
                    width={LARGEUR_CASE}
                    height={HAUTEUR_CASE}
                    rx={0.06}
                    fill="#f8fafc"
                    fillOpacity={0.14}
                    stroke="#f8fafc"
                    strokeWidth={0.04}
                    strokeOpacity={0.7}
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
