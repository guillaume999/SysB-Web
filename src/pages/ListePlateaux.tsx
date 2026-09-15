import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Aide, { Terme } from "@/components/Aide";
import { BandeauJoueur } from "@/components/Conception";
import PanneauPlanete, { type Modele3DPartage } from "@/components/PanneauPlanete";
import { useAuth } from "@/lib/auth";
import { dansLaPortee } from "@/lib/conception";
import { usePortee } from "@/lib/portee";
import { type Joueur, loadJoueurs } from "@/lib/joueurs";
import { messageErreur, pb } from "@/lib/pb";
import { loadModeles3D, TYPES_PLATEAU, type TypePlateau } from "@/lib/modeles3d";
import {
  APPARTIENT_GAME,
  COLLECTION_PLANETES,
  appartenance,
  appartientPourPlanete,
  estGame,
  loadIcones,
  loadPlanetes,
  nomDePlanete,
  rangAppartenance,
  triAdmin,
  type Icone,
  type Planete,
} from "@/lib/planetes";
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
 * La liste des modèles, ou celle des plateaux de joueurs.
 *
 * Un seul composant pour les deux : ce sont les mêmes colonnes et les mêmes
 * gestes. Ce qui diffère — le vocabulaire, l'aide, la façon dont un plateau
 * naît — tient dans la table ci-dessous plutôt que dans deux fichiers qui
 * divergeraient au premier changement.
 *
 * Ils ont en revanche **deux onglets distincts** dans la navigation : un modèle
 * se dessine, un plateau de joueur s'inspecte. Les mélanger dans une seule page
 * mettait sur le même plan ce qu'on fabrique et ce qu'on observe.
 */
/** Ce que lit un joueur sur SES modèles. */
const TEXTES_JOUEUR = {
  titre: "Mes modèles de plateau",
  chapeau:
    "Le terrain de départ de ta planète : un modèle ground et un modèle space, créés avec elle. Tu les peins avec tes propres tuiles ; le jeu en fait ta partie à ta première venue.",
  vide: "Ta planète n'a pas encore de modèle : le serveur les crée avec elle. Recharge dans un moment.",
  bouton: "",
} as const;

const TEXTES = {
  [COLLECTION_TEMPLATES]: {
    titre: "Modèles de plateau",
    chapeau: "Le terrain de départ que tu dessines, rangé par planète. Le jeu en fait une copie pour chaque joueur, à sa première venue. Chaque joueur reçoit à l'inscription sa planète, à son pseudo, avec un modèle ground et un modèle space.",
    vide: "Aucun modèle. Tant qu'il n'y en a pas, le jeu refuse de fabriquer le plateau d'un joueur et le dit dans la console — c'est voulu.",
    bouton: "+ Nouveau modèle",
  },
  [COLLECTION_PLATEAUX]: {
    titre: "Plateaux des joueurs",
    chapeau: "Les copies personnelles, une par joueur et par type. Elles naissent toutes seules à la première venue du joueur.",
    vide: "Aucun plateau de joueur pour l'instant.",
    bouton: "+ Nouveau (le tien)",
  },
} as const;

