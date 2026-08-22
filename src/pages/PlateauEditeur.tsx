import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Aide, { Terme } from "@/components/Aide";
import GrillePlateau, { couleurTuile } from "@/components/GrillePlateau";
import { messageErreur, pb } from "@/lib/pb";
import {
  COLLECTION_PLATEAUX,
  COLLECTION_TEMPLATES,
  TILE_VIDE,
  cleCase,
  decoderTiles,
  encoderTiles,
  etatVide,
  etatsDe,
  index,
  indexerEtats,
  libelleProprietaire,
  loadPlateau,
  nettoyerEtats,
  redimensionner,
  type EtatCase,
  type Plateau,
  type SourcePlateau,
} from "@/lib/plateaux";
import { loadTuiles, type Tuile } from "@/lib/tuiles";

/** Au-delà, le SVG commence à ramer, et le plateau devient difficile à jouer sur mobile. */
const SEUIL_LENT = 2500;

/**
 * Au-delà, on ne dessine plus tout seul : un élément SVG par case, à ce
 * nombre-là, fige l'onglet plusieurs secondes. Le cadre reste modifiable, et un
 * bouton permet d'afficher quand même en connaissance de cause.
 */
const SEUIL_LOURD = 8000;

/**
 * Éditeur d'un plateau : le cadre, la grille, et les états.
 *
 * Il vit sur sa propre page plutôt que dans une modale : on y passe du temps,
 * on veut de la place, et une URL partageable vaut mieux qu'un état de fenêtre.
 *
 * Le plateau est chargé une fois puis édité **en mémoire** — la grille se
 * repeint des dizaines de fois par seconde sous le pinceau, il n'est pas
 * question d'écrire en base à chaque case. La sauvegarde est explicite, et un
 * indicateur dit ce qui n'est pas encore enregistré.
 */
