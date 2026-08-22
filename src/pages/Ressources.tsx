import { useCallback, useEffect, useState } from "react";
import { messageErreur, pb } from "@/lib/pb";
import {
  COLLECTION_RESSOURCES,
  GENRES,
  loadRessources,
  type GenreRessource,
  type Ressource,
  type ValeursRessource,
} from "@/lib/ressources";

/**
 * Le vocabulaire des ressources du jeu.
 *
 * Une dizaine de records, saisis une fois. Tout le reste du catalogue y fait
 * reference par le `code` : les couts et les productions n'offrent que des listes
 * alimentees par cette table, pour qu'il soit impossible d'ecrire un code que le
 * jeu ne connaitra pas.
 */
export default function Ressources() {
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ ressource: Ressource | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setRessources(await loadRessources());
    } catch (e) {
      setErreur(messageErreur(e, "Chargement des ressources impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const enregistrer = async (valeurs: ValeursRessource) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      if (dialog.ressource)
        await pb.collection(COLLECTION_RESSOURCES).update(dialog.ressource.id, valeurs);
      else await pb.collection(COLLECTION_RESSOURCES).create(valeurs);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refuse."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (ressource: Ressource) => {
    setASupprimer(null);
    try {
      await pb.collection(COLLECTION_RESSOURCES).delete(ressource.id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusee."));
    }
  };

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Ressources</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Le vocabulaire du jeu : une ligne par ressource, saisie une fois. Les couts et les
            productions des tuiles ne proposent que ce qui est declare ici, ce qui evite de se
            retrouver avec <code className="text-slate-400">bois</code>,{" "}
            <code className="text-slate-400">Bois</code> et <code className="text-slate-400">boi</code>{" "}
            dans trois tuiles differentes.
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
              setDialog({ ressource: null });
            }}
          >
            + Nouvelle ressource
          </button>
        </div>
      </header>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {!chargement && ressources.length === 0 ? (
        <div className="card p-5 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Aucune ressource declaree.</p>
          <p className="mt-2 max-w-2xl">
            Commence par les bases : bois, pierre, or, ble, viande, et une entree{" "}
            <code className="text-slate-300">population</code> de genre{" "}
            <code className="text-slate-300">population</code>. Sans elles, l'ecran des tuiles n'aura
            rien a proposer dans les couts et les productions.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="w-16 px-3 py-2 font-medium">ordre</th>
                <th className="px-3 py-2 font-medium">code</th>
                <th className="px-3 py-2 font-medium">nom</th>
                <th className="w-28 px-3 py-2 font-medium">genre</th>
                <th className="px-3 py-2 font-medium">vignette</th>
                <th className="w-40 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {chargement && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              )}
              {!chargement &&
                ressources.map((r) => {
                  const confirme = aSupprimer === r.id;
                  return (
                    <tr key={r.id} className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
                      <td className="px-3 py-2 tabular-nums text-slate-500">{r.ordre || 0}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-200">{r.code}</td>
                      <td className="px-3 py-2 text-slate-300">{r.nom}</td>
                      <td className="px-3 py-2">
                        <span className="rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                          {r.genre || "?"}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                        {r.chemin_icone?.trim() || <span className="text-slate-600">a venir</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {confirme ? (
                          <>
                            <span className="mr-3 text-[11px] text-red-300">
                              Les tuiles qui la citent garderont un code inconnu.
                            </span>
                            <button
                              className="text-xs text-red-300 hover:underline"
                              onClick={() => void supprimer(r)}
                            >
                              Confirmer
                            </button>
                            <button
                              className="ml-3 text-xs text-slate-400 hover:text-white"
                              onClick={() => setASupprimer(null)}
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="text-xs text-accent hover:underline"
                              onClick={() => {
                                setErreurDialog(null);
                                setDialog({ ressource: r });
                              }}
                            >
                              Modifier
                            </button>
                            <button
                              className="ml-3 text-xs text-slate-500 hover:text-red-400"
                              onClick={() => setASupprimer(r.id)}
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
        <RessourceDialog
          ressource={dialog.ressource}
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

/** Formulaire court : il vit dans le meme fichier plutot que d'ouvrir un module pour six champs. */
function RessourceDialog({
  ressource,
  ressources,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  ressource: Ressource | null;
  ressources: Ressource[];
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: ValeursRessource) => void;
}) {
  const enEdition = ressource !== null;
  const [code, setCode] = useState(ressource?.code ?? "");
  const [nom, setNom] = useState(ressource?.nom ?? "");
  const [genre, setGenre] = useState<GenreRessource>(ressource?.genre || "stock");
  const [ordre, setOrdre] = useState<string>(
    String(ressource?.ordre ?? (ressources.length + 1) * 10),
  );
  const [icone, setIcone] = useState(ressource?.chemin_icone ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const codeNet = code.trim().toLowerCase();
  const doublon = ressources.find((r) => r.code === codeNet && r.id !== ressource?.id) ?? null;
  const codeInvalide = codeNet !== "" && !/^[a-z0-9_]+$/.test(codeNet);
  const bloque = saving || codeNet === "" || nom.trim() === "" || doublon !== null || codeInvalide;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (bloque) return;
          onSubmit({
            code: codeNet,
            nom: nom.trim(),
            genre,
            ordre: Number(ordre) || 0,
            chemin_icone: icone.trim(),
          });
        }}
        className="card w-full max-w-lg p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-white">
          {enEdition ? "Modifier la ressource" : "Nouvelle ressource"}
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="res-code">
              code
            </label>
            <input
              id="res-code"
              className="input font-mono text-xs"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ble"
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Ce que le jeu lit. Minuscules, chiffres et underscore.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="res-nom">
              Nom
            </label>
            <input
              id="res-nom"
              className="input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ble"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="res-genre">
              Genre
            </label>
            <select
              id="res-genre"
              className="input"
              value={genre}
              onChange={(e) => setGenre(e.target.value as GenreRessource)}
            >
              {GENRES.map((g) => (
                <option key={g.valeur} value={g.valeur}>
                  {g.libelle}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {GENRES.find((g) => g.valeur === genre)?.aide}
            </p>
          </div>

          <div>
            <label className="label" htmlFor="res-ordre">
              Ordre d'affichage
            </label>
            <input
              id="res-ordre"
              type="number"
              step={1}
              className="input"
              value={ordre}
              onChange={(e) => setOrdre(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="res-icone">
            Chemin de la vignette
          </label>
          <input
            id="res-icone"
            className="input font-mono text-xs"
            value={icone}
            onChange={(e) => setIcone(e.target.value)}
            placeholder="Icones/ble"
          />
          <p className="mt-1 text-xs text-slate-500">
            Chemin sous <code className="text-slate-400">Assets/Resources/</code>, sans extension.
            Laisse vide tant que les icones ne sont pas faites.
          </p>
        </div>

        {doublon && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Le code {codeNet} existe deja ({doublon.nom}).
          </p>
        )}
        {!doublon && codeInvalide && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Code invalide : minuscules, chiffres et underscore uniquement.
          </p>
        )}
        {erreur && (
          <p className="mt-3 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            {erreur}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={bloque}>
            {saving ? "Enregistrement..." : enEdition ? "Enregistrer" : "Creer"}
          </button>
        </div>
      </form>
    </div>
  );
}
