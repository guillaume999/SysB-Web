// ============================================================
//  Planetes.tsx
//  L'onglet PLANÈTES — 2026-09-14.
//
//  Une planète, c'est ce que `typeOfPlateau2` n'était pas encore : un objet
//  avec un nom, un propriétaire et une apparence. Cet écran fait deux choses,
//  et elles vont ensemble :
//
//    1. **la planète elle-même** — la créer, la renommer, lui donner sa sphère
//       et sa vignette ;
//    2. **ce que l'administrateur lui OUVRE** — quels modèles 3D et quelles
//       icônes un joueur pourra utiliser dessus.
//
//  ⚠️ LE PARTAGE S'ÉDITE PAR LA PLANÈTE, PAS PAR LE MODÈLE. La relation est la
//  même dans les deux sens (`tuile3dmodel.planetes_autorisees`), mais la
//  question que se pose l'administrateur est « qu'est-ce que j'ouvre à
//  Aragonia ? », pas « à qui j'ouvre ce cube ? ». Ouvrir par le modèle
//  demanderait 140 allers-retours pour équiper une planète.
//
//  ⚠️⚠️ « OUVERT À TOUTES » N'EST PAS UNE PROPRIÉTÉ DE LA PLANÈTE. La case
//  `toutes_planetes` vit sur le modèle 3D ou sur l'icône : la cocher depuis
//  l'écran d'Aragonia l'ouvre AUSSI à toutes les autres, aujourd'hui et
//  demain. L'écran le dit à côté de la case — c'est le seul endroit où une
//  action déborde de la planète qu'on regarde.
//
//  ⚠️ CET ÉCRAN NE PROTÈGE RIEN. Ce qui refuse une écriture, ce sont les règles
//  d'API PocketBase et le crochet du serveur Go qui juge une tuile. Ici on
//  n'évite qu'un 403 incompréhensible.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { messageErreur, pb } from "@/lib/pb";
import { loadJoueurs, type Joueur } from "@/lib/joueurs";
import { loadModeles3D, libelle as libelleModele, type Modele3D } from "@/lib/modeles3d";
import {
  COLLECTION_ICONES,
  COLLECTION_PLANETES,
  autoriseeSur,
  avecPlanete,
  estGame,
  estPlaneteGame,
  loadIcones,
  loadPlanetes,
  pourquoiRienACreer,
  triAdmin,
  usageDuModele3D,
  type Icone,
  type Partageable,
  type Planete,
} from "@/lib/planetes";
import { COLLECTION_MODELES_3D } from "@/lib/modeles3d";

/** Un modèle 3D tel qu'il arrive maintenant : avec ses deux champs de partage. */
type Modele3DPartage = Modele3D & Partageable & { usage?: string };