export default function PlateauEditeur({ source }: { source: SourcePlateau }) {
  const { id } = useParams<{ id: string }>();
  const collection = source;
  const estModele = collection === COLLECTION_TEMPLATES;
  const retour = estModele ? "/modeles" : "/plateaux";

  const [plateau, setPlateau] = useState<Plateau | null>(null);
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Le cadre
  const [nom, setNom] = useState("");
  const [type, setType] = useState<"ground" | "space">("ground");
  const [largeur, setLargeur] = useState(0);
  const [hauteur, setHauteur] = useState(0);
  const [actif, setActif] = useState(false);

  // Le contenu
  const [octets, setOctets] = useState<Uint8Array>(new Uint8Array(0));
  const [etats, setEtats] = useState<EtatCase[]>([]);

  const [pinceau, setPinceau] = useState<number>(TILE_VIDE);
  const [mode, setMode] = useState<"peindre" | "inspecter">("peindre");
  const [selection, setSelection] = useState<{ x: number; z: number } | null>(null);

  /** L'admin a demandé le rendu d'une grille au-delà du seuil lourd. */
  const [forcerRendu, setForcerRendu] = useState(false);
  const [modifie, setModifie] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const chargeInitial = useRef(true);

  const charger = useCallback(async () => {
    if (!id) return;
    setChargement(true);
    setErreur(null);
    try {
      const [p, t] = await Promise.all([loadPlateau(collection, id), loadTuiles()]);
      setPlateau(p);
      setTuiles(t);
      setNom(p.nom ?? "");
      setType(p.typeOfPlateau);
      setLargeur(p.largeur);
      setHauteur(p.hauteur);
      setActif(Boolean(p.actif));
      setOctets(decoderTiles(p));
      setEtats(etatsDe(p));
      setModifie(false);
      chargeInitial.current = true;
    } catch (e) {
      setErreur(messageErreur(e, "Chargement du plateau impossible."));
    } finally {
      setChargement(false);
    }
  }, [collection, id]);

  useEffect(() => {
    void charger();
  }, [charger]);

  // Les tuiles proposées suivent le type du plateau : peindre une tuile `space`
  // sur un plateau `ground` donnerait un prefab qui n'a rien à faire là.
  const palette = useMemo(
    () => tuiles.filter((t) => t.typeOfPlateau === type).sort((a, b) => a.tileId - b.tileId),
    [tuiles, type],
  );

  const etatsIndex = useMemo(() => indexerEtats(etats), [etats]);

  /** Redimensionne en conservant les coordonnées, pas l'ordre des octets. */
  const appliquerTaille = (l: number, h: number) => {
    if (!(l >= 1 && h >= 1 && l <= 200 && h <= 200)) return;
    const nouveaux = redimensionner(octets, { largeur, hauteur }, { largeur: l, hauteur: h });
    setOctets(nouveaux);
    setEtats((e) => nettoyerEtats(e, nouveaux, l, h));
    setLargeur(l);
    setHauteur(h);
    setModifie(true);
  };

  const peindre = (x: number, z: number) => {
    const i = index(largeur, x, z);
    if (octets[i] === pinceau) return;
    const copie = new Uint8Array(octets);
    copie[i] = pinceau;
    setOctets(copie);
    // Repeindre une case change ce qu'elle porte : l'état de l'ancien bâtiment
    // n'a plus de sens et continuerait à produire pour une tuile disparue.
    setEtats((e) => e.filter((s) => !(s.x === x && s.z === z)));
    setModifie(true);
  };

  const etatSelection = selection ? etatsIndex.get(cleCase(selection.x, selection.z)) : undefined;
  const tuileSelection = selection
    ? tuiles.find((t) => t.tileId === octets[index(largeur, selection.x, selection.z)])
    : undefined;

  const majEtat = (patch: Partial<EtatCase>) => {
    if (!selection) return;
    setEtats((e) => {
      const existe = e.some((s) => s.x === selection.x && s.z === selection.z);
      if (!existe) return [...e, { ...etatVide(selection.x, selection.z), ...patch }];
      return e.map((s) =>
        s.x === selection.x && s.z === selection.z ? { ...s, ...patch } : s,
      );
    });
    setModifie(true);
  };

  const retirerEtat = (x: number, z: number) => {
    setEtats((e) => e.filter((s) => !(s.x === x && s.z === z)));
    setModifie(true);
  };

  const enregistrer = async () => {
    if (!plateau) return;
    setSaving(true);
    setErreur(null);
    setMessage(null);
    try {
      const propres = nettoyerEtats(etats, octets, largeur, hauteur);
      const corps: Record<string, unknown> = {
        nom: nom.trim(),
        typeOfPlateau: type,
        largeur,
        hauteur,
        tilesBase64: encoderTiles(octets),
        etats: propres,
      };
      if (estModele) corps.actif = actif;
      await pb.collection(collection).update(plateau.id, corps);
      setEtats(propres);
      setModifie(false);
      setMessage(
        propres.length === etats.length
          ? "Enregistré."
          : `Enregistré. ${etats.length - propres.length} état(s) orphelin(s) écarté(s).`,
      );
    } catch (e) {
      setErreur(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setSaving(false);
    }
  };

  if (chargement) return <p className="text-sm text-slate-500">Chargement…</p>;
  if (!plateau)
    return (
      <div>
        <p className="rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur ?? "Plateau introuvable."}
        </p>
        <Link
          to={source === COLLECTION_TEMPLATES ? "/modeles" : "/plateaux"}
          className="mt-3 inline-block text-sm text-accent hover:underline"
        >
          Retour à la liste
        </Link>
      </div>
    );

  const cases = largeur * hauteur;
  const occupees = octets.reduce((n, o) => (o !== TILE_VIDE ? n + 1 : n), 0);

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={retour} className="text-xs text-slate-500 hover:text-white">
            ← {estModele ? "Modèles" : "Plateaux des joueurs"}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-white">
            {nom || "(sans nom)"}
            <span className="ml-2 text-sm font-normal text-slate-500">
              {estModele ? "modèle" : `plateau de ${libelleProprietaire(plateau)}`}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {modifie && <span className="text-xs text-amber-300">non enregistré</span>}
          {message && !modifie && <span className="text-xs text-slate-500">{message}</span>}
          <button className="btn-ghost" onClick={() => void charger()} disabled={saving}>
            Recharger
          </button>
          <button className="btn-primary" onClick={() => void enregistrer()} disabled={saving || !modifie}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </header>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {/* ── Le cadre ──────────────────────────────────────────────────────── */}
      <div className="card mb-4 p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="label" htmlFor="ed-nom">
              Nom
            </label>
            <input
              id="ed-nom"
              className="input"
              value={nom}
              onChange={(e) => {
                setNom(e.target.value);
                setModifie(true);
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="ed-type">
              Type
            </label>
            <select
              id="ed-type"
              className="input"
              value={type}
              onChange={(e) => {
                setType(e.target.value as "ground" | "space");
                setModifie(true);
              }}
            >
              <option value="ground">ground</option>
              <option value="space">space</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ed-l">
              Largeur
            </label>
            <input
              id="ed-l"
              type="number"
              min={1}
              max={200}
              className="input"
              value={largeur}
              onChange={(e) => appliquerTaille(Number(e.target.value), hauteur)}
            />
          </div>
          <div>
            <label className="label" htmlFor="ed-h">
              Hauteur
            </label>
            <input
              id="ed-h"
              type="number"
              min={1}
              max={200}
              className="input"
              value={hauteur}
              onChange={(e) => appliquerTaille(largeur, Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>
            {occupees} case{occupees > 1 ? "s" : ""} occupée{occupees > 1 ? "s" : ""} sur {cases} ·{" "}
            {etats.length} état{etats.length > 1 ? "s" : ""}
          </span>
          {estModele && (
            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={actif}
                onChange={(e) => {
                  setActif(e.target.checked);
                  setModifie(true);
                }}
              />
              modèle actif
            </label>
          )}
        </div>

        <Aide titre="Ce que fait l'éditeur">
          <Terme nom="peindre">
            Choisis une tuile dans la palette et clique, ou glisse pour peindre plusieurs cases.
            La gomme remet la case à vide.
          </Terme>
          <Terme nom="redimensionner">
            Les cases sont conservées <strong>par coordonnées</strong>, pas par position dans le
            tableau : réduire la largeur perd la colonne de droite, pas tout le plateau. Ce qui
            sort du cadre est perdu, états compris.
          </Terme>
          <Terme nom="états">
            Le point blanc marque une case qui retient quelque chose — un niveau, un stock, un
            bâtiment éteint. Repeindre une case efface son état : la tuile a changé, l'ancien état
            produirait pour un bâtiment disparu.
          </Terme>
          <Terme nom="quinconce">
            Les cases sont dessinées en carrés décalés d'une rangée à l'autre : c'est le repère
            réel du jeu, en plus lisible qu'un pavage hexagonal. Les <strong>distances</strong>,
            elles, restent hexagonales — un rayon de 2 couvre 18 cases, pas 24.
          </Terme>
          <Terme nom="palette">
            Seules les tuiles du même type de plateau sont proposées. Une tuile `space` sur un
            plateau `ground` instancierait un prefab qui n'a rien à faire là.
          </Terme>
          <p className="text-slate-500">
            Rien n'est écrit en base avant « Enregistrer ». La grille se repeint des dizaines de
            fois par seconde sous le pinceau : elle vit en mémoire jusque-là.
          </p>
        </Aide>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        {/* ── La grille ───────────────────────────────────────────────────── */}
        <div className="card overflow-hidden p-3">
          {cases > SEUIL_LOURD && !forcerRendu ? (
            <div className="p-4 text-sm text-slate-400">
              <p className="font-medium text-slate-200">
                {cases.toLocaleString("fr-FR")} cases — grille non affichée.
              </p>
              <p className="mt-2 max-w-xl">
                Une case = un élément dessiné : à ce nombre-là, l'affichage fige l'onglet plusieurs
                secondes à chaque coup de pinceau. Le cadre reste modifiable au-dessus — réduis la
                taille, ou affiche quand même si tu sais ce que tu fais.
              </p>
              <button className="btn-ghost mt-3" onClick={() => setForcerRendu(true)}>
                Afficher quand même
              </button>
            </div>
          ) : (
            <>
          {cases > SEUIL_LENT && (
            <p className="mb-2 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">
              {cases} cases : l'affichage peut devenir lent, et un plateau de cette taille est déjà
              difficile à jouer sur mobile.
            </p>
          )}
          {palette.length === 0 && (
            <p className="mb-2 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">
              Aucune tuile <code>{type}</code> au catalogue : il n'y a rien à peindre. Crée d'abord
              des <Link to="/tuiles" className="underline">tuiles</Link> de ce type.
            </p>
          )}
          <GrillePlateau
            largeur={largeur}
            hauteur={hauteur}
            octets={octets}
            etats={etatsIndex}
            tuiles={tuiles}
            selection={selection}
            onPeindre={mode === "peindre" ? peindre : null}
            onSelectionner={(x, z) => setSelection({ x, z })}
          />
            </>
          )}
        </div>

        {/* ── Palette et case sélectionnée ────────────────────────────────── */}
        <div className="space-y-4">
          <div className="card p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="label mb-0">Pinceau</p>
              <button
                className="text-xs text-slate-400 hover:text-white"
                onClick={() => setMode(mode === "peindre" ? "inspecter" : "peindre")}
              >
                {mode === "peindre" ? "passer en inspection" : "passer en peinture"}
              </button>
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              <button
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs ${
                  pinceau === TILE_VIDE ? "bg-accent/20 text-white" : "text-slate-400 hover:bg-ink"
                }`}
                onClick={() => setPinceau(TILE_VIDE)}
              >
                <span className="h-4 w-4 shrink-0 rounded border border-edge bg-ink" />
                gomme (vide)
              </button>
              {palette.map((t) => (
                <button
                  key={t.id}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs ${
                    pinceau === t.tileId ? "bg-accent/20 text-white" : "text-slate-400 hover:bg-ink"
                  }`}
                  onClick={() => setPinceau(t.tileId)}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded"
                    style={{ background: couleurTuile(t.tileId) }}
                  />
                  <span className="truncate">
                    #{t.tileId} {t.nom}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-3">
            <p className="label">Case sélectionnée</p>
            {!selection ? (
              <p className="text-xs text-slate-600">clique une case</p>
            ) : (
              <div className="space-y-2 text-xs text-slate-400">
                <p>
                  ({selection.x}, {selection.z}) —{" "}
                  {tuileSelection ? (
                    <span className="text-slate-200">
                      #{tuileSelection.tileId} {tuileSelection.nom}
                    </span>
                  ) : (
                    <span className="text-slate-600">vide</span>
                  )}
                </p>

                {tuileSelection && (
                  <>
                    <label className="flex items-center gap-2">
                      niveau
                      <input
                        type="number"
                        min={1}
                        className="input h-8 w-16 py-0"
                        value={etatSelection?.niveau ?? 1}
                        onChange={(e) => majEtat({ niveau: Number(e.target.value) })}
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={etatSelection?.actif ?? true}
                        onChange={(e) => majEtat({ actif: e.target.checked })}
                      />
                      bâtiment actif
                    </label>
                    {etatSelection && (
                      <>
                        {Object.keys(etatSelection.stock).length > 0 && (
                          <p className="text-slate-500">
                            stock :{" "}
                            {Object.entries(etatSelection.stock)
                              .map(([r, q]) => `${q} ${r}`)
                              .join(", ")}
                          </p>
                        )}
                        <button
                          className="text-slate-500 hover:text-red-400"
                          onClick={() => retirerEtat(selection.x, selection.z)}
                        >
                          retirer l'état de cette case
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {etats.length > 0 && (
            <div className="card p-3">
              <p className="label">Cases avec un état ({etats.length})</p>
              <div className="max-h-48 space-y-1 overflow-y-auto pr-1 text-xs">
                {etats.map((e) => (
                  <button
                    key={cleCase(e.x, e.z)}
                    className="block w-full truncate rounded px-2 py-1 text-left text-slate-400 hover:bg-ink hover:text-white"
                    onClick={() => setSelection({ x: e.x, z: e.z })}
                  >
                    ({e.x}, {e.z}) niveau {e.niveau}
                    {e.actif ? "" : " · éteint"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
