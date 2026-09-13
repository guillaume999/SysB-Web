import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Aide, { Terme } from "@/components/Aide";
import { useAuth } from "@/lib/auth";
import { type Joueur, libelleRole, loadJoueurs } from "@/lib/joueurs";
import { estConcepteur, modelesVisibles, usePartage } from "@/lib/partage";
import { messageErreur, pb } from "@/lib/pb";
import { TYPES_PLATEAU, type TypePlateau } from "@/lib/modeles3d";
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
const TEXTES = {
  [COLLECTION_TEMPLATES]: {
    titre: "Modèles de plateau",
    chapeau: "Le terrain de départ que tu dessines. Le jeu en fait une copie pour chaque joueur, à sa première venue sur un type.",
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
  const { user, estAdmin } = useAuth();
  const { portee, recharger: rechargerPortee } = usePartage();
  const textes = TEXTES[source];
  const estModele = source === COLLECTION_TEMPLATES;
  // ⚠️ Un concepteur ne voit QUE les modèles qu'on lui a ouverts, et il ne peut
  //    ni en créer ni en supprimer : les règles d'API gardent create et delete
  //    pour l'admin. Lui montrer les boutons ne ferait que promettre un 403.
  const concepteur = estConcepteur(portee);
  const [partageOuvert, setPartageOuvert] = useState<string | null>(null);

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
      setListe(estModele ? modelesVisibles(chargee, portee) : chargee);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement impossible."));
    } finally {
      setChargement(false);
    }
  }, [estModele, portee]);

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
          {concepteur && estModele && (
            <p className="mt-1 max-w-2xl text-xs text-accent">
              Un administrateur t'a ouvert {portee.modeles.length > 1 ? "ces modèles" : "ce modèle"}
              . Les bâtiments, ressources et technologies qui s'y rattachent se modifient dans
              leurs propres onglets.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => void charger()}>
            Recharger
          </button>
          {estAdmin && (
            <button className="btn-primary" onClick={() => setCreation(true)}>
              {textes.bouton}
            </button>
          )}
        </div>
      </header>

      {estModele ? (
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
          <Terme nom="actif">
            Un modèle non coché est un brouillon. Tu peux préparer le prochain terrain de départ
            sans perturber celui en service.
          </Terme>
          <Terme nom="aucun modèle">
            Le jeu refuse alors de fabriquer un plateau et le dit clairement, au lieu d'en inventer
            un vide de 100×100 — injouable sur mobile.
          </Terme>
          <Terme nom="partager">
            Ouvre ce modèle à un joueur : il peut alors le <strong>dessiner</strong>, et modifier
            les bâtiments, ressources et technologies qui y sont <strong>rattachés</strong> — rien
            d'autre. Il ne peut ni créer ni supprimer un modèle. Ce qui l'autorise vraiment, ce
            sont les règles d'API PocketBase ; cet écran ne fait que le déclarer.
          </Terme>
          <Terme nom="rattachement">
            Chaque bâtiment, ressource et techno appartient à UN modèle. Tout l'existant a été
            rattaché au modèle Terre <code className="text-accent">ground</code> le 13/09, et un
            nouvel enregistrement se range dans le modèle de son type de plateau. ⚠️ Ça ne dit pas
            où la tuile se JOUE — ça, c'est son type — seulement qui a le droit de l'écrire.
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
      ) : liste.length === 0 ? (
        <p className="card mt-4 p-4 text-sm text-slate-500">{textes.vide}</p>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2 font-medium">nom</th>
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
              {liste.map((p) => {
                const cases = p.largeur * p.hauteur;
                const occupees = compterOccupees(p);
                const confirme = aSupprimer === p.id;
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
                          {estModele && estAdmin && (
                            <button
                              className="ml-3 text-xs text-slate-400 hover:text-white"
                              onClick={() =>
                                setPartageOuvert(partageOuvert === p.id ? null : p.id)
                              }
                            >
                              Partager
                              {(p.partages ?? []).length > 0 && (
                                <span className="ml-1 tabular-nums text-accent">
                                  {(p.partages ?? []).length}
                                </span>
                              )}
                            </button>
                          )}
                          {estAdmin && (
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
                  {/*
                    ⚠️ Le partage se règle dans une LIGNE DÉPLIÉE, jamais dans
                    une `window.confirm` : la règle du site depuis le 23/08 —
                    une boîte native gèle l'automatisation Chrome.
                  */}
                  {partageOuvert === p.id && (
                    <tr className="border-b border-edge/60 bg-ink/30">
                      <td colSpan={8} className="px-3 py-3">
                        <PanneauPartage
                          modele={p}
                          onFini={async () => {
                            setPartageOuvert(null);
                            await charger();
                            await rechargerPortee();
                          }}
                          onAnnuler={() => setPartageOuvert(null)}
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

      {creation && (
        <DialogCreation
          source={source}
          uid={String(user?.id ?? "")}
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
  const estModele = source === COLLECTION_TEMPLATES;
  const [nom, setNom] = useState(estModele ? "Modèle Terre" : "Mon plateau");
  const [type, setType] = useState<TypePlateau>("ground");
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
      if (estModele) corps.actif = false;
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

/**
 * **Qui a le droit de travailler sur ce modèle.** Déplié sous la ligne du
 * modèle, jamais dans une fenêtre : c'est la règle du site depuis le 23/08.
 *
 * ⚠️ **Cet écran ne donne aucun droit à lui seul.** Il écrit une liste d'ids
 * dans `templates.partages` ; ce sont les **règles d'API PocketBase** qui, en
 * la lisant, laissent (ou non) passer l'écriture. Tant que les règles ne sont
 * pas posées, cocher un joueur ne fait rien du tout — et le dire ici évite de
 * chercher le bug côté site.
 *
 * ⚠️ **Un admin n'apparaît pas dans la liste** : il peut déjà tout écrire, et
 * l'inscrire dans `partages` laisserait croire qu'on peut lui RETIRER quelque
 * chose en le décochant.
 */
function PanneauPartage({
  modele,
  onFini,
  onAnnuler,
}: {
  modele: Plateau;
  onFini: () => void | Promise<void>;
  onAnnuler: () => void;
}) {
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [choisis, setChoisis] = useState<string[]>(modele.partages ?? []);
  const [chargement, setChargement] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    loadJoueurs()
      .then((liste) => {
        if (!annule) setJoueurs(liste.filter((j) => j.role !== "admin"));
      })
      .catch((e) => {
        if (!annule) setErreur(messageErreur(e, "Liste des joueurs illisible."));
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, []);

  const basculer = (id: string) =>
    setChoisis((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const enregistrer = async () => {
    setSaving(true);
    setErreur(null);
    try {
      await pb.collection(COLLECTION_TEMPLATES).update(modele.id, { partages: choisis });
      await onFini();
    } catch (e) {
      setErreur(messageErreur(e, "Partage refusé."));
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs text-slate-400">
        Les joueurs cochés peuvent <strong className="text-slate-200">dessiner ce modèle</strong> et
        modifier tout ce qui s'y rattache. Ils ne peuvent ni créer ni supprimer un modèle.
      </p>

      {chargement ? (
        <p className="mt-2 text-xs text-slate-500">Chargement des joueurs…</p>
      ) : joueurs.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          Aucun compte non-admin à qui partager. Crée-en un dans l'onglet Joueurs.
        </p>
      ) : (
        <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {joueurs.map((j) => (
            <li key={j.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-slate-300 hover:bg-ink">
                <input
                  type="checkbox"
                  checked={choisis.includes(j.id)}
                  onChange={() => basculer(j.id)}
                />
                <span className="truncate">{j.pseudo || j.email}</span>
                <span className="shrink-0 text-[10px] uppercase text-slate-600">
                  {libelleRole(j.role)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {erreur && <p className="mt-2 text-xs text-red-300">{erreur}</p>}

      <div className="mt-3 flex gap-3">
        <button className="btn-primary py-1 text-xs" onClick={() => void enregistrer()} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer le partage"}
        </button>
        <button className="text-xs text-slate-400 hover:text-white" onClick={onAnnuler}>
          Annuler
        </button>
      </div>
    </div>
  );
}
