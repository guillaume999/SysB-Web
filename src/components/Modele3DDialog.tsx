import { useEffect, useMemo, useState } from "react";
import {
  CHAMPS_SECTION,
  PREFABS_CONNUS,
  RACINE_PREFABS,
  sectionsConnues,
  typeDepuisChemin,
  type ChampSection,
  type Modele3D,
} from "@/lib/modeles3d";

export interface SoumissionModele3D {
  nom_dans_le_jeu: string;
  section: string;
  section2: string;
  section3: string;
}

/** Libellés des trois champs de section, dans l'ordre de `CHAMPS_SECTION`. */
const LIBELLES_SECTION: Record<ChampSection, string> = {
  section: "Section",
  section2: "Section 2",
  section3: "Section 3",
};

/**
 * Création / modification d'une entrée 3DmodelTuile.
 *
 * Le champ décisif est `nom_dans_le_jeu` : c'est lui, et lui seul, que le jeu
 * utilise pour retrouver le prefab. Il est donc laissé **libre** (un prefab
 * ajouté dans Unity ne doit pas attendre une mise à jour du site pour être
 * référençable), mais assisté par la liste des prefabs connus et par des
 * avertissements sur les erreurs de saisie classiques.
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

  const [nomJeu, setNomJeu] = useState(modele?.nom_dans_le_jeu ?? "");
  // Les trois sections vivent dans un seul état : elles se comportent à l'identique.
  const [sections, setSections] = useState<Record<ChampSection, string>>({
    section: modele?.section ?? "",
    section2: modele?.section2 ?? "",
    section3: modele?.section3 ?? "",
  });

  useEffect(() => {
    // Échap ferme la fenêtre — réflexe attendu sur une modale.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const chemin = nomJeu.trim();
  const type = typeDepuisChemin(chemin);

  const doublon = useMemo(
    () => modeles.find((m) => m.nom_dans_le_jeu === chemin && m.id !== modele?.id) ?? null,
    [modeles, chemin, modele?.id],
  );

  const remarques = useMemo(() => {
    const liste: string[] = [];
    if (chemin === "") return liste;
    if (/\.(prefab|fbx|blend)$/i.test(chemin))
      liste.push("Retire l'extension : le jeu charge « Prefabs/…/VERT_BLE », pas « VERT_BLE.prefab ».");
    if (chemin.startsWith("Assets/") || chemin.includes("Resources/"))
      liste.push("Le chemin est relatif au dossier Resources/ : il commence à « Prefabs/ ».");
    if (!type)
      liste.push(`Chemin inhabituel : les prefabs du jeu vivent sous « ${RACINE_PREFABS}/Ground » ou « /Space ».`);
    if (!PREFABS_CONNUS.includes(chemin))
      liste.push("Ce prefab ne fait pas partie de ceux relevés dans le projet — à vérifier dans Unity.");
    return liste;
  }, [chemin, type]);

  const bloque = saving || chemin === "" || doublon !== null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (bloque) return;
    onSubmit({
      nom_dans_le_jeu: chemin,
      section: sections.section.trim(),
      section2: sections.section2.trim(),
      section3: sections.section3.trim(),
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

        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="m3d-nom-jeu">
              nom_dans_le_jeu
            </label>
            <input
              id="m3d-nom-jeu"
              className="input font-mono text-xs"
              list="prefabs-connus"
              value={nomJeu}
              onChange={(e) => setNomJeu(e.target.value)}
              placeholder="Prefabs/Empire/Earth/Ground/VERT_BLE"
              autoFocus
              required
            />
            <datalist id="prefabs-connus">
              {PREFABS_CONNUS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-slate-500">
              Chemin du prefab sous <code className="text-slate-400">Assets/Resources/</code>, sans
              extension. C'est ce que <code className="text-slate-400">Resources.Load</code> reçoit.
              {type && (
                <>
                  {" "}Dossier <span className="uppercase text-slate-400">{type}</span>.
                </>
              )}
            </p>
          </div>

          <div>
            <p className="label mb-2">Sections</p>
            <div className="grid gap-3 sm:grid-cols-3">
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
              Toutes facultatives — trois libellés de classement libres, à remplir dans l'ordre ou pas.
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
