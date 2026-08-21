import { useCallback, useEffect, useMemo, useState } from "react";
import TuileDialog, { type ValeursTuile } from "@/components/TuileDialog";
import { pb } from "@/lib/pb";
import {
  loadModeles,
  loadTuiles,
  messageErreur,
  tuilesParPrefab,
  vignetteUrl,
  type Modele,
  type Tuile,
  type TypePlateau,
} from "@/lib/tuiles";

type Filtre = "tous" | TypePlateau;

/** Fenêtre ouverte : soit une création depuis un modèle, soit l'édition d'une tuile. */
type Dialog = { modele: Modele | null; tuile: Tuile | null } | null;

export default function Tuiles() {
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [recherche, setRecherche] = useState("");

  const [dialog, setDialog] = useState<Dialog>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [m, t] = await Promise.all([loadModeles(), loadTuiles()]);
      setModeles(m);
      setTuiles(t);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement du catalogue impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const parPrefab = useMemo(() => tuilesParPrefab(tuiles), [tuiles]);
  const modeleParPrefab = useMemo(
    () => new Map(modeles.map((m) => [m.prefabPath, m])),
    [modeles],
  );

  const modelesVisibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return modeles.filter((m) => {
      if (filtre !== "tous" && m.typeSuggere && m.typeSuggere !== filtre) return false;
      if (terme === "") return true;
      return `${m.nom} ${m.prefabPath}`.toLowerCase().includes(terme);
    });
  }, [modeles, filtre, recherche]);

  const enregistrer = async (valeurs: ValeursTuile) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      if (dialog.tuile) await pb.collection("tuiles").update(dialog.tuile.id, valeurs);
      else await pb.collection("tuiles").create(valeurs);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (tuile: Tuile) => {
    const utilisee = `Supprimer « ${tuile.nom} » (#${tuile.tileId}) ?\n\nLes plateaux qui utilisent cet id afficheront des cases vides.`;
    if (!window.confirm(utilisee)) return;
    try {
      await pb.collection("tuiles").delete(tuile.id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusée."));
    }
  };

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Tuiles</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Une tuile, c'est un modèle 3D du jeu plus un nom à toi. Le même modèle peut servir
            autant de fois que nécessaire — chaque tuile reçoit son propre <code className="text-slate-400">tileId</code>.
          </p>
        </div>
        <button className="btn-ghost" onClick={() => void charger()}>
          Recharger
        </button>
      </header>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {/* ─── Modèles disponibles ─────────────────────────────────────────── */}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Modèles 3D du build ({modeles.length})
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-edge">
              {(["tous", "ground", "space"] as Filtre[]).map((valeur) => (
                <button
                  key={valeur}
                  onClick={() => setFiltre(valeur)}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    filtre === valeur ? "bg-accent/20 text-white" : "text-slate-400 hover:bg-ink"
                  }`}
                >
                  {valeur}
                </button>
              ))}
            </div>
            <input
              className="input w-44"
              placeholder="Filtrer…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
        </div>

        {chargement && <p className="text-sm text-slate-500">Chargement du catalogue…</p>}

        {!chargement && modeles.length === 0 && (
          <div className="card p-5 text-sm text-slate-400">
            <p className="font-medium text-slate-200">Aucun modèle publié.</p>
            <p className="mt-2 max-w-2xl">
              Les modèles viennent d'Unity, pas d'ici : seuls les prefabs présents dans{" "}
              <code className="text-slate-300">Assets/Resources/Tile/</code> sont chargeables par le jeu au
              runtime. Ouvre le projet Unity, puis{" "}
              <strong className="text-slate-200">SySB → Exporter les modèles vers PocketBase</strong> :
              le script crée les prefabs manquants, rend une vignette et remplit cette liste.
            </p>
          </div>
        )}

        {!chargement && modeles.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modelesVisibles.map((modele) => {
              const usages = parPrefab.get(modele.prefabPath) ?? [];
              const vignette = vignetteUrl(modele, "120x120");
              return (
                <div key={modele.id} className="card flex flex-col overflow-hidden">
                  <div className="flex h-28 items-center justify-center border-b border-edge bg-ink">
                    {vignette ? (
                      <img src={vignette} alt="" className="h-full w-full object-contain p-2" />
                    ) : (
                      <span className="text-xs text-slate-600">pas de vignette</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium text-white" title={modele.nom}>
                        {modele.nom}
                      </p>
                      {modele.typeSuggere && (
                        <span className="shrink-0 rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                          {modele.typeSuggere}
                        </span>
                      )}
                    </div>
                    <p className="truncate font-mono text-[11px] text-slate-500" title={modele.prefabPath}>
                      {modele.prefabPath}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {usages.length === 0
                        ? "aucune tuile"
                        : `${usages.length} tuile${usages.length > 1 ? "s" : ""} : ${usages
                            .map((t) => t.nom)
                            .join(", ")}`}
                    </p>
                    <button
                      className="btn-ghost mt-auto w-full"
                      onClick={() => {
                        setErreurDialog(null);
                        setDialog({ modele, tuile: null });
                      }}
                    >
                      + Créer une tuile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Catalogue de tuiles ─────────────────────────────────────────── */}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Catalogue de tuiles ({tuiles.length})
        </h2>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="w-16 px-3 py-2 font-medium">id</th>
                <th className="w-14 px-3 py-2 font-medium" />
                <th className="px-3 py-2 font-medium">nom</th>
                <th className="px-3 py-2 font-medium">modèle</th>
                <th className="w-24 px-3 py-2 font-medium">plateau</th>
                <th className="w-32 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {tuiles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    {chargement
                      ? "Chargement…"
                      : "Aucune tuile. Choisis un modèle ci-dessus pour en créer une."}
                  </td>
                </tr>
              )}
              {tuiles.map((tuile) => {
                const modele = modeleParPrefab.get(tuile.prefabPath) ?? null;
                const vignette = modele ? vignetteUrl(modele, "120x120") : null;
                return (
                  <tr key={tuile.id} className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
                    <td className="px-3 py-2 font-mono tabular-nums text-slate-300">{tuile.tileId}</td>
                    <td className="px-3 py-2">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded border border-edge bg-ink">
                        {vignette ? (
                          <img src={vignette} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-200">{tuile.nom}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-slate-400">{tuile.prefabPath}</span>
                      {!modele && (
                        <span
                          className="ml-2 rounded border border-amber-900/60 bg-amber-950/40 px-1.5 py-0.5 text-[10px] text-amber-300"
                          title="Ce chemin n'existe pas dans la liste des modèles publiés — le jeu affichera une case vide."
                        >
                          introuvable
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{tuile.typeOfPlateau}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="text-xs text-accent hover:underline"
                        onClick={() => {
                          setErreurDialog(null);
                          setDialog({ modele, tuile });
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        className="ml-3 text-xs text-slate-500 hover:text-red-400"
                        onClick={() => void supprimer(tuile)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {dialog && (
        <TuileDialog
          modeles={modeles}
          tuiles={tuiles}
          modeleInitial={dialog.modele}
          tuile={dialog.tuile}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(valeurs) => void enregistrer(valeurs)}
        />
      )}
    </div>
  );
}