export default function ListePlateaux({ source }: { source: SourcePlateau }) {
  // ⚠️ Les plateaux des joueurs : admin seul (la route n'existe que pour lui).
  //    Les MODÈLES : l'admin les voit tous ; un joueur, depuis le 15/09, voit et
  //    peint les deux de SA planète — sans en créer ni en supprimer.
  const { user } = useAuth();
  const { portee, chargement: chargementPortee } = usePortee();
  const admin = portee.admin;
  const textes = admin ? TEXTES[source] : TEXTES_JOUEUR;
  const estModele = source === COLLECTION_TEMPLATES;
  const [planeteOuverte, setPlaneteOuverte] = useState<string | null>(null);

  // ⚠️ Ce qui sert à lire les colonnes « planète » et « appartient », et au
  //    panneau de la planète. Rien de tout ça n'est indispensable à la
  //    liste : un échec laisse les colonnes en identifiants, pas l'écran vide.
  const [planetes, setPlanetes] = useState<Planete[]>([]);
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [modeles3d, setModeles3d] = useState<Modele3DPartage[]>([]);
  const [icones, setIcones] = useState<Icone[]>([]);

  /** Planètes, joueurs, modèles 3D, icônes. */
  const chargerAutour = useCallback(async () => {
    const [p, j, m, i] = await Promise.all([
      loadPlanetes().catch(() => [] as Planete[]),
      loadJoueurs().catch(() => [] as Joueur[]),
      (loadModeles3D() as Promise<Modele3DPartage[]>).catch(() => [] as Modele3DPartage[]),
      loadIcones().catch(() => [] as Icone[]),
    ]);
    setPlanetes(p);
    setJoueurs(j);
    setModeles3d(m);
    setIcones(i);
  }, []);

  const [liste, setListe] = useState<Plateau[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [creation, setCreation] = useState(false);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const chargee = await (estModele ? loadTemplates() : loadPlateauxJoueurs());
      setListe(chargee);
      if (estModele) await chargerAutour();
    } catch (e) {
      setErreur(messageErreur(e, "Chargement impossible."));
    } finally {
      setChargement(false);
    }
  }, [estModele, chargerAutour]);

  /**
   * ⚠️ L'ORDRE : le jeu d'abord, puis les joueurs, puis les modèles que
   * personne n'a rangés ; dans chaque groupe par planète, puis par type — les
   * deux modèles d'une planète se suivent.
   */
  const rangee = useMemo(() => {
    if (!estModele) return liste;
    if (!admin) return dansLaPortee(portee, liste);
    const nomP = (p: Plateau) => nomDePlanete(planetes, p.planete);
    return [...liste].sort(
      (a, b) =>
        rangAppartenance(a.appartient) - rangAppartenance(b.appartient) ||
        nomP(a).localeCompare(nomP(b), "fr", { sensitivity: "base" }) ||
        a.typeOfPlateau.localeCompare(b.typeOfPlateau),
    );
  }, [liste, planetes, estModele, admin, portee]);

  const libelleAppartient = (valeur: string | undefined) => {
    const a = appartenance(valeur);
    if (a.famille === "game")
      return (
        <span className="rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-accent">
          game
        </span>
      );
    if (a.famille === "personne") return <span className="text-xs text-amber-300">non rangé</span>;
    if (a.id === user?.id) return <span className="text-xs text-slate-300">toi</span>;
    const j = joueurs.find((x) => x.id === a.id);
    return <span className="text-xs text-slate-300">{j ? j.pseudo?.trim() || j.email : a.id}</span>;
  };

  useEffect(() => {
    void charger();
  }, [charger]);

  const supprimer = async (p: Plateau) => {
    setASupprimer(null);
    try {
      await pb.collection(source).delete(p.id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusée."));
    }
  };

  const lien = (p: Plateau) => (estModele ? `/modeles/${p.id}` : `/plateaux/${p.id}`);

  return (
    <div>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">{textes.titre}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{textes.chapeau}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => void charger()}>
            Recharger
          </button>
          {admin && (
            <button className="btn-primary" onClick={() => setCreation(true)}>
              {textes.bouton}
            </button>
          )}
        </div>
      </header>

      <BandeauJoueur portee={portee} chargement={chargementPortee} />

      {!admin ? (
        <Aide titre="Comment marchent tes modèles">
          <Terme nom="deux modèles">
            Un <code>ground</code> et un <code>space</code>, créés avec ta planète. Tu ne peux ni en
            ajouter ni en supprimer.
          </Terme>
          <Terme nom="peindre">
            Ouvre un modèle et peins avec TES tuiles (onglet Tuiles). Les tuiles du jeu ne sont pas
            proposées chez toi.
          </Terme>
          <Terme nom="taille">
            Tu peux changer la taille dans la limite que l'administrateur t'a fixée.
          </Terme>
          <Terme nom="la copie">
            À ta première venue sur ta planète, le jeu fabrique ta partie depuis ce modèle.
            Retoucher le modèle ensuite ne change pas une partie déjà commencée.
          </Terme>
        </Aide>
      ) : estModele ? (
        <Aide titre="Comment marchent les modèles">
          <Terme nom="un par type">
            Un modèle par type de plateau — `ground`, `space`, `TPTplateau`. Le joueur n'y touche
            jamais.
          </Terme>
          <Terme nom="la copie">
            À sa première venue sur un type, le jeu fabrique au joueur une copie personnelle du
            modèle et l'ouvre. C'est cette copie qu'il joue ; retoucher le modèle ensuite ne change
            rien aux parties déjà commencées, seulement au départ des nouveaux joueurs.
          </Terme>
          <Terme nom="planète">
            Où le modèle se joue. Une planète a deux modèles, <code>ground</code> et{" "}
            <code>space</code>. Le bouton « Planète » règle son apparence et ce qui lui est
            ouvert : quels modèles 3D et quelles icônes ses tuiles peuvent utiliser.
          </Terme>
          <Terme nom="appartient">
            <strong>game</strong> = modèle du jeu (Terre, Jupiter…). Sinon, le joueur à qui est la
            planète — elle est créée d'office à son inscription et porte son pseudo.{" "}
            <strong>non rangé</strong> = champ vide : personne n'en est propriétaire, à corriger.
          </Terme>
          <Terme nom="actif">
            Un modèle non coché est un brouillon. Tu peux préparer le prochain terrain de départ
            sans perturber celui en service.
          </Terme>
          <Terme nom="aucun modèle">
            Le jeu refuse alors de fabriquer un plateau et le dit clairement, au lieu d'en inventer
            un vide de 100×100 — injouable sur mobile.
          </Terme>
        </Aide>
      ) : (
        <Aide titre="Comment marchent les plateaux des joueurs">
          <Terme nom="un par joueur et par type">
            Garanti par la base, pas seulement par le code : un index unique sur (joueur, type).
            Sans lui, un incident réseau pourrait en créer un second et faire croire au joueur
            qu'il a perdu le premier.
          </Terme>
          <Terme nom="naissance">
            Ils ne se créent pas à la main d'habitude : le jeu les fabrique depuis le modèle, tout
            seul, à la première venue.
          </Terme>
          <Terme nom="créer depuis ici">
            Ne fonctionne que <strong>pour ton propre compte</strong>. Les règles d'API interdisent
            de créer un plateau au nom de quelqu'un d'autre — c'est ce qui empêche un compte
            compromis d'en fabriquer pour toute la base. Tu peux en revanche ouvrir, modifier et
            supprimer ceux des autres.
          </Terme>
          <Terme nom="états">
            Les cases qui retiennent quelque chose : un niveau, un stock, un bâtiment éteint. Une
            tuile décorative n'a pas d'état.
          </Terme>
        </Aide>
      )}

      {erreur && (
        <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {chargement ? (
        <p className="mt-6 text-sm text-slate-500">Chargement…</p>
      ) : rangee.length === 0 ? (
        <p className="card mt-4 p-4 text-sm text-slate-500">{textes.vide}</p>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2 font-medium">nom</th>
                {estModele && <th className="px-3 py-2 font-medium">planète</th>}
                {estModele && admin && <th className="px-3 py-2 font-medium">appartient</th>}
                {!estModele && <th className="px-3 py-2 font-medium">joueur</th>}
                <th className="w-20 px-3 py-2 font-medium">type</th>
                <th className="w-24 px-3 py-2 font-medium">taille</th>
                <th className="w-28 px-3 py-2 font-medium">occupées</th>
                <th className="w-20 px-3 py-2 font-medium">états</th>
                <th className="w-36 px-3 py-2 font-medium">modifié</th>
                <th className="w-40 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rangee.map((p) => {
                const cases = p.largeur * p.hauteur;
                const occupees = compterOccupees(p);
                const confirme = aSupprimer === p.id;
                const saPlanete = planetes.find((x) => x.id === p.planete) ?? null;
                return (
                  <Fragment key={p.id}>
                  <tr className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
                    <td className="px-3 py-2">
                      <Link to={lien(p)} className="text-slate-200 hover:text-accent hover:underline">
                        {p.nom || "(sans nom)"}
                      </Link>
                      {estModele && !p.actif && (
                        <span className="ml-2 rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                          brouillon
                        </span>
                      )}
                    </td>
                    {estModele && (
                      <td className="px-3 py-2 text-xs text-slate-300">
                        {p.planete ? (
                          nomDePlanete(planetes, p.planete)
                        ) : (
                          <span className="text-amber-300">aucune</span>
                        )}
                      </td>
                    )}
                    {estModele && admin && <td className="px-3 py-2">{libelleAppartient(p.appartient)}</td>}
                    {!estModele && (
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
                            onClick={() => void supprimer(p)}
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
                          <Link to={lien(p)} className="text-xs text-accent hover:underline">
                            Ouvrir
                          </Link>
                          {estModele && admin && saPlanete && (
                            <button
                              className="ml-3 text-xs text-slate-400 hover:text-white"
                              onClick={() => setPlaneteOuverte(planeteOuverte === p.id ? null : p.id)}
                            >
                              Planète
                            </button>
                          )}
                          {admin && (
                            <button
                              className="ml-3 text-xs text-slate-500 hover:text-red-400"
                              onClick={() => setASupprimer(p.id)}
                            >
                              Supprimer
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                  {planeteOuverte === p.id && saPlanete && (
                    <tr className="border-b border-edge/60 bg-ink/30">
                      <td colSpan={10} className="px-3 py-3">
                        <PanneauPlanete
                          planete={saPlanete}
                          modeles={modeles3d}
                          icones={icones}
                          onChange={chargerAutour}
                          onFermer={() => setPlaneteOuverte(null)}
                        />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creation && admin && (
        <DialogCreation
          source={source}
          uid={String(user?.id ?? "")}
          planetes={planetes}
          joueurs={joueurs}
          onCancel={() => setCreation(false)}
          onCree={() => {
            setCreation(false);
            void charger();
          }}
        />
      )}
    </div>
  );
}

/** Création : juste le cadre. Le contenu se dessine ensuite dans l'éditeur. */
/** Valeur du sélecteur de planète qui veut dire « en créer une ». */
const NOUVELLE_PLANETE = "__nouvelle__";

function DialogCreation({
  source,
  uid,
  planetes,
  joueurs,
  onCancel,
  onCree,
}: {
  source: SourcePlateau;
  uid: string;
  planetes: Planete[];
  joueurs: Joueur[];
  onCancel: () => void;
  onCree: () => void;
}) {
  const estModele = source === COLLECTION_TEMPLATES;
  // ⚠️ « Game » porte le contenu commun et ne se joue pas : aucun modèle ne
  //    doit s'y rattacher, donc il n'est pas proposé.
  const choixPlanetes = useMemo(() => triAdmin(planetes).filter((p) => !estGame(p)), [planetes]);
  const [planeteId, setPlaneteId] = useState(choixPlanetes[0]?.id ?? NOUVELLE_PLANETE);
  const [nomPlanete, setNomPlanete] = useState("");
  const [appartientNeuf, setAppartientNeuf] = useState(APPARTIENT_GAME);
  const planeteChoisie = choixPlanetes.find((p) => p.id === planeteId) ?? null;
  const nouvelle = planeteId === NOUVELLE_PLANETE;
  // ⚠️ `appartient` SE DÉDUIT de la planète existante : on ne le laisse saisir
  //    que pour une planète neuve, sinon le modèle et sa planète diraient deux
  //    propriétaires différents.
  const appartient = nouvelle ? appartientNeuf : appartientPourPlanete(planeteChoisie);
  const [nom, setNom] = useState(estModele ? "Modèle Terre" : "Mon plateau");
  const [type, setType] = useState<TypePlateau>("ground");
  const [largeur, setLargeur] = useState("20");
  const [hauteur, setHauteur] = useState("20");
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const l = Number(largeur);
  const h = Number(hauteur);
  const cases = l * h;
  const bloque =
    saving ||
    nom.trim() === "" ||
    !(l >= 1 && h >= 1 && l <= 200 && h <= 200) ||
    (estModele && nouvelle && nomPlanete.trim() === "");

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
      if (estModele) {
        corps.actif = false;
        let planete = planeteChoisie;
        if (nouvelle) {
          planete = await pb.collection(COLLECTION_PLANETES).create<Planete>({
            nom: nomPlanete.trim(),
            proprietaire: appartient === APPARTIENT_GAME ? "" : appartient,
          });
        }
        if (planete) {
          corps.planete = planete.id;
          // L'étiquette texte : le pinceau de l'éditeur filtre encore dessus.
          corps.typeOfPlateau2 = planete.nom;
        }
        corps.appartient = appartient;
      } else corps.ownerId = uid;
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
          {estModele ? "Nouveau modèle" : "Nouveau plateau (le tien)"}
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

          {estModele && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="pl-planete">
                  Planète
                </label>
                <select
                  id="pl-planete"
                  className="input"
                  value={planeteId}
                  onChange={(e) => setPlaneteId(e.target.value)}
                >
                  {choixPlanetes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                  <option value={NOUVELLE_PLANETE}>+ nouvelle planète…</option>
                </select>
                {nouvelle && (
                  <input
                    className="input mt-2"
                    placeholder="Nom de la planète (unique)"
                    value={nomPlanete}
                    onChange={(e) => setNomPlanete(e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className="label" htmlFor="pl-appartient">
                  Appartient
                </label>
                <select
                  id="pl-appartient"
                  className="input"
                  value={appartient}
                  disabled={!nouvelle}
                  onChange={(e) => setAppartientNeuf(e.target.value)}
                >
                  <option value={APPARTIENT_GAME}>game (le jeu)</option>
                  {joueurs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.pseudo?.trim() || j.email}
                    </option>
                  ))}
                  {appartient !== APPARTIENT_GAME && !joueurs.some((j) => j.id === appartient) && (
                    <option value={appartient}>{appartient}</option>
                  )}
                </select>
                {!nouvelle && <p className="mt-1 text-xs text-slate-500">Celui de la planète choisie.</p>}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="pl-type">
                Type
              </label>
              <select
                id="pl-type"
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value as TypePlateau)}
              >
                {TYPES_PLATEAU.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
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
