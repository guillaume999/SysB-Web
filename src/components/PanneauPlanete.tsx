// ============================================================
//  PanneauPlanete.tsx
//  LA PLANÈTE D'UN MODÈLE — déplié sous sa ligne, dans l'onglet Modèles.
//
//  Repris de l'ancien onglet Planètes (14/09), fondu dans Modèles le 15/09 :
//
//    1. **l'apparence** de la planète — sa sphère et sa vignette ;
//    2. **ce que l'administrateur lui OUVRE** — quels modèles 3D et quelles
//       icônes un joueur pourra utiliser dessus.
//
//  ⚠️ LE PARTAGE S'ÉDITE PAR LA PLANÈTE, PAS PAR LE MODÈLE 3D : la question
//  est « qu'est-ce que j'ouvre à Aragonia ? ». Les deux modèles de plateau
//  d'une même planète ouvrent donc le MÊME panneau.
//
//  ⚠️⚠️ « OUVERT À TOUTES » N'EST PAS UNE PROPRIÉTÉ DE LA PLANÈTE. La case
//  `toutes_planetes` vit sur le modèle 3D ou sur l'icône : la cocher ici
//  l'ouvre AUSSI à toutes les autres, aujourd'hui et demain.
//
//  ⚠️ CE PANNEAU NE PROTÈGE RIEN. Ce qui refuse une écriture, ce sont les
//  règles d'API PocketBase et le crochet du serveur Go qui juge une tuile.
// ============================================================

import { useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { COLLECTION_MODELES_3D, libelle as libelleModele, type Modele3D } from "@/lib/modeles3d";
import { messageErreur, pb } from "@/lib/pb";
import {
  COLLECTION_ICONES,
  COLLECTION_PLANETES,
  autoriseeSur,
  avecPlanete,
  estPlaneteGame,
  pourquoiRienACreer,
  usageDuModele3D,
  type Icone,
  type Partageable,
  type Planete,
} from "@/lib/planetes";

/** Un modèle 3D tel qu'il arrive : avec ses deux champs de partage. */
export type Modele3DPartage = Modele3D & Partageable & { usage?: string };

export default function PanneauPlanete({
  planete,
  modeles,
  icones,
  onChange,
  onFermer,
}: {
  planete: Planete;
  modeles: Modele3DPartage[];
  icones: Icone[];
  /** Après chaque écriture : l'appelant recharge planètes, modèles 3D et icônes. */
  onChange: () => Promise<void>;
  onFermer: () => void;
}) {
  const [enregistre, setEnregistre] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const modelesDeTuile = useMemo(
    () => modeles.filter((m) => usageDuModele3D(m) === "tuile"),
    [modeles],
  );
  const modelesDePlanete = useMemo(
    () => modeles.filter((m) => usageDuModele3D(m) === "planete"),
    [modeles],
  );
  const iconesDeTuile = useMemo(() => icones.filter((i) => i.usage === "tuile"), [icones]);
  const iconesDePlanete = useMemo(() => icones.filter((i) => i.usage === "planete"), [icones]);

  const blocage = useMemo(
    () => pourquoiRienACreer(planete, modelesDeTuile, iconesDeTuile),
    [planete, modelesDeTuile, iconesDeTuile],
  );

  const ecrire = async (collection: string, id: string, champs: Record<string, unknown>) => {
    setEnregistre(true);
    setErreur(null);
    try {
      await pb.collection(collection).update(id, champs);
      await onChange();
    } catch (e) {
      setErreur(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setEnregistre(false);
    }
  };

  /**
   * ⚠️ On écrit la liste COMPLÈTE recalculée, jamais un « ajoute » partiel :
   * PocketBase remplace le champ, et envoyer la seule nouvelle valeur effacerait
   * les autres planètes déjà ouvertes.
   */
  const basculer = (collection: string, part: Partageable & { id: string }, ouvert: boolean) =>
    ecrire(collection, part.id, { planetes_autorisees: avecPlanete(part, planete.id, ouvert) });

  const basculerToutes = (collection: string, part: Partageable & { id: string }, toutes: boolean) =>
    ecrire(collection, part.id, { toutes_planetes: toutes });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">Planète « {planete.nom} »</p>
        <button className="text-xs text-slate-400 hover:text-white" onClick={onFermer}>
          Fermer
        </button>
      </div>

      {erreur && <p className="text-xs text-red-300">{erreur}</p>}
      {blocage && (
        <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          ⚠️ {blocage}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-300">Modèle 3D (la sphère dans la scène)</span>
          <select
            value={planete.modele3d ?? ""}
            disabled={enregistre}
            onChange={(e) => void ecrire(COLLECTION_PLANETES, planete.id, { modele3d: e.target.value })}
            className="input"
          >
            <option value="">— aucun</option>
            {modelesDePlanete.map((m) => (
              <option key={m.id} value={m.id}>
                {libelleModele(m)}
              </option>
            ))}
          </select>
          {modelesDePlanete.length === 0 && (
            <span className="block text-xs text-slate-500">
              Aucun modèle 3D d'usage « planete ».
            </span>
          )}
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-300">Icône (la vignette de la fiche)</span>
          <select
            value={planete.icone ?? ""}
            disabled={enregistre}
            onChange={(e) => void ecrire(COLLECTION_PLANETES, planete.id, { icone: e.target.value })}
            className="input"
          >
            <option value="">— aucune</option>
            {iconesDePlanete.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nom?.trim() || i.chemin}
              </option>
            ))}
          </select>
          {iconesDePlanete.length === 0 && (
            <span className="block text-xs text-slate-500">
              Aucune icône d'usage « planete » (dossier <code>Icones_Planetes/</code>).
            </span>
          )}
        </label>
      </div>

      <Aide titre="Ce que ce panneau décide">
        <Terme nom="planète game">
          Une planète sans propriétaire. Tout le monde y joue, chacun sa colonie, et{" "}
          <strong>tout lui est ouvert sans rien cocher</strong>.
        </Terme>
        <Terme nom="planète de joueur">
          Créée d'office à l'inscription, à son pseudo. Elle n'a <strong>rien</strong> tant que tu
          n'as pas ouvert : il lui faut un modèle 3D <em>et</em> une icône pour qu'une seule tuile
          puisse exister.
        </Terme>
        <Terme nom="à toutes">
          La case vit sur le modèle 3D, pas sur la planète : la cocher ici l'ouvre à toutes les
          planètes, y compris celles créées plus tard.
        </Terme>
      </Aide>

      <div className="grid gap-4 lg:grid-cols-2">
        <Partage
          titre="Modèles 3D ouverts à cette planète"
          vide="Aucun modèle 3D déclaré."
          collection={COLLECTION_MODELES_3D}
          planete={planete}
          entrees={modelesDeTuile.map((m) => ({ part: m, libelle: libelleModele(m) }))}
          enregistre={enregistre}
          onBasculer={basculer}
          onToutes={basculerToutes}
        />
        <Partage
          titre="Icônes ouvertes à cette planète"
          vide="Aucune icône déclarée — le relevé n'a pas encore tourné."
          collection={COLLECTION_ICONES}
          planete={planete}
          entrees={iconesDeTuile.map((i) => ({ part: i, libelle: i.nom?.trim() || i.chemin }))}
          enregistre={enregistre}
          onBasculer={basculer}
          onToutes={basculerToutes}
        />
      </div>
    </div>
  );
}

