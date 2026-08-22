import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Modele3DDialog, { type SoumissionModele3D } from "@/components/Modele3DDialog";
import { messageErreur, pb } from "@/lib/pb";
import {
  CHAMPS_SECTION,
  COLLECTION_MODELES_3D,
  RACINE_PREFABS,
  avertissements,
  cheminJeu,
  loadModeles3D,
  sectionsConnues,
  typeDepuisChemin,
  type ChampSection,
  type Modele3D,
} from "@/lib/modeles3d";
import { loadTuiles, tuilesParPrefab, type Tuile } from "@/lib/tuiles";

/**
 * Valeur de filtre spéciale : ne garder que les modèles dont cette section est vide.
 * Commence par un espace pour ne jamais entrer en collision avec une valeur saisie,
 * qui est toujours trimée avant enregistrement.
 */
const VIDE = " vide";

/** `""` = pas de filtre sur cette section. */
type Filtres = Record<ChampSection, string>;

const AUCUN_FILTRE: Filtres = { section: "", section2: "", section3: "", section4: "" };

/**
 * Onglet 3DmodelTuile — l'inventaire des modèles 3D du jeu.
 *
 * C'est la première moitié de la chaîne : ici on déclare *qu'un prefab existe*.
 * La seconde moitié, le catalogue de tuiles, ajoute les règles du jeu par-dessus
 * (voir l'onglet Tuiles).
 *
 * Le tri se fait par les quatre sections, chacune avec sa propre liste de valeurs
 * existantes : c'est le classement que l'admin s'est donné, pas une taxonomie imposée.
 */
