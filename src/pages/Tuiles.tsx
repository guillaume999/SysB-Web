import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import TuileDialog from "@/components/TuileDialog";
import { messageErreur, pb } from "@/lib/pb";
import { cheminJeu, loadModeles3D, type Modele3D } from "@/lib/modeles3d";
import {
  COLLECTION_TUILES,
  contrainteDe,
  couleurDe,
  loadTuiles,
  placementDe,
  tuilesCitant,
  type Tuile,
  type ValeursTuile,
} from "@/lib/tuiles";

/**
 * Une colonne au choix : ce qu'elle affiche, et sur quoi elle se trie.
 *
 * ⚠️ `rendu` et `valeur` sont DEUX fonctions distinctes, et c'est deliberé.
 * Trier sur ce qui est affiche marcherait pour le texte mais pas pour les
 * nombres : « 10 » se classerait avant « 2 », et « 3 h » avant « 45 min ».
 * `valeur` rend donc la grandeur brute — un nombre reste un nombre.
 */
interface ColonneAuChoix {
  cle: string;
  libelle: string;
  /** Court = la colonne peut rester etroite. */
  etroite?: boolean;
  rendu: (ctx: ContexteColonne) => ReactNode;
  valeur: (ctx: ContexteColonne) => string | number;
}

/** Ce dont une colonne a besoin en plus de la tuile pour se rendre. */
interface ContexteColonne {
  tuile: Tuile;
  modele: Modele3D | null;
}

const RIEN = <span className="text-slate-600">—</span>;

const COLONNES: ColonneAuChoix[] = [
  {
    cle: "id",
    libelle: "id",
    etroite: true,
    rendu: ({ tuile }) => (
      <span className="flex items-center gap-2 font-mono tabular-nums text-slate-300">
        {/* La pastille : la meme couleur que dans l'editeur de plateaux. */}
        <span
          className="h-3 w-3 shrink-0 rounded-sm border border-edge"
          style={{ background: couleurDe(tuile) }}
          title={tuile.couleur ? tuile.couleur : "couleur automatique"}
        />
        {tuile.tileId}
      </span>
    ),
    valeur: ({ tuile }) => tuile.tileId,
  },
  {
    cle: "categorie",
    libelle: "categorie",
    rendu: ({ tuile }) => tuile.categorie || RIEN,
    valeur: ({ tuile }) => tuile.categorie ?? "",
  },
  {
    cle: "modele",
    libelle: "modele 3D",
    rendu: ({ modele }) =>
      modele ? (
        <span className="font-mono text-[11px] text-slate-400">{cheminJeu(modele)}</span>
      ) : (
        <span className="text-[11px] text-amber-300">modele introuvable</span>
      ),
    valeur: ({ modele }) => (modele ? cheminJeu(modele) : "\uffff"),
  },
  {
    cle: "plateau",
    libelle: "type de plateau",
    etroite: true,
    rendu: ({ tuile }) => tuile.typeOfPlateau || RIEN,
    valeur: ({ tuile }) => tuile.typeOfPlateau ?? "",
  },
  {
    cle: "regles",
    libelle: "regles de pose",
    etroite: true,
    rendu: ({ tuile }) => {
      const n = placementDe(tuile).length;
      return n === 0 ? <span className="text-slate-600">libre</span> : `${n}`;
    },
    valeur: ({ tuile }) => placementDe(tuile).length,
  },
  {
    cle: "contrainte",
    libelle: "destruction",
    etroite: true,
    rendu: ({ tuile }) => {
      const c = contrainteDe(tuile);
      return c === "destructible" ? <span className="text-slate-600">{c}</span> : c;
    },
    valeur: ({ tuile }) => contrainteDe(tuile),
  },
  {
    cle: "etat",
    libelle: "actif",
    etroite: true,
    rendu: ({ tuile }) =>
      tuile.actif ? <span className="text-slate-600">actif</span> : "brouillon",
    valeur: ({ tuile }) => (tuile.actif ? 1 : 0),
  },
  {
    cle: "maj",
    libelle: "modifiee le",
    etroite: true,
    rendu: ({ tuile }) => (
      <span className="tabular-nums text-slate-400">{(tuile.updated ?? "").slice(0, 10)}</span>
    ),
    valeur: ({ tuile }) => tuile.updated ?? "",
  },
];

