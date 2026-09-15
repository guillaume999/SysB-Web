// ============================================================
//  Limites.tsx — /limites (admin, 15/09)
//  Ce que chaque joueur peut concevoir : la taille de ses plateaux, le nombre
//  de tuiles, de ressources et de technos qu'il peut créer. Pour TOUS (une
//  fiche générale) ou joueur par joueur.
//
//  ⚠️ LA RÈGLE (la même que le serveur, `routes.LimitesDe`) : une fiche qui
//  nomme le joueur REMPLACE la générale ; plusieurs fiches du même rang → la
//  plus large, champ par champ ; aucune fiche → il ne crée rien. Le tableau du
//  bas montre le résultat pour chaque joueur, avec ce qu'il a déjà créé.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Erreur, Fenetre, SupprimerEnPlace } from "@/components/Communaute";
import PartageJoueurs from "@/components/PartageJoueurs";
import {
  CHAMPS_LIMITES,
  COLLECTION_LIMITES,
  erreurFiche,
  ficheVide,
  limitesDe,
  planeteDuJoueur,
  type FicheLimites,
  type ValeursLimites,
} from "@/lib/conception";
import { loadJoueurs, type Joueur } from "@/lib/joueurs";
import { resumePartage, nomJoueur } from "@/lib/partageJoueurs";
import { messageErreur, pb } from "@/lib/pb";
import { loadPlanetes, type Planete } from "@/lib/planetes";
import { loadLimites } from "@/lib/portee";
import { loadRessources, type Ressource } from "@/lib/ressources";
import { loadTechnologies, type Technologie } from "@/lib/technologies";
import { loadTuiles, type Tuile } from "@/lib/tuiles";

type Existant = { planete?: string };

