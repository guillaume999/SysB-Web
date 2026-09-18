import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BandeauJoueur } from "@/components/Conception";
import GrilleTuiles from "@/components/GrilleTuiles";
import TuileDialog from "@/components/TuileDialog";
import { Vignette } from "@/components/Vignette";
import {
  dansLaPortee,
  duCatalogue,
  duTerritoire,
  etatQuota,
  filtrerParPlanete,
  planeteParDefaut,
  SANS_PLANETE,
  territoireDe,
} from "@/lib/conception";
import { messageErreur, pb } from "@/lib/pb";
import { autoriseeSur, loadIcones, usageDuModele3D, type Icone } from "@/lib/planetes";
import { usePortee } from "@/lib/portee";
import {
  cheminJeu,
  loadModeles3D,
  problemeDeModele,
  TYPES_PLATEAU,
  type Modele3D,
} from "@/lib/modeles3d";
import { libelleRessource, loadRessources, type Ressource } from "@/lib/ressources";
// ⚠️ Les ages sont une COLLECTION depuis le 2026-08-27 au soir (onglet Ages) :
// le catalogue les lit, il n'en tient pas un second jeu. Deux listes pour les
// memes ages, et plus personne ne sait laquelle est la bonne.
import { libelleAge, loadAges, type Age } from "@/lib/ages";
import { loadTechnologies, type Technologie } from "@/lib/technologies";
import { loadSocles, type Socle } from "@/lib/socles";
// ⚠️ L'ORDRE des categories (17/09) : il est STOCKE, dans la collection
// `categories`, et c'est le MEME que celui des onglets du magasin dans le jeu.
// La grille ne fait que le suivre ; les fleches de ses lignes l'ecrivent.
import {
  deplacerCategorie,
  enregistrerOrdre,
  loadCategoriesRangees,
  ordreCategories,
  synchroniserRenommage,
  type CategorieRangee,
} from "@/lib/categories";
import {
  categorieRenommeeDans,
  COLLECTION_TUILES,
  cheminIcone,
  contrainteDe,
  couleurDe,
  estCommun,
  estEntrepot,
  estMarche,
  estQuai,
  libelleCycle,
  loadTuiles,
  logistiqueDe,
  paliersDe,
  placementDe,
  toutesLesCategories,
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
  // ⚠️ Plus de « / min » depuis le 11/09 : une quantite n'a de sens qu'avec
  // la duree du cycle qui la livre — « 20 Ble par cycle de 2 min ».
  const conso = p.utilisation
    .map((l) => `${l.quantite} ${libelleRessource(ctx.ressources, l.ressource)}`)
    .join(", ");
  return { cout, conso: conso && `${conso} ${libelleCycle(p)}` };
}

/**
 * Ce qu'on lit SOUS LE NOM de chaque tuile, sans avoir a choisir une colonne
 * (demande du 2026-09-07 : *« les ressources produites / recoltees / envoyees
 * par chaque batiment, leur cout de construction »*). Palier 1, comme les
 * colonnes « cout nv.1 » et « consommation nv.1 ». Une ligne absente = rien a
 * dire, on ne montre pas de « — » cinq fois par tuile.
 */