/** Ce qu'on affiche par defaut, et ce qu'on retient d'une visite a l'autre. */
const CLE_PREFS = "sysb.tuiles.colonne";
const CLE_TRI = "sysb.tuiles.tri";

function lirePref(cle: string, defaut: string): string {
  // localStorage jette dans un onglet prive ou avec les cookies bloques : une
  // preference d'affichage ne doit jamais empecher la page de s'ouvrir.
  try {
    return window.localStorage.getItem(cle) ?? defaut;
  } catch {
    return defaut;
  }
}

function ecrirePref(cle: string, valeur: string) {
  try {
    window.localStorage.setItem(cle, valeur);
  } catch {
    /* tant pis : le choix vaut pour cette session seulement */
  }
}

/**
 * Le catalogue de jeu : ce que le joueur peut reellement poser.
 *
 * Le tableau ne montre que TROIS colonnes : le nom, les actions, et **une
 * colonne au choix** (selecteur en haut). Mieux vaut une colonne qu'on choisit
 * que sept qu'on subit.
 *
 * ⚠️ Depuis la remise a zero du 2026-08-26, une tuile ne porte plus que son
 * identite : les colonnes cout, production, regles de pose, niveaux et role
 * logistique ont ete retirees en meme temps que les ecrans qui les
 * remplissaient.
 */
