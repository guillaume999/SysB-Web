import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TuileDialog from "@/components/TuileDialog";
import { messageErreur, pb } from "@/lib/pb";
import { cheminJeu, loadModeles3D, type Modele3D } from "@/lib/modeles3d";
import { loadRessources, libelleRessource, type Ressource } from "@/lib/ressources";
import {
  COLLECTION_TUILES,
  couleurDe,
  formatDuree,
  loadTuiles,
  logistiqueDe,
  niveauxDe,
  placementDe,
  tuilesCitant,
  type Tuile,
  type ValeursTuile,
} from "@/lib/tuiles";

/**
 * Le catalogue de jeu : ce que le joueur peut reellement poser.
 *
 * La liste reste volontairement resumee. Le detail (couts, regles, productions)
 * vit dans la fenetre d'edition : une tuile complete represente quatre listes et
 * autant de niveaux, ce qui ne tient pas dans un tableau.
 */
export default function Tuiles() {
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [modeles, setModeles] = useState<Modele3D[]>([]);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ tuile: Tuile | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [t, m, r] = await Promise.all([loadTuiles(), loadModeles3D(), loadRessources()]);
      setTuiles(t);
      setModeles(m);
      setRessources(r);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement du catalogue impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const parId = useMemo(() => new Map(modeles.map((m) => [m.id, m])), [modeles]);

  const enregistrer = async (valeurs: ValeursTuile) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      if (dialog.tuile) await pb.collection(COLLECTION_TUILES).update(dialog.tuile.id, valeurs);
      else await pb.collection(COLLECTION_TUILES).create(valeurs);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refuse."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (tuile: Tuile) => {
    setASupprimer(null);
    try {
      await pb.collection(COLLECTION_TUILES).delete(tuile.id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusee."));
    }
  };

  /** Resume d'une tuile en une ligne : ce qu'elle coute et ce qu'elle rend au niveau 1. */
  const resume = (tuile: Tuile) => {
    const n = niveauxDe(tuile)[0];
    const cout = n.cout
      .map((c) => `${c.quantite} ${libelleRessource(ressources, c.ressource)}`)
      .join(", ");
    const prod = n.production.periodique
      .map(
        (p) => `${p.quantite} ${libelleRessource(ressources, p.ressource)}/${formatDuree(p.periode_s)}`,
      )
      .join(", ");
    return { cout, prod };
  };

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Tuiles</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Une tuile, c'est un modele declare dans{" "}
            <Link to="/3dmodeltuile" className="text-accent hover:underline">
              3DmodelTuile
            </Link>{" "}
            plus les regles du jeu qui vont avec : cout, conditions de deploiement, production par
            niveau, role logistique. Le meme modele peut servir a autant de tuiles que necessaire.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => void charger()}>
            Recharger
          </button>
          <button
            className="btn-primary"
            disabled={modeles.length === 0}
            title={modeles.length === 0 ? "Declare d'abord un modele 3D" : undefined}
            onClick={() => {
              setErreurDialog(null);
              setDialog({ tuile: null });
            }}
          >
            + Nouvelle tuile
          </button>
        </div>
      </header>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {!chargement && ressources.length === 0 && (
        <p className="mb-4 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">
          Aucune ressource declaree :{" "}
          <Link to="/ressources" className="underline">
            commence par l'onglet Ressources
          </Link>
          , sinon les couts et les productions n'auront rien a proposer.
        </p>
      )}

      {!chargement && tuiles.length === 0 ? (
        <div className="card p-5 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Aucune tuile au catalogue.</p>
          <p className="mt-2 max-w-2xl">
            Une tuile a besoin d'un modele 3D existant. Declare-les dans{" "}
            <Link to="/3dmodeltuile" className="text-accent hover:underline">
              3DmodelTuile
            </Link>
            , puis reviens ici pour leur donner un cout, des conditions de pose et une production.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="w-16 px-3 py-2 font-medium">id</th>
                <th className="px-3 py-2 font-medium">nom</th>
                <th className="px-3 py-2 font-medium">modele</th>
                <th className="w-20 px-3 py-2 font-medium">niveaux</th>
                <th className="px-3 py-2 font-medium">cout nv.1</th>
                <th className="px-3 py-2 font-medium">production nv.1</th>
                <th className="w-24 px-3 py-2 font-medium">regles</th>
                <th className="w-40 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {chargement && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              )}
              {!chargement &&
                tuiles.map((tuile) => {
                  const modele = tuile.expand?.modele ?? parId.get(tuile.modele) ?? null;
                  const niveaux = niveauxDe(tuile);
                  const regles = placementDe(tuile);
                  const logistique = logistiqueDe(tuile);
                  const { cout, prod } = resume(tuile);
                  const confirme = aSupprimer === tuile.id;
                  const citants = tuilesCitant(tuiles, tuile.tileId).filter((t) => t.id !== tuile.id);
                  return (
                    <tr
                      key={tuile.id}
                      className="border-b border-edge/60 align-top last:border-0 hover:bg-ink/40"
                    >
                      <td className="px-3 py-2 font-mono tabular-nums text-slate-300">
                        <span className="flex items-center gap-2">
                          {/* La pastille : la meme couleur que dans l'editeur de plateaux. */}
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm border border-edge"
                            style={{ background: couleurDe(tuile) }}
                            title={tuile.couleur ? tuile.couleur : "couleur automatique"}
                          />
                          {tuile.tileId}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={tuile.actif ? "text-slate-200" : "text-slate-500"}>
                          {tuile.nom}
                        </span>
                        {!tuile.actif && (
                          <span className="ml-2 rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                            brouillon
                          </span>
                        )}
                        {logistique && (
                          <span className="ml-2 rounded border border-accent/40 px-1.5 py-0.5 text-[10px] uppercase text-accent">
                            {logistique.role}
                          </span>
                        )}
                        {tuile.categorie && (
                          <p className="text-[11px] text-slate-500">{tuile.categorie}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {modele ? (
                          <span className="font-mono text-[11px] text-slate-400">
                            {cheminJeu(modele)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-300">modele introuvable</span>
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-400">{niveaux.length}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {cout || <span className="text-slate-600">gratuit</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {prod || <span className="text-slate-600">aucune</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {regles.length === 0 ? "libre" : `${regles.length}`}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {confirme ? (
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="text-[11px] leading-tight text-red-300">
                              {citants.length > 0
                                ? `${citants.length} tuile(s) citent l'id ${tuile.tileId} dans leurs regles.`
                                : "Cet id ne sera jamais reattribue."}
                            </span>
                            <span>
                              <button
                                className="text-xs text-red-300 hover:underline"
                                onClick={() => void supprimer(tuile)}
                              >
                                Confirmer
                              </button>
                              <button
                                className="ml-3 text-xs text-slate-400 hover:text-white"
                                onClick={() => setASupprimer(null)}
                              >
                                Annuler
                              </button>
                            </span>
                          </div>
                        ) : (
                          <>
                            <button
                              className="text-xs text-accent hover:underline"
                              onClick={() => {
                                setErreurDialog(null);
                                setDialog({ tuile });
                              }}
                            >
                              Modifier
                            </button>
                            <button
                              className="ml-3 text-xs text-slate-500 hover:text-red-400"
                              onClick={() => setASupprimer(tuile.id)}
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <TuileDialog
          tuile={dialog.tuile}
          tuiles={tuiles}
          modeles={modeles}
          ressources={ressources}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}
