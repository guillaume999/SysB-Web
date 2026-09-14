// ============================================================
//  MaPlanete.tsx
//  LA PLANÈTE DU JOUEUR — 2026-09-14.
//
//  Ouvert à **tout compte connecté**, admin compris : l'administrateur a lui
//  aussi une planète à lui, distincte des planètes du jeu.
//
//  ⚠️⚠️ ELLE SE CRÉE PAR UN GESTE EXPLICITE, PAS À L'INSCRIPTION. Une planète
//  posée d'office serait — jusqu'à ce que l'admin lui ouvre quelque chose — une
//  planète sans nom, sans apparence et **injouable** : le joueur la trouverait
//  vide sans savoir pourquoi. Ici il la nomme, et l'écran lui dit tout de suite
//  ce qui lui manque encore.
//
//  ⚠️ L'ÉCRAN N'ÉCRIT PAS DANS `planetes` : il appelle
//  `POST /api/sysb/ma-planete`, qui crée la planète **et ses deux modèles de
//  plateau** d'un bloc. Une planète sans modèle ne s'ouvre pas, et personne ne
//  saurait qu'il faut la réparer.
//
//  ⚠️ UNE SEULE PLANÈTE PAR JOUEUR — tenue par le serveur, pas par ce fichier :
//  l'index unique de `planetes` ne porte que le nom. Cet écran cache le
//  formulaire quand il en voit une ; le serveur répond 409 si on insiste.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Aide, { Terme } from "@/components/Aide";
import { useAuth } from "@/lib/auth";
import { messageErreur } from "@/lib/pb";
import { loadModeles3D, libelle as libelleModele, type Modele3D } from "@/lib/modeles3d";
import { loadTemplates, type Plateau } from "@/lib/plateaux";
import {
  creerMaPlanete,
  loadIcones,
  loadPlanetes,
  maPlanete,
  ouvertsA,
  pourquoiRienACreer,
  usageDuModele3D,
  type Icone,
  type Partageable,
  type Planete,
} from "@/lib/planetes";

type Modele3DPartage = Modele3D & Partageable & { usage?: string };