export default function Tuiles() {
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [modeles, setModeles] = useState<Modele3D[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ tuile: Tuile | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  /** La 3e colonne, et le tri. Les deux survivent a un rechargement de page. */
  const [colonneCle, setColonneCle] = useState(() => lirePref(CLE_PREFS, "categorie"));
  const [tri, setTri] = useState(() => lirePref(CLE_TRI, "nom:asc"));

  const colonne = COLONNES.find((c) => c.cle === colonneCle) ?? COLONNES[0];
  const [triCle, triSens] = tri.split(":");

  const choisirColonne = (cle: string) => {
    setColonneCle(cle);
    ecrirePref(CLE_PREFS, cle);
    // Rien a faire pour le tri : s'il portait deja sur « la colonne au choix »,
    // il suit tout seul, puisque le classement se recalcule a partir de
    // `colonne`. C'est l'interet de trier sur le ROLE et non sur un nom fige.
  };

  /** Clic sur un entete : meme colonne = on inverse le sens, sinon on y va. */
  const basculerTri = (cle: "nom" | "colonne") => {
    const sens = triCle === cle && triSens === "asc" ? "desc" : "asc";
    const suivant = `${cle}:${sens}`;
    setTri(suivant);
    ecrirePref(CLE_TRI, suivant);
  };

  const parId = useMemo(() => new Map(modeles.map((m) => [m.id, m])), [modeles]);

  const contexte = useCallback(
    (tuile: Tuile): ContexteColonne => ({
      tuile,
      modele: tuile.expand?.modele ?? parId.get(tuile.modele) ?? null,
    }),
    [parId],
  );

  const tuilesTriees = useMemo(() => {
    const liste = [...tuiles];
    const sens = triSens === "desc" ? -1 : 1;

    liste.sort((a, b) => {
      let va: string | number;
      let vb: string | number;

      if (triCle === "colonne") {
        va = colonne.valeur(contexte(a));
        vb = colonne.valeur(contexte(b));
      } else {
        va = a.nom ?? "";
        vb = b.nom ?? "";
      }

      let ecart: number;
      if (typeof va === "number" && typeof vb === "number") ecart = va - vb;
      else
        // `localeCompare` avec `numeric` : « tuile 10 » se range apres
        // « tuile 2 », et les accents ne partent pas en fin de liste.
        ecart = String(va).localeCompare(String(vb), "fr", {
          numeric: true,
          sensitivity: "base",
        });

      // Un tri stable et previsible : a valeur egale, on retombe sur le nom.
      if (ecart === 0 && triCle === "colonne")
        ecart = (a.nom ?? "").localeCompare(b.nom ?? "", "fr", { numeric: true });

      return ecart * sens;
    });

    return liste;
  }, [tuiles, triCle, triSens, colonne, contexte]);

  /**
   * Le compte du catalogue. Le total seul ne dit pas grand-chose : une tuile en
   * brouillon n'est pas jouable, et une tuile `space` ne sortira jamais sur un
   * plateau au sol. On decompose donc, plutot que d'afficher un nombre qui
   * rassure a tort.
   */
  const compte = useMemo(() => {
    const actives = tuiles.filter((t) => t.actif).length;
    const ground = tuiles.filter((t) => t.typeOfPlateau === "ground").length;
    const space = tuiles.filter((t) => t.typeOfPlateau === "space").length;
    return {
      total: tuiles.length,
      actives,
      brouillons: tuiles.length - actives,
      ground,
      space,
      /** Ni ground ni space : une saisie a reprendre, elle ne se posera nulle part. */
      sansType: tuiles.length - ground - space,
    };
  }, [tuiles]);

  /** La fleche de tri, ou rien si ce n'est pas la colonne classante. */
  const fleche = (cle: string) =>
    triCle === cle ? <span className="ml-1 text-accent">{triSens === "asc" ? "▲" : "▼"}</span> : null;

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [t, m] = await Promise.all([loadTuiles(), loadModeles3D()]);
      setTuiles(t);
      setModeles(m);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement du catalogue impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);


  const enregistrer = async (valeurs: ValeursTuile) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      if (dialog.tuile) await pb.collection(COLLECTION_TUILES).update(dialog.tuile.id, valeurs);
      else await pb.collection(COLLECTION_TUILES).create(valeurs);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refuse."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (tuile: Tuile) => {
    setASupprimer(null);
    try {
      await pb.collection(COLLECTION_TUILES).delete(tuile.id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusee."));
    }
  };

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-baseline gap-2 text-xl font-semibold text-white">
            Tuiles
            {!chargement && (
              <span
                className="rounded border border-edge px-1.5 py-0.5 font-mono text-xs tabular-nums text-slate-400"
                title="Nombre de tuiles au catalogue"
              >
                {compte.total}
              </span>
            )}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Une tuile, c'est un modele declare dans{" "}
            <Link to="/3dmodeltuile" className="text-accent hover:underline">
              3DmodelTuile
            </Link>{" "}
            plus son identite de jeu : nom, categorie, couleur, comportement a la destruction. Le
            meme modele peut servir a autant de tuiles que necessaire. Les regles de pose, les
            niveaux et le role logistique sont en cours de refonte : ils ne se saisissent nulle
            part pour l'instant.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Le choix de la 3e colonne. En haut, a cote des actions : c'est un
              reglage d'affichage, pas une donnee du tableau. */}
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Afficher
            <select
              className="input py-1 text-xs"
              value={colonne.cle}
              onChange={(e) => choisirColonne(e.target.value)}
            >
              {COLONNES.map((c) => (
                <option key={c.cle} value={c.cle}>
                  {c.libelle}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-ghost" onClick={() => void charger()}>
            Recharger
          </button>
          <button
            className="btn-primary"
            disabled={modeles.length === 0}
            title={modeles.length === 0 ? "Declare d'abord un modele 3D" : undefined}
            onClick={() => {
              setErreurDialog(null);
              setDialog({ tuile: null });
            }}
          >
            + Nouvelle tuile
          </button>
        </div>
      </header>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {/* Le detail du compte : au-dessus du tableau, parce qu'il decrit ce que
          le tableau contient — pas un reglage, une lecture. */}
      {!chargement && tuiles.length > 0 && (
        <p className="mb-2 text-xs text-slate-500">
          <span className="tabular-nums text-slate-300">{compte.total}</span> tuile
          {compte.total > 1 ? "s" : ""} au catalogue —{" "}
          <span className="tabular-nums text-slate-300">{compte.actives}</span> active
          {compte.actives > 1 ? "s" : ""}, {compte.brouillons} brouillon
          {compte.brouillons > 1 ? "s" : ""}
          {" · "}
          <span className="tabular-nums text-slate-300">{compte.ground}</span> ground,{" "}
          <span className="tabular-nums text-slate-300">{compte.space}</span> space
          {compte.sansType > 0 && (
            <span className="text-amber-400"> · {compte.sansType} sans type de plateau</span>
          )}
        </p>
      )}

      {!chargement && tuiles.length === 0 ? (
        <div className="card p-5 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Aucune tuile au catalogue.</p>
          <p className="mt-2 max-w-2xl">
            Une tuile a besoin d'un modele 3D existant. Declare-les dans{" "}
            <Link to="/3dmodeltuile" className="text-accent hover:underline">
              3DmodelTuile
            </Link>
            , puis reviens ici pour leur donner un cout, des conditions de pose et une production.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                {/* Les deux entetes classants sont des BOUTONS, pas des cellules
                    decorees : un tri qui ne se declenche qu'au pixel pres du
                    texte donne l'impression que le clic n'a pas marche. */}
                <th className="px-3 py-2 font-medium">
                  <button
                    className="uppercase tracking-wide hover:text-white"
                    onClick={() => basculerTri("nom")}
                    title="Classer par nom"
                  >
                    nom{fleche("nom")}
                  </button>
                </th>
                <th className="w-40 px-3 py-2" />
                <th className={`px-3 py-2 font-medium ${colonne.etroite ? "w-40" : ""}`}>
                  <button
                    className="uppercase tracking-wide hover:text-white"
                    onClick={() => basculerTri("colonne")}
                    title={`Classer par ${colonne.libelle}`}
                  >
                    {colonne.libelle}
                    {fleche("colonne")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {chargement && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              )}
              {!chargement &&
                tuilesTriees.map((tuile) => {
                  const confirme = aSupprimer === tuile.id;
                  const citants = tuilesCitant(tuiles, tuile.tileId).filter((t) => t.id !== tuile.id);
                  return (
                    <tr
                      key={tuile.id}
                      className="border-b border-edge/60 align-top last:border-0 hover:bg-ink/40"
                    >
                      <td className="px-3 py-2">
                        <span className={tuile.actif ? "text-slate-200" : "text-slate-500"}>
                          {tuile.nom}
                        </span>
                        {!tuile.actif && (
                          <span className="ml-2 rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                            brouillon
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {confirme ? (
                          <div className="inline-flex flex-col items-start gap-1">
                            <span className="text-[11px] leading-tight text-red-300">
                              {citants.length > 0
                                ? `${citants.length} tuile(s) citent l'id ${tuile.tileId} dans leurs regles.`
                                : "Cet id ne sera jamais reattribue."}
                            </span>
                            <span>
                              <button
                                className="text-xs text-red-300 hover:underline"
                                onClick={() => void supprimer(tuile)}
                              >
                                Confirmer
                              </button>
                              <button
                                className="ml-3 text-xs text-slate-400 hover:text-white"
                                onClick={() => setASupprimer(null)}
                              >
                                Annuler
                              </button>
                            </span>
                          </div>
                        ) : (
                          <>
                            <button
                              className="text-xs text-accent hover:underline"
                              onClick={() => {
                                setErreurDialog(null);
                                setDialog({ tuile });
                              }}
                            >
                              Modifier
                            </button>
                            <button
                              className="ml-3 text-xs text-slate-500 hover:text-red-400"
                              onClick={() => setASupprimer(tuile.id)}
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {colonne.rendu(contexte(tuile))}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <TuileDialog
          tuile={dialog.tuile}
          tuiles={tuiles}
          modeles={modeles}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}
