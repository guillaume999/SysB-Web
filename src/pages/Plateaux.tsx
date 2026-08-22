import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Aide, { Terme } from "@/components/Aide";
import { useAuth } from "@/lib/auth";
import { messageErreur, pb } from "@/lib/pb";
import {
  COLLECTION_PLATEAUX,
  COLLECTION_TEMPLATES,
  compterOccupees,
  encoderTiles,
  etatsDe,
  libelleProprietaire,
  loadPlateauxJoueurs,
  loadTemplates,
  type Plateau,
  type SourcePlateau,
} from "@/lib/plateaux";

/**
 * Les plateaux : modèles de l'admin et copies des joueurs.
 *
 * La liste reste un résumé — dimensions, cases occupées, états, dernière
 * modification. Le contenu se voit et se modifie dans l'éditeur, sur une page
 * dédiée : une grille hexagonale n'a rien à faire dans une ligne de tableau.
 */
export default function Plateaux() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Plateau[]>([]);
  const [joueurs, setJoueurs] = useState<Plateau[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [creation, setCreation] = useState<SourcePlateau | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [t, p] = await Promise.all([
        loadTemplates(),
        loadPlateauxJoueurs().catch(() => [] as Plateau[]),
      ]);
      setTemplates(t);
      setJoueurs(p);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement des plateaux impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const supprimer = async (source: SourcePlateau, p: Plateau) => {
    setASupprimer(null);
    try {
      await pb.collection(source).delete(p.id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusée."));
    }
  };

  const Tableau = ({
    source,
    liste,
    titre,
  }: {
    source: SourcePlateau;
    liste: Plateau[];
    titre: string;
  }) => (
    <section className="mt-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {titre} ({liste.length})
        </h2>
        <button
          className="text-xs text-accent hover:underline"
          onClick={() => setCreation(source)}
        >
          + nouveau
        </button>
      </div>

      {liste.length === 0 ? (
        <p className="card p-4 text-sm text-slate-500">
          {source === COLLECTION_TEMPLATES
            ? "Aucun modèle. Tant qu'il n'y en a pas, le jeu refuse de fabriquer le plateau d'un joueur et le dit dans la console — c'est voulu."
            : "Aucun plateau de joueur. Ils naissent tout seuls, à la première venue d'un joueur sur un type."}
        </p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2 font-medium">nom</th>
                {source === COLLECTION_PLATEAUX && (
                  <th className="px-3 py-2 font-medium">joueur</th>
                )}
                <th className="w-20 px-3 py-2 font-medium">type</th>
                <th className="w-24 px-3 py-2 font-medium">taille</th>
                <th className="w-28 px-3 py-2 font-medium">occupées</th>
                <th className="w-20 px-3 py-2 font-medium">états</th>
                <th className="w-36 px-3 py-2 font-medium">modifié</th>
                <th className="w-40 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {liste.map((p) => {
                const cases = p.largeur * p.hauteur;
                const occupees = compterOccupees(p);
                const confirme = aSupprimer === p.id;
                return (
                  <tr key={p.id} className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
                    <td className="px-3 py-2">
                      <Link
                        to={`/plateaux/${source}/${p.id}`}
                        className="text-slate-200 hover:text-accent hover:underline"
                      >
                        {p.nom || "(sans nom)"}
                      </Link>
                      {source === COLLECTION_TEMPLATES && !p.actif && (
                        <span className="ml-2 rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                          brouillon
                        </span>
                      )}
                    </td>
                    {source === COLLECTION_PLATEAUX && (
                      <td className="px-3 py-2 text-xs text-slate-400">{libelleProprietaire(p)}</td>
                    )}
                    <td className="px-3 py-2">
                      <span className="rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                        {p.typeOfPlateau}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-slate-400">
                      {p.largeur}×{p.hauteur}
                    </td>
                    <td className="px-3 py-2 text-xs tabular-nums text-slate-400">
                      {occupees} / {cases}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-slate-400">{etatsDe(p).length}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {new Date(p.updated).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {confirme ? (
                        <>
                          <button
                            className="text-xs text-red-300 hover:underline"
                            onClick={() => void supprimer(source, p)}
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
                          <Link
                            to={`/plateaux/${source}/${p.id}`}
                            className="text-xs text-accent hover:underline"
                          >
                            Ouvrir
                          </Link>
                          <button
                            className="ml-3 text-xs text-slate-500 hover:text-red-400"
                            onClick={() => setASupprimer(p.id)}
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
    </section>
  );

  return (
    <div>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Plateaux</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Les <strong>modèles</strong> que tu dessines, et les <strong>copies</strong> que le jeu
            en fait pour chaque joueur.
          </p>
        </div>
        <button className="btn-ghost" onClick={() => void charger()}>
          Recharger
        </button>
      </header>

      <Aide titre="Comment marchent les plateaux">
        <Terme nom="modèle">
          Un par type de plateau. Le joueur n'y touche jamais. À sa première venue sur un type, le
          jeu lui en fabrique une copie personnelle et c'est elle qu'il joue.
        </Terme>
        <Terme nom="plateau de joueur">
          La copie. Un seul par joueur et par type — la base le garantit par un index unique, pour
          qu'un incident réseau ne puisse pas en créer un second et faire croire au joueur qu'il a
          perdu le premier.
        </Terme>
        <Terme nom="aucun modèle">
          Le jeu refuse alors de fabriquer un plateau et le dit clairement, au lieu d'en inventer
          un vide de 100×100 — injouable sur mobile.
        </Terme>
        <Terme nom="occupées">
          Le nombre de cases portant une tuile, sur le total. Le reste est du vide.
        </Terme>
        <Terme nom="états">
          Les cases qui retiennent quelque chose : un niveau, un stock, un bâtiment éteint. Une
          tuile décorative n'a pas d'état.
        </Terme>
        <p className="text-slate-500">
          Créer un plateau de joueur depuis ici ne fonctionne que <strong>pour ton propre
          compte</strong> : les règles d'API interdisent d'en créer un au nom de quelqu'un d'autre.
          C'est volontaire, et c'est ce qui empêche un compte compromis de fabriquer des plateaux
          pour toute la base.
        </p>
      </Aide>

      {erreur && (
        <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {chargement ? (
        <p className="mt-6 text-sm text-slate-500">Chargement…</p>
      ) : (
        <>
          <Tableau source={COLLECTION_TEMPLATES} liste={templates} titre="Modèles" />
          <Tableau source={COLLECTION_PLATEAUX} liste={joueurs} titre="Plateaux des joueurs" />
        </>
      )}

      {creation && (
        <DialogCreation
          source={creation}
          uid={String(user?.id ?? "")}
          onCancel={() => setCreation(null)}
          onCree={() => {
            setCreation(null);
            void charger();
          }}
        />
      )}
    </div>
  );
}

/** Création : juste le cadre. Le contenu se dessine ensuite dans l'éditeur. */
function DialogCreation({
  source,
  uid,
  onCancel,
  onCree,
}: {
  source: SourcePlateau;
  uid: string;
  onCancel: () => void;
  onCree: () => void;
}) {
  const [nom, setNom] = useState(source === COLLECTION_TEMPLATES ? "Modèle Terre" : "Mon plateau");
  const [type, setType] = useState<"ground" | "space">("ground");
  const [largeur, setLargeur] = useState("20");
  const [hauteur, setHauteur] = useState("20");
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const l = Number(largeur);
  const h = Number(hauteur);
  const cases = l * h;
  const bloque = saving || nom.trim() === "" || !(l >= 1 && h >= 1 && l <= 200 && h <= 200);

  const creer = async () => {
    setSaving(true);
    setErreur(null);
    try {
      const corps: Record<string, unknown> = {
        nom: nom.trim(),
        typeOfPlateau: type,
        largeur: l,
        hauteur: h,
        tilesBase64: encoderTiles(new Uint8Array(cases)),
        etats: [],
      };
      if (source === COLLECTION_TEMPLATES) corps.actif = false;
      else corps.ownerId = uid;
      await pb.collection(source).create(corps);
      onCree();
    } catch (e) {
      setErreur(messageErreur(e, "Création refusée."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div className="card w-full max-w-md p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">
          {source === COLLECTION_TEMPLATES ? "Nouveau modèle" : "Nouveau plateau (le tien)"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          On pose le cadre ici. Le contenu se dessine ensuite dans l'éditeur.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="pl-nom">
              Nom
            </label>
            <input
              id="pl-nom"
              className="input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="pl-type">
                Type
              </label>
              <select
                id="pl-type"
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value as "ground" | "space")}
              >
                <option value="ground">ground</option>
                <option value="space">space</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pl-l">
                Largeur
              </label>
              <input
                id="pl-l"
                type="number"
                min={1}
                max={200}
                className="input"
                value={largeur}
                onChange={(e) => setLargeur(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="pl-h">
                Hauteur
              </label>
              <input
                id="pl-h"
                type="number"
                min={1}
                max={200}
                className="input"
                value={hauteur}
                onChange={(e) => setHauteur(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            {cases > 0 ? `${cases} cases.` : ""}{" "}
            {cases > 2500 &&
              "Au-delà de quelques milliers de cases, l'éditeur devient lent et le plateau difficile à jouer sur mobile."}
          </p>
        </div>

        {erreur && (
          <p className="mt-3 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            {erreur}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </button>
          <button className="btn-primary" onClick={() => void creer()} disabled={bloque}>
            {saving ? "Création…" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
