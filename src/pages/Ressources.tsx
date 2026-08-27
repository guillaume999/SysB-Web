import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { messageErreur, pb } from "@/lib/pb";
import {
  COLLECTION_RESSOURCES,
  GENRES,
  loadRessources,
  type GenreRessource,
  type Ressource,
  type ValeursRessource,
} from "@/lib/ressources";

/**
 * Le vocabulaire des ressources du jeu.
 *
 * Une dizaine de records, saisis une fois. Tout le reste du catalogue y fait
 * reference par le `code` : les couts et les productions n'offrent que des listes
 * alimentees par cette table, pour qu'il soit impossible d'ecrire un code que le
 * jeu ne connaitra pas.
 */
export default function Ressources() {
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ ressource: Ressource | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [tri, setTri] = useState<Tri | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setRessources(await loadRessources());
    } catch (e) {
      setErreur(messageErreur(e, "Chargement des ressources impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  /**
   * Trois etats par colonne : croissant, decroissant, puis **retour a l'ordre du
   * jeu**. Sans le troisieme, le champ `ordre` deviendrait impossible a relire
   * une fois qu'on a trie sur autre chose.
   */
  const basculerTri = (colonne: ColonneTri) =>
    setTri((t) =>
      t?.colonne !== colonne ? { colonne, sens: 1 } : t.sens === 1 ? { colonne, sens: -1 } : null,
    );

  /**
   * Un tri d'AFFICHAGE : rien n'est ecrit en base, et `tri === null` rend
   * exactement ce que PocketBase a renvoye, c'est-a-dire l'ordre du jeu
   * (`ordre`, puis `nom`). Voir `loadRessources`.
   */
  const affichees = useMemo(() => {
    if (!tri) return ressources;
    const { colonne, sens } = tri;
    return [...ressources].sort((a, b) => {
      if (colonne === "ordre") {
        const d = (a.ordre || 0) - (b.ordre || 0);
        if (d !== 0) return d * sens;
      } else {
        const va = (a[colonne] ?? "").trim();
        const vb = (b[colonne] ?? "").trim();
        // Une case vide reste en bas dans les deux sens : la remonter en tete
        // au premier clic sur « vignette » ne montrerait que du vide.
        if ((va === "") !== (vb === "")) return va === "" ? 1 : -1;
        const d = va.localeCompare(vb, "fr", { sensitivity: "base" });
        if (d !== 0) return d * sens;
      }
      // Depart toujours identique a rang egal, sinon deux clics sur la meme
      // colonne ne rendraient pas la meme liste.
      return (a.ordre || 0) - (b.ordre || 0) || (a.nom ?? "").localeCompare(b.nom ?? "", "fr");
    });
  }, [ressources, tri]);

  /**
   * Le detail par genre, en infobulle du compteur : un total seul ne dit pas si
   * les 4 genres sont representes, et c'est la premiere chose qu'on veut savoir
   * en arrivant sur l'ecran.
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

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
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
            Le vocabulaire du jeu : une ligne par ressource, saisie une fois. Les couts et les
            productions des tuiles ne proposent que ce qui est declare ici, ce qui evite de se
            retrouver avec <code className="text-slate-400">bois</code>,{" "}
            <code className="text-slate-400">Bois</code> et <code className="text-slate-400">boi</code>{" "}
            dans trois tuiles differentes.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setErreurDialog(null);
            setDialog({ ressource: null });
          }}
        >
          + Nouvelle ressource
        </button>
      </header>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {!chargement && ressources.length === 0 ? (
        <div className="card p-5 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Aucune ressource declaree.</p>
          <p className="mt-2 max-w-2xl">
            Commence par les bases : bois, pierre, or, ble, viande, et une entree{" "}
            <code className="text-slate-300">population</code> de genre{" "}
            <code className="text-slate-300">population</code>. Sans elles, l'ecran des tuiles n'aura
            rien a proposer dans les couts et les productions.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          {tri && (
            <p className="flex flex-wrap items-center gap-2 border-b border-edge/60 px-3 py-2 text-xs text-slate-500">
              Tri d'affichage seulement : l'ordre en jeu reste le champ{" "}
              <code className="text-slate-400">ordre</code>.
              <button className="text-accent hover:underline" onClick={() => setTri(null)}>
                Revenir a l'ordre du jeu
              </button>
            </p>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <EnTete colonne="ordre" libelle="ordre" tri={tri} onTri={basculerTri} largeur="w-16" />
                <EnTete colonne="code" libelle="code" tri={tri} onTri={basculerTri} />
                <EnTete colonne="nom" libelle="nom" tri={tri} onTri={basculerTri} />
                <EnTete colonne="genre" libelle="genre" tri={tri} onTri={basculerTri} largeur="w-28" />
                <EnTete
                  colonne="chemin_icone"
                  libelle="vignette"
                  tri={tri}
                  onTri={basculerTri}
                />
                <th className="w-40 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {chargement && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              )}
              {!chargement &&
                affichees.map((r) => {
                  const confirme = aSupprimer === r.id;
                  return (
                    <tr key={r.id} className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
                      <td className="px-3 py-2 tabular-nums text-slate-500">{r.ordre || 0}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-200">{r.code}</td>
                      <td className="px-3 py-2 text-slate-300">{r.nom}</td>
                      <td className="px-3 py-2">
                        <span className="rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                          {r.genre || "?"}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                        {r.chemin_icone?.trim() || <span className="text-slate-600">a venir</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {confirme ? (
                          <>
                            <span className="mr-3 text-[11px] text-red-300">
                              Les tuiles qui la citent garderont un code inconnu.
                            </span>
                            <button
                              className="text-xs text-red-300 hover:underline"
                              onClick={() => void supprimer(r)}
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
                            <button
                              className="text-xs text-accent hover:underline"
                              onClick={() => {
                                setErreurDialog(null);
                                setDialog({ ressource: r });
                              }}
                            >
                              Modifier
                            </button>
                            <button
                              className="ml-3 text-xs text-slate-500 hover:text-red-400"
                              onClick={() => setASupprimer(r.id)}
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

/** Les colonnes sur lesquelles on peut trier. La derniere colonne ne porte que des boutons. */
type ColonneTri = "ordre" | "code" | "nom" | "genre" | "chemin_icone";
type Tri = { colonne: ColonneTri; sens: 1 | -1 };

/**
 * Un en-tete cliquable. La fleche est toujours dessinee — grisee tant que la
 * colonne ne trie pas : une affordance qui n'apparait qu'au survol ne se
 * decouvre pas au doigt, et ne se decouvre pas du tout si on ne survole jamais.
 */
function EnTete({
  colonne,
  libelle,
  tri,
  onTri,
  largeur,
}: {
  colonne: ColonneTri;
  libelle: string;
  tri: Tri | null;
  onTri: (colonne: ColonneTri) => void;
  largeur?: string;
}) {
  const actif = tri?.colonne === colonne;
  return (
    <th className={`px-3 py-2 font-medium ${largeur ?? ""}`}>
      <button
        type="button"
        className={`flex items-center gap-1 uppercase tracking-wide hover:text-slate-200 ${
          actif ? "text-slate-200" : ""
        }`}
        title={
          actif
            ? tri.sens === 1
              ? "Trie du plus petit au plus grand. Clique pour inverser."
              : "Trie du plus grand au plus petit. Clique pour revenir a l'ordre du jeu."
            : `Trier sur ${libelle}`
        }
        onClick={() => onTri(colonne)}
      >
        {libelle}
        <span className={`text-[10px] ${actif ? "text-accent" : "text-slate-600"}`}>
          {actif ? (tri.sens === 1 ? "\u25b2" : "\u25bc") : "\u21c5"}
        </span>
      </button>
    </th>
  );
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
          <Terme nom="genre, flux">
            N'existe qu'en debit et ne s'accumule pas : energie, eau courante. Un bilan, pas un
            coffre.
          </Terme>
          <Terme nom="genre, mobilise">
            S'occupe et se rend, au lieu de se depenser : c'est ce qui permet a un batiment
            d'occuper 6 habitants et de les rendre quand on l'eteint ou qu'on le detruit. La
            population est le premier cas, mais le genre decrit le MECANISME, pas le sujet.
            <br />
            ⚠️ Une ressource de ce genre ne se produit pas et ne voyage pas : elle se declare en
            PLACES, dans le tableau de stockage d'une tuile. Une tuile qui stocke 12 population
            loge 12 habitants, presents des la pose. C'est pour ca qu'elle n'est proposee ni dans
            la liste « produit » d'un palier, ni dans les regles d'approvisionnement.
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
