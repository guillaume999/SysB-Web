import { useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import {
  CHAMPS_SECTION,
  DOSSIERS_CONNUS,
  PREFABS_CONNUS,
  RACINE_PREFABS,
  avertissementsDe,
  cheminJeuDe,
  sectionsConnues,
  typeDepuisChemin,
  type ChampSection,
  type Modele3D,
} from "@/lib/modeles3d";

export interface SoumissionModele3D {
  nom_prefab: string;
  chemin_prefab: string;
  section: string;
  section2: string;
  section3: string;
  section4: string;
}

/** Libellés des trois champs de section, dans l'ordre de `CHAMPS_SECTION`. */
const LIBELLES_SECTION: Record<ChampSection, string> = {
  section: "Section",
  section2: "Section 2",
  section3: "Section 3",
  section4: "Section 4",
};

/**
 * Création / modification d'une entrée 3DmodelTuile.
 *
 * Les deux champs décisifs sont `chemin_prefab` et `nom_prefab` : c'est leur
 * concaténation, et elle seule, que le jeu utilise pour retrouver le prefab. Ils
 * sont laissés **libres** (un prefab ajouté dans Unity ne doit pas attendre une
 * mise à jour du site pour être référençable), mais assistés par la liste des
 * prefabs connus et par des avertissements sur les erreurs de saisie classiques.
 */
export default function Modele3DDialog({
  modele,
  modeles,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  modele: Modele3D | null;
  modeles: Modele3D[];
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: SoumissionModele3D) => void;
}) {
  const enEdition = modele !== null;

  const [nomPrefab, setNomPrefab] = useState(modele?.nom_prefab ?? "");
  const [cheminPrefab, setCheminPrefab] = useState(modele?.chemin_prefab ?? "");
  // Les trois sections vivent dans un seul état : elles se comportent à l'identique.
  const [sections, setSections] = useState<Record<ChampSection, string>>({
    section: modele?.section ?? "",
    section2: modele?.section2 ?? "",
    section3: modele?.section3 ?? "",
    section4: modele?.section4 ?? "",
  });

  useEffect(() => {
    // Échap ferme la fenêtre — réflexe attendu sur une modale.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const nom = nomPrefab.trim();
  const chemin = cheminPrefab.trim();
  const type = typeDepuisChemin(chemin);
  const cheminComplet = cheminJeuDe(chemin, nom);

  /**
   * Le dossier suit le prefab choisi tant que l'admin ne l'a pas rempli lui-même :
   * taper « VERT_BLE » dans la liste doit poser son dossier tout seul.
   */
  const [cheminTouche, setCheminTouche] = useState(enEdition);
  useEffect(() => {
    if (cheminTouche || nom === "") return;
    const connu = PREFABS_CONNUS.find((p) => p.nom === nom);
    if (connu) setCheminPrefab(connu.chemin);
  }, [nom, cheminTouche]);

  const doublon = useMemo(
    () =>
      modeles.find(
        (m) => m.nom_prefab === nom && (m.chemin_prefab ?? "").trim() === chemin && m.id !== modele?.id,
      ) ?? null,
    [modeles, nom, chemin, modele?.id],
  );

  const remarques = useMemo(
    () => (nom === "" && chemin === "" ? [] : avertissementsDe(chemin, nom)),
    [chemin, nom],
  );

  const bloque = saving || nom === "" || doublon !== null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (bloque) return;
    onSubmit({
      nom_prefab: nom,
      chemin_prefab: chemin,
      section: sections.section.trim(),
      section2: sections.section2.trim(),
      section3: sections.section3.trim(),
      section4: sections.section4.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form onSubmit={submit} className="card w-full max-w-xl p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">
          {enEdition ? "Modifier le modèle 3D" : "Nouveau modèle 3D"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Une entrée 3DmodelTuile ne fait que désigner un prefab du jeu. Les coûts, productions et
          conditions se posent ensuite, sur les tuiles du catalogue.
        </p>

        <Aide titre="A quoi servent ces champs">
          <Terme nom="nom_prefab">
            Le nom du fichier prefab dans Unity, sans extension. Doit correspondre exactement :
            une faute de frappe ne se voit pas ici, elle se voit en jeu sous forme de case vide.
          </Terme>
          <Terme nom="chemin_prefab">
            Le dossier qui contient ce prefab, compte a partir de Assets/Resources/Prefabs/. Le
            segment &laquo; Prefabs &raquo; n'est pas a retaper.
          </Terme>
          <Terme nom="Resources.Load">
            L'encart gris montre le chemin recompose a partir des deux champs. C'est la seule
            chaine qui compte au moment ou le jeu charge le modele.
          </Terme>
          <Terme nom="sections">
            Quatre libelles de classement libres, tous facultatifs. Ils ne servent qu'a toi : ce
            sont les quatre filtres de la liste. Le jeu les ignore.
          </Terme>
        </Aide>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="m3d-nom-prefab">
                nom_prefab
              </label>
              <input
                id="m3d-nom-prefab"
                className="input font-mono text-xs"
                list="prefabs-connus"
                value={nomPrefab}
                onChange={(e) => setNomPrefab(e.target.value)}
                placeholder="VERT_BLE"
                autoFocus
                required
              />
              <datalist id="prefabs-connus">
                {PREFABS_CONNUS.map((p) => (
                  <option key={`${p.chemin}/${p.nom}`} value={p.nom}>
                    {p.chemin}
                  </option>
                ))}
              </datalist>
              <p className="mt-1 text-xs text-slate-500">Le fichier, sans extension.</p>
            </div>

            <div>
              <label className="label" htmlFor="m3d-chemin-prefab">
                chemin_prefab
              </label>
              <input
                id="m3d-chemin-prefab"
                className="input font-mono text-xs"
                list="dossiers-connus"
                value={cheminPrefab}
                onChange={(e) => {
                  setCheminTouche(true);
                  setCheminPrefab(e.target.value);
                }}
                placeholder="Empire/Earth/Ground"
              />
              <datalist id="dossiers-connus">
                {DOSSIERS_CONNUS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-slate-500">
                Le dossier, à partir de{" "}
                <code className="text-slate-400">Assets/Resources/{RACINE_PREFABS}/</code>.
              </p>
            </div>
          </div>

          {/* Ce que le jeu recevra réellement — la seule chose qui compte au runtime. */}
          <div className="rounded border border-edge bg-ink/60 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Resources.Load
            </p>
            <p className="mt-0.5 break-all font-mono text-xs text-slate-300">
              {cheminComplet || <span className="text-slate-600">—</span>}
              {type && (
                <span className="ml-2 rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                  {type}
                </span>
              )}
            </p>
          </div>

          <div>
            <p className="label mb-2">Sections</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CHAMPS_SECTION.map((champ) => (
                <div key={champ}>
                  <input
                    id={`m3d-${champ}`}
                    className="input"
                    list={`sections-connues-${champ}`}
                    value={sections[champ]}
                    onChange={(e) => setSections((s) => ({ ...s, [champ]: e.target.value }))}
                    placeholder={LIBELLES_SECTION[champ]}
                    aria-label={LIBELLES_SECTION[champ]}
                  />
                  {/* Autocomplétion sur ce qui a déjà été saisi ailleurs, pour limiter les doublons de casse. */}
                  <datalist id={`sections-connues-${champ}`}>
                    {sectionsConnues(modeles, champ).map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Toutes facultatives — quatre libellés de classement libres, à remplir dans l'ordre ou pas.
            </p>
          </div>
        </div>

        {doublon && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Ce prefab est déjà déclaré. Une seule entrée par modèle : c'est le catalogue de tuiles
            qui autorise les réutilisations.
          </p>
        )}

        {!doublon && remarques.length > 0 && (
          <ul className="mt-4 space-y-1 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">
            {remarques.map((r) => (
              <li key={r}>· {r}</li>
            ))}
          </ul>
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
            {saving ? "Enregistrement…" : enEdition ? "Enregistrer" : "Créer le modèle"}
          </button>
        </div>
      </form>
    </div>
  );
}
