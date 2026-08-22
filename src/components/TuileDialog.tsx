import { useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import TuileLogistique from "@/components/TuileLogistique";
import TuileNiveaux from "@/components/TuileNiveaux";
import TuilePlacement from "@/components/TuilePlacement";
import { cheminJeu, libelle, typeDepuisChemin, type Modele3D } from "@/lib/modeles3d";
import type { Ressource } from "@/lib/ressources";
import {
  TILE_ID_MAX,
  TILE_ID_MIN,
  logistiqueDe,
  niveauVide,
  niveauxDe,
  placementDe,
  prochainTileId,
  type Logistique,
  type Niveau,
  type ReglePlacement,
  type Tuile,
  type TypePlateau,
  type ValeursTuile,
} from "@/lib/tuiles";

type Onglet = "identite" | "placement" | "niveaux" | "logistique";

const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: "identite", libelle: "Identite" },
  { cle: "placement", libelle: "Placement" },
  { cle: "niveaux", libelle: "Niveaux" },
  { cle: "logistique", libelle: "Logistique" },
];

/**
 * Creation / modification d'une tuile du catalogue.
 *
 * Le formulaire est decoupe en onglets : tout afficher d'un coup produirait une
 * modale interminable ou l'on ne trouve plus rien. Les quatre onglets suivent
 * l'ordre dans lequel on remplit reellement une tuile.
 *
 * Aucun champ ne laisse taper une reference : les modeles, les ressources et les
 * tuiles citees se choisissent dans des listes. C'est ce qui remplace la
 * validation que PocketBase ne fait pas sur les champs json.
 */
