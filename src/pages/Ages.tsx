import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import ChoixTuiles from "@/components/ChoixTuiles";
import { messageErreur, pb } from "@/lib/pb";
import { loadTuiles, type Tuile } from "@/lib/tuiles";
import { loadTechnologies, type Technologie } from "@/lib/technologies";
import {
  COLLECTION_AGES,
  NUMERO_MIN,
  batimentsRequisDe,
  loadAges,
  prochainNumero,
  type Age,
  type ValeursAge,
} from "@/lib/ages";

/**
 * Les ages du jeu.
 *
 * **Demande du 2026-08-27 :** *« fais moi un onglet des ages ! qui servira de
 * base pour les techno et les tuiles »*. Cet ecran est donc la SOURCE : les
 * sept ages etaient ecrits en dur dans le code, ils se saisissent maintenant.
 *
 * ⚠️ Chaque ligne dit **combien de tuiles et de technos s'y rangent** : c'est
 * ce qui fait la difference entre une table de vocabulaire et une base. Un age
 * qu'on s'apprete a renumeroter ou a supprimer montre du meme coup ce qu'il
 * emporte.
 */
export default function Ages() {
  const [ages, setAges] = useState<Age[]>([]);
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [technologies, setTechnologies] = useState<Technologie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ age: Age | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      // Tuiles et technos en chargement TOLERANT : elles ne servent qu'a
      // compter et a alimenter la liste des batiments. Un age reste lisible
      // meme si l'une des deux collections ne repond pas.
      const [a, t, te] = await Promise.all([
        loadAges(),
        loadTuiles().catch(() => [] as Tuile[]),
        loadTechnologies().catch(() => [] as Technologie[]),
      ]);
      setAges(a);
      setTuiles(t);
      setTechnologies(te);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement des ages impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  /** Ce que chaque age porte, et ce qu'une suppression laisserait orphelin. */
  const compte = useMemo(() => {
    const par = new Map<number, { tuiles: number; technos: number }>();
    const ajouter = (n: number, cle: "tuiles" | "technos") => {
      const c = par.get(n) ?? { tuiles: 0, technos: 0 };
      c[cle] += 1;
      par.set(n, c);
    };
    for (const t of tuiles) if (t.age > 0) ajouter(t.age, "tuiles");
    for (const t of technologies) if (t.age > 0) ajouter(t.age, "technos");
    return par;
  }, [tuiles, technologies]);

  /**
   * Des numeros portes par des tuiles ou des technos alors qu'aucun age ne les
   * declare. Ce n'est pas une faute a masquer : c'est la premiere chose a voir
   * en arrivant ici, parce que ces lignes-la sont invisibles ailleurs.
   */
  const orphelins = useMemo(() => {
    const declares = new Set(ages.map((a) => a.numero));
    return [...compte.keys()].filter((n) => !declares.has(n)).sort((x, y) => x - y);
  }, [ages, compte]);

  const nomDe = (tileId: number) => tuiles.find((t) => t.tileId === tileId)?.nom ?? `#${tileId}`;

  const enregistrer = async (valeurs: ValeursAge) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      if (dialog.age) await pb.collection(COLLECTION_AGES).update(dialog.age.id, valeurs);
      else await pb.collection(COLLECTION_AGES).create(valeurs);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refuse."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (age: Age) => {
    setASupprimer(null);
    try {
      await pb.collection(COLLECTION_AGES).delete(age.id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusee."));
    }
  };

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white">Ages</h1>
            {!chargement && ages.length > 0 && (
              <span className="rounded-full border border-edge px-2 py-0.5 text-xs tabular-nums text-slate-400">
                {ages.length}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Les paliers du jeu, et la base des deux autres ecrans : une tuile porte un age, une
            technologie prend celui de son batiment. Le <code className="text-slate-400">numero</code>{" "}
            est ce qui est stocke — le nom, lui, se corrige sans rien casser.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setErreurDialog(null);
            setDialog({ age: null });
          }}
        >
          + Nouvel age
        </button>
      </header>

      {/*
        L'avertissement de la maison : un ecran qui prend de la saisie sans que
        rien ne la lise DOIT le dire. Ici c'est PARTIEL — le classement, lui,
        sert deja partout —, donc l'avertissement ne parle que des batiments.
      */}
      <p className="mb-5 rounded border border-amber-900/60 bg-amber-950/30 p-3 text-sm text-amber-200/90">
        <span className="font-medium">Le classement sert deja</span> : les bandes de l'ecran Tuiles
        et celles de l'ecran Technologie viennent d'ici. En revanche{" "}
        <span className="font-medium">les batiments qui ouvrent un age ne sont lus par personne</span>{" "}
        : le jeu ne verrouille rien, et ne refuse pas de construire hors de son age. C'est le meme
        chantier de moteur que les technologies.
      </p>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {orphelins.length > 0 && (
        <p className="mb-4 rounded border border-amber-900/60 bg-amber-950/30 p-3 text-sm text-amber-200/90">
          Des tuiles ou des technos citent un age qui n'est pas declare ici :{" "}
          {orphelins
            .map(
              (n) =>
                `age ${n} (${compte.get(n)?.tuiles ?? 0} tuiles, ${compte.get(n)?.technos ?? 0} technos)`,
            )
            .join(", ")}
          . Declare-le, ou corrige ces lignes : elles se rangent aujourd'hui dans une bande
          « non declare ».
        </p>
      )}

      {!chargement && ages.length === 0 ? (
        <div className="card p-5 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Aucun age declare.</p>
          <p className="mt-2 max-w-2xl">
            L'arbre en compte sept : Pionniers, Secteur artisanal, Societe urbaine, Ere
            industrielle, Ere spatiale primordiale, Metropole spatiale, Cite spatiale transhumaine.
            Le script <code className="text-slate-300">patch-ages-2026-08-27.js</code> les verse
            d'un coup, avec leur sous-titre et leur batiment de gouvernance.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="w-16 px-3 py-2 font-medium">n°</th>
                <th className="px-3 py-2 font-medium">nom</th>
                <th className="px-3 py-2 font-medium">ce qu'il ouvre</th>
                <th className="w-40 px-3 py-2 font-medium">contenu</th>
                <th className="w-40 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {chargement && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              )}
              {!chargement &&
                ages.map((a) => {
                  const confirme = aSupprimer === a.id;
                  const c = compte.get(a.numero) ?? { tuiles: 0, technos: 0 };
                  const requis = batimentsRequisDe(a);
                  return (
                    <tr key={a.id} className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
                      <td className="px-3 py-2 tabular-nums text-slate-500">{a.numero}</td>
                      <td className="px-3 py-2">
                        <span className="text-slate-200">{a.nom}</span>
                        {a.description?.trim() && (
                          <p className="mt-0.5 text-xs text-slate-500">{a.description}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {requis.length === 0 ? (
                          <span className="text-slate-600">rien de declare</span>
                        ) : (
                          requis.map(nomDe).join(", ")
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums text-slate-500">
                        {c.tuiles} tuile{c.tuiles > 1 ? "s" : ""} · {c.technos} techno
                        {c.technos > 1 ? "s" : ""}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {confirme ? (
                          <>
                            <span className="mr-3 text-[11px] text-red-300">
                              {c.tuiles + c.technos === 0
                                ? "Rien ne s'y range."
                                : `${c.tuiles} tuiles et ${c.technos} technos garderaient un age non declare.`}
                            </span>
                            <button
                              className="text-xs text-red-300 hover:underline"
                              onClick={() => void supprimer(a)}
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
                                setDialog({ age: a });
                              }}
                            >
                              Modifier
                            </button>
                            <button
                              className="ml-3 text-xs text-slate-500 hover:text-red-400"
                              onClick={() => setASupprimer(a.id)}
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
        <AgeDialog
          age={dialog.age}
          ages={ages}
          tuiles={tuiles}
          porte={
            dialog.age
              ? (compte.get(dialog.age.numero) ?? { tuiles: 0, technos: 0 })
              : { tuiles: 0, technos: 0 }
          }
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}

/** Formulaire court : quatre champs, il vit dans le meme fichier. */
function AgeDialog({
  age,
  ages,
  tuiles,
  porte,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  age: Age | null;
  ages: Age[];
  tuiles: Tuile[];
  /** Ce que l'age porte deja — pour prevenir avant un renumerotage. */
  porte: { tuiles: number; technos: number };
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: ValeursAge) => void;
}) {
  const enEdition = age !== null;
  const [numero, setNumero] = useState<string>(String(age?.numero ?? prochainNumero(ages)));
  const [nom, setNom] = useState(age?.nom ?? "");
  const [description, setDescription] = useState(age?.description ?? "");
  const [batiments, setBatiments] = useState<number[]>(age ? batimentsRequisDe(age) : []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const n = Number(numero);
  const numeroInvalide = !Number.isInteger(n) || n < NUMERO_MIN;
  const doublon = ages.find((a) => a.numero === n && a.id !== age?.id) ?? null;
  // Renumeroter, c'est decrocher : les tuiles gardent l'ANCIEN nombre, elles ne
  // suivent pas. On ne l'interdit pas — on le dit avant.
  const decroche = enEdition && n !== age.numero && porte.tuiles + porte.technos > 0;
  const bloque = saving || nom.trim() === "" || numeroInvalide || doublon !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (bloque) return;
          onSubmit({
            numero: n,
            nom: nom.trim(),
            description: description.trim(),
            batiments_requis: batiments,
          });
        }}
        className="card w-full max-w-lg p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-white">
          {enEdition ? `Modifier ${age.nom}` : "Nouvel age"}
        </h2>

        <Aide titre="A quoi servent ces champs">
          <Terme nom="numero">
            Ce qui est STOCKE, sur chaque tuile et chaque techno — comme le code d'une ressource.
            Le changer ne deplace pas ce qui s'y range deja : les tuiles gardent l'ancien nombre et
            se retrouvent sans age declare. A ne toucher qu'a la creation, ou en connaissance de
            cause.
          </Terme>
          <Terme nom="nom">
            Le libelle des bandes d'age, dans Tuiles comme dans Technologie. Modifiable sans
            risque, autant de fois qu'on veut.
          </Terme>
          <Terme nom="description">
            Ce que l'age change, en une phrase — le sous-titre du document d'arbre. Lu par
            l'humain seulement.
          </Terme>
          <Terme nom="batiments qui l'ouvrent">
            Les batiments qu'il faut posseder pour entrer dans cet age : la Mairie pour l'ere
            industrielle, par exemple. Plusieurs sont permis, et ils se lisent comme des
            conditions — il les faut TOUS.
            <br />
            ⚠️ Rien ne les applique aujourd'hui : le jeu ne verrouille aucun age. C'est du
            vocabulaire pose d'avance, comme la regle des technos.
          </Terme>
        </Aide>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="age-numero">
              Numero
            </label>
            <input
              id="age-numero"
              type="number"
              min={NUMERO_MIN}
              step={1}
              className="input"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              L'ordre des paliers. <b>0</b> n'est pas un age : c'est « aucun ».
            </p>
          </div>

          <div>
            <label className="label" htmlFor="age-nom">
              Nom
            </label>
            <input
              id="age-nom"
              className="input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ere industrielle"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="age-description">
            Description
          </label>
          <textarea
            id="age-description"
            className="input min-h-[4rem]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="l'energie entre dans l'equation"
          />
        </div>

        <div className="mt-4">
          <p className="label">Batiments qui ouvrent cet age</p>
          <ChoixTuiles
            tuiles={tuiles}
            choisies={batiments}
            onChange={setBatiments}
            vide="Aucune tuile au catalogue : commence par l'onglet Tuiles."
          />
          <p className="mt-1 text-xs text-slate-500">
            Il les faut tous. Laisse vide si l'age ne depend d'aucune construction.
          </p>
        </div>

        {doublon && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Le numero {n} est deja celui de {doublon.nom}.
          </p>
        )}
        {!doublon && numeroInvalide && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Numero invalide : un entier a partir de {NUMERO_MIN}.
          </p>
        )}
        {decroche && (
          <p className="mt-4 rounded border border-amber-900/60 bg-amber-950/30 p-2 text-sm text-amber-200/90">
            {porte.tuiles} tuiles et {porte.technos} technos portent l'age {age.numero}. Elles ne
            suivront PAS ce changement de numero : elles se retrouveront sans age declare, et il
            faudra les reprendre une par une.
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