export default function Limites() {
  const [fiches, setFiches] = useState<FicheLimites[]>([]);
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [planetes, setPlanetes] = useState<Planete[]>([]);
  const [compte, setCompte] = useState<{ tuiles: Existant[]; ressources: Existant[]; technologies: Existant[] }>({
    tuiles: [],
    ressources: [],
    technologies: [],
  });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [edition, setEdition] = useState<FicheLimites | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [erreurFicheEnvoi, setErreurFicheEnvoi] = useState<string | null>(null);
  const [suppression, setSuppression] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const [f, j, p, t, r, te] = await Promise.all([
        loadLimites(),
        loadJoueurs().catch(() => [] as Joueur[]),
        loadPlanetes().catch(() => [] as Planete[]),
        loadTuiles().catch(() => [] as Tuile[]),
        loadRessources().catch(() => [] as Ressource[]),
        loadTechnologies().catch(() => [] as Technologie[]),
      ]);
      setFiches(f);
      setJoueurs(j);
      setPlanetes(p);
      setCompte({ tuiles: t, ressources: r, technologies: te });
    } catch (e) {
      const err = e as { status?: number };
      setErreur(
        err.status === 404
          ? "La collection « limites » n'existe pas encore : lance patch-conception-joueur-2026-09-15.js."
          : messageErreur(e, "Chargement impossible."),
      );
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  /** Pour chaque joueur : ses limites effectives et ce qu'il a déjà créé. */
  const lignes = useMemo(
    () =>
      joueurs
        .filter((j) => j.role !== "admin")
        .map((j) => {
          const planete = planeteDuJoueur(planetes, j.id);
          const sur = (l: Existant[]) => (planete ? l.filter((x) => x.planete === planete.id).length : 0);
          return {
            joueur: j,
            planete,
            limites: limitesDe(j.id, fiches),
            deja: { tuiles: sur(compte.tuiles), ressources: sur(compte.ressources), technologies: sur(compte.technologies) },
          };
        })
        .sort((a, b) => nomJoueur(a.joueur).localeCompare(nomJoueur(b.joueur), "fr", { sensitivity: "base" })),
    [joueurs, planetes, fiches, compte],
  );

  const enregistrer = async (v: ValeursLimites) => {
    setSaving(true);
    setErreurFicheEnvoi(null);
    try {
      const corps = { ...v, nom: v.nom.trim() };
      if (edition) await pb.collection(COLLECTION_LIMITES).update(edition.id, corps);
      else await pb.collection(COLLECTION_LIMITES).create(corps);
      setEdition(undefined);
      await charger();
    } catch (e) {
      setErreurFicheEnvoi(messageErreur(e, "Enregistrement impossible."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (id: string) => {
    setSuppression(id);
    try {
      await pb.collection(COLLECTION_LIMITES).delete(id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression impossible."));
    } finally {
      setSuppression(null);
    }
  };

  const joueursPourPartage = useMemo(() => joueurs.filter((j) => j.role !== "admin"), [joueurs]);

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Limites</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Ce que chaque joueur peut concevoir sur sa planète : la taille de ses modèles de
            plateau, et combien de tuiles, de ressources et de technologies il peut créer.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setErreurFicheEnvoi(null);
            setEdition(null);
          }}
        >
          + Nouvelle fiche
        </button>
      </header>

      <Aide titre="Comment les fiches se combinent">
        <Terme nom="fiche générale">
          Cochée « tous les joueurs », elle vaut pour chaque joueur qu'aucune autre fiche ne nomme,
          y compris ceux qui s'inscriront plus tard.
        </Terme>
        <Terme nom="fiche personnelle">
          Elle nomme des joueurs, et REMPLACE la générale pour eux — même si elle est plus petite :
          c'est ainsi qu'on bride un joueur sous la règle commune.
        </Terme>
        <Terme nom="plusieurs fiches">
          Un joueur nommé dans deux fiches reçoit, champ par champ, la valeur la plus large.
        </Terme>
        <Terme nom="aucune fiche">
          Le joueur ne peut rien créer : 0 partout. Ce qu'il a déjà créé reste en place.
        </Terme>
        <Terme nom="taille">
          Elle ne se juge que si le joueur CHANGE la taille de son modèle : ses deux modèles naissent
          en 60 × 60 et restent modifiables même avec une limite plus petite.
        </Terme>
        <Terme nom="qui refuse">
          Le serveur : il compte ce que la planète porte déjà avant chaque création. Cet écran ne
          fait que régler et montrer.
        </Terme>
      </Aide>

      <div className="mt-4">
        <Erreur>{erreur}</Erreur>
      </div>
      {chargement && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}

      {!chargement && (
        <>
          <section className="mt-4">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">Fiches</h2>
            {fiches.length === 0 ? (
              <p className="card p-4 text-sm text-slate-400">
                Aucune fiche : <strong className="text-slate-200">aucun joueur ne peut créer</strong> pour
                l'instant. Commence par une fiche « tous les joueurs ».
              </p>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead className="border-b border-edge text-left text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Fiche</th>
                      <th className="px-3 py-2 font-medium">Pour</th>
                      {CHAMPS_LIMITES.map((c) => (
                        <th key={c.cle} className="px-2 py-2 text-right font-medium">
                          {c.court}
                        </th>
                      ))}
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge">
                    {fiches.map((f) => (
                      <tr key={f.id}>
                        <td className="px-3 py-2 font-medium text-white">{f.nom}</td>
                        <td className="px-3 py-2 text-slate-300">
                          {resumePartage({ toutes_planetes: f.general, joueurs_autorises: f.joueurs }, joueurs)}
                        </td>
                        {CHAMPS_LIMITES.map((c) => (
                          <td key={c.cle} className="px-2 py-2 text-right tabular-nums text-slate-300">
                            {f[c.cle]}
                          </td>
                        ))}
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <button
                            className="mr-3 text-xs text-slate-400 hover:text-white"
                            onClick={() => {
                              setErreurFicheEnvoi(null);
                              setEdition(f);
                            }}
                          >
                            Modifier
                          </button>
                          <SupprimerEnPlace
                            quoi="cette fiche"
                            occupe={suppression === f.id}
                            onConfirme={() => void supprimer(f.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
              Ce que chaque joueur peut concevoir
            </h2>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="border-b border-edge text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Joueur</th>
                    <th className="px-3 py-2 font-medium">Selon</th>
                    <th className="px-2 py-2 text-right font-medium">plateau max</th>
                    <th className="px-2 py-2 text-right font-medium">tuiles</th>
                    <th className="px-2 py-2 text-right font-medium">ressources</th>
                    <th className="px-2 py-2 text-right font-medium">technos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {lignes.map(({ joueur, planete, limites, deja }) => (
                    <tr key={joueur.id}>
                      <td className="px-3 py-2">
                        <span className="text-white">{nomJoueur(joueur)}</span>
                        {!planete && <span className="ml-2 text-xs text-amber-300">sans planète</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {limites.source === "joueur"
                          ? "sa fiche"
                          : limites.source === "general"
                            ? "fiche générale"
                            : "aucune fiche"}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-slate-300">
                        {limites.largeur_max} × {limites.hauteur_max}
                      </td>
                      {(
                        [
                          [deja.tuiles, limites.tuiles_max],
                          [deja.ressources, limites.ressources_max],
                          [deja.technologies, limites.technos_max],
                        ] as const
                      ).map(([n, max], i) => (
                        <td
                          key={i}
                          className={`px-2 py-2 text-right tabular-nums ${n >= max && max > 0 ? "text-amber-300" : "text-slate-300"}`}
                        >
                          {n} / {max}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {lignes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-3 text-sm text-slate-500">
                        Aucun compte joueur.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {edition !== undefined && (
        <FicheDialog
          fiche={edition}
          joueurs={joueursPourPartage}
          saving={saving}
          erreur={erreurFicheEnvoi}
          onCancel={() => setEdition(undefined)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}

function FicheDialog({
  fiche,
  joueurs,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  fiche: FicheLimites | null;
  joueurs: Joueur[];
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (v: ValeursLimites) => void;
}) {
  const [v, setV] = useState<ValeursLimites>(() => {
    if (!fiche) return ficheVide();
    const { nom, general, joueurs: j, largeur_max, hauteur_max, tuiles_max, ressources_max, technos_max } = fiche;
    return { nom, general, joueurs: j, largeur_max, hauteur_max, tuiles_max, ressources_max, technos_max };
  });
  const [local, setLocal] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const err = erreurFiche(v);
    setLocal(err);
    if (!err) onSubmit(v);
  };

  return (
    <Fenetre titre={fiche ? `Modifier « ${fiche.nom} »` : "Nouvelle fiche de limites"} onFermer={onCancel}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="fiche-nom">Nom</label>
          <input
            id="fiche-nom"
            className="input"
            value={v.nom}
            maxLength={100}
            autoFocus
            placeholder="Général, Testeurs, Seb…"
            onChange={(e) => setV({ ...v, nom: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CHAMPS_LIMITES.map((c) => (
            <div key={c.cle}>
              <label className="label" htmlFor={`fiche-${c.cle}`}>{c.libelle}</label>
              <input
                id={`fiche-${c.cle}`}
                type="number"
                min={0}
                max={c.cle === "largeur_max" || c.cle === "hauteur_max" ? 200 : undefined}
                step={1}
                className="input"
                value={v[c.cle]}
                onChange={(e) => setV({ ...v, [c.cle]: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Largeur et hauteur en cases (200 au plus). 0 = rien : aucun agrandissement, aucune création.
        </p>

        <PartageJoueurs
          objet="cette fiche"
          question="À qui s'applique cette fiche ?"
          aideChoisis="Elle remplace la fiche générale pour eux."
          valeur={{ toutes_planetes: v.general, joueurs_autorises: v.joueurs }}
          onChange={(p) => setV({ ...v, general: p.toutes_planetes, joueurs: p.joueurs_autorises })}
          joueurs={joueurs}
        />

        <Erreur>{local || erreur}</Erreur>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : fiche ? "Enregistrer" : "Créer la fiche"}
          </button>
        </div>
      </form>
    </Fenetre>
  );
}
