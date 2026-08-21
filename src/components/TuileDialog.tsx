import { useEffect, useMemo, useState } from "react";
import {
  TILE_ID_MAX,
  TILE_ID_MIN,
  prochainTileIdLibre,
  vignetteUrl,
  type Modele,
  type Tuile,
  type TypePlateau,
} from "@/lib/tuiles";

export interface ValeursTuile {
  tileId: number;
  nom: string;
  prefabPath: string;
  typeOfPlateau: TypePlateau;
}

/**
 * Création / modification d'une tuile.
 *
 * Le modèle 3D est imposé (on arrive depuis sa carte) mais reste changeable :
 * repointer une tuile vers un autre modèle est un cas normal, ça ne casse aucun
 * plateau existant puisque c'est le `tileId` qui est écrit dans `tilesBase64`.
 */
export default function TuileDialog({
  modeles,
  tuiles,
  modeleInitial,
  tuile,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  modeles: Modele[];
  tuiles: Tuile[];
  modeleInitial: Modele | null;
  tuile: Tuile | null;
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: ValeursTuile) => void;
}) {
  const enEdition = tuile !== null;

  const [prefabPath, setPrefabPath] = useState(tuile?.prefabPath ?? modeleInitial?.prefabPath ?? "");
  const [nom, setNom] = useState(tuile?.nom ?? modeleInitial?.nom ?? "");
  const [type, setType] = useState<TypePlateau>(
    tuile?.typeOfPlateau ?? (modeleInitial?.typeSuggere || "ground"),
  );
  const [tileId, setTileId] = useState<string>(
    String(tuile?.tileId ?? prochainTileIdLibre(tuiles) ?? TILE_ID_MIN),
  );

  useEffect(() => {
    // Échap ferme la fenêtre — réflexe attendu sur une modale.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const modele = useMemo(
    () => modeles.find((m) => m.prefabPath === prefabPath) ?? null,
    [modeles, prefabPath],
  );

  const idNumerique = Number(tileId);
  const idHorsBornes =
    !Number.isInteger(idNumerique) || idNumerique < TILE_ID_MIN || idNumerique > TILE_ID_MAX;
  const conflit = tuiles.find((t) => t.tileId === idNumerique && t.id !== tuile?.id) ?? null;

  const memeModele = tuiles.filter((t) => t.prefabPath === prefabPath && t.id !== tuile?.id);

  const vignette = modele ? vignetteUrl(modele, "120x120") : null;
  const bloque = saving || idHorsBornes || conflit !== null || nom.trim() === "" || prefabPath === "";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (bloque) return;
    onSubmit({ tileId: idNumerique, nom: nom.trim(), prefabPath, typeOfPlateau: type });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form onSubmit={submit} className="card w-full max-w-xl p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">
          {enEdition ? "Modifier la tuile" : "Nouvelle tuile"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Le nom est libre. Le même modèle 3D peut servir à autant de tuiles que tu veux.
        </p>

        <div className="mt-5 flex gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-edge bg-ink">
            {vignette ? (
              <img src={vignette} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="px-1 text-center text-[10px] leading-tight text-slate-600">
                pas de vignette
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <label className="label" htmlFor="tuile-nom">
                Nom de la tuile
              </label>
              <input
                id="tuile-nom"
                className="input"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ferme du nord"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="tuile-prefab">
                Modèle 3D
              </label>
              <select
                id="tuile-prefab"
                className="input"
                value={prefabPath}
                onChange={(e) => setPrefabPath(e.target.value)}
              >
                {prefabPath === "" && <option value="">— choisir un modèle —</option>}
                {modeles.map((m) => (
                  <option key={m.id} value={m.prefabPath}>
                    {m.nom} ({m.prefabPath})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tuile-type">
              Type de plateau
            </label>
            <select
              id="tuile-type"
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as TypePlateau)}
            >
              <option value="ground">ground</option>
              <option value="space">space</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="tuile-id">
              tileId
            </label>
            <input
              id="tuile-id"
              type="number"
              min={TILE_ID_MIN}
              max={TILE_ID_MAX}
              step={1}
              className="input"
              value={tileId}
              onChange={(e) => setTileId(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              L'octet écrit dans les plateaux. {TILE_ID_MIN}–{TILE_ID_MAX}, unique.
            </p>
          </div>
        </div>

        {conflit && (
          <p className="mt-3 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Le tileId {idNumerique} est déjà pris par « {conflit.nom} ». Deux tuiles avec le même id se
            masquent l'une l'autre dans le jeu.
          </p>
        )}
        {!conflit && idHorsBornes && (
          <p className="mt-3 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            tileId invalide : il faut un entier entre {TILE_ID_MIN} et {TILE_ID_MAX}.
          </p>
        )}

        {memeModele.length > 0 && (
          <p className="mt-3 rounded border border-edge bg-ink/60 p-2 text-xs text-slate-400">
            Ce modèle sert déjà à {memeModele.length} tuile{memeModele.length > 1 ? "s" : ""} :{" "}
            <span className="text-slate-300">
              {memeModele.map((t) => `${t.nom} (#${t.tileId})`).join(", ")}
            </span>
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
            {saving ? "Enregistrement…" : enEdition ? "Enregistrer" : "Créer la tuile"}
          </button>
        </div>
      </form>
    </div>
  );
}