export default function Modeles3D() {
  const [modeles, setModeles] = useState<Modele3D[]>([]);
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [filtres, setFiltres] = useState<Filtres>(AUCUN_FILTRE);

  const [dialog, setDialog] = useState<{ modele: Modele3D | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  /** Id du modèle dont la suppression attend confirmation, en place dans la ligne. */
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      // Le catalogue n'est pas indispensable à cet écran : s'il échoue, on
      // affiche quand même les modèles plutôt que de tout bloquer.
      const [m, t] = await Promise.all([loadModeles3D(), loadTuiles().catch(() => [] as Tuile[])]);
      setModeles(m);
      setTuiles(t);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement des modèles impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const parPrefab = useMemo(() => tuilesParPrefab(tuiles), [tuiles]);

  /**
   * Options de chaque liste : les valeurs réellement saisies dans *cette* colonne.
   * Calculées sur l'ensemble des modèles, pas sur le résultat filtré — sinon choisir
   * une valeur ferait disparaître les autres et on ne pourrait plus changer d'avis.
   */
  const options = useMemo(() => {
    const par = {} as Record<ChampSection, { valeurs: string[]; vides: number }>;
    for (const champ of CHAMPS_SECTION) {
      par[champ] = {
        valeurs: sectionsConnues(modeles, champ),
        vides: modeles.filter((m) => !m[champ]?.trim()).length,
      };
    }
    return par;
  }, [modeles]);

  const visibles = useMemo(
    () =>
      modeles.filter((m) =>
        CHAMPS_SECTION.every((champ) => {
          const choix = filtres[champ];
          if (choix === "") return true;
          const valeur = m[champ]?.trim() ?? "";
          return choix === VIDE ? valeur === "" : valeur === choix;
        }),
      ),
    [modeles, filtres],
  );

  const filtresActifs = CHAMPS_SECTION.filter((c) => filtres[c] !== "").length;

  const enregistrer = async (valeurs: SoumissionModele3D) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      if (dialog.modele) await pb.collection(COLLECTION_MODELES_3D).update(dialog.modele.id, valeurs);
      else await pb.collection(COLLECTION_MODELES_3D).create(valeurs);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (modele: Modele3D) => {
    setASupprimer(null);
    try {
      await pb.collection(COLLECTION_MODELES_3D).delete(modele.id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusée."));
    }
  };

  /** nom + chemin + type + sections + tuiles + actions */
  const nbColonnes = 5 + CHAMPS_SECTION.length;

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">3DmodelTuile</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Le lien entre les prefabs du jeu et le site. Une entrée = un modèle 3D présent dans{" "}
            <code className="text-slate-400">Assets/Resources/{RACINE_PREFABS}/…</code>, décrit en deux
            morceaux : le nom du fichier et son dossier. Aucune règle de jeu ici : les coûts,
            productions et conditions se posent sur les{" "}
            <Link to="/tuiles" className="text-accent hover:underline">
              tuiles du catalogue
            </Link>
            , qui se créent à partir de ces modèles.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => void charger()}>
            Recharger
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setErreurDialog(null);
              setDialog({ modele: null });
            }}
          >
            + Nouveau modèle
          </button>
        </div>
      </header>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {/* Filtres : une liste par section, alimentée par ce qui a été saisi dans cette colonne. */}
      <div className="card mb-4 p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHAMPS_SECTION.map((champ) => (
            <div key={champ}>
              <label className="label" htmlFor={`filtre-${champ}`}>
                {champ}
              </label>
              <select
                id={`filtre-${champ}`}
                className="input"
                value={filtres[champ]}
                onChange={(e) => setFiltres((f) => ({ ...f, [champ]: e.target.value }))}
              >
                <option value="">Toutes ({modeles.length})</option>
                {options[champ]?.valeurs.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
                {(options[champ]?.vides ?? 0) > 0 && (
                  <option value={VIDE}>non renseignée ({options[champ].vides})</option>
                )}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            {visibles.length} modèle{visibles.length > 1 ? "s" : ""} sur {modeles.length}
          </span>
          {filtresActifs > 0 && (
            <button
              className="text-slate-400 hover:text-white"
              onClick={() => setFiltres(AUCUN_FILTRE)}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {!chargement && modeles.length === 0 ? (
        <div className="card p-5 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Aucun modèle déclaré.</p>
          <p className="mt-2 max-w-2xl">
            Ouvre le projet Unity, regarde ce qu'il y a dans{" "}
            <code className="text-slate-300">Assets/Resources/{RACINE_PREFABS}/Empire/Earth/Ground</code>{" "}
            et <code className="text-slate-300">/Space</code>, et déclare ici un modèle par prefab que tu
            veux rendre utilisable. <code className="text-slate-300">nom_prefab</code> et{" "}
            <code className="text-slate-300">chemin_prefab</code> doivent reprendre le nom et le dossier
            exactement.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2 font-medium">nom_prefab</th>
                <th className="px-3 py-2 font-medium">chemin_prefab</th>
                <th className="w-20 px-3 py-2 font-medium">type</th>
                {CHAMPS_SECTION.map((champ) => (
                  <th key={champ} className="px-3 py-2 font-medium">
                    {champ}
                  </th>
                ))}
                <th className="w-32 px-3 py-2 font-medium">tuiles</th>
                <th className="w-40 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {chargement && (
                <tr>
                  <td colSpan={nbColonnes} className="px-3 py-6 text-center text-slate-500">
                    Chargement…
                  </td>
                </tr>
              )}

              {!chargement && visibles.length === 0 && (
                <tr>
                  <td colSpan={nbColonnes} className="px-3 py-6 text-center text-slate-500">
                    Aucun modèle ne correspond aux filtres.
                  </td>
                </tr>
              )}

              {!chargement &&
                visibles.map((modele) => {
                  const usages = parPrefab.get(cheminJeu(modele)) ?? [];
                  const alertes = avertissements(modele);
                  const type = typeDepuisChemin(modele.chemin_prefab ?? "");
                  const confirme = aSupprimer === modele.id;
                  return (
                    <tr
                      key={modele.id}
                      className="border-b border-edge/60 align-top last:border-0 hover:bg-ink/40"
                    >
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-slate-200">{modele.nom_prefab}</span>
                        {alertes.length > 0 && (
                          <p className="mt-1 text-[10px] leading-tight text-amber-300">{alertes[0]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-slate-400">
                          {modele.chemin_prefab?.trim() || <span className="text-slate-600">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                          {type ?? "?"}
                        </span>
                      </td>
                      {CHAMPS_SECTION.map((champ) => (
                        <td key={champ} className="px-3 py-2 text-slate-300">
                          {modele[champ]?.trim() || <span className="text-slate-600">—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {usages.length === 0 ? "—" : usages.map((t) => t.nom).join(", ")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {confirme ? (
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="text-[11px] leading-tight text-red-300">
                              Supprimer ?
                              {usages.length > 0 &&
                                ` ${usages.length} tuile${usages.length > 1 ? "s" : ""} pointe${
                                  usages.length > 1 ? "nt" : ""
                                } dessus.`}
                            </span>
                            <span>
                              <button
                                className="text-xs text-red-300 hover:underline"
                                onClick={() => void supprimer(modele)}
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
                                setDialog({ modele });
                              }}
                            >
                              Modifier
                            </button>
                            <button
                              className="ml-3 text-xs text-slate-500 hover:text-red-400"
                              onClick={() => setASupprimer(modele.id)}
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
        <Modele3DDialog
          modele={dialog.modele}
          modeles={modeles}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(valeurs) => void enregistrer(valeurs)}
        />
      )}
    </div>
  );
}
