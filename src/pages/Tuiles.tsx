import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import TuileDialog from "@/components/TuileDialog";
import { Vignette } from "@/components/Vignette";
import { messageErreur, pb } from "@/lib/pb";
import { cheminJeu, loadModeles3D, problemeDeModele, type Modele3D } from "@/lib/modeles3d";
import { libelleRessource, loadRessources, type Ressource } from "@/lib/ressources";
// ⚠️ Les ages sont une COLLECTION depuis le 2026-08-27 au soir (onglet Ages) :
// le catalogue les lit, il n'en tient pas un second jeu. Deux listes pour les
// memes ages, et plus personne ne sait laquelle est la bonne.
import { libelleAge, loadAges, type Age } from "@/lib/ages";
import { loadTechnologies, type Technologie } from "@/lib/technologies";
import {
  COLLECTION_TUILES,
  cheminIcone,
  contrainteDe,
  couleurDe,
  estCommun,
  estEntrepot,
  formatDuree,
  loadTuiles,
  logistiqueDe,
  paliersDe,
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
  ressources: Ressource[];
}

/** Le palier 1 resume en une ligne : ce qu'on paie, ce qu'on mobilise. */
function resumePalier1(ctx: ContexteColonne) {
  const p = paliersDe(ctx.tuile)[0];
  const cout = p.cout
    .map(
      (l) =>
        `${l.quantite} ${libelleRessource(ctx.ressources, l.ressource)}` +
        (l.mode === "mobilise" ? " (mobilisé)" : ""),
    )
    .join(", ");
  const conso = p.utilisation
    .map(
      (l) =>
        `${l.quantite} ${libelleRessource(ctx.ressources, l.ressource)}/${formatDuree(l.periode_s)}`,
    )
    .join(", ");
  return { cout, conso };
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
    cle: "code",
    libelle: "code de l'arbre",
    rendu: ({ tuile }) =>
      tuile.code ? <span className="font-mono text-xs text-slate-300">{tuile.code}</span> : RIEN,
    valeur: ({ tuile }) => tuile.code ?? "",
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
    cle: "paliers",
    libelle: "paliers",
    etroite: true,
    rendu: ({ tuile }) => (
      <span className="tabular-nums text-slate-400">{paliersDe(tuile).length}</span>
    ),
    valeur: ({ tuile }) => paliersDe(tuile).length,
  },
  {
    cle: "cout",
    libelle: "cout nv.1",
    rendu: (ctx) => resumePalier1(ctx).cout || <span className="text-slate-600">gratuit</span>,
    valeur: (ctx) => resumePalier1(ctx).cout,
  },
  {
    cle: "utilisation",
    libelle: "consommation nv.1",
    rendu: (ctx) => resumePalier1(ctx).conso || <span className="text-slate-600">aucune</span>,
    valeur: (ctx) => resumePalier1(ctx).conso,
  },
  {
    cle: "logistique",
    libelle: "stock & appro",
    etroite: true,
    rendu: ({ tuile }) => {
      const l = logistiqueDe(tuile);
      const bouts: string[] = [];
      if (estEntrepot(l)) bouts.push("entrepôt");
      else {
        if (l.appros.some((r) => r.sens === "entrant")) bouts.push("récolte");
        if (l.appros.some((r) => r.sens === "envoi")) bouts.push("envoie");
      }
      if (l.stockage.length > 0)
        bouts.push(`stock ${l.stockage.reduce((n, x) => n + Math.max(0, x.max), 0)}`);
      // Le stock commun change ce que le chiffre au-dessus veut dire : ce n'est
      // plus le coffre d'un bâtiment, c'est sa part du coffre de tout le type.
      if (estCommun(l)) bouts.push("commun");
      return bouts.length === 0 ? RIEN : bouts.join(" · ");
    },
    // Les tuiles sans logistique se rangent APRES : trier sur cette colonne
    // sert a trouver les entrepots, pas les 200 autres.
    valeur: ({ tuile }) => {
      const l = logistiqueDe(tuile);
      if (estEntrepot(l)) return "1 entrepot";
      if (l.appros.length > 0) return "2 appro";
      if (l.stockage.length > 0) return "3 stock";
      return "\uffff";
    },
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
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [ages, setAges] = useState<Age[]>([]);
  const [technologies, setTechnologies] = useState<Technologie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ tuile: Tuile | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  /**
   * Le filtre. Volontairement NON retenu d'une visite a l'autre, contrairement
   * a la colonne et au tri : rouvrir la page sur une liste amputee, sans se
   * souvenir d'avoir filtre, fait croire que des tuiles ont disparu.
   */
  const [filtre, setFiltre] = useState("");
  const [filtreType, setFiltreType] = useState("tous");
  const [filtreEtat, setFiltreEtat] = useState("tous");
  /** Ne garder que les tuiles dont le modele 3D cloche. Voir `problemeDeModele`. */
  const [seulSansModele, setSeulSansModele] = useState(false);

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

  /** Le modele 3D d'une tuile : celui que PocketBase a etendu, sinon le notre. */
  const modeleDe = useCallback(
    (tuile: Tuile): Modele3D | null => tuile.expand?.modele ?? parId.get(tuile.modele) ?? null,
    [parId],
  );

  const contexte = useCallback(
    (tuile: Tuile): ContexteColonne => ({ tuile, modele: modeleDe(tuile), ressources }),
    [modeleDe, ressources],
  );

  /**
   * Le filtre porte sur ce qu'on LIT dans la ligne : le nom, l'id, la
   * categorie. Chercher dans des champs invisibles donnerait des resultats
   * inexplicables — « pourquoi cette tuile ressort-elle ? ».
   */
  const tuilesFiltrees = useMemo(() => {
    const q = filtre.trim().toLowerCase();
    return tuiles.filter((t) => {
      if (filtreType !== "tous" && t.typeOfPlateau !== filtreType) return false;
      if (filtreEtat === "actives" && !t.actif) return false;
      if (filtreEtat === "brouillons" && t.actif) return false;
      if (seulSansModele && !problemeDeModele(modeleDe(t))) return false;
      if (q === "") return true;
      return (
        (t.nom ?? "").toLowerCase().includes(q) ||
        (t.categorie ?? "").toLowerCase().includes(q) ||
        String(t.tileId) === q
      );
    });
  }, [tuiles, filtre, filtreType, filtreEtat, seulSansModele, modeleDe]);

  const filtreActif =
    filtre.trim() !== "" || filtreType !== "tous" || filtreEtat !== "tous" || seulSansModele;

  const reinitialiser = () => {
    setFiltre("");
    setFiltreType("tous");
    setFiltreEtat("tous");
    setSeulSansModele(false);
  };

  const tuilesTriees = useMemo(() => {
    const liste = [...tuilesFiltrees];
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
  }, [tuilesFiltrees, triCle, triSens, colonne, contexte]);

  /**
   * Le catalogue rendu comme l'ecran des technologies : **des bandes d'age, avec
   * les categories a l'interieur** (demande du 2026-08-27 au soir). L'arbre se
   * lit par paliers ; une liste a plat de 150 tuiles ne dit rien de sa forme.
   *
   * Trois differences assumees avec l'ecran des technologies :
   *
   * 1. **Un age vide n'est PAS affiche.** La-bas les sept bandes sont toujours
   *    la, pour inviter a la saisie ; ici un FILTRE est actif la moitie du temps,
   *    et sept bandes vides seraient du bruit qui cache le resultat.
   * 2. **« Sans age » va en DERNIER**, pas en tete : ce ne sont pas des
   *    brouillons mais les cases de terrain (eau, foret, volcan), qui n'ont
   *    aucune raison d'etre dans l'arbre.
   * 3. **Le tri reste celui des entetes**, il joue A L'INTERIEUR d'une
   *    categorie. Regrouper n'est pas classer : on garde les deux.
   */
  const groupes = useMemo(() => {
    const parAge = new Map<number, Tuile[]>();
    for (const t of tuilesTriees) {
      // Plus de borne 1..7 en dur : un age vaut ce que l'onglet Ages declare,
      // et un numero inconnu garde sa bande — marquee « non declare » — plutot
      // que de tomber en silence dans « sans age ».
      const age = t.age > 0 ? Math.trunc(t.age) : 0;
      parAge.set(age, [...(parAge.get(age) ?? []), t]);
    }
    return [...parAge.entries()]
      // 0 en dernier, les ages dans l'ordre : l'Infini envoie le zero au bout,
      // quel que soit le nombre d'ages declares.
      .sort((a, b) => (a[0] || Infinity) - (b[0] || Infinity))
      .map(([age, liste]) => {
        const parCat = new Map<string, Tuile[]>();
        for (const t of liste) {
          const c = (t.categorie ?? "").trim() || "sans categorie";
          parCat.set(c, [...(parCat.get(c) ?? []), t]);
        }
        return {
          age,
          total: liste.length,
          categories: [...parCat.entries()]
            .sort((a, b) => a[0].localeCompare(b[0], "fr", { sensitivity: "base" }))
            .map(([categorie, tuiles]) => ({ categorie, tuiles })),
        };
      });
  }, [tuilesTriees]);

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
      /** Modele absent, ou prefab disparu du releve : rien ne s'affichera en jeu. */
      sansModele: tuiles.filter((t) => problemeDeModele(modeleDe(t)) !== null).length,
    };
  }, [tuiles, modeleDe]);

  /** La fleche de tri, ou rien si ce n'est pas la colonne classante. */
  const fleche = (cle: string) =>
    triCle === cle ? <span className="ml-1 text-accent">{triSens === "asc" ? "▲" : "▼"}</span> : null;

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      // Les ages sont charges de facon TOLERANTE : le catalogue reste lisible
      // meme si leur collection n'existe pas encore (patch pas encore lance).
      // Les bandes s'appellent alors « Age 3 — non declare », ce qui se corrige,
      // au lieu d'un ecran vide qui se cherche.
      // Les technos aussi, et pour la meme raison : leur collection peut etre
      // vide, ou refusee ; le catalogue doit rester ouvrable. La regle
      // « technologie requise » dit alors « aucune technologie declaree ».
      const [t, m, r, a, tech] = await Promise.all([
        loadTuiles(),
        loadModeles3D(),
        loadRessources(),
        loadAges().catch(() => [] as Age[]),
        loadTechnologies().catch(() => [] as Technologie[]),
      ]);
      setTuiles(t);
      setModeles(m);
      setRessources(r);
      setAges(a);
      setTechnologies(tech);
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
            meme modele peut servir a autant de tuiles que necessaire. La fenetre d'edition porte
            aussi ses <strong>regles de pose</strong>, ses <strong>paliers de cout</strong> et son{" "}
            <strong>stock &amp; appro</strong>, un onglet chacun.
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

      {!chargement && ressources.length === 0 && (
        <p className="mb-4 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">
          Aucune ressource declaree :{" "}
          <Link to="/ressources" className="underline">
            commence par l'onglet Ressources
          </Link>
          , sinon l'onglet Cout n'aura rien a proposer.
        </p>
      )}

      {/* Le filtre, puis le compte. Dans cet ordre : on regle, puis on lit ce
          que le reglage a donne. */}
      {!chargement && tuiles.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            className="input h-8 w-56 py-1 text-xs"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            placeholder="filtrer par nom, categorie ou id..."
          />
          <select
            className="input h-8 py-1 text-xs"
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            title="Type de plateau"
          >
            <option value="tous">tous les plateaux</option>
            <option value="ground">ground</option>
            <option value="space">space</option>
          </select>
          <select
            className="input h-8 py-1 text-xs"
            value={filtreEtat}
            onChange={(e) => setFiltreEtat(e.target.value)}
            title="Actives ou brouillons"
          >
            <option value="tous">actives et brouillons</option>
            <option value="actives">actives seulement</option>
            <option value="brouillons">brouillons seulement</option>
          </select>
          {filtreActif && (
            <button type="button" className="text-xs text-accent hover:underline" onClick={reinitialiser}>
              tout afficher
            </button>
          )}
        </div>
      )}

      {/* Le detail du compte : au-dessus du tableau, parce qu'il decrit ce que
          le tableau contient — pas un reglage, une lecture. */}
      {!chargement && tuiles.length > 0 && (
        <p className="mb-2 text-xs text-slate-500">
          {filtreActif && (
            <span className="text-slate-300">
              <span className="tabular-nums">{tuilesFiltrees.length}</span> affichee
              {tuilesFiltrees.length > 1 ? "s" : ""} sur{" "}
            </span>
          )}
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
          {/* Cliquable : sans ca, savoir qu'il y en a 3 ne dit toujours pas
              LESQUELLES, et il faut parcourir tout le catalogue a la main. */}
          {compte.sansModele > 0 && (
            <>
              {" · "}
              <button
                type="button"
                className="text-amber-400 hover:underline"
                onClick={() => setSeulSansModele((v) => !v)}
                title={
                  seulSansModele
                    ? "Reafficher tout le catalogue"
                    : "N'afficher que ces tuiles"
                }
              >
                <span className="tabular-nums">{compte.sansModele}</span> sans modele 3D valable
                {seulSansModele ? " (affichees seules)" : ""}
              </button>
            </>
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
              {!chargement && tuilesTriees.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                    Aucune tuile ne correspond au filtre.{" "}
                    <button type="button" className="text-accent hover:underline" onClick={reinitialiser}>
                      tout afficher
                    </button>
                  </td>
                </tr>
              )}
              {!chargement &&
                groupes.map((groupe) => (
                  <Fragment key={groupe.age}>
                    {/* La bande d'age : une ligne pleine largeur DANS le tbody,
                        plutot qu'un tableau par age — l'entete classant reste
                        unique en haut, et les colonnes restent alignees d'un
                        age a l'autre. */}
                    <tr className="border-y border-edge bg-ink/60">
                      <td colSpan={3} className="px-3 py-1.5">
                        <span className="text-xs font-medium text-slate-200">
                          {groupe.age === 0
                            ? "Sans age — cases de terrain et tuiles non classees"
                            : libelleAge(groupe.age, ages)}
                        </span>
                        <span className="ml-2 text-xs tabular-nums text-slate-500">
                          {groupe.total}
                        </span>
                      </td>
                    </tr>
                    {groupe.categories.map((c) => (
                      <Fragment key={c.categorie}>
                        {/* Le sous-titre ne s'affiche que s'il y a plusieurs
                            categories : un seul sous-titre au-dessus d'une seule
                            liste n'apprend rien. */}
                        {groupe.categories.length > 1 && (
                          <tr className="bg-ink/30">
                            <td
                              colSpan={3}
                              className="px-3 py-1 text-[10px] uppercase tracking-wide text-slate-500"
                            >
                              {c.categorie}
                            </td>
                          </tr>
                        )}
                        {c.tuiles.map((tuile) => {
                          const confirme = aSupprimer === tuile.id;
                          const problemeModele = problemeDeModele(modeleDe(tuile));
                          const citants = tuilesCitant(tuiles, tuile.tileId).filter((t) => t.id !== tuile.id);
                          return (
                            <tr
                              key={tuile.id}
                              className="border-b border-edge/60 align-top last:border-0 hover:bg-ink/40"
                            >
                              <td className="px-3 py-2">
                                <Vignette chemin={cheminIcone(tuile)} alt="" taille={24} />
                                <span
                                  className={`ml-2 align-middle ${
                                    tuile.actif ? "text-slate-200" : "text-slate-500"
                                  }`}
                                >
                                  {tuile.nom}
                                </span>
                                {!tuile.actif && (
                                  <span className="ml-2 rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                                    brouillon
                                  </span>
                                )}
                                {/* Sous le nom, et non dans la colonne au choix :
                                    cette colonne peut afficher autre chose, et une
                                    panne qui ne se voit qu'apres avoir choisi la
                                    bonne colonne ne se voit pas. */}
                                {problemeModele && (
                                  <p className="mt-1 text-[10px] leading-tight text-amber-300">
                                    {problemeModele}
                                  </p>
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
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <TuileDialog
          tuile={dialog.tuile}
          tuiles={tuiles}
          modeles={modeles}
          ressources={ressources}
          ages={ages}
          technologies={technologies}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}
