import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Vignette } from "@/components/Vignette";
import ChoixTuiles from "@/components/ChoixTuiles";
import { messageErreur, pb } from "@/lib/pb";
import { loadRessources, parAlphabet, type Ressource } from "@/lib/ressources";
import { formatDuree, loadTuiles, tileIdsDe, type Tuile } from "@/lib/tuiles";
// ⚠️ Les ages sont une collection depuis le 2026-08-27 au soir : ils ne sont
// plus ecrits en dur dans `technologies.ts`. C'est l'onglet Ages qui dit
// lesquels existent, et dans quel ordre les bandes se suivent.
import { libelleAge, loadAges, type Age } from "@/lib/ages";
import {
  ageDeduit,
  batimentDe,
  categorieDe,
  COLLECTION_TECHNOLOGIES,
  codesDe,
  codesInterdits,
  coutDe,
  coutVideEnFait,
  effetsDe,
  effetUtile,
  effetVide,
  ligneAchatVide,
  ligneEntretienVide,
  loadTechnologies,
  MODES_EFFET,
  prerequisDeclaresAilleurs,
  prerequisEffectifs,
  SANS_CATEGORIE,
  valeursAvecBatiment,
  type CoutTechno,
  type EffetTechno,
  type ModeEffet,
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
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [ages, setAges] = useState<Age[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ technologie: Technologie | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      // Les tuiles et les ressources alimentent les listes du formulaire : on ne
      // saisit jamais un tileId ni un code de ressource a la main. Chargement
      // tolerant — une techno reste lisible meme si le catalogue ne repond pas.
      const [t, tu, r, a] = await Promise.all([
        loadTechnologies(),
        loadTuiles().catch(() => [] as Tuile[]),
        loadRessources().catch(() => [] as Ressource[]),
        loadAges().catch(() => [] as Age[]),
      ]);
      setTechnologies(t);
      setTuiles(tu);
      setRessources(r);
      setAges(a);
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
   * L'ordre de l'ecran, decide le 2026-08-27 au soir : **par age, puis par
   * categorie**, l'un et l'autre lus sur le BATIMENT ou la techno existe.
   *
   * **Tous les ages declares sont TOUJOURS la, meme vides** : un age absent se
   * lirait comme un age qui n'existe pas, alors qu'il n'attend qu'une saisie.
   * Depuis le 27/08 au soir la liste vient de la collection `ages` — sept
   * aujourd'hui, huit le jour ou il en ajoutera un.
   *
   * ⚠️ Les BROUILLONS — sans batiment relie, donc sans age ni categorie — sont
   * en TETE, pas en fin. Ce sont les idees en cours : les enterrer sous sept
   * sections pleines reviendrait a les perdre.
   */
  const groupes = useMemo(() => {
    const sousGroupes = (liste: Technologie[]) => {
      const par = new Map<string, Technologie[]>();
      for (const t of liste) {
        const c = categorieDe(batimentDe(t, tuiles)) || SANS_CATEGORIE;
        par.set(c, [...(par.get(c) ?? []), t]);
      }
      return [...par.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], "fr", { sensitivity: "base" }))
        .map(([categorie, technos]) => ({ categorie, technos }));
    };

    const brouillons = technologies.filter((t) => !t.batiment);
    const declares = ages.map((a) => a.numero);
    const parAge = declares.map((age) => {
      const liste = technologies.filter((t) => t.batiment && t.age === age);
      return { age, categories: sousGroupes(liste), total: liste.length };
    });

    // Une techno reliee a un batiment SANS age (une case de terrain, ou un
    // batiment dont l'age n'a pas ete rempli) ne tomberait dans aucune bande —
    // pas plus qu'une techno rangee sous un age qui n'est plus declare.
    const horsAge = technologies.filter((t) => t.batiment && !declares.includes(t.age));

    return [
      ...(brouillons.length
        ? [{ age: -1, categories: sousGroupes(brouillons), total: brouillons.length }]
        : []),
      ...parAge,
      ...(horsAge.length
        ? [{ age: 0, categories: sousGroupes(horsAge), total: horsAge.length }]
        : []),
    ];
  }, [technologies, tuiles, ages]);

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
            setDialog({ technologie: null });
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
        <span className="font-medium">Le jeu ne lit pas encore cette table.</span> La regle est
        ecrite — prerequis, deblocages, cout, effets — mais rien ne l'applique : le magasin ne sait
        pas refuser un batiment non debloque, le moteur ne sait pas appliquer un bonus, et rien ne
        met une techno en veille quand son entretien n'est plus paye. Ce qui est saisi ici est le
        vocabulaire ; le faire agir est un second chantier, dans le moteur. Le bouton
        « Technologie » du jeu ouvre pour la meme raison un panneau vide.
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
                  {groupe.age === -1
                    ? "Brouillons — sans batiment relie"
                    : libelleAge(groupe.age, ages)}
                  <span className="ml-2 text-xs tabular-nums text-slate-500">{groupe.total}</span>
                </h2>
                {groupe.age === -1 && (
                  <span className="text-[11px] text-slate-500">
                    Relie un batiment et elles rejoindront leur age
                  </span>
                )}
              </header>

              {groupe.total === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-600">Aucune technologie a cet age.</p>
              ) : (
                groupe.categories.map((c) => (
                  <div key={c.categorie}>
                    {/* La categorie ne s'affiche que s'il y en a plusieurs : un
                        seul sous-titre au-dessus d'une seule liste n'apprend rien. */}
                    {groupe.categories.length > 1 && (
                      <p className="border-b border-edge/40 bg-ink/40 px-4 py-1 text-[10px] uppercase tracking-wide text-slate-500">
                        {c.categorie}
                      </p>
                    )}
                    <ul>
                      {c.technos.map((t) => (
                        <LigneTechno
                          key={t.id}
                          techno={t}
                          tuiles={tuiles}
                          toutes={technologies}
                          confirme={aSupprimer === t.id}
                          onModifier={() => {
                            setErreurDialog(null);
                            setDialog({ technologie: t });
                          }}
                          onSupprimer={() => setASupprimer(t.id)}
                          onConfirmer={() => void supprimer(t)}
                          onAnnuler={() => setASupprimer(null)}
                        />
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          ))}
        </div>
      )}

      {dialog && (
        <TechnologieDialog
          technologie={dialog.technologie}
          technologies={technologies}
          tuiles={tuiles}
          ressources={ressources}
          ages={ages}
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
 * Une ligne de liste doit dire ce que la techno FAIT, pas seulement comment elle
 * s'appelle. La description est un texte libre qui peut etre vide ; le resume,
 * lui, se deduit de ce qui est saisi.
 */
function resumeTechno(t: Technologie, tuiles: Tuile[], toutes: Technologie[]): string {
  const nomDe = (id: number) => tuiles.find((x) => x.tileId === id)?.nom ?? `#${id}`;
  const bouts: string[] = [];
  const debloque = tileIdsDe(t.debloque);
  if (debloque.length) bouts.push("debloque " + debloque.map(nomDe).join(", "));
  const technos = prerequisEffectifs(t.code, toutes);
  if (technos.length) bouts.push("apres " + technos.join(", "));
  const ouvre = codesDe(t.debloque_technos);
  if (ouvre.length) bouts.push("ouvre " + ouvre.join(", "));
  const cout = coutDe(t);
  if (cout.achat.length) bouts.push(cout.achat.map((l) => `${l.quantite} ${l.ressource}`).join(" + "));
  if (cout.entretien.length)
    bouts.push(
      "entretien " +
        cout.entretien.map((l) => `${l.quantite} ${l.ressource}/${formatDuree(l.periode_s)}`).join(", "),
    );
  const effets = effetsDe(t).filter(effetUtile);
  if (effets.length)
    bouts.push(
      effets
        .map((e) => `${e.valeur > 0 ? "+" : ""}${e.valeur}${e.mode === "pourcentage" ? " %" : ""} ${e.ressource} sur ${nomDe(e.tuile)}`)
        .join(" · "),
    );
  return bouts.join(" · ");
}

/** Formulaire : identite en haut, puis les quatre sections de la regle. */
function TechnologieDialog({
  technologie,
  technologies,
  tuiles,
  ressources,
  ages,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  technologie: Technologie | null;
  technologies: Technologie[];
  tuiles: Tuile[];
  ressources: Ressource[];
  /** Les ages declares : ils nomment la bande ou la techno ira se ranger. */
  ages: Age[];
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: ValeursTechnologie) => void;
}) {
  const enEdition = technologie !== null;
  const [code, setCode] = useState(technologie?.code ?? "");
  const [nom, setNom] = useState(technologie?.nom ?? "");
  /**
   * ⚠️ L'age NE SE SAISIT PLUS : il est lu sur le batiment ou la techno existe
   * (decision du 27/08 au soir). Pas de `setAge` — c'est `setBatiment` qui le
   * fait bouger, et `valeursAvecBatiment` qui le recopie a l'enregistrement.
   */
  const [batiment, setBatiment] = useState<number>(technologie?.batiment ?? 0);
  const tuileHote = useMemo(() => batimentDe({ batiment }, tuiles), [batiment, tuiles]);
  const age = ageDeduit(tuileHote);
  const categorie = categorieDe(tuileHote);
  const [description, setDescription] = useState(technologie?.description ?? "");
  const [batimentsRequis, setBatimentsRequis] = useState<number[]>(
    tileIdsDe(technologie?.batiments_requis),
  );
  const [technosRequises, setTechnosRequises] = useState<string[]>(
    codesDe(technologie?.technos_requises),
  );
  const [debloque, setDebloque] = useState<number[]>(tileIdsDe(technologie?.debloque));
  const [debloqueTechnos, setDebloqueTechnos] = useState<string[]>(
    codesDe(technologie?.debloque_technos),
  );
  const [cout, setCout] = useState<CoutTechno>(
    technologie ? coutDe(technologie) : { achat: [], entretien: [] },
  );
  const [effets, setEffets] = useState<EffetTechno[]>(technologie ? effetsDe(technologie) : []);

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

  /**
   * Ce qu'on ne peut pas exiger sans fabriquer un cycle : soi-meme, et tout ce
   * qui depend deja de soi. Recalcule a chaque frappe sur le code, parce qu'une
   * techno neuve n'a pas encore de code et n'interdit donc rien.
   */
  const interdits = useMemo(
    () => codesInterdits(code.trim().toLowerCase(), technologies),
    [code, technologies],
  );

  /** Les prerequis que d'AUTRES fiches lui imposent, en se declarant la debloquer. */
  const venuesDAilleurs = useMemo(
    () => prerequisDeclaresAilleurs(code.trim().toLowerCase(), technologies),
    [code, technologies],
  );

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
          onSubmit(valeursAvecBatiment({
            code: codeNet,
            nom: nom.trim(),
            batiment,
            age,
            ordre: ordreEffectif,
            description: description.trim(),
            batiments_requis: batimentsRequis,
            technos_requises: technosRequises,
            debloque,
            debloque_technos: debloqueTechnos,
            // Les lignes inachevees partent telles quelles : les jeter a
            // l'enregistrement ferait disparaitre sous les yeux de l'admin une
            // ligne qu'il etait en train de remplir. Elles sont signalees en
            // orange, jamais bloquantes — meme regle que les tuiles.
            cout,
            effets,
          }, tuileHote));
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
          <Terme nom="batiment ou elle existe">
            Le batiment auquel la techno appartient. C'est LUI qui donne son age et sa categorie —
            ni l'un ni l'autre ne se saisit, pour qu'ils ne puissent pas contredire le catalogue.
            Laisse « aucun » tant que tu ne sais pas : la techno reste un brouillon, visible en
            tete de l'ecran.
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
            <label className="label" htmlFor="tech-batiment">
              Batiment ou elle existe
            </label>
            <select
              id="tech-batiment"
              className="input"
              value={batiment}
              onChange={(e) => setBatiment(Number(e.target.value) || 0)}
            >
              <option value={0}>— aucun (brouillon) —</option>
              {tuiles.map((t) => (
                <option key={t.tileId} value={t.tileId}>
                  {t.nom}
                  {t.age ? ` — age ${t.age}` : ""}
                </option>
              ))}
            </select>
            {/* L'age et la categorie ne se saisissent pas : ils SONT ceux du
                batiment. Les montrer quand meme, en lecture seule, pour qu'on
                voie tout de suite ou la techno va se ranger. */}
            <p className="mt-1 text-xs text-slate-500">
              {tuileHote ? (
                <>
                  Elle sera rangee dans <span className="text-slate-300">{libelleAge(age, ages)}</span>
                  {categorie ? (
                    <>
                      , categorie <span className="text-slate-300">{categorie}</span>
                    </>
                  ) : (
                    <>, sans categorie (ce batiment n'en porte pas)</>
                  )}
                  .
                </>
              ) : (
                <>
                  Sans batiment, c'est un <span className="text-slate-300">brouillon</span> : elle
                  n'a ni age ni categorie et reste en tete de l'ecran.
                </>
              )}
            </p>
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

        {/* ─── La regle : quatre sections, dans l'ordre ou on y pense ─────────
            d'abord ce qu'il faut pour la chercher, puis ce qu'elle coute, puis
            ce qu'elle apporte. */}

        <Section titre="Prerequis" aide="Ce qu'il faut avant de pouvoir la chercher.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label">Batiments a posseder</p>
              <ChoixTuiles
                tuiles={tuiles}
                choisies={batimentsRequis}
                onChange={setBatimentsRequis}
                vide="Aucune tuile au catalogue."
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Rien de coche = aucune condition de batiment.
              </p>
            </div>
            <div>
              <p className="label">Technos a avoir acquises</p>
              <ChoixTechnos
                technologies={technologies}
                choisies={technosRequises}
                interdits={interdits}
                onChange={setTechnosRequises}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                C'est ce qui fait un arbre plutot qu'une liste. Les technos grisees creeraient un
                cycle : elles dependent deja de celle-ci.
              </p>
              {/*
                ⚠️ Ne JAMAIS taire une condition qui vient d'ailleurs. Sans cette
                ligne, l'admin verrait « aucun prerequis » sur une techno qu'une
                autre declare debloquer — et chercherait longtemps pourquoi elle
                ne s'ouvre pas.
              */}
              {venuesDAilleurs.length > 0 && (
                <p className="mt-1 rounded border border-edge bg-ink/40 px-2 py-1 text-[11px] text-slate-400">
                  Plus, declare depuis l'autre bout :{" "}
                  <span className="text-slate-200">
                    {venuesDAilleurs
                      .map((c) => technologies.find((t) => t.code === c)?.nom ?? c)
                      .join(", ")}
                  </span>{" "}
                  — a decocher dans « ce qu'elle ouvre » de ces technos-la.
                </p>
              )}
            </div>
          </div>
        </Section>

        <Section titre="Cout" aide="Paye une fois, et/ou consomme en continu.">
          <div className="grid gap-4 sm:grid-cols-2">
            <LignesRessource
              titre="A l'acquisition"
              aide="Paye une fois. La techno est acquise tout de suite : pas de duree de recherche."
              ressources={ressources}
              lignes={cout.achat}
              onChange={(achat) => setCout({ ...cout, achat })}
              nouvelle={(code) => ligneAchatVide(code)}
              rendreExtra={null}
            />
            <LignesRessource
              titre="Entretien"
              aide="Consomme a chaque periode, definitivement — comme les vivres d'un habitat. Si ca ne rentre plus, la techno se met en veille."
              ressources={ressources}
              lignes={cout.entretien}
              onChange={(entretien) => setCout({ ...cout, entretien })}
              nouvelle={(code) => ligneEntretienVide(code)}
              rendreExtra={(l, maj) => (
                <label className="flex items-center gap-1 text-[11px] text-slate-500">
                  / 
                  <input
                    type="number"
                    min={1}
                    className="input w-20 py-1 text-xs"
                    value={(l as { periode_s: number }).periode_s}
                    onChange={(e) =>
                      maj({ periode_s: Math.max(1, Number(e.target.value) || 1) })
                    }
                  />
                  s
                </label>
              )}
            />
          </div>
          {coutVideEnFait(cout) && (
            <p className="mt-2 rounded border border-amber-900/60 bg-amber-950/30 p-2 text-[11px] text-amber-200/80">
              Cette techno est gratuite : rien a payer, rien a entretenir.
            </p>
          )}
        </Section>

        <Section
          titre="Ce qu'elle ouvre"
          aide="Les batiments qui deviennent constructibles, et les technos qu'elle rend cherchables."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label">Batiments</p>
              <ChoixTuiles
                tuiles={tuiles}
                choisies={debloque}
                onChange={setDebloque}
                vide="Aucune tuile au catalogue."
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Rien de coche = elle ne debloque aucun batiment. Elle peut n'avoir que des effets.
              </p>
            </div>
            <div>
              <p className="label">Technos</p>
              <ChoixTechnos
                technologies={technologies}
                choisies={debloqueTechnos}
                interdits={interdits}
                onChange={setDebloqueTechnos}
              />
              {/*
                ⚠️ C'est la MEME fleche que « Technos a avoir acquises », vue de
                l'autre bout. Les deux sens se lisent en UNION, jamais en
                concurrence : cocher ici revient exactement a cocher celle-ci
                dans les prerequis de l'autre. D'ou le meme jeu d'interdits — un
                cycle est un cycle, quel que soit le bout par lequel on l'ecrit.
              */}
              <p className="mt-1 text-[11px] text-slate-500">
                Revient a citer celle-ci dans les prerequis de l'autre : c'est la meme fleche, ecrite
                du cote qui t'arrange.
              </p>
            </div>
          </div>
        </Section>

        <Section
          titre="Effets"
          aide="Un chiffre ou un pourcentage, sur une production d'une tuile."
        >
          {effets.length === 0 && (
            <p className="text-[11px] text-slate-600">Aucun effet. Elle ne fait que debloquer.</p>
          )}
          <div className="space-y-2">
            {effets.map((e, i) => {
              const maj = (p: Partial<EffetTechno>) =>
                setEffets(effets.map((x, k) => (k === i ? { ...x, ...p } : x)));
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    className="input w-auto min-w-[10rem] py-1 text-xs"
                    value={e.tuile}
                    onChange={(ev) => maj({ tuile: Number(ev.target.value) || 0 })}
                  >
                    <option value={0}>— quelle tuile ? —</option>
                    {tuiles.map((t) => (
                      <option key={t.tileId} value={t.tileId}>
                        {t.nom}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input w-auto min-w-[9rem] py-1 text-xs"
                    value={e.ressource}
                    onChange={(ev) => maj({ ressource: ev.target.value })}
                  >
                    <option value="">— quelle production ? —</option>
                    {parAlphabet(ressources).map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.nom}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input w-24 py-1 text-xs"
                    value={e.valeur}
                    onChange={(ev) => maj({ valeur: Math.trunc(Number(ev.target.value) || 0) })}
                  />
                  <select
                    className="input w-auto py-1 text-xs"
                    value={e.mode}
                    onChange={(ev) => maj({ mode: ev.target.value as ModeEffet })}
                  >
                    {MODES_EFFET.map((m) => (
                      <option key={m.valeur} value={m.valeur}>
                        {m.libelle}
                      </option>
                    ))}
                  </select>
                  {!effetUtile(e) && (
                    <span className="text-[11px] text-amber-300/80">incomplet — ignore</span>
                  )}
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 hover:text-red-400"
                    onClick={() => setEffets(effets.filter((_, k) => k !== i))}
                  >
                    retirer
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-2 text-xs text-accent hover:underline"
            onClick={() => setEffets([...effets, effetVide()])}
          >
            + un effet
          </button>
          <p className="mt-2 text-[11px] text-slate-500">
            Un effet vise UNE tuile et UNE de ses productions. « toutes les mines », un rayon de
            recolte ou un cout de construction ne sont pas exprimables aujourd'hui — le dire si
            c'est necessaire, ca demande un champ de plus.
          </p>
        </Section>

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

/** Un bloc de formulaire, avec son titre et sa phrase d'aide. */
function Section({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded border border-edge bg-ink/30 p-3">
      <h3 className="text-sm font-medium text-slate-200">{titre}</h3>
      <p className="mb-2 text-[11px] text-slate-500">{aide}</p>
      {children}
    </section>
  );
}

/**
 * Les technos a cocher.
 *
 * ⚠️ Des cases a cocher, jamais un `<select multiple>` — meme lecon que
 * `ChoixTuiles`, elle a coute une refonte le 25/08.
 *
 * ⚠️ Ce qui creerait un CYCLE est desactive, pas cache : une case grisee avec sa
 * raison apprend la regle, une case absente laisse chercher.
 */
function ChoixTechnos({
  technologies,
  choisies,
  interdits,
  onChange,
}: {
  technologies: Technologie[];
  choisies: string[];
  interdits: Set<string>;
  onChange: (codes: string[]) => void;
}) {
  const [filtre, setFiltre] = useState("");
  const q = filtre.trim().toLowerCase();
  const visibles = technologies.filter(
    (t) => choisies.includes(t.code) || q === "" || t.nom.toLowerCase().includes(q),
  );

  if (technologies.length === 0)
    return <p className="text-[11px] text-slate-500">Aucune autre technologie declaree.</p>;

  return (
    <div>
      {technologies.length > 10 && (
        <input
          className="input mb-1 py-1 text-xs"
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          placeholder="filtrer..."
        />
      )}
      <div className="max-h-40 overflow-y-auto rounded border border-edge p-2">
        {visibles.map((t) => {
          const bloque = interdits.has(t.code);
          return (
            <label
              key={t.id}
              className={`flex items-center gap-2 py-0.5 text-xs ${
                bloque ? "text-slate-600" : "text-slate-300"
              }`}
              title={bloque ? "Elle depend deja de celle-ci : ce serait un cycle." : undefined}
            >
              <input
                type="checkbox"
                disabled={bloque}
                checked={choisies.includes(t.code)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...choisies, t.code]
                      : choisies.filter((c) => c !== t.code),
                  )
                }
              />
              <span className="text-[10px] text-slate-500">age {t.age}</span>
              {t.nom}
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Une liste de lignes « ressource + quantite », avec un supplement facultatif
 * (la periode, pour l'entretien).
 *
 * Le meme composant sert aux deux moities du cout : elles ne different que par
 * ce supplement, et deux composants presque identiques divergent toujours.
 */
function LignesRessource<T extends { ressource: string; quantite: number }>({
  titre,
  aide,
  ressources,
  lignes,
  onChange,
  nouvelle,
  rendreExtra,
}: {
  titre: string;
  aide: string;
  ressources: Ressource[];
  lignes: T[];
  onChange: (lignes: T[]) => void;
  nouvelle: (code: string) => T;
  rendreExtra: ((l: T, maj: (p: Partial<T>) => void) => React.ReactNode) | null;
}) {
  const libres = parAlphabet(ressources).filter((r) => !lignes.some((l) => l.ressource === r.code));

  return (
    <div>
      <p className="label">{titre}</p>
      <p className="mb-1 text-[11px] text-slate-500">{aide}</p>
      <div className="space-y-1">
        {lignes.map((l, i) => {
          const maj = (p: Partial<T>) =>
            onChange(lignes.map((x, k) => (k === i ? { ...x, ...p } : x)));
          const r = ressources.find((x) => x.code === l.ressource);
          return (
            <div key={l.ressource + i} className="flex flex-wrap items-center gap-1.5">
              <input
                type="number"
                min={0}
                className="input w-20 py-1 text-xs"
                value={l.quantite}
                onChange={(e) =>
                  maj({ quantite: Math.max(0, Math.trunc(Number(e.target.value) || 0)) } as Partial<T>)
                }
              />
              <span className="text-xs text-slate-300">{r?.nom ?? l.ressource}</span>
              {!r && <span className="text-[11px] text-amber-300/80">code inconnu</span>}
              {rendreExtra?.(l, maj)}
              <button
                type="button"
                className="text-[11px] text-slate-500 hover:text-red-400"
                onClick={() => onChange(lignes.filter((_, k) => k !== i))}
              >
                retirer
              </button>
            </div>
          );
        })}
      </div>
      {libres.length > 0 && (
        <select
          className="input mt-1.5 py-1 text-xs"
          value=""
          onChange={(e) => e.target.value && onChange([...lignes, nouvelle(e.target.value)])}
        >
          <option value="">+ ajouter une ressource...</option>
          {libres.map((r) => (
            <option key={r.code} value={r.code}>
              {r.nom}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/**
 * Une ligne de la liste. Sortie du corps de la page parce qu'elle est
 * maintenant rendue depuis deux boucles imbriquees (age, puis categorie) : la
 * laisser en place aurait mis six niveaux d'indentation entre le `map` et ce
 * qu'il produit.
 */
function LigneTechno({
  techno,
  tuiles,
  toutes,
  confirme,
  onModifier,
  onSupprimer,
  onConfirmer,
  onAnnuler,
}: {
  techno: Technologie;
  tuiles: Tuile[];
  toutes: Technologie[];
  confirme: boolean;
  onModifier: () => void;
  onSupprimer: () => void;
  onConfirmer: () => void;
  onAnnuler: () => void;
}) {
  const hote = batimentDe(techno, tuiles);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-edge/60 px-4 py-2 last:border-0 hover:bg-ink/40">
      <span className="w-10 shrink-0 text-xs tabular-nums text-slate-600">{techno.ordre || 0}</span>
      {/*
        La vignette n'est PAS un champ de `technologies` : elle se deduit du
        `code`, qui est celui de l'arbre — le meme dessin que la tuile porte en
        jeu (`Icones_Tuiles/<code>`). Un code sans dessin rend un carre vide,
        jamais une image cassee.
        ⚠️ A ne pas confondre avec `tuiles.chemin_icone`, qui lui EST stocke
        depuis le 27/08 au soir : les deux tables ne suivent pas la meme regle.
      */}
      <Vignette chemin={`Icones_Tuiles/${techno.code}`} alt="" taille={22} />
      <span className="font-mono text-xs text-slate-200">{techno.code}</span>
      <span className="text-sm text-slate-300">{techno.nom}</span>
      {hote && (
        <span
          className="rounded border border-edge px-1.5 py-0.5 text-[10px] text-slate-500"
          title="Le batiment ou elle existe : c'est lui qui donne son age et sa categorie."
        >
          {hote.nom}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
        {resumeTechno(techno, tuiles, toutes) || techno.description}
      </span>
      {confirme ? (
        <span className="flex items-center gap-3">
          <span className="text-[11px] text-red-300">Vraiment ?</span>
          <button className="text-xs text-red-300 hover:underline" onClick={onConfirmer}>
            Confirmer
          </button>
          <button className="text-xs text-slate-400 hover:text-white" onClick={onAnnuler}>
            Annuler
          </button>
        </span>
      ) : (
        <span className="flex items-center gap-3">
          <button className="text-xs text-accent hover:underline" onClick={onModifier}>
            Modifier
          </button>
          <button className="text-xs text-slate-500 hover:text-red-400" onClick={onSupprimer}>
            Supprimer
          </button>
        </span>
      )}
    </li>
  );
}