function lignesSousLeNom(ctx: ContexteColonne): { cle: string; libelle: string; texte: string }[] {
  const nom = (code: string) => libelleRessource(ctx.ressources, code);
  const p = paliersDe(ctx.tuile)[0];
  const l = logistiqueDe(ctx.tuile);
  const lignes: { cle: string; libelle: string; texte: string }[] = [];

  const paye = p.cout.filter((c) => c.mode === "paye").map((c) => `${c.quantite} ${nom(c.ressource)}`);
  const mobilise = p.cout
    .filter((c) => c.mode === "mobilise")
    .map((c) => `${c.quantite} ${nom(c.ressource)}`);
  if (paye.length > 0) lignes.push({ cle: "cout", libelle: "coût", texte: paye.join(", ") });
  if (mobilise.length > 0)
    lignes.push({ cle: "mobilise", libelle: "mobilise", texte: mobilise.join(", ") });

  const produit = p.production.map((x) => `${x.quantite} ${nom(x.ressource)}`);
  if (produit.length > 0)
    lignes.push({ cle: "produit", libelle: "produit", texte: `${produit.join(", ")} ${libelleCycle(p)}` });

  // Une regle d'appro se resume a ses ressources et sa portee : le detail des
  // navettes reste dans le formulaire.
  const appro = (r: (typeof l.appros)[number]) =>
    (r.ressources.length === 0 ? "toutes les ressources" : r.ressources.map(nom).join(", ")) +
    (r.rayon === null ? " (tout le plateau)" : ` (rayon ${r.rayon})`);
  const recolte = l.appros.filter((r) => r.sens === "entrant").map(appro);
  const envoie = l.appros.filter((r) => r.sens === "envoi").map(appro);
  if (recolte.length > 0) lignes.push({ cle: "recolte", libelle: "récolte", texte: recolte.join(" · ") });
  if (envoie.length > 0) lignes.push({ cle: "envoie", libelle: "envoie", texte: envoie.join(" · ") });

  return lignes;
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
      // Les échanges hors du plateau (16/09), déclarés sur les paliers.
      const paliers = paliersDe(tuile);
      if (estQuai(paliers)) bouts.push("quai");
      if (estMarche(paliers)) bouts.push("marché");
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
/**
 * La vue : « tableau » (ages en colonnes, categories en lignes — 17/09) ou
 * « liste » (une ligne par tuile, colonne au choix et tri). Retenue d'une
 * visite a l'autre, comme la colonne.
 */
const CLE_VUE = "sysb.tuiles.vue";
type Vue = "tableau" | "liste";

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
 * Depuis le 2026-09-07, l'essentiel de l'economie se lit SOUS LE NOM, sans
 * choisir de colonne : cout de construction, mobilise, produit, recolte,
 * envoie (palier 1) — voir `lignesSousLeNom`. C'est le choix de l'utilisateur
 * face a deux colonnes fixes de plus.
 */
export default function Tuiles() {
  const { portee, planetes, chargement: chargementPortee } = usePortee();
  const [toutesTuiles, setToutesTuiles] = useState<Tuile[]>([]);
  const [tousModeles, setTousModeles] = useState<Modele3D[]>([]);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [ages, setAges] = useState<Age[]>([]);
  const [technologies, setTechnologies] = useState<Technologie[]>([]);
  const [icones, setIcones] = useState<Icone[]>([]);
  const [socles, setSocles] = useState<Socle[]>([]);
  const [rangees, setRangees] = useState<CategorieRangee[]>([]);
  /**
   * ⚠️ LE PLEIN ECRAN NE SE RETIENT PAS d'une visite a l'autre, contrairement
   * a la vue et au tri : on y entre pour lire le tableau, on n'y vit pas.
   * Retrouver le site sans sa barre laterale en arrivant sur la page
   * passerait pour une panne.
   */
  const [pleinEcran, setPleinEcran] = useState(false);
  /** Une ecriture d'ordre est en cours : les fleches attendent. */
  const [rangementOccupe, setRangementOccupe] = useState(false);
  // ⚠️ Admin seulement : la planète qu'il regarde. "" = toutes.
  const [filtrePlanete, setFiltrePlanete] = useState("");

  // ⚠️ LA PORTÉE (15/09) : un joueur ne voit et n'édite que les tuiles de SA
  // planète, et ne choisit que parmi les modèles 3D qu'on lui a ouverts.
  const tuilesDeLaPortee = useMemo(() => dansLaPortee(portee, toutesTuiles), [portee, toutesTuiles]);
  const tuiles = useMemo(
    () => (portee.admin ? filtrerParPlanete(tuilesDeLaPortee, filtrePlanete) : tuilesDeLaPortee),
    [portee, tuilesDeLaPortee, filtrePlanete],
  );
  const modeles = useMemo(
    () =>
      portee.admin
        ? tousModeles
        : tousModeles.filter((m) => usageDuModele3D(m) === "tuile" && autoriseeSur(m, portee.planete)),
    [portee, tousModeles],
  );
  /**
   * ⚠️⚠️ LE TERRITOIRE DONT ON LIT ET ECRIT L'ORDRE DES CATEGORIES (18/09).
   *
   * L'admin sans filtre regarde LE JEU ; s'il filtre sur la planete d'un joueur,
   * il regarde le domaine de ce joueur. Un joueur regarde le sien, toujours.
   * Sans ca, un rang ecrit chez un joueur se rangerait dans la liste du jeu.
   */
  const planeteRegardee = portee.admin
    ? filtrePlanete === SANS_PLANETE
      ? ""
      : filtrePlanete
    : (portee.planete?.id ?? "");
  const territoire = useMemo(
    () => territoireDe(planetes, planeteRegardee),
    [planetes, planeteRegardee],
  );
  const rangeesDuTerritoire = useMemo(
    () => duTerritoire(rangees, planetes, planeteRegardee),
    [rangees, planetes, planeteRegardee],
  );

  const quota = portee.admin ? null : etatQuota(portee.limites, "tuiles", tuilesDeLaPortee.length);
  const sansPlanete = portee.admin ? toutesTuiles.filter((t) => !(t.planete ?? "")).length : 0;
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ tuile: Tuile | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  // La categorie en cours de reecriture dans TOUT le catalogue, ou null. Elle
  // grise les boutons du formulaire : une rafale de 28 PATCH ne doit pas se
  // relancer par-dessus elle-meme.
  const [categorieOccupee, setCategorieOccupee] = useState<string | null>(null);

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

  const [vue, setVue] = useState<Vue>(() =>
    lirePref(CLE_VUE, "tableau") === "liste" ? "liste" : "tableau",
  );
  const choisirVue = (v: Vue) => {
    setVue(v);
    // ⚠️ La vue Liste n'a pas de plein ecran : y passer sans en sortir
    // laisserait un panneau fixe par-dessus la page, sans bouton pour le
    // fermer.
    if (v !== "tableau") setPleinEcran(false);
    ecrirePref(CLE_VUE, v);
  };

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

  // ⚠️ Les noms de ressources se lisent DANS LE CATALOGUE DE LA PLANÈTE de la
  // tuile : deux planètes peuvent avoir chacune leur « bois » (15/09).
  const ressourcesDe = useMemo(() => {
    const cache = new Map<string, Ressource[]>();
    return (planete: string) => {
      let l = cache.get(planete);
      if (!l) {
        l = duCatalogue(ressources, planetes, planete);
        cache.set(planete, l);
      }
      return l;
    };
  }, [ressources, planetes]);

  const contexte = useCallback(
    (tuile: Tuile): ContexteColonne => ({
      tuile,
      modele: modeleDe(tuile),
      ressources: ressourcesDe(tuile.planete ?? ""),
    }),
    [modeleDe, ressourcesDe],
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
    // Un compte par type declare, plus le reste. ⚠️ Se derive de TYPES_PLATEAU :
    // un type ajoute la-bas se compte ici sans qu'on y revienne.
    const parType = TYPES_PLATEAU.map((t) => ({
      type: t,
      nombre: tuiles.filter((x) => x.typeOfPlateau === t).length,
    }));
    const types = parType.reduce((n, p) => n + p.nombre, 0);
    return {
      total: tuiles.length,
      actives,
      brouillons: tuiles.length - actives,
      parType,
      /** Aucun type connu : une saisie a reprendre, elle ne se posera nulle part. */
      sansType: tuiles.length - types,
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
      // Les socles aussi, et pour la meme raison : leur collection n'existe
      // qu'apres `patch-socles-2026-09-17.js`. Sans elle, le champ Socle dit
      // « aucune couleur declaree » au lieu de fermer le catalogue.
      // L'ordre des categories aussi, et pour la meme raison : sa collection
      // n'existe qu'apres `patch-categories-2026-09-17.js`. Sans elle, les
      // lignes de la grille restent rangees par ordre alphabetique, comme
      // avant le 17/09 — et les fleches ne s'affichent pas.
      const [t, m, r, a, tech, ico, soc, cat] = await Promise.all([
        loadTuiles(),
        loadModeles3D(),
        loadRessources(),
        loadAges().catch(() => [] as Age[]),
        loadTechnologies().catch(() => [] as Technologie[]),
        loadIcones().catch(() => [] as Icone[]),
        loadSocles().catch(() => [] as Socle[]),
        loadCategoriesRangees().catch(() => [] as CategorieRangee[]),
      ]);
      setToutesTuiles(t);
      setTousModeles(m);
      setRessources(r);
      setAges(a);
      setTechnologies(tech);
      setIcones(ico);
      setSocles(soc);
      setRangees(cat);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement du catalogue impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  /**
   * Le plein ecran : Echap en sort, et la page derriere ne defile plus.
   *
   * ⚠️ **Echap ne sort PAS quand la fiche d'une tuile est ouverte** : elle
   * ecoute la meme touche pour se fermer. Sans ce garde, un seul Echap
   * fermerait la fiche ET le plein ecran, et on se retrouverait deux ecrans
   * en arriere sans l'avoir demande.
   *
   * ⚠️ **Le defilement du body est bloque** pendant ce temps : le panneau est
   * `fixed`, donc la molette au-dessus d'une de ses zones non defilantes fait
   * glisser la page cachee derriere — et on la retrouve ailleurs en sortant.
   */
  useEffect(() => {
    if (!pleinEcran) return;

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dialog === null) setPleinEcran(false);
    };
    window.addEventListener("keydown", surTouche);

    const defilementAvant = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", surTouche);
      document.body.style.overflow = defilementAvant;
    };
  }, [pleinEcran, dialog]);


  const enregistrer = async (valeurs: ValeursTuile) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      // ⚠️ Le NUMÉRO (`tileId`) n'est pas envoyé : le serveur l'attribue à la
      // création (max + 1) et ne le change plus ensuite (15/09).
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

  /**
   * L'ordre des lignes de la grille — et des onglets du magasin dans le jeu.
   *
   * ⚠️ Il part des tuiles de la PORTEE, pas des tuiles filtrees : un filtre de
   * planete ne doit pas faire disparaitre une categorie de la liste des rangs,
   * sinon un deplacement fait sous filtre reecrirait un ordre ampute.
   *
   * ⚠️⚠️ MAIS IL EST BORNE AU TERRITOIRE (18/09) : les rangs du jeu et ceux
   * d'un domaine sont deux listes. Melanger les deux ferait ecrire l'ordre du
   * jeu avec les categories d'un joueur — et l'inverse.
   */
  const ordreDesCategories = useMemo(
    () =>
      ordreCategories(
        rangeesDuTerritoire,
        toutesLesCategories(duTerritoire(tuilesDeLaPortee, planetes, planeteRegardee)),
      ),
    [rangeesDuTerritoire, tuilesDeLaPortee, planetes, planeteRegardee],
  );

  /**
   * Monte (`-1`) ou descend (`+1`) une ligne de categorie, et l'ecrit.
   *
   * ⚠️ `visibles` vient de la GRILLE, pas d'ici : c'est elle qui sait quelles
   * lignes un filtre laisse voir, et un cran se compte sur ce qu'on voit.
   *
   * ⚠️ On RECHARGE la collection apres coup plutot que de deviner les rangs
   * ecrits : si deux onglets rangent en meme temps, c'est la base qui tranche.
   */
  const deplacerLigne = async (categorie: string, sens: -1 | 1, visibles: string[]) => {
    const apres = deplacerCategorie(ordreDesCategories, visibles, categorie, sens);
    if (apres === ordreDesCategories) return;

    setRangementOccupe(true);
    setErreur(null);
    try {
      await enregistrerOrdre(apres, rangeesDuTerritoire, territoire);
      setRangees(await loadCategoriesRangees());
    } catch (e) {
      setErreur(
        messageErreur(
          e,
          "Ordre non enregistre. La collection `categories` existe-t-elle " +
            "(patch-categories-2026-09-17.js) ?",
        ),
      );
    } finally {
      setRangementOccupe(false);
    }
  };

  /**
   * Renomme (`nouvelle`) ou retire (`null`) une categorie **dans tout le
   * catalogue**, puis recharge.
   *
   * ⚠️ **Il n'y a pas de table des categories** : une categorie n'existe que
   * parce que des tuiles la portent. « Renommer » veut donc dire « reecrire le
   * champ `categorie` de chacune », et c'est la seule facon d'en changer une.
   *
   * ⚠️ **La tuile ouverte est reecrite comme les autres.** On pourrait croire
   * qu'il faut l'epargner pour ne pas ecraser ce qui n'est pas encore
   * enregistre : non. Le PATCH ne touche QUE le champ `categorie` en base, il
   * ne voit pas le formulaire ; et le formulaire, lui, met sa propre liste a
   * jour de son cote. L'epargner laisserait au contraire l'ancien nom en base
   * si l'utilisateur ferme la fenetre sans enregistrer — et une categorie que
   * porte encore une seule tuile REAPPARAIT dans la liste.
   */
  const majCategorie = async (ancienne: string, nouvelle: string | null) => {
    setCategorieOccupee(ancienne);
    setErreurDialog(null);
    try {
      const aEcrire: { id: string; ligne: string }[] = [];
      // ⚠️ Un joueur ne renomme que dans SES tuiles : c'est tout ce qu'il voit.
      for (const t of tuilesDeLaPortee) {
        const ligne = categorieRenommeeDans(t, ancienne, nouvelle);
        if (ligne !== null) aEcrire.push({ id: t.id, ligne });
      }

      // ⚠️ EN SERIE, pas en `Promise.all`. Vingt-huit ecritures simultanees sur
      // un PocketBase en SQLite, derriere un tunnel Cloudflare, c'est le genre
      // de rafale qui rend un 429 a mi-chemin — et un renommage a moitie fait
      // laisse les deux noms en base, ce qui est pire que ne rien faire.
      for (const { id, ligne } of aEcrire)
        await pb.collection(COLLECTION_TUILES).update(id, { categorie: ligne });

      // ⚠️ LE RANG DOIT SUIVRE LE NOM. Sans ca, la rangee « Vivres » resterait
      // en base sans tuile et « Nourriture » repartirait a la fin de la liste
      // comme une inconnue. Les tuiles, elles, sont DEJA reecrites : si la
      // collection d'ordre refuse, on le dit, on ne defait rien.
      try {
        await synchroniserRenommage(rangeesDuTerritoire, ancienne, nouvelle);
      } catch (e) {
        setErreurDialog(
          messageErreur(e, "Categorie renommee, mais son rang n'a pas suivi."),
        );
      }

      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Renommage refuse."));
    } finally {
      setCategorieOccupee(null);
    }
  };

  /** Ce qu'on lit avant de confirmer une suppression, dans les deux vues. */
  const avertissementSuppression = (tuile: Tuile) => {
    const citants = tuilesCitant(tuiles, tuile.tileId).filter((t) => t.id !== tuile.id);
    return citants.length > 0
      ? `${citants.length} tuile(s) citent l'id ${tuile.tileId} dans leurs regles.`
      : "Cet id ne sera jamais reattribue.";
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
            Une tuile, c'est un modele 3D{" "}
            {portee.admin ? (
              <>
                declare dans{" "}
                <Link to="/3dmodeltuile" className="text-accent hover:underline">
                  3DmodelTuile
                </Link>
              </>
            ) : (
              "qu'on t'a ouvert"
            )}{" "}
            plus son identite de jeu : nom, categorie, couleur, comportement a la destruction. Le
            meme modele peut servir a autant de tuiles que necessaire. La fenetre d'edition porte
            aussi ses <strong>regles de pose</strong>, ses <strong>paliers de cout</strong> et son{" "}
            <strong>stock &amp; appro</strong>, un onglet chacun.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Le choix de la 3e colonne. En haut, a cote des actions : c'est un
              reglage d'affichage, pas une donnee du tableau. */}
          <div className="flex overflow-hidden rounded border border-edge text-xs" role="group" aria-label="Vue">
            {(["tableau", "liste"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={vue === v}
                className={`px-2.5 py-1.5 ${
                  vue === v ? "bg-accent/20 text-white" : "text-slate-400 hover:text-white"
                }`}
                onClick={() => choisirVue(v)}
              >
                {v === "tableau" ? "Tableau" : "Liste"}
              </button>
            ))}
          </div>
          {/* ⚠️ Il n'apparait qu'en vue Tableau : c'est la seule qui gagne
              quelque chose a prendre l'ecran. La liste, elle, tient en
              largeur. */}
          {vue === "tableau" && (
            <button
              type="button"
              className="btn-ghost h-8 px-2 py-1 text-xs"
              onClick={() => setPleinEcran(true)}
              title="Le tableau prend toute la fenetre. Echap pour en sortir."
            >
              Plein ecran
            </button>
          )}
          {vue === "liste" && (
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
          )}
          {portee.admin && planetes.length > 0 && (
            <select
              className="input h-9 w-auto py-1 text-xs"
              value={filtrePlanete}
              onChange={(e) => setFiltrePlanete(e.target.value)}
              title="Planète"
            >
              <option value="">toutes les planètes</option>
              <option value={SANS_PLANETE}>sans planète</option>
              {planetes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          )}
          <button className="btn-ghost" onClick={() => void charger()}>
            Recharger
          </button>
          <button
            className="btn-primary"
            disabled={modeles.length === 0 || !!quota?.refus || (!portee.admin && !portee.planete)}
            title={
              modeles.length === 0
                ? portee.admin
                  ? "Declare d'abord un modele 3D"
                  : "Aucun modele 3D ne t'est ouvert"
                : (quota?.refus ?? undefined)
            }
            onClick={() => {
              setErreurDialog(null);
              setDialog({ tuile: null });
            }}
          >
            + Nouvelle tuile
          </button>
        </div>
      </header>

      <BandeauJoueur
        portee={portee}
        collection="tuiles"
        deja={tuilesDeLaPortee.length}
        chargement={chargementPortee}
      />
      {!portee.admin && !chargement && modeles.length === 0 && (
        <p className="mb-4 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">
          Aucun modèle 3D n'est ouvert à ta planète : une tuile en a besoin. C'est l'administrateur
          qui les partage.
        </p>
      )}
      {sansPlanete > 0 && (
        <p className="mb-4 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">
          {sansPlanete} tuile{sansPlanete > 1 ? "s ne sont rangées" : " n'est rangée"} sur aucune
          planète : le serveur les fait jouer sur les planètes du jeu, jamais chez un joueur.
          Ouvre-les pour choisir leur planète (filtre « sans planète »).
        </p>
      )}

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {!chargement && dansLaPortee(portee, ressources).length === 0 && (
        <p className="mb-4 rounded border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">
          Aucune ressource declaree :{" "}
          <Link to="/ressources" className="underline">
            commence par l'onglet Ressources
          </Link>
          , sinon l'onglet Cout n'aura rien a proposer.
        </p>
      )}

      {/* ⚠️ EN PLEIN ECRAN, CE BLOC SORT DU FLUX (`fixed inset-0`) et couvre
          toute la fenetre, barre laterale comprise. Ce qui reste derriere
          n'est pas cache, il est simplement RECOUVERT — d'ou le fond opaque,
          sans lequel on lirait le titre de la page au travers.

          ⚠️ LES FILTRES ET LE COMPTE PARTENT AVEC LE TABLEAU, c'est tout
          l'interet : un plein ecran qui ne garderait que la grille obligerait
          a en sortir pour filtrer, donc a le quitter tout le temps.

          ⚠️ `z-40`, PAS `z-50` : la fiche d'une tuile est a `z-50`, et elle
          s'ouvre depuis ce tableau. A egalite, elle passerait dessous et le
          clic sur une carte n'ouvrirait rien de visible. */}
      <div
        className={
          pleinEcran
            ? "fixed inset-0 z-40 flex flex-col gap-1 overflow-hidden bg-ink p-3"
            : undefined
        }
      >
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
            {TYPES_PLATEAU.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
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
          {/* ⚠️ La sortie est DANS la barre de filtres, pas dans un coin a
              elle : c'est la seule bande qui reste a l'ecran quoi qu'on
              fasse, et un plein ecran dont on ne voit pas la sortie se ferme
              en rechargeant la page. */}
          {pleinEcran && (
            <button
              type="button"
              className="btn-ghost ml-auto h-8 px-2 py-1 text-xs"
              onClick={() => setPleinEcran(false)}
            >
              Quitter le plein ecran (Echap)
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
          {compte.parType.map((p, i) => (
            <span key={p.type}>
              {i > 0 ? ", " : ""}
              <span className="tabular-nums text-slate-300">{p.nombre}</span> {p.type}
            </span>
          ))}
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
            Une tuile a besoin d'un modele 3D existant.{" "}
            {portee.admin ? (
              <>
                Declare-les dans{" "}
                <Link to="/3dmodeltuile" className="text-accent hover:underline">
                  3DmodelTuile
                </Link>
                , puis reviens ici
              </>
            ) : (
              "Choisis-en un parmi ceux qu'on t'a ouverts"
            )}{" "}
            pour leur donner un cout, des conditions de pose et une production.
          </p>
        </div>
      ) : vue === "tableau" && !chargement ? (
        <GrilleTuiles
          tuiles={tuilesTriees}
          ages={ages}
          ordreCategories={ordreDesCategories}
          peutRanger={portee.admin}
          rangementOccupe={rangementOccupe}
          onDeplacerCategorie={(c, sens, visibles) => void deplacerLigne(c, sens, visibles)}
          probleme={(t) => problemeDeModele(modeleDe(t))}
          avertissement={avertissementSuppression}
          aSupprimer={aSupprimer}
          onOuvrir={(tuile) => {
            setErreurDialog(null);
            setDialog({ tuile });
          }}
          onDemanderSuppression={setASupprimer}
          onSupprimer={(t) => void supprimer(t)}
          plein={pleinEcran}
        />
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
                              className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#39ff14]"
                            >
                              {c.categorie}
                            </td>
                          </tr>
                        )}
                        {c.tuiles.map((tuile) => {
                          const confirme = aSupprimer === tuile.id;
                          const problemeModele = problemeDeModele(modeleDe(tuile));
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
                                {lignesSousLeNom(contexte(tuile)).map((ligne) => (
                                  <p
                                    key={ligne.cle}
                                    className="mt-0.5 text-[11px] leading-tight text-slate-400"
                                  >
                                    <span className="text-slate-500">{ligne.libelle} : </span>
                                    {ligne.texte}
                                  </p>
                                ))}
                              </td>
                              <td className="px-3 py-2">
                                {confirme ? (
                                  <div className="inline-flex flex-col items-start gap-1">
                                    <span className="text-[11px] leading-tight text-red-300">
                                      {avertissementSuppression(tuile)}
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
      </div>

      {dialog && (
        <TuileDialog
          tuile={dialog.tuile}
          tuiles={portee.admin ? toutesTuiles : tuilesDeLaPortee}
          modeles={modeles}
          ressources={ressources}
          ages={ages}
          technologies={technologies}
          portee={portee}
          planetes={planetes}
          icones={icones}
          socles={socles}
          planeteProposee={planeteParDefaut(planetes, "tuiles", filtrePlanete)}
          saving={saving}
          erreur={erreurDialog}
          categorieOccupee={categorieOccupee}
          onCategorie={majCategorie}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}
