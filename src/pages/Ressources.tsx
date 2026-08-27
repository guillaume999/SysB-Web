import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Vignette } from "@/components/Vignette";
import { messageErreur, pb } from "@/lib/pb";
import { libelleAge, loadAges, numerosDeclares, type Age } from "@/lib/ages";
import { loadTuiles, type Tuile } from "@/lib/tuiles";
import {
  COLLECTION_RESSOURCES,
  GENRES,
  HORS_ARBRE,
  loadRessources,
  rangerParAge,
  type GenreRessource,
  type GroupeAge,
  type Ressource,
  type RessourceRangee,
  type ValeursRessource,
} from "@/lib/ressources";

/**
 * Le vocabulaire des ressources du jeu, **rangé comme l'arbre** — demande du
 * 2026-08-27 : *« un affichage pour ressources comme pour technologie, avec les
 * âges où ils apparaissent (en lien avec les tuiles) et catégories à
 * l'intérieur »*.
 *
 * Un cadre par âge, les catégories en onglets dedans, une carte par ressource.
 *
 * ⚠️ **L'âge et la catégorie ne se saisissent pas** : ils se déduisent des
 * bâtiments qui produisent ou consomment la ressource — voir `rangerParAge`.
 * Rien de neuf n'est stocké, et rien ne peut diverger du catalogue.
 *
 * ⚠️ **La table triable a disparu**, remplacée par cette vue (choix explicite).
 * Le champ `ordre` reste lisible : il trie l'intérieur d'un onglet et s'affiche
 * sur chaque carte, sinon il deviendrait impossible à régler.
 */
