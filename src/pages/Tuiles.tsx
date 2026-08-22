import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TuileDialog, { type ValeursTuile } from "@/components/TuileDialog";
import { messageErreur, pb } from "@/lib/pb";
import {
  cheminJeu,
  libelle,
  loadModeles3D,
  typeDepuisChemin,
  type Modele3D,
  type TypePlateau,
} from "@/lib/modeles3d";
import { loadTuiles, tuilesParPrefab, type Tuile } from "@/lib/tuiles";

type Filtre = "tous" | TypePlateau;

/** Fenêtre ouverte : soit une création depuis un modèle, soit l'édition d'une tuile. */
type Dialog = { modele: Modele3D | null; tuile: Tuile | null } | null;

export default function Tuiles() {
  const [modeles, setModeles] = useState<Modele3D[]>([]);
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
      const [m, t] = await Promise.all([loadModeles3D(), loadTuiles()]);
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
    () => new Map(modeles.map((m) => [cheminJeu(m), m])),
    [modeles],
  );

  const modelesVisibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return modeles.filter((m) => {
      // Le type d'un modèle n'est plus un champ : il se lit dans le dossier du prefab.
      const type = typeDepuisChemin(m.chemin_prefab ?? "");
      if (filtre !== "tous" && type && type !== filtre) return false;
      if (terme === "") return true;
      return `${libelle(m)} ${cheminJeu(m)}`.toLowerCase().includes(terme);
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
            Une tuile, c'est un modèle déclaré dans <Link to="/3dmodeltuile" className="text-accent hover:underline">3DmodelTuile</Link>{" "}
            plus les règles du jeu qui vont avec. Le même modèle peut servir autant de fois que
            nécessaire — chaque tuile reçoit son propre <code className="text-slate-400">tileId</code>.
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
            Modèles 3DmodelTuile ({modeles.length})
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
            <p className="font-medium text-slate-200">Aucun modèle déclaré.</p>
            <p className="mt-2 max-w-2xl">
              Une tuile a besoin d'un modèle 3D existant. Commence par l'onglet{" "}
              <Link to="/3dmodeltuile" className="text-accent hover:underline">3DmodelTuile</Link>, où tu
              déclares les prefabs du jeu (<code className="text-slate-300">Assets/Resources/Prefabs/Empire/Earth/…</code>),
              puis reviens ici pour en faire des tuiles jouables.
            </p>
          </div>
        )}

        {!chargement && modeles.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modelesVisibles.map((modele) => {
              const usages = parPrefab.get(cheminJeu(modele)) ?? [];
              const type = typeDepuisChemin(modele.chemin_prefab ?? "");
              return (
                <div key={modele.id} className="card flex flex-col overflow-hidden">
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium text-white" title={libelle(modele)}>
                        {libelle(modele)}
                      </p>
                      {type && (
                        <span className="shrink-0 rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                          {type}
                        </span>
                      )}
                    </div>
                    <p className="truncate font-mono text-[11px] text-slate-500" title={cheminJeu(modele)}>
                      {cheminJeu(modele)}
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
                <th className="px-3 py-2 font-medium">nom</th>
                <th className="px-3 py-2 font-medium">modèle</th>
                <th className="w-24 px-3 py-2 font-medium">plateau</th>
                <th className="w-32 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {tuiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    {chargement
                      ? "Chargement…"
                      : "Aucune tuile. Choisis un modèle ci-dessus pour en créer une."}
                  </td>
                </tr>
              )}
              {tuiles.map((tuile) => {
                const modele = modeleParPrefab.get(tuile.prefabPath) ?? null;
                return (
                  <tr key={tuile.id} className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
                    <td className="px-3 py-2 font-mono tabular-nums text-slate-300">{tuile.tileId}</td>
                    <td className="px-3 py-2 text-slate-200">{tuile.nom}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-slate-400">{tuile.prefabPath}</span>
                      {!modele && (
                        <span
                          className="ml-2 rounded border border-amber-900/60 bg-amber-950/40 px-1.5 py-0.5 text-[10px] text-amber-300"
                          title="Ce chemin n'est pas déclaré dans 3DmodelTuile — le jeu affichera une case vide."
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
