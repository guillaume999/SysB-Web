import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Aide, { Terme } from "@/components/Aide";
import AmorcageEditeur from "@/components/AmorcageEditeur";
import GrillePlateau, { couleurTuile } from "@/components/GrillePlateau";
import { messageErreur, pb } from "@/lib/pb";
import {
  COLLECTION_PLATEAUX,
  COLLECTION_TEMPLATES,
  TILE_VIDE,
  amorcageDe,
  amorcageNettoye,
  amorcageVide,
  casesDansRayon,
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
  type Amorcage,
  type EtatCase,
  type Plateau,
  type SourcePlateau,
} from "@/lib/plateaux";
import { casesCouvertes, loadTuiles, type Tuile } from "@/lib/tuiles";
import { libelleRessource, loadRessources, type Ressource } from "@/lib/ressources";

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
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Le cadre
  const [nom, setNom] = useState("");
  const [type, setType] = useState<"ground" | "space">("ground");
  const [largeur, setLargeur] = useState(0);
  const [hauteur, setHauteur] = useState(0);
  const [actif, setActif] = useState(false);

  // ⚠️ `templates` seulement. Un plateau de joueur n'a pas d'amorcage : il l'a
  // deja consomme a sa creation. L'editer la n'aurait aucun effet, et laisser le
  // panneau visible ferait croire le contraire.
  const [amorcage, setAmorcage] = useState<Amorcage>(amorcageVide());

  // Le contenu
  const [octets, setOctets] = useState<Uint8Array>(new Uint8Array(0));
  const [etats, setEtats] = useState<EtatCase[]>([]);

  const [pinceau, setPinceau] = useState<number>(TILE_VIDE);
  /** Rayon hexagonal du pinceau : 0 = une case, 1 = sept, 2 = dix-neuf. */
  const [rayonPinceau, setRayonPinceau] = useState(0);
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
      const [p, t, r] = await Promise.all([loadPlateau(collection, id), loadTuiles(), loadRessources()]);
      setPlateau(p);
      setTuiles(t);
      setRessources(r);
      setNom(p.nom ?? "");
      setType(p.typeOfPlateau);
      setLargeur(p.largeur);
      setHauteur(p.hauteur);
      setActif(Boolean(p.actif));
      setAmorcage(amorcageDe(p));
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

  /**
   * Peint le disque du pinceau, centré sur la case visée.
   *
   * Le disque est **hexagonal**, comme les rayons du jeu : un pinceau de rayon 2
   * couvre 19 cases, pas les 25 d'un carré. Peindre autrement donnerait à l'admin
   * une intuition fausse des portées qu'il configure ailleurs.
   */
  const peindre = (x: number, z: number) => {
    const cibles = casesDansRayon(x, z, rayonPinceau, largeur, hauteur);
    let copie: Uint8Array | null = null;
    const changees = new Set<string>();
    for (const c of cibles) {
      const i = index(largeur, c.x, c.z);
      if (octets[i] === pinceau) continue;
      if (!copie) copie = new Uint8Array(octets);
      copie[i] = pinceau;
      changees.add(cleCase(c.x, c.z));
    }
    if (!copie) return;
    setOctets(copie);
    // Repeindre une case change ce qu'elle porte : l'état de l'ancien bâtiment
    // n'a plus de sens et continuerait à produire pour une tuile disparue. Seules
    // les cases réellement changées perdent le leur.
    setEtats((e) => e.filter((s) => !changees.has(cleCase(s.x, s.z))));
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

  /**
   * Ecrit une quantite dans le coffre de la case selectionnee.
   *
   * C'est ce qui permet de **doter un plateau de depart** : sans un stock pose a
   * la main dans le modele, un nouveau joueur n'a rien, donc ne peut rien
   * construire, donc ne produira jamais rien. La copie du modele vers le plateau
   * du joueur conserve ce stock — seuls les horodatages sont remis a l'heure.
   *
   * `quantite <= 0` retire la ligne : un zero qui traine dans le json ne veut
   * rien dire et ferait croire a une ressource geree.
   */
  const majStock = (code: string, quantite: number) => {
    if (!selection || !code) return;
    const actuel = etatSelection?.stock ?? {};
    const stock = { ...actuel };
    if (quantite > 0) stock[code] = Math.floor(quantite);
    else delete stock[code];
    majEtat({ stock });
  };

  /**
   * Seules les ressources de genre `stock` s'entreposent. Un `flux` n'existe
   * qu'en debit et une `population` se mobilise : les proposer ici laisserait
   * saisir une dotation que le jeu ne saurait pas depenser.
   */
  const ressourcesStockables = useMemo(
    () =>
      ressources
        .filter((r) => r.genre === "stock")
        .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0) || a.code.localeCompare(b.code)),
    [ressources],
  );

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
      if (estModele) {
        corps.actif = actif;
        // Les lignes vides sont ecartees a l'envoi : le jeu les ignorerait de
        // toute facon, autant ne pas laisser croire qu'elles agissent.
        corps.amorcage = amorcageNettoye(amorcage);
      }
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

        {estModele && (
          <div className="mt-4 rounded border border-edge p-3">
            <p className="label mb-0">Amorçage — comment une partie démarre ici</p>
            <p className="mt-0.5 mb-3 text-[11px] text-slate-500">
              Ces réglages appartiennent au <strong>modèle</strong>, pas aux tuiles : le même
              entrepôt doit pouvoir être offert sur un plateau de débutant et payant sur un
              plateau difficile, sans créer deux tuiles. C&apos;est pour ça que le champ
              &laquo; Exemplaires offerts &raquo; a quitté le catalogue pour arriver ici.
            </p>
            <AmorcageEditeur
              amorcage={amorcage}
              tuiles={palette}
              ressources={ressources}
              onChange={(a) => {
                setAmorcage(a);
                setModifie(true);
              }}
            />
          </div>
        )}

        <Aide titre="Ce que fait l'éditeur">
          <Terme nom="peindre">
            Choisis une tuile dans la palette et clique, ou glisse pour peindre plusieurs cases.
            La gomme remet la case à vide. Une case n'est sélectionnée qu'au clic : survoler la
            grille ne change plus le panneau de droite.
          </Terme>
          <Terme nom="taille du pinceau">
            1, 7, 19 ou 37 cases — un disque <strong>hexagonal</strong>, exactement ce que couvre
            un rayon dans les règles du jeu. La zone visée s'éclaircit sous le curseur avant que
            tu ne cliques. La gomme suit la même taille.
          </Terme>
          <Terme nom="zoom">
            Les boutons − et + agrandissent les cases sans rien changer au plateau, en gardant le
            centre de la fenêtre au même endroit ; les flèches déplacent la vue.
            &laquo; Ajuster &raquo; ramène le plateau entier dans la largeur.
          </Terme>
          <Terme nom="couleurs">
            La couleur d'une tuile se règle dans son onglet Identité, au{" "}
            <Link to="/tuiles" className="underline">catalogue</Link>. Sans réglage, une teinte
            stable est déduite du tileId.
          </Terme>
          <Terme nom="redimensionner">
            Les cases sont conservées <strong>par coordonnées</strong>, pas par position dans le
            tableau : réduire la largeur perd la colonne de droite, pas tout le plateau. Ce qui
            sort du cadre est perdu, états compris.
          </Terme>
          <Terme nom="amorçage">
            Sur un <strong>modèle</strong> seulement : les ressources de départ et les bâtiments
            offerts. Les ressources atterrissent dans les entrepôts du plateau à sa création ;
            les trois modes de gratuité ne diffèrent que sur ce qui arrive quand le joueur
            détruit un exemplaire offert.
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
            rayonPinceau={rayonPinceau}
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

            {/* Le disque est hexagonal : 1, 7, 19, 37 cases, pas 1, 9, 25, 49. */}
            <div className="mb-2 flex items-center gap-1">
              <span className="mr-1 text-[11px] text-slate-500">Taille</span>
              {[0, 1, 2, 3].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`h-7 min-w-[2rem] rounded border border-edge px-1.5 text-[11px] tabular-nums transition-colors ${
                    rayonPinceau === r
                      ? "bg-accent/20 text-white"
                      : "text-slate-400 hover:bg-ink hover:text-white"
                  }`}
                  onClick={() => setRayonPinceau(r)}
                  title={r === 0 ? "une seule case" : `rayon ${r} — ${casesCouvertes(r) + 1} cases`}
                >
                  {casesCouvertes(r) + 1}
                </button>
              ))}
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
                    style={{ background: couleurTuile(t.tileId, t) }}
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
                    <div className="space-y-1 border-t border-edge pt-2">
                      <p className="label">Coffre de départ</p>

                      {Object.entries(etatSelection?.stock ?? {}).map(([code, q]) => (
                        <div key={code} className="flex items-center gap-2">
                          <span className="flex-1 truncate text-slate-300">
                            {libelleRessource(ressources, code)}
                          </span>
                          <input
                            type="number"
                            min={0}
                            className="input h-8 w-20 py-0"
                            value={q}
                            onChange={(e) => majStock(code, Number(e.target.value))}
                          />
                          <button
                            className="text-slate-500 hover:text-red-400"
                            title="retirer cette ressource du coffre"
                            onClick={() => majStock(code, 0)}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {/*
                        Une liste, jamais une saisie libre : un code invente ici
                        serait ecrit tel quel dans le json et le jeu ne saurait
                        pas quoi en faire.
                      */}
                      <select
                        className="input h-8 w-full py-0"
                        value=""
                        onChange={(e) => majStock(e.target.value, 1)}
                      >
                        <option value="">ajouter une ressource…</option>
                        {ressourcesStockables
                          .filter((r) => !(r.code in (etatSelection?.stock ?? {})))
                          .map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.nom}
                            </option>
                          ))}
                      </select>

                      {ressourcesStockables.length === 0 && (
                        <p className="text-[11px] text-slate-600">
                          Aucune ressource de genre « stock » déclarée.
                        </p>
                      )}
                    </div>

                    {etatSelection && (
                      <button
                        className="text-slate-500 hover:text-red-400"
                        onClick={() => retirerEtat(selection.x, selection.z)}
                      >
                        retirer l'état de cette case
                      </button>
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