export default function Ressources() {
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [ages, setAges] = useState<Age[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ ressource: Ressource | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      // Chargement tolérant sur les deux tables d'appoint : une ressource reste
      // lisible et modifiable même si le catalogue ou les âges ne répondent pas.
      // Sans catalogue, tout tombe dans « hors arbre » — et le bandeau le dit,
      // pour qu'on ne lise pas une panne réseau comme une base vide.
      const [r, t, a] = await Promise.all([
        loadRessources(),
        loadTuiles().catch(() => [] as Tuile[]),
        loadAges().catch(() => [] as Age[]),
      ]);
      setRessources(r);
      setTuiles(t);
      setAges(a);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement des ressources impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const groupes = useMemo(
    () => rangerParAge(ressources, tuiles, numerosDeclares(ages)),
    [ressources, tuiles, ages],
  );

  /**
   * Le détail par genre, en infobulle du compteur : un total seul ne dit pas si
   * les trois genres sont représentés, et c'est la première chose qu'on veut
   * savoir en arrivant.
   */
  const repartition = useMemo(() => {
    const parts = GENRES.map((g) => ({
      libelle: g.libelle,
      n: ressources.filter((r) => r.genre === g.valeur).length,
    }));
    const sansGenre = ressources.filter((r) => !r.genre).length;
    if (sansGenre > 0) parts.push({ libelle: "sans genre", n: sansGenre });
    return parts
      .filter((p) => p.n > 0)
      .map((p) => `${p.n} ${p.libelle}`)
      .join(", ");
  }, [ressources]);

  const enregistrer = async (valeurs: ValeursRessource) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      if (dialog.ressource)
        await pb.collection(COLLECTION_RESSOURCES).update(dialog.ressource.id, valeurs);
      else await pb.collection(COLLECTION_RESSOURCES).create(valeurs);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refuse."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (ressource: Ressource) => {
    setASupprimer(null);
    try {
      await pb.collection(COLLECTION_RESSOURCES).delete(ressource.id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusee."));
    }
  };

  const ouvrir = (ressource: Ressource | null) => {
    setErreurDialog(null);
    setDialog({ ressource });
  };

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white">Ressources</h1>
            {!chargement && ressources.length > 0 && (
              <span
                className="rounded-full border border-edge px-2 py-0.5 text-xs tabular-nums text-slate-400"
                title={repartition}
              >
                {ressources.length}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Le vocabulaire du jeu, rangé dans l'âge où chaque ressource apparaît, et par catégorie
            de bâtiment à l'intérieur. L'âge et la catégorie ne se saisissent pas : ils se lisent
            sur les bâtiments qui la produisent ou la consomment.
          </p>
        </div>
        <button className="btn-primary" onClick={() => ouvrir(null)}>
          + Nouvelle ressource
        </button>
      </header>

      <Aide titre="Comment cet écran range les ressources">
        <Terme nom="âge d'apparition">
          Le plus petit âge où un bâtiment la <strong>produit</strong> ou la{" "}
          <strong>consomme</strong>. Elle n'est listée qu'une fois, à cet âge-là ; un badge
          « aussi âge 3, 4 » dit où elle sert encore.
        </Terme>
        <Terme nom="ce qui compte, et ce qui ne compte pas">
          Seules les lignes de flux d'un palier — <code className="text-slate-400">production</code>{" "}
          et <code className="text-slate-400">utilisation</code>. Le coût de construction, le
          stockage et les règles d'appro ne rangent pas une ressource dans un âge : sinon la
          population, citée dans une centaine de coûts, remonterait à l'âge 1 en prétendant y être
          fabriquée.
        </Terme>
        <Terme nom="catégorie">
          Celle du bâtiment qui la fait apparaître. À âge égal, le{" "}
          <strong>producteur l'emporte</strong> sur le consommateur : une ressource se range là où
          elle naît.
        </Terme>
        <Terme nom="hors arbre">
          Ce qu'aucun bâtiment ne produit ni ne consomme. Ce n'est pas forcément une erreur — une
          ressource de genre <code className="text-slate-400">mobilisé</code> se déclare en places
          dans un coffre, elle n'est jamais fabriquée. Le décompte affiché sur la carte dit ce qui
          la cite quand même, et fait ressortir les codes vraiment orphelins.
        </Terme>
        <Terme nom="ordre">
          L'ordre d'affichage en jeu, dans la barre des ressources. Il trie l'intérieur d'un onglet
          et se lit en petit sur chaque carte.
        </Terme>
      </Aide>

      {erreur && (
        <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {!chargement && ressources.length > 0 && tuiles.length === 0 && (
        <p className="mt-4 rounded border border-amber-900/60 bg-amber-950/30 p-3 text-sm text-amber-200/90">
          <span className="font-medium">Le catalogue des tuiles n'a pas répondu.</span> Sans lui,
          aucun âge ne peut être déduit et tout se retrouve « hors arbre ». Recharge la page — ce
          n'est pas la base des ressources qui est vide.
        </p>
      )}

      {chargement ? (
        <p className="mt-4 text-sm text-slate-500">Chargement...</p>
      ) : ressources.length === 0 ? (
        <div className="card mt-4 p-5 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Aucune ressource declaree.</p>
          <p className="mt-2 max-w-2xl">
            Commence par les bases : bois, pierre, or, ble, viande, et une entree{" "}
            <code className="text-slate-300">population</code> de genre{" "}
            <code className="text-slate-300">mobilise</code>. Sans elles, l'ecran des tuiles n'aura
            rien a proposer dans les couts et les productions.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groupes.map((groupe) => (
            <SectionAge
              key={groupe.numero}
              groupe={groupe}
              ages={ages}
              aSupprimer={aSupprimer}
              onModifier={ouvrir}
              onSupprimer={setASupprimer}
              onConfirmer={(r) => void supprimer(r)}
              onAnnuler={() => setASupprimer(null)}
            />
          ))}
        </div>
      )}

      {dialog && (
        <RessourceDialog
          ressource={dialog.ressource}
          ressources={ressources}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}

/**
 * Un âge : un cadre, ses catégories en onglets, et les cartes de l'onglet
 * ouvert.
 *
 * ⚠️ L'onglet actif est un état LOCAL à la section. Le remonter au parent
 * ferait qu'ouvrir « Matériaux » à l'âge 3 changerait aussi l'âge 5, alors que
 * les deux listes de catégories n'ont rien à voir l'une avec l'autre.
 *
 * ⚠️ Il vaut `null` — « toutes » — et non la première catégorie : arriver sur un
 * écran qui cache d'emblée les trois quarts de ses ressources donnerait à croire
 * qu'elles manquent. Les onglets restreignent, ils ne révèlent pas.
 */
function SectionAge({
  groupe,
  ages,
  aSupprimer,
  onModifier,
  onSupprimer,
  onConfirmer,
  onAnnuler,
}: {
  groupe: GroupeAge;
  ages: Age[];
  aSupprimer: string | null;
  onModifier: (r: Ressource) => void;
  onSupprimer: (id: string) => void;
  onConfirmer: (r: Ressource) => void;
  onAnnuler: () => void;
}) {
  const [onglet, setOnglet] = useState<string | null>(null);
  const horsArbre = groupe.numero === HORS_ARBRE;

  // Une catégorie fermée qui disparaît (dernière ressource déplacée, base
  // rechargée) laisserait la section vide sans rien dire : on retombe sur
  // « toutes » plutôt que d'afficher un onglet qui ne montre plus rien.
  const ouvert = groupe.categories.some((c) => c.categorie === onglet) ? onglet : null;
  const visibles = groupe.categories.filter((c) => ouvert === null || c.categorie === ouvert);

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-edge px-4 py-2.5">
        <h2 className="text-sm font-medium text-slate-200">
          {horsArbre ? "Hors arbre — ni produite ni consommee" : libelleAge(groupe.numero, ages)}
          <span className="ml-2 text-xs tabular-nums text-slate-500">{groupe.total}</span>
        </h2>
        {horsArbre && (
          <span className="text-[11px] text-slate-500">
            Aucun batiment ne la fabrique ni ne la consomme — ce qui est normal pour un genre
            mobilise, et suspect pour un stock
          </span>
        )}
      </header>

      {groupe.total === 0 ? (
        <p className="px-4 py-3 text-xs text-slate-600">Aucune ressource a cet age.</p>
      ) : (
        <>
          {/* Les onglets ne s'affichent qu'a partir de deux categories : un seul
              onglet au-dessus d'une seule liste n'apprend rien et se clique pour
              rien. */}
          {groupe.categories.length > 1 && (
            <div className="flex flex-wrap gap-1.5 border-b border-edge/60 bg-ink/40 px-3 py-2">
              <Onglet
                libelle="Toutes"
                n={groupe.total}
                actif={ouvert === null}
                onClick={() => setOnglet(null)}
              />
              {groupe.categories.map((c) => (
                <Onglet
                  key={c.categorie}
                  libelle={c.categorie}
                  n={c.ressources.length}
                  actif={ouvert === c.categorie}
                  onClick={() => setOnglet(ouvert === c.categorie ? null : c.categorie)}
                />
              ))}
            </div>
          )}

          {visibles.map((c) => (
            <div key={c.categorie}>
              {ouvert === null && groupe.categories.length > 1 && (
                <p className="border-b border-edge/40 bg-ink/20 px-4 py-1 text-[10px] uppercase tracking-wide text-slate-500">
                  {c.categorie}
                </p>
              )}
              <ul className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
                {c.ressources.map((r) => (
                  <CarteRessource
                    key={r.ressource.id}
                    rangee={r}
                    confirme={aSupprimer === r.ressource.id}
                    onModifier={() => onModifier(r.ressource)}
                    onSupprimer={() => onSupprimer(r.ressource.id)}
                    onConfirmer={() => onConfirmer(r.ressource)}
                    onAnnuler={onAnnuler}
                  />
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

/** Un onglet de categorie : un cadre, pas un lien — il porte son compteur. */
function Onglet({
  libelle,
  n,
  actif,
  onClick,
}: {
  libelle: string;
  n: number;
  actif: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
        actif
          ? "border-accent bg-accent/15 text-white"
          : "border-edge bg-panel text-slate-400 hover:border-slate-500 hover:text-slate-200"
      }`}
      title={actif ? "Clique pour revoir toutes les categories" : `N'afficher que ${libelle}`}
    >
      {libelle}
      <span className="ml-1.5 tabular-nums text-slate-500">{n}</span>
    </button>
  );
}

/**
 * La barre de couleur d'une carte dit le GENRE, pas la catégorie : c'est le
 * genre qui change le comportement du moteur, et c'est ce qu'on cherche à
 * repérer d'un coup d'œil dans une grille de soixante-dix cartes.
 */
const COULEUR_GENRE: Record<string, string> = {
  stock: "bg-emerald-500/70",
  mobilise: "bg-amber-500/70",
  indicateur: "bg-violet-500/70",
};

/**
 * Une carte : la vignette, le nom, le code, et ce que la ressource FAIT dans
 * l'arbre. Cliquer ouvre le formulaire — la carte entière, pas un lien
 * « Modifier » de trois pixels.
 */
function CarteRessource({
  rangee,
  confirme,
  onModifier,
  onSupprimer,
  onConfirmer,
  onAnnuler,
}: {
  rangee: RessourceRangee;
  confirme: boolean;
  onModifier: () => void;
  onSupprimer: () => void;
  onConfirmer: () => void;
  onAnnuler: () => void;
}) {
  const { ressource: r, autresAges, citations } = rangee;
  const [tout, setTout] = useState(false);

  const produit = nomsDesBatiments(rangee, "produit");
  const consomme = nomsDesBatiments(rangee, "consomme");
  const caches = Math.max(0, produit.length - MAX_NOMS) + Math.max(0, consomme.length - MAX_NOMS);

  return (
    <li className="relative flex overflow-hidden rounded-lg border border-edge bg-ink/40">
      <span
        aria-hidden
        className={`w-1 shrink-0 ${COULEUR_GENRE[r.genre] ?? "bg-slate-600"}`}
      />
      <div className="min-w-0 flex-1 p-3">
        <button
          type="button"
          onClick={onModifier}
          className="flex w-full items-start gap-2.5 text-left"
          title="Modifier cette ressource"
        >
          <Vignette chemin={r.chemin_icone} alt="" taille={32} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="truncate font-medium text-slate-100">{r.nom}</span>
              <span className="shrink-0 font-mono text-[10px] text-slate-500">{r.code}</span>
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] uppercase tracking-wide text-slate-500">
              <span>{r.genre || "sans genre"}</span>
              <span className="tabular-nums text-slate-600" title="Ordre d'affichage en jeu">
                #{r.ordre || 0}
              </span>
            </span>
          </span>
        </button>

        <div className="mt-2 space-y-1 text-xs">
          <LigneBatiments
            libelle="produite par"
            couleur="text-emerald-300/90"
            batiments={produit}
            tout={tout}
          />
          <LigneBatiments
            libelle="consommee par"
            couleur="text-sky-300/90"
            batiments={consomme}
            tout={tout}
          />
          {caches > 0 && (
            <button
              type="button"
              className="text-[11px] text-accent hover:underline"
              onClick={() => setTout(!tout)}
            >
              {tout ? "replier" : `voir les ${caches} autres`}
            </button>
          )}
          {(citations || autresAges.length > 0) && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {citations && <span className="text-slate-500">{resumeCitations(citations)}</span>}
              {autresAges.length > 0 && (
                <span
                  className="rounded border border-edge px-1.5 py-0.5 text-[10px] text-slate-400"
                  title="Les ages suivants ou elle sert encore"
                >
                  aussi age {autresAges.join(", ")}
                </span>
              )}
            </p>
          )}
        </div>

        {confirme ? (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-red-300">
            Les tuiles qui la citent garderont un code inconnu.
            <button className="hover:underline" onClick={onConfirmer}>
              Confirmer
            </button>
            <button className="text-slate-400 hover:text-white" onClick={onAnnuler}>
              Annuler
            </button>
          </p>
        ) : (
          <button
            className="absolute right-2 top-2 text-xs text-slate-600 hover:text-red-400"
            onClick={onSupprimer}
            title="Supprimer cette ressource"
          >
            &times;
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Combien de batiments on NOMME avant de replier. Quatre : au-dela, une carte
 * de grille devient un paragraphe et l'ecran perd sa forme.
 *
 * ⚠️ Le reste n'est pas cache derriere une infobulle mais derriere un BOUTON.
 * « produite par 3 » ne disait pas par qui, et c'est ce qu'on vient chercher
 * (demande du 27/08) ; une infobulle ne se decouvre pas au doigt.
 */
const MAX_NOMS = 4;

/**
 * Les batiments d'un sens, **du plus ancien au plus recent** : sur un ecran
 * range par ages, l'ordre de l'arbre est le seul qui veuille dire quelque
 * chose. Le `tileId` departage, pour que deux chargements rendent la meme liste.
 */
function nomsDesBatiments(rangee: RessourceRangee, sens: "produit" | "consomme") {
  return rangee.usages
    .filter((u) => u.sens === sens)
    .sort((a, b) => (a.age || 99) - (b.age || 99) || a.tileId - b.tileId);
}

/** Une ligne « produite par X, Y, Z ». Rien du tout si personne. */
function LigneBatiments({
  libelle,
  couleur,
  batiments,
  tout,
}: {
  libelle: string;
  couleur: string;
  batiments: { tileId: number; nom: string; age: number; categorie: string }[];
  tout: boolean;
}) {
  if (batiments.length === 0) return null;
  const montres = tout ? batiments : batiments.slice(0, MAX_NOMS);
  const reste = batiments.length - montres.length;
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5">
      <span className={`shrink-0 ${couleur}`}>{libelle}</span>
      {montres.map((b, i) => (
        <span
          key={b.tileId}
          className="text-slate-300"
          title={`${b.categorie || "sans categorie"} — ${b.age > 0 ? "age " + b.age : "sans age"}`}
        >
          {b.nom}
          {i < montres.length - 1 || reste > 0 ? "," : ""}
        </span>
      ))}
      {reste > 0 && <span className="text-slate-500">+{reste}</span>}
    </p>
  );
}

/**
 * Ce qui cite une ressource sans la faire vivre. Dire « rien ne la cite » quand
 * c'est le cas est le vrai service rendu : c'est ce qui distingue un code
 * orphelin d'une ressource seulement mobilisee.
 */
function resumeCitations(c: { cout: number; stockage: number; appro: number }): string {
  const bouts: string[] = [];
  if (c.cout > 0) bouts.push(`${c.cout} cout${c.cout > 1 ? "s" : ""}`);
  if (c.stockage > 0) bouts.push(`${c.stockage} coffre${c.stockage > 1 ? "s" : ""}`);
  if (c.appro > 0) bouts.push(`${c.appro} appro${c.appro > 1 ? "s" : ""}`);
  return bouts.length === 0 ? "citee nulle part" : `citee par ${bouts.join(", ")}`;
}

/** Formulaire court : il vit dans le meme fichier plutot que d'ouvrir un module pour six champs. */
function RessourceDialog({
  ressource,
  ressources,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  ressource: Ressource | null;
  ressources: Ressource[];
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: ValeursRessource) => void;
}) {
  const enEdition = ressource !== null;
  const [code, setCode] = useState(ressource?.code ?? "");
  const [nom, setNom] = useState(ressource?.nom ?? "");
  const [genre, setGenre] = useState<GenreRessource>(ressource?.genre || "stock");
  const [ordre, setOrdre] = useState<string>(
    String(ressource?.ordre ?? (ressources.length + 1) * 10),
  );
  const [icone, setIcone] = useState(ressource?.chemin_icone ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const codeNet = code.trim().toLowerCase();
  const doublon = ressources.find((r) => r.code === codeNet && r.id !== ressource?.id) ?? null;
  const codeInvalide = codeNet !== "" && !/^[a-z0-9_]+$/.test(codeNet);
  const bloque = saving || codeNet === "" || nom.trim() === "" || doublon !== null || codeInvalide;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (bloque) return;
          onSubmit({
            code: codeNet,
            nom: nom.trim(),
            genre,
            ordre: Number(ordre) || 0,
            chemin_icone: icone.trim(),
          });
        }}
        className="card w-full max-w-lg p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-white">
          {enEdition ? "Modifier la ressource" : "Nouvelle ressource"}
        </h2>

        <Aide titre="A quoi servent ces champs">
          <Terme nom="code">
            Ce que le jeu lit, et ce que les couts et productions des tuiles stockent. Il ne se
            change pas a la legere : les tuiles deja saisies continueraient a citer l'ancien code.
          </Terme>
          <Terme nom="nom">Le libelle montre, ici comme en jeu. Modifiable sans risque.</Terme>
          <Terme nom="genre, stock">
            S'accumule et se depense : bois, pierre, or, viande. Le cas courant.
          </Terme>
          <Terme nom="genre, mobilise">
            S'occupe et se rend, au lieu de se depenser : c'est ce qui permet a un batiment
            d'occuper 6 habitants — ou 20 d'electricite — et de les rendre quand on l'eteint ou
            qu'on le detruit. La population est le premier cas, mais le genre decrit le MECANISME,
            pas le sujet : depuis le 27/08 l'eau, la vapeur, l'electricite, l'energie et la foi
            sont de ce genre. Une centrale DECLARE des places, une usine en OCCUPE.
            <br />
            ⚠️ Une ressource de ce genre ne se produit pas et ne voyage pas : elle se declare en
            PLACES, dans le tableau de stockage d'une tuile. Une tuile qui stocke 12 population
            loge 12 habitants, presents des la pose. C'est pour ca qu'elle n'est proposee ni dans
            la liste « produit » d'un palier, ni dans les regles d'approvisionnement.
          </Terme>
          <Terme nom="genre, indicateur">
            Calcule par le jeu, jamais stocke ni transporte : la satisfaction en est le cas. Elle
            garde son nom, son icone et sa place dans la barre des ressources, mais elle ne
            s'accumule dans aucun coffre et ne monte dans aucune navette.
            <br />
            ⚠️ Comme le genre mobilise, il n'est propose ni dans la liste
            « produit » d'un palier, ni dans les regles d'approvisionnement.
          </Terme>
          <Terme nom="ordre d'affichage">
            L'ordre des listes, ici et dans les formulaires de tuiles. Laisse des trous (10, 20,
            30) pour pouvoir intercaler plus tard sans tout renumeroter.
          </Terme>
          <Terme nom="chemin de la vignette">
            L'icone en jeu, sous Assets/Resources/. A laisser vide tant que les icones ne sont pas
            faites.
          </Terme>
        </Aide>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="res-code">
              code
            </label>
            <input
              id="res-code"
              className="input font-mono text-xs"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ble"
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Ce que le jeu lit. Minuscules, chiffres et underscore.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="res-nom">
              Nom
            </label>
            <input
              id="res-nom"
              className="input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ble"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="res-genre">
              Genre
            </label>
            <select
              id="res-genre"
              className="input"
              value={genre}
              onChange={(e) => setGenre(e.target.value as GenreRessource)}
            >
              {GENRES.map((g) => (
                <option key={g.valeur} value={g.valeur}>
                  {g.libelle}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {GENRES.find((g) => g.valeur === genre)?.aide}
            </p>
          </div>

          <div>
            <label className="label" htmlFor="res-ordre">
              Ordre d'affichage
            </label>
            <input
              id="res-ordre"
              type="number"
              step={1}
              className="input"
              value={ordre}
              onChange={(e) => setOrdre(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="res-icone">
            Chemin de la vignette
          </label>
          <input
            id="res-icone"
            className="input font-mono text-xs"
            value={icone}
            onChange={(e) => setIcone(e.target.value)}
            placeholder="Icones/ble"
          />
          <p className="mt-1 text-xs text-slate-500">
            Chemin sous <code className="text-slate-400">Assets/Resources/</code>, sans extension.
            Laisse vide tant que les icones ne sont pas faites.
          </p>
        </div>

        {doublon && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Le code {codeNet} existe deja ({doublon.nom}).
          </p>
        )}
        {!doublon && codeInvalide && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Code invalide : minuscules, chiffres et underscore uniquement.
          </p>
        )}
        {erreur && (
          <p className="mt-3 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            {erreur}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={bloque}>
            {saving ? "Enregistrement..." : enEdition ? "Enregistrer" : "Creer"}
          </button>
        </div>
      </form>
    </div>
  );
}