export default function Planetes() {
  const [planetes, setPlanetes] = useState<Planete[]>([]);
  const [modeles, setModeles] = useState<Modele3DPartage[]>([]);
  const [icones, setIcones] = useState<Icone[]>([]);
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [choisie, setChoisie] = useState<string>("");
  const [nomNeuf, setNomNeuf] = useState("");
  const [proprietaireNeuf, setProprietaireNeuf] = useState("");
  const [enregistre, setEnregistre] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      // ⚠️ Les joueurs ne sont pas indispensables à cet écran : s'ils échouent,
      //    on affiche quand même les planètes plutôt que de tout bloquer. On
      //    perd alors le pseudo du propriétaire, pas la planète.
      const [p, m, i, j] = await Promise.all([
        loadPlanetes(),
        loadModeles3D() as Promise<Modele3DPartage[]>,
        loadIcones(),
        loadJoueurs().catch(() => [] as Joueur[]),
      ]);
      setPlanetes(p);
      setModeles(m);
      setIcones(i);
      setJoueurs(j);
      setChoisie((c) => (c && p.some((x) => x.id === c) ? c : (triAdmin(p)[0]?.id ?? "")));
    } catch (e) {
      setErreur(
        messageErreur(
          e,
          "Chargement impossible. Si la collection `planetes` ou `icones` n'existe pas encore, " +
            "lance les patches 1 à 4 du chantier « planètes ».",
        ),
      );
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const rangees = useMemo(() => triAdmin(planetes), [planetes]);
  const planete = useMemo(() => planetes.find((p) => p.id === choisie) ?? null, [planetes, choisie]);

  /** Les modèles 3D destinés aux TUILES — ceux qu'on ouvre à une planète. */
  const modelesDeTuile = useMemo(
    () => modeles.filter((m) => usageDuModele3D(m) === "tuile"),
    [modeles],
  );
  /** Ceux qui dessinent une PLANÈTE — l'apparence, pas le catalogue. */
  const modelesDePlanete = useMemo(
    () => modeles.filter((m) => usageDuModele3D(m) === "planete"),
    [modeles],
  );
  const iconesDeTuile = useMemo(() => icones.filter((i) => i.usage === "tuile"), [icones]);
  const iconesDePlanete = useMemo(() => icones.filter((i) => i.usage === "planete"), [icones]);

  const blocage = useMemo(
    () => (planete ? pourquoiRienACreer(planete, modelesDeTuile, iconesDeTuile) : null),
    [planete, modelesDeTuile, iconesDeTuile],
  );

  const nomDuJoueur = (id: string) => {
    if (!id) return "— planète game";
    const j = joueurs.find((x) => x.id === id);
    return j ? (j.pseudo?.trim() || j.email) : id;
  };

  /* ---------------------------------------------------------------- */

  const creer = async () => {
    const nom = nomNeuf.trim();
    if (!nom) return;
    setEnregistre(true);
    setErreur(null);
    try {
      const rec = await pb
        .collection(COLLECTION_PLANETES)
        .create<Planete>({ nom, proprietaire: proprietaireNeuf });
      setNomNeuf("");
      setProprietaireNeuf("");
      await charger();
      setChoisie(rec.id);
    } catch (e) {
      setErreur(
        messageErreur(e, "Création refusée. Un nom de planète est unique — celui-ci existe peut-être déjà."),
      );
    } finally {
      setEnregistre(false);
    }
  };

  const majPlanete = async (champs: Partial<Planete>) => {
    if (!planete) return;
    setEnregistre(true);
    setErreur(null);
    try {
      await pb.collection(COLLECTION_PLANETES).update(planete.id, champs);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setEnregistre(false);
    }
  };

  /**
   * Ouvrir ou fermer un partageable à la planète regardée.
   *
   * ⚠️ On écrit la liste COMPLÈTE recalculée, jamais un « ajoute » partiel :
   * PocketBase remplace le champ, et envoyer la seule nouvelle valeur effacerait
   * les autres planètes déjà ouvertes.
   */
  const basculer = async (
    collection: string,
    part: Partageable & { id: string },
    ouvert: boolean,
  ) => {
    if (!planete) return;
    setEnregistre(true);
    setErreur(null);
    try {
      await pb
        .collection(collection)
        .update(part.id, { planetes_autorisees: avecPlanete(part, planete.id, ouvert) });
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setEnregistre(false);
    }
  };

  const basculerToutes = async (
    collection: string,
    part: Partageable & { id: string },
    toutes: boolean,
  ) => {
    setEnregistre(true);
    setErreur(null);
    try {
      await pb.collection(collection).update(part.id, { toutes_planetes: toutes });
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setEnregistre(false);
    }
  };

  /* ---------------------------------------------------------------- */

  if (chargement) return <p className="text-sm text-slate-400">Chargement des planètes…</p>;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Planètes</h1>
        <p className="text-sm text-slate-400">
          Les planètes <strong>game</strong> sont les tiennes ; celles des joueurs portent un
          propriétaire. <strong>Game</strong> n'est pas une planète jouable : c'est le contenu commun
          à toutes les planètes game.
        </p>
      </header>

      {erreur && (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        {/* ------------------------------- la liste ------------------------ */}
        <aside className="space-y-3">
          <ul className="divide-y divide-edge rounded border border-edge">
            {rangees.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setChoisie(p.id)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                    p.id === choisie ? "bg-ink text-white" : "text-slate-300 hover:bg-ink/60"
                  }`}
                >
                  <span>{p.nom}</span>
                  <span className="text-xs text-slate-500">
                    {estGame(p) ? "commun" : estPlaneteGame(p) ? "game" : "joueur"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="space-y-2 rounded border border-edge p-3">
            <p className="text-xs font-medium text-slate-300">Créer une planète</p>
            <input
              value={nomNeuf}
              onChange={(e) => setNomNeuf(e.target.value)}
              placeholder="Nom (unique)"
              className="w-full rounded border border-edge bg-ink px-2 py-1 text-sm text-white"
            />
            <select
              value={proprietaireNeuf}
              onChange={(e) => setProprietaireNeuf(e.target.value)}
              className="w-full rounded border border-edge bg-ink px-2 py-1 text-sm text-white"
            >
              <option value="">— planète game (sans propriétaire)</option>
              {joueurs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.pseudo?.trim() || j.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!nomNeuf.trim() || enregistre}
              onClick={() => void creer()}
              className="w-full rounded bg-sky-600 px-2 py-1 text-sm text-white disabled:opacity-40"
            >
              Créer
            </button>
          </div>
        </aside>

        {/* ------------------------------- la planète ---------------------- */}
        {planete ? (
          <section className="space-y-6">
            <div className="space-y-3 rounded border border-edge p-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-white">{planete.nom}</h2>
                <span className="text-xs text-slate-500">{nomDuJoueur(planete.proprietaire)}</span>
              </div>

              {estGame(planete) && (
                <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  ⚠️ « Game » porte le vocabulaire et les technos communs à toutes les planètes de
                  l'administrateur. <strong>Ne lui rattache aucun modèle de plateau</strong> : c'est
                  cette absence qui l'empêche d'être ouverte comme une planète jouable.
                </p>
              )}

              {blocage && !estGame(planete) && (
                <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  ⚠️ {blocage}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Champ libelle="Modèle 3D (la sphère dans la scène)">
                  <select
                    value={planete.modele3d ?? ""}
                    disabled={enregistre}
                    onChange={(e) => void majPlanete({ modele3d: e.target.value })}
                    className="w-full rounded border border-edge bg-ink px-2 py-1 text-sm text-white"
                  >
                    <option value="">— aucun</option>
                    {modelesDePlanete.map((m) => (
                      <option key={m.id} value={m.id}>
                        {libelleModele(m)}
                      </option>
                    ))}
                  </select>
                  {modelesDePlanete.length === 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      Aucun modèle 3D d'usage « planete ». Passe-en un à cet usage dans l'onglet
                      3DmodelTuile.
                    </p>
                  )}
                </Champ>

                <Champ libelle="Icône (la vignette de la fiche)">
                  <select
                    value={planete.icone ?? ""}
                    disabled={enregistre}
                    onChange={(e) => void majPlanete({ icone: e.target.value })}
                    className="w-full rounded border border-edge bg-ink px-2 py-1 text-sm text-white"
                  >
                    <option value="">— aucune</option>
                    {iconesDePlanete.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nom?.trim() || i.chemin}
                      </option>
                    ))}
                  </select>
                  {iconesDePlanete.length === 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      Aucune icône d'usage « planete ». Le relevé les crée depuis
                      <code className="px-1">Icones_Planetes/</code>.
                    </p>
                  )}
                </Champ>
              </div>

              <Aide titre="Ce que cet écran décide">
                <Terme nom="planète game">
                  Une planète sans propriétaire. Tout le monde y joue, chacun sa colonie, et{" "}
                  <strong>tout lui est ouvert sans rien cocher</strong>.
                </Terme>
                <Terme nom="planète de joueur">
                  Elle n'a <strong>rien</strong> tant que tu n'as pas ouvert. Il lui faut un modèle
                  3D <em>et</em> une icône pour qu'une seule tuile puisse exister.
                </Terme>
                <Terme nom="ouvert à toutes">
                  La case vit sur le modèle 3D, pas sur la planète : la cocher ici l'ouvre à toutes
                  les planètes, y compris celles créées plus tard.
                </Terme>
              </Aide>
            </div>

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
              entrees={iconesDeTuile.map((i) => ({
                part: i,
                libelle: i.nom?.trim() || i.chemin,
              }))}
              enregistre={enregistre}
              onBasculer={basculer}
              onToutes={basculerToutes}
            />
          </section>
        ) : (
          <p className="text-sm text-slate-400">Aucune planète. Crée-en une à gauche.</p>
        )}
      </div>
    </div>
  );
}

function Champ({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-300">{libelle}</span>
      {children}
    </label>
  );
}

/**
 * Le tableau d'ouverture, le même pour les modèles 3D et pour les icônes — ils
 * portent exactement les deux mêmes champs, donc un seul composant.
 *
 * ⚠️ Sur une planète **game**, les cases sont cochées ET désactivées : tout lui
 * est ouvert par la règle, pas par une autorisation. Les rendre cliquables
 * laisserait croire qu'on peut fermer quelque chose, ce que la règle ne permet
 * pas — et une case qu'on décoche sans effet est pire qu'une case grisée.
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
    <div className="space-y-3 rounded border border-edge p-4">
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
          className="rounded border border-edge bg-ink px-2 py-1 text-xs text-white"
        />
      </div>

      {game && (
        <p className="text-xs text-slate-500">
          ⚠️ « {planete.nom} » est une planète game : <strong>tout lui est ouvert</strong> par la
          règle, sans rien cocher. Les cases restent grisées — il n'y a rien à lui fermer.
        </p>
      )}

      {entrees.length === 0 ? (
        <p className="text-xs text-slate-500">{vide}</p>
      ) : (
        <ul className="divide-y divide-edge">
          {visibles.map(({ part, libelle }) => {
            const nomme = (part.planetes_autorisees ?? []).includes(planete.id);
            return (
              <li key={part.id} className="flex items-center justify-between gap-3 py-1.5">
                <span className="truncate text-sm text-slate-300">{libelle}</span>
                <span className="flex shrink-0 items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-400">
                    <input
                      type="checkbox"
                      checked={game || nomme || part.toutes_planetes === true}
                      disabled={game || enregistre || part.toutes_planetes === true}
                      onChange={(e) => void onBasculer(collection, part, e.target.checked)}
                    />
                    ouvert ici
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