/**
 * Le tableau d'ouverture, le même pour les modèles 3D et pour les icônes.
 *
 * ⚠️ Sur une planète **game**, les cases « ouvert ici » sont cochées ET
 * désactivées : tout lui est ouvert par la règle. Une case qu'on décoche sans
 * effet est pire qu'une case grisée.
 */
function Partage({
  titre,
  vide,
  collection,
  planete,
  entrees,
  enregistre,
  onBasculer,
  onToutes,
}: {
  titre: string;
  vide: string;
  collection: string;
  planete: Planete;
  entrees: { part: Partageable & { id: string }; libelle: string }[];
  enregistre: boolean;
  onBasculer: (c: string, p: Partageable & { id: string }, ouvert: boolean) => Promise<void>;
  onToutes: (c: string, p: Partageable & { id: string }, toutes: boolean) => Promise<void>;
}) {
  const [recherche, setRecherche] = useState("");
  const game = estPlaneteGame(planete);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return entrees;
    return entrees.filter((e) => e.libelle.toLowerCase().includes(q));
  }, [entrees, recherche]);

  const ouverts = entrees.filter((e) => autoriseeSur(e.part, planete)).length;

  return (
    <div className="space-y-2 rounded border border-edge p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">
          {titre}{" "}
          <span className="text-xs font-normal text-slate-500">
            {ouverts} / {entrees.length}
          </span>
        </h3>
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher…"
          className="input w-40 py-1 text-xs"
        />
      </div>

      {game && (
        <p className="text-xs text-slate-500">
          « {planete.nom} » est une planète game : <strong>tout lui est ouvert</strong> par la
          règle, sans rien cocher.
        </p>
      )}

      {entrees.length === 0 ? (
        <p className="text-xs text-slate-500">{vide}</p>
      ) : (
        <ul className="max-h-80 divide-y divide-edge overflow-y-auto">
          {visibles.map(({ part, libelle }) => {
            const nomme = (part.planetes_autorisees ?? []).includes(planete.id);
            // ⚠️ Ouvert AUTREMENT qu'en cochant ici — à toutes, ou au joueur
            // propriétaire (onglet Partage, 15/09) : la case est cochée ET
            // grisée, puisque la décocher ne changerait rien.
            const parAilleurs = !nomme && autoriseeSur(part, planete);
            return (
              <li key={part.id} className="flex items-center justify-between gap-3 py-1.5">
                <span className="truncate text-xs text-slate-300">{libelle}</span>
                <span className="flex shrink-0 items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-400">
                    <input
                      type="checkbox"
                      checked={nomme || parAilleurs}
                      disabled={game || enregistre || parAilleurs}
                      onChange={(e) => void onBasculer(collection, part, e.target.checked)}
                    />
                    ouvert ici
                    {parAilleurs && !game && part.toutes_planetes !== true && (
                      <span className="text-slate-600">(par son joueur)</span>
                    )}
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-500">
                    <input
                      type="checkbox"
                      checked={part.toutes_planetes === true}
                      disabled={enregistre}
                      onChange={(e) => void onToutes(collection, part, e.target.checked)}
                    />
                    à toutes
                  </label>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