export default function MaPlanete() {
  const { user } = useAuth();

  const [planetes, setPlanetes] = useState<Planete[]>([]);
  const [modeles, setModeles] = useState<Modele3DPartage[]>([]);
  const [icones, setIcones] = useState<Icone[]>([]);
  const [templates, setTemplates] = useState<Plateau[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [modele3d, setModele3d] = useState("");
  const [icone, setIcone] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [p, m, i, t] = await Promise.all([
        loadPlanetes(),
        loadModeles3D() as Promise<Modele3DPartage[]>,
        loadIcones(),
        // ⚠️ Les modèles ne sont pas indispensables à cet écran : s'ils
        //    échouent, on montre quand même la planète plutôt que tout bloquer.
        loadTemplates().catch(() => [] as Plateau[]),
      ]);
      setPlanetes(p);
      setModeles(m);
      setIcones(i);
      setTemplates(t);
    } catch (e) {
      setErreur(
        messageErreur(
          e,
          "Chargement impossible. Si la collection `planetes` n'existe pas encore, " +
            "les patches du chantier « planètes » ne sont pas passés.",
        ),
      );
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const mienne = useMemo(() => maPlanete(planetes, user?.id), [planetes, user?.id]);

  /**
   * ⚠️ LES APPARENCES NE SE FILTRENT PAS À LA CRÉATION, et c'est structurel :
   * on choisit l'apparence **au moment où la planète naît**, donc elle n'existe
   * pas encore — il n'y a rien sur quoi appliquer la règle du partage. C'est le
   * seul endroit du chantier où l'axe « par planète » ne s'applique pas.
   */
  const apparences3d = useMemo(
    () => modeles.filter((m) => usageDuModele3D(m) === "planete"),
    [modeles],
  );
  const apparencesIcone = useMemo(() => icones.filter((i) => i.usage === "planete"), [icones]);

  /** Ce qu'elle peut utiliser pour fabriquer des tuiles, une fois née. */
  const modelesDeTuile = useMemo(
    () => modeles.filter((m) => usageDuModele3D(m) === "tuile"),
    [modeles],
  );
  const iconesDeTuile = useMemo(() => icones.filter((i) => i.usage === "tuile"), [icones]);

  const blocage = useMemo(
    () => (mienne ? pourquoiRienACreer(mienne, modelesDeTuile, iconesDeTuile) : null),
    [mienne, modelesDeTuile, iconesDeTuile],
  );

  const mesModeles = useMemo(
    () => (mienne ? templates.filter((t) => (t as { planete?: string }).planete === mienne.id) : []),
    [templates, mienne],
  );

  const creer = async () => {
    setEnvoi(true);
    setErreur(null);
    setMessage(null);
    try {
      const r = await creerMaPlanete(nom.trim(), modele3d, icone);
      setMessage(r.verdict);
      setNom("");
      await charger();
    } catch (e) {
      // ⚠️ Le verdict du serveur est un MESSAGE À MONTRER, pas une erreur à
      //    masquer : « tu as déjà ta planète », « ce nom est pris »…
      setErreur(messageErreur(e, "Création refusée."));
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement) return <p className="text-sm text-slate-400">Chargement…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Ma planète</h1>
        <p className="text-sm text-slate-400">
          Elle est à toi seul : tu la dessines, tu y joues, et les autres ne peuvent que la
          visiter. Les planètes du jeu, elles, restent celles de l'administrateur.
        </p>
      </header>

      {erreur && (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {erreur}
        </p>
      )}
      {message && (
        <p className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      )}

      {mienne ? (
        <section className="space-y-4 rounded border border-edge p-4">
          <h2 className="text-lg font-semibold text-white">{mienne.nom}</h2>

          {blocage && (
            <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              ⚠️ {blocage}
            </p>
          )}

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-300">Ses deux modèles de plateau</p>
            {mesModeles.length === 0 ? (
              <p className="text-xs text-slate-500">
                Aucun modèle rattaché — c'est anormal : ils sont créés avec la planète. Préviens
                l'administrateur plutôt que d'en créer un.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {mesModeles.map((t) => (
                  <li key={t.id}>
                    <Link to={`/modeles/${t.id}`} className="text-sky-400 hover:underline">
                      {t.nom}
                    </Link>{" "}
                    <span className="text-xs text-slate-500">({t.typeOfPlateau})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Aide titre="Dans quel ordre avancer">
            <Terme nom="1. tes tuiles">
              Rien ne se dessine tant que tu n'as pas de tuiles : l'éditeur de plateaux n'aurait
              aucun pinceau. Il te faut un <strong>modèle 3D</strong> et une <strong>icône</strong>,
              ouverts à ta planète par l'administrateur.
            </Terme>
            <Terme nom="2. ton terrain">
              Tu dessines tes deux modèles — le sol et l'orbite — avec tes tuiles.
            </Terme>
            <Terme nom="3. la partie">
              Elle part du modèle, une fois. ⚠️ Le redessiner ensuite ne change{" "}
              <strong>rien</strong> à la partie en cours.
            </Terme>
          </Aide>
        </section>
      ) : (
        <section className="space-y-3 rounded border border-edge p-4">
          <h2 className="text-lg font-semibold text-white">Crée ta planète</h2>
          <p className="text-xs text-slate-400">
            Elle naîtra avec <strong>ses deux modèles de plateau</strong>, vides — le sol et
            l'orbite. C'est toi qui les dessineras.
          </p>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-300">
              Son nom <span className="text-slate-500">— unique, c'est par lui qu'on la cherche</span>
            </span>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={100}
              className="w-full rounded border border-edge bg-ink px-2 py-1 text-sm text-white"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-300">Son modèle 3D</span>
              <select
                value={modele3d}
                onChange={(e) => setModele3d(e.target.value)}
                className="w-full rounded border border-edge bg-ink px-2 py-1 text-sm text-white"
              >
                <option value="">— aucun pour l'instant</option>
                {apparences3d.map((m) => (
                  <option key={m.id} value={m.id}>
                    {libelleModele(m)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-300">Son icône</span>
              <select
                value={icone}
                onChange={(e) => setIcone(e.target.value)}
                className="w-full rounded border border-edge bg-ink px-2 py-1 text-sm text-white"
              >
                <option value="">— aucune pour l'instant</option>
                {apparencesIcone.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nom?.trim() || i.chemin}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {apparences3d.length === 0 && apparencesIcone.length === 0 && (
            <p className="text-xs text-slate-500">
              Aucune apparence n'est encore déclarée. Ce n'est pas bloquant : une planète sans
              sphère ni vignette se joue, elle est juste terne — et l'administrateur pourra lui en
              donner une plus tard.
            </p>
          )}

          <button
            type="button"
            disabled={!nom.trim() || envoi}
            onClick={() => void creer()}
            className="rounded bg-sky-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            {envoi ? "Création…" : "Créer ma planète"}
          </button>

          <Aide titre="Ce que ça crée exactement">
            <Terme nom="la planète">
              Avec toi comme propriétaire. <strong>Une seule par joueur</strong> — c'est le serveur
              qui le tient.
            </Terme>
            <Terme nom="ses deux modèles">
              Un <code>ground</code> et un <code>space</code>, vides, partagés à toi seul. Sans eux
              la planète ne s'ouvrirait pas.
            </Terme>
            <Terme nom="et rien d'autre">
              Ni tuiles, ni autorisations : c'est l'administrateur qui ouvre les modèles 3D et les
              icônes que tu pourras utiliser.
            </Terme>
          </Aide>
        </section>
      )}

      {ouvertsA(modelesDeTuile, mienne).length > 0 && (
        <p className="text-xs text-slate-500">
          {ouvertsA(modelesDeTuile, mienne).length} modèle(s) 3D et{" "}
          {ouvertsA(iconesDeTuile, mienne).length} icône(s) te sont ouverts pour fabriquer tes
          tuiles.
        </p>
      )}
    </div>
  );
}