export default function TuileDialog({
  tuile,
  tuiles,
  modeles,
  ressources,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  tuile: Tuile | null;
  tuiles: Tuile[];
  modeles: Modele3D[];
  ressources: Ressource[];
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: ValeursTuile) => void;
}) {
  const enEdition = tuile !== null;
  const [onglet, setOnglet] = useState<Onglet>("identite");

  const [tileId, setTileId] = useState<string>(
    String(tuile?.tileId ?? prochainTileId(tuiles) ?? TILE_ID_MIN),
  );
  const [nom, setNom] = useState(tuile?.nom ?? "");
  const [modele, setModele] = useState(tuile?.modele ?? "");
  const [type, setType] = useState<TypePlateau>(tuile?.typeOfPlateau ?? "ground");
  const [categorie, setCategorie] = useState(tuile?.categorie ?? "");
  const [description, setDescription] = useState(tuile?.description ?? "");
  const [actif, setActif] = useState(tuile?.actif ?? false);
  const [apresDestruction, setApresDestruction] = useState<string>(
    String(tuile?.tileId_apres_destruction ?? 0),
  );

  const [placement, setPlacement] = useState<ReglePlacement[]>(tuile ? placementDe(tuile) : []);
  const [niveaux, setNiveaux] = useState<Niveau[]>(tuile ? niveauxDe(tuile) : [niveauVide(1)]);
  const [logistique, setLogistique] = useState<Logistique | null>(
    tuile ? logistiqueDe(tuile) : null,
  );

  useEffect(() => {
    // Echap ferme la fenetre : reflexe attendu sur une modale.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const modeleChoisi = useMemo(
    () => modeles.find((m) => m.id === modele) ?? null,
    [modeles, modele],
  );

  /**
   * Le type de plateau suit le dossier du modele tant que l'admin ne l'a pas
   * force : les deux doivent normalement s'accorder, autant eviter la saisie.
   */
  const [typeForce, setTypeForce] = useState(enEdition);
  useEffect(() => {
    if (typeForce || !modeleChoisi) return;
    const devine = typeDepuisChemin(modeleChoisi.chemin_prefab ?? "");
    if (devine) setType(devine);
  }, [modeleChoisi, typeForce]);

  const idNumerique = Number(tileId);
  const idHorsBornes =
    !Number.isInteger(idNumerique) || idNumerique < TILE_ID_MIN || idNumerique > TILE_ID_MAX;
  const conflit = tuiles.find((t) => t.tileId === idNumerique && t.id !== tuile?.id) ?? null;

  const bloque = saving || nom.trim() === "" || modele === "" || idHorsBornes || conflit !== null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (bloque) return;
    onSubmit({
      tileId: idNumerique,
      nom: nom.trim(),
      modele,
      typeOfPlateau: type,
      categorie: categorie.trim(),
      description: description.trim(),
      actif,
      tileId_apres_destruction: Number(apresDestruction) || 0,
      placement,
      // Renumerotation de securite : la position et le champ `niveau` restent d'accord.
      niveaux: niveaux.map((n, i) => ({ ...n, niveau: i + 1 })),
      logistique,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form onSubmit={submit} className="card w-full max-w-3xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">
            {enEdition ? `Modifier ${tuile.nom}` : "Nouvelle tuile"}
          </h2>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
            active, visible par les joueurs
          </label>
        </div>

        <div className="mt-4 flex overflow-hidden rounded-md border border-edge">
          {ONGLETS.map((o) => (
            <button
              key={o.cle}
              type="button"
              onClick={() => setOnglet(o.cle)}
              className={`flex-1 px-3 py-1.5 text-xs transition-colors ${
                onglet === o.cle ? "bg-accent/20 text-white" : "text-slate-400 hover:bg-ink"
              }`}
            >
              {o.libelle}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-[18rem]">
          {onglet === "identite" && (
            <div className="space-y-4">
              <Aide titre="A quoi servent ces champs">
                <Terme nom="tileId">
                  L'octet ecrit dans le plateau du joueur. C'est par ce nombre que le jeu et les
                  regles de placement designent la tuile. Il ne se recycle <strong>jamais</strong> :
                  reattribuer l'id d'une tuile supprimee ferait pointer en silence toutes les regles
                  qui la citaient vers la nouvelle.
                </Terme>
                <Terme nom="modele 3D">
                  Le prefab a instancier, choisi parmi ceux declares dans l'onglet 3DmodelTuile.
                  Plusieurs tuiles peuvent viser le meme modele : c'est ce qui permet d'avoir
                  &laquo; Ferme du nord &raquo; et &laquo; Ferme du sud &raquo; sur la meme
                  apparence.
                </Terme>
                <Terme nom="type de plateau">
                  Sur quel plateau la tuile existe. Il est devine du dossier du modele, tu peux le
                  forcer.
                </Terme>
                <Terme nom="categorie">
                  Le regroupement dans le menu de construction du jeu. Texte libre : les tuiles
                  partageant la meme categorie se retrouvent ensemble.
                </Terme>
                <Terme nom="description">L'infobulle montree au joueur.</Terme>
                <Terme nom="active">
                  Tant que ce n'est pas coche, la tuile est un brouillon : elle existe en base mais
                  n'est pas proposee aux joueurs. Utile pour preparer une tuile en plusieurs fois.
                </Terme>
                <Terme nom="apres destruction">
                  Ce que la case redevient quand le joueur detruit cette tuile.
                  &laquo; case vide &raquo; laisse un trou ; sinon choisis la tuile de repli, en
                  general le sol d'origine. C'est le <strong>type</strong> qui decide : l'instance
                  posee sur le plateau ne memorise rien.
                </Terme>
              </Aide>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="tuile-nom">
                    Nom
                  </label>
                  <input
                    id="tuile-nom"
                    className="input"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Abattoir"
                    autoFocus
                    required
                  />
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
                    L'octet ecrit dans les plateaux. Un id ne se recycle jamais.
                  </p>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="tuile-modele">
                  Modele 3D
                </label>
                <select
                  id="tuile-modele"
                  className="input"
                  value={modele}
                  onChange={(e) => setModele(e.target.value)}
                >
                  <option value="">choisir un modele</option>
                  {modeles.map((m) => (
                    <option key={m.id} value={m.id}>
                      {libelle(m)} ({cheminJeu(m)})
                    </option>
                  ))}
                </select>
                {modeleChoisi && (
                  <p className="mt-1 break-all font-mono text-[11px] text-slate-500">
                    {cheminJeu(modeleChoisi)}
                  </p>
                )}
                {modeles.length === 0 && (
                  <p className="mt-1 text-xs text-amber-300">
                    Aucun modele declare : commence par l'onglet 3DmodelTuile.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="tuile-type">
                    Type de plateau
                  </label>
                  <select
                    id="tuile-type"
                    className="input"
                    value={type}
                    onChange={(e) => {
                      setTypeForce(true);
                      setType(e.target.value as TypePlateau);
                    }}
                  >
                    <option value="ground">ground</option>
                    <option value="space">space</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Deduit du dossier du modele.</p>
                </div>

                <div>
                  <label className="label" htmlFor="tuile-categorie">
                    Categorie
                  </label>
                  <input
                    id="tuile-categorie"
                    className="input"
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    placeholder="Production"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Regroupement dans le menu de construction.
                  </p>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="tuile-destruction">
                  Apres destruction
                </label>
                <select
                  id="tuile-destruction"
                  className="input"
                  value={apresDestruction}
                  onChange={(e) => setApresDestruction(e.target.value)}
                >
                  <option value="0">case vide</option>
                  {tuiles
                    .filter((t) => t.id !== tuile?.id)
                    .map((t) => (
                      <option key={t.id} value={t.tileId}>
                        #{t.tileId} {t.nom}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Ce que la case redevient quand le joueur detruit cette tuile. Une seule couche :
                  c'est le type de tuile qui decide, l'instance ne memorise rien.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="tuile-description">
                  Description
                </label>
                <textarea
                  id="tuile-description"
                  className="input min-h-[4rem]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Transforme les bovins en viande."
                />
              </div>
            </div>
          )}

          {onglet === "placement" && (
            <TuilePlacement
              regles={placement}
              tuiles={tuiles}
              tuileCourante={tuile?.id ?? null}
              onChange={setPlacement}
            />
          )}

          {onglet === "niveaux" && (
            <TuileNiveaux
              niveaux={niveaux}
              ressources={ressources}
              tuiles={tuiles}
              onChange={setNiveaux}
            />
          )}

          {onglet === "logistique" && (
            <TuileLogistique
              logistique={logistique}
              ressources={ressources}
              onChange={setLogistique}
            />
          )}
        </div>

        {conflit && (
          <p className="mt-3 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Le tileId {idNumerique} est deja pris par {conflit.nom}. Deux tuiles avec le meme id se
            masquent l'une l'autre dans le jeu.
          </p>
        )}
        {!conflit && idHorsBornes && (
          <p className="mt-3 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            tileId invalide : il faut un entier entre {TILE_ID_MIN} et {TILE_ID_MAX}.
          </p>
        )}
        {ressources.length === 0 && (
          <p className="mt-3 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">
            Aucune ressource declaree : les couts et productions n'auront rien a proposer. Commence
            par l'onglet Ressources.
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
            {saving ? "Enregistrement..." : enEdition ? "Enregistrer" : "Creer la tuile"}
          </button>
        </div>
      </form>
    </div>
  );
}
