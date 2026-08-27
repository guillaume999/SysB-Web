import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Vignette } from "@/components/Vignette";
import { messageErreur, pb } from "@/lib/pb";
import {
  AGES,
  COLLECTION_TECHNOLOGIES,
  libelleAge,
  loadTechnologies,
  NOMS_AGES,
  type Age,
  type Technologie,
  type ValeursTechnologie,
} from "@/lib/technologies";

/**
 * Le vocabulaire des technologies.
 *
 * Meme parti pris que l'ecran Ressources : une ligne par techno, saisie une
 * fois, designee partout ailleurs par son `code`. La difference est qu'ici
 * PERSONNE ne s'en sert encore — ni le site, ni le jeu. C'est assume et c'est
 * ecrit en orange en haut de l'ecran : on saisit le vocabulaire d'abord, la
 * regle viendra ensuite.
 *
 * ⚠️ Les technos sont groupees PAR AGE, pas listees a plat. Un arbre se lit par
 * paliers ; une table triable de 132 lignes ne dirait rien de sa forme.
 */
export default function Technologies() {
  const [technologies, setTechnologies] = useState<Technologie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ technologie: Technologie | null; age: number } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setTechnologies(await loadTechnologies());
    } catch (e) {
      setErreur(messageErreur(e, "Chargement des technologies impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  /**
   * Les sept ages, TOUJOURS les sept, meme vides : un age absent de l'ecran se
   * lirait comme un age qui n'existe pas, alors qu'il n'attend qu'une saisie.
   * Un huitieme groupe « sans age » n'apparait que s'il porte quelque chose.
   */
  const groupes = useMemo(() => {
    const parAge = AGES.map((age) => ({
      age: age as number,
      technos: technologies.filter((t) => t.age === age),
    }));
    const orphelines = technologies.filter((t) => !AGES.includes(t.age as Age));
    return orphelines.length > 0 ? [...parAge, { age: 0, technos: orphelines }] : parAge;
  }, [technologies]);

  const enregistrer = async (valeurs: ValeursTechnologie) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      if (dialog.technologie)
        await pb.collection(COLLECTION_TECHNOLOGIES).update(dialog.technologie.id, valeurs);
      else await pb.collection(COLLECTION_TECHNOLOGIES).create(valeurs);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refuse."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (technologie: Technologie) => {
    setASupprimer(null);
    try {
      await pb.collection(COLLECTION_TECHNOLOGIES).delete(technologie.id);
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
            <h1 className="text-xl font-semibold text-white">Technologies</h1>
            {!chargement && technologies.length > 0 && (
              <span className="rounded-full border border-edge px-2 py-0.5 text-xs tabular-nums text-slate-400">
                {technologies.length}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Une ligne par technologie, rangee dans l'age ou elle apparait. Comme pour les
            ressources, le <code className="text-slate-400">code</code> est ce que le reste du
            catalogue citera : on le fixe une fois et on n'y revient plus.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setErreurDialog(null);
            setDialog({ technologie: null, age: 1 });
          }}
        >
          + Nouvelle technologie
        </button>
      </header>

      {/*
        L'avertissement de la maison : un ecran qui prend de la saisie sans que
        rien ne la lise DOIT le dire. Le retirer le jour ou le mecanisme existe,
        pas avant.
      */}
      <p className="mb-5 rounded border border-amber-900/60 bg-amber-950/30 p-3 text-sm text-amber-200/90">
        <span className="font-medium">Rien ne lit encore cette table.</span> On y saisit pour
        l'instant l'identite d'une techno — code, nom, age, ordre, une phrase. Ce qu'une techno{" "}
        <em>coute</em> et ce qu'elle <em>debloque</em> n'est pas decide : quand la regle sera
        arretee, les champs seront ajoutes ici et le jeu les lira. Le bouton « Technologie » du jeu
        ouvre pour la meme raison un panneau vide.
      </p>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {chargement ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="space-y-4">
          {groupes.map((groupe) => (
            <section key={groupe.age} className="card overflow-hidden">
              <header className="flex items-center justify-between gap-3 border-b border-edge px-4 py-2.5">
                <h2 className="text-sm font-medium text-slate-200">
                  {libelleAge(groupe.age)}
                  <span className="ml-2 text-xs tabular-nums text-slate-500">
                    {groupe.technos.length}
                  </span>
                </h2>
                {groupe.age !== 0 && (
                  <button
                    className="text-xs text-accent hover:underline"
                    onClick={() => {
                      setErreurDialog(null);
                      setDialog({ technologie: null, age: groupe.age });
                    }}
                  >
                    + ajouter ici
                  </button>
                )}
              </header>

              {groupe.technos.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-600">Aucune technologie a cet age.</p>
              ) : (
                <ul>
                  {groupe.technos.map((t) => {
                    const confirme = aSupprimer === t.id;
                    return (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-edge/60 px-4 py-2 last:border-0 hover:bg-ink/40"
                      >
                        <span className="w-10 shrink-0 text-xs tabular-nums text-slate-600">
                          {t.ordre || 0}
                        </span>
                        {/*
                          La vignette n'est PAS un champ de la table : elle se
                          deduit du `code`, qui est celui de l'arbre — le meme
                          dessin que la tuile porte en jeu (`Icones_Tuiles/<code>`).
                          Un code sans dessin rend un carre vide, jamais une
                          image cassee. C'est ce qui evite un `chemin_icone` de
                          plus a saisir et a tenir a jour.
                        */}
                        <Vignette chemin={`Icones_Tuiles/${t.code}`} alt="" taille={22} />
                        <span className="font-mono text-xs text-slate-200">{t.code}</span>
                        <span className="text-sm text-slate-300">{t.nom}</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                          {t.description}
                        </span>
                        {confirme ? (
                          <span className="flex items-center gap-3">
                            <span className="text-[11px] text-red-300">Vraiment ?</span>
                            <button
                              className="text-xs text-red-300 hover:underline"
                              onClick={() => void supprimer(t)}
                            >
                              Confirmer
                            </button>
                            <button
                              className="text-xs text-slate-400 hover:text-white"
                              onClick={() => setASupprimer(null)}
                            >
                              Annuler
                            </button>
                          </span>
                        ) : (
                          <span className="flex items-center gap-3">
                            <button
                              className="text-xs text-accent hover:underline"
                              onClick={() => {
                                setErreurDialog(null);
                                setDialog({ technologie: t, age: t.age });
                              }}
                            >
                              Modifier
                            </button>
                            <button
                              className="text-xs text-slate-500 hover:text-red-400"
                              onClick={() => setASupprimer(t.id)}
                            >
                              Supprimer
                            </button>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {dialog && (
        <TechnologieDialog
          technologie={dialog.technologie}
          ageParDefaut={dialog.age}
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

/** Formulaire court : il vit dans le meme fichier plutot que d'ouvrir un module pour cinq champs. */
function TechnologieDialog({
  technologie,
  ageParDefaut,
  technologies,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  technologie: Technologie | null;
  ageParDefaut: number;
  technologies: Technologie[];
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: ValeursTechnologie) => void;
}) {
  const enEdition = technologie !== null;
  const [code, setCode] = useState(technologie?.code ?? "");
  const [nom, setNom] = useState(technologie?.nom ?? "");
  const [age, setAge] = useState<number>(technologie?.age || ageParDefaut || 1);
  const [description, setDescription] = useState(technologie?.description ?? "");

  /**
   * Une nouvelle techno prend le rang suivant DE SON AGE, pas de la table
   * entiere : les ordres se comparent a l'interieur d'un age, et repartir a 10 a
   * chaque palier garde des nombres lisibles. Des trous de 10 pour intercaler
   * plus tard sans tout renumeroter.
   */
  const ordreSuivant = useMemo(() => {
    const memeAge = technologies.filter((t) => t.age === age && t.id !== technologie?.id);
    return memeAge.reduce((max, t) => Math.max(max, t.ordre || 0), 0) + 10;
  }, [technologies, age, technologie?.id]);

  const [ordre, setOrdre] = useState<string>(String(technologie?.ordre ?? ""));
  const ordreEffectif = ordre.trim() === "" ? ordreSuivant : Number(ordre) || 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const codeNet = code.trim().toLowerCase();
  const doublon = technologies.find((t) => t.code === codeNet && t.id !== technologie?.id) ?? null;
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
            age,
            ordre: ordreEffectif,
            description: description.trim(),
          });
        }}
        className="card w-full max-w-lg p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-white">
          {enEdition ? "Modifier la technologie" : "Nouvelle technologie"}
        </h2>

        <Aide titre="A quoi servent ces champs">
          <Terme nom="code">
            Ce que le jeu lira, et ce que les tuiles citeront le jour ou une techno en debloquera.
            Il ne se change pas a la legere.
          </Terme>
          <Terme nom="nom">Le libelle montre, ici comme en jeu. Modifiable sans risque.</Terme>
          <Terme nom="age">
            Le palier de l'arbre ou la techno apparait. Les sept ages, et leurs noms, sont ceux
            de arbre_sysb.json — la source de verite de l'arbre des tuiles. Ils ne se saisissent
            pas ici : deux jeux de noms pour les memes sept ages, et plus personne ne sait lequel
            est le bon.
          </Terme>
          <Terme nom="ordre">
            La place dans SON age, pas dans la table entiere. Laisse vide pour prendre le rang
            suivant ; les trous de 10 permettent d'intercaler plus tard.
          </Terme>
          <Terme nom="description">
            Une phrase pour toi, pas pour le moteur. Ce qu'elle coute et ce qu'elle debloque n'a
            pas encore de champ : ecris-le ici en attendant, ca ne se perdra pas.
          </Terme>
        </Aide>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tech-code">
              code
            </label>
            <input
              id="tech-code"
              className="input font-mono text-xs"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="roue"
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Ce que le jeu lit. Minuscules, chiffres et underscore.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="tech-nom">
              Nom
            </label>
            <input
              id="tech-nom"
              className="input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="La roue"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="tech-age">
              Age
            </label>
            <select
              id="tech-age"
              className="input"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
            >
              {AGES.map((a) => (
                <option key={a} value={a}>
                  {a} — {NOMS_AGES[a]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="tech-ordre">
              Ordre dans l'age
            </label>
            <input
              id="tech-ordre"
              type="number"
              step={1}
              className="input"
              value={ordre}
              onChange={(e) => setOrdre(e.target.value)}
              placeholder={String(ordreSuivant)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Vide = {ordreSuivant}, le rang suivant de cet age.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="tech-description">
            Description
          </label>
          <textarea
            id="tech-description"
            className="input min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ce qu'elle apporte, ce qu'elle devrait couter, ce qu'elle devrait ouvrir."
          />
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
