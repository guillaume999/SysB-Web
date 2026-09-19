// ============================================================
//  Unites.tsx
//  ONGLET UNITÉS (19/09) — ce qu'un bâtiment de production peut sortir sur un
//  champ de bataille.
//
//  Il se lit comme l'onglet Tuiles : une liste filtrable, une fiche par entrée,
//  un bloc d'aide par section. Mais une unité n'est PAS une tuile — pas de
//  tileId, pas de type de plateau, pas de règle de placement (voir l'en-tête de
//  `lib/unites.ts`). Ce qui la borne, c'est l'ÂGE du plateau Univers.
//
//  ⚠️ LE CATALOGUE DE DÉPART ARRIVE PAR UN PATCH, en `actif = false`
//  (`patch-unites-2026-09-19.js`, 89 unités). Cet écran est fait pour RELIRE et
//  COCHER, pas pour tout saisir à la main.
//
//  ⚠️ Comme partout : cet écran cache des choses, il n'en protège aucune. Ce
//  qui protège `unites`, c'est sa règle d'API (écriture admin).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Vignette } from "@/components/Vignette";
import { libelleAge, loadAges, type Age } from "@/lib/ages";
import { libelle as libelleModele, loadModeles3D, type Modele3D } from "@/lib/modeles3d";
import { messageErreur } from "@/lib/pb";
import { loadIcones, type Icone } from "@/lib/planetes";
import { parAlphabet, loadRessources, type Ressource } from "@/lib/ressources";
import {
  AGE_DES_AXES,
  AXES,
  CIBLES_AUTO,
  CONTRES,
  PILOTAGES,
  UNITE_VIDE,
  accessiblesA,
  avertissementsUnite,
  coutDe,
  entierDe,
  erreursUnite,
  libelleAxe,
  libelleCibleAuto,
  libelleContre,
  loadUnites,
  enregistrerUnite,
  resumeCout,
  supprimerUnite,
  type AxeUnite,
  type CibleAuto,
  type Contre,
  type LigneCoutUnite,
  type Pilotage,
  type Unite,
  type ValeursUnite,
} from "@/lib/unites";

type Filtres = { texte: string; age: string; axe: string; pilotage: string; actif: string };
const FILTRES_VIDES: Filtres = { texte: "", age: "", axe: "", pilotage: "", actif: "" };

export default function Unites() {
  const [unites, setUnites] = useState<Unite[]>([]);
  const [ages, setAges] = useState<Age[]>([]);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [modeles, setModeles] = useState<Modele3D[]>([]);
  const [icones, setIcones] = useState<Icone[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES);
  const [dialog, setDialog] = useState<{ unite: Unite | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      // ⚠️ Les quatre listes d'appoint en chargement TOLÉRANT : elles servent à
      // nommer et à proposer. L'écran doit s'ouvrir même si l'une ne répond
      // pas — sinon une icône manquante cacherait tout le catalogue d'unités.
      const [u, a, r, m, i] = await Promise.all([
        loadUnites(),
        loadAges().catch(() => [] as Age[]),
        loadRessources().catch(() => [] as Ressource[]),
        loadModeles3D().catch(() => [] as Modele3D[]),
        loadIcones().catch(() => [] as Icone[]),
      ]);
      setUnites(u);
      setAges(a);
      setRessources(r);
      setModeles(m);
      setIcones(i);
    } catch (e) {
      setErreur(
        messageErreur(
          e,
          "Chargement des unités impossible. La collection `unites` existe-t-elle ? " +
            "(patch-univers-2026-09-19.js, puis patch-unites-2026-09-19.js pour le catalogue)",
        ),
      );
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const visibles = useMemo(() => {
    const q = filtres.texte.trim().toLowerCase();
    return unites.filter(
      (u) =>
        (q === "" || u.nom.toLowerCase().includes(q) || u.code.includes(q)) &&
        (filtres.age === "" || String(u.age) === filtres.age) &&
        (filtres.axe === "" || u.axe === (filtres.axe === "commun" ? "" : filtres.axe)) &&
        (filtres.pilotage === "" || u.pilotage === filtres.pilotage) &&
        (filtres.actif === "" || String(u.actif) === filtres.actif),
    );
  }, [unites, filtres]);

  const actives = unites.filter((u) => u.actif).length;
  /** Ce qu'un joueur verrait vraiment dans son bâtiment, à l'âge filtré. */
  const disponibles = filtres.age === "" ? null : accessiblesA(Number(filtres.age), unites).length;

  const enregistrer = async (v: ValeursUnite) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      await enregistrerUnite(dialog.unite, v);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (u: Unite) => {
    setErreur(null);
    try {
      await supprimerUnite(u.id);
      setASupprimer(null);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression refusée."));
    }
  };

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Unités</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Ce qu'un bâtiment de production peut sortir sur un champ de bataille. L'âge du plateau
            Univers borne ce qui est admis — son âge et tous les précédents. Une unité ne dépend{" "}
            <b>pas</b> de la planète : deux joueurs venus d'ailleurs ont les mêmes.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => void charger()}>
            Recharger
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setErreurDialog(null);
              setDialog({ unite: null });
            }}
          >
            Nouvelle unité
          </button>
        </div>
      </header>

      <Aide titre="Ce qu'il faut savoir avant d'en saisir une">
        <Terme nom="code">
          La clé, comme pour une ressource : minuscules, chiffres et « _ ». Une unité n'a{" "}
          <b>pas de tileId</b> — elle ne s'écrit jamais dans la grille d'un plateau, elle bouge
          dessus.
        </Terme>
        <Terme nom="âge">
          Le seul filtre. À l'âge 5, un joueur a accès aux unités des âges 1 à 5, toutes planètes
          confondues. L'âge 0 veut dire « hors âge » : aucun plateau ne l'admettra.
        </Terme>
        <Terme nom="axe">
          Vide avant l'âge {AGE_DES_AXES} — c'est là que la conception fait apparaître les bâtiments
          d'axe. Ensuite : Science bat Génétique, Génétique bat Archéomages, Archéomages bat Science.
        </Terme>
        <Terme nom="cible automatique / contre">
          Deux choses différentes, et c'est pour ça qu'il y a deux champs. La{" "}
          <b>cible automatique</b> est ce que vise une unité de vague quand elle avance seule ; le{" "}
          <b>contre</b> est la famille qu'elle domine, et il vaut pour toutes les unités.
        </Terme>
        <Terme nom="vague automatique">
          Elle sort seule du bâtiment de chaque camp et suit son chemin, réglé sur le modèle de
          damier. Elle est <b>gratuite</b> : son coût reste vide, et l'écran le refuse autrement.
        </Terme>
        <Terme nom="active">
          Une unité décochée n'entre dans aucune bataille. Les 89 unités du catalogue arrivent
          décochées : on les relit, on ajuste les chiffres, puis on coche.
        </Terme>
      </Aide>

      {erreur && (
        <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <div className="card mt-4 flex flex-wrap items-end gap-3 p-3">
        <div>
          <label className="label" htmlFor="u-q">
            Chercher
          </label>
          <input
            id="u-q"
            className="input h-9 w-52 py-1"
            value={filtres.texte}
            placeholder="nom ou code…"
            onChange={(e) => setFiltres({ ...filtres, texte: e.target.value })}
          />
        </div>
        <Filtre
          id="u-age"
          libelle="Âge"
          valeur={filtres.age}
          onChange={(age) => setFiltres({ ...filtres, age })}
          options={[0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
            valeur: String(n),
            libelle: n === 0 ? "hors âge" : libelleAge(n, ages),
          }))}
        />
        <Filtre
          id="u-axe"
          libelle="Axe"
          valeur={filtres.axe}
          onChange={(axe) => setFiltres({ ...filtres, axe })}
          options={AXES.map((a) => ({ valeur: a.valeur === "" ? "commun" : a.valeur, libelle: a.libelle }))}
        />
        <Filtre
          id="u-pilotage"
          libelle="Pilotage"
          valeur={filtres.pilotage}
          onChange={(pilotage) => setFiltres({ ...filtres, pilotage })}
          options={PILOTAGES.map((p) => ({ valeur: p.valeur, libelle: p.libelle }))}
        />
        <Filtre
          id="u-actif"
          libelle="État"
          valeur={filtres.actif}
          onChange={(actif) => setFiltres({ ...filtres, actif })}
          options={[
            { valeur: "true", libelle: "actives" },
            { valeur: "false", libelle: "brouillons" },
          ]}
        />
        <div className="ml-auto text-right text-xs text-slate-500">
          <p>
            {visibles.length} / {unites.length} unité{unites.length > 1 ? "s" : ""} ·{" "}
            <b className="text-slate-300">{actives}</b> active{actives > 1 ? "s" : ""}
          </p>
          {disponibles !== null && (
            <p className="mt-0.5">
              un joueur à cet âge en produit <b className="text-slate-300">{disponibles}</b> (son âge
              et les précédents)
            </p>
          )}
        </div>
      </div>

      {chargement && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}

      {!chargement && unites.length === 0 && (
        <p className="card mt-4 p-4 text-sm text-slate-500">
          Aucune unité. Le catalogue de départ se verse avec{" "}
          <code className="font-mono text-slate-300">patch-unites-2026-09-19.js</code> (89 unités,
          toutes décochées) — après{" "}
          <code className="font-mono text-slate-300">patch-univers-2026-09-19.js</code>, qui crée la
          collection.
        </p>
      )}

      {!chargement && unites.length > 0 && (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Unité</th>
                <th className="px-3 py-2">Âge</th>
                <th className="px-3 py-2">Axe</th>
                <th className="px-3 py-2 text-right">Vie</th>
                <th className="px-3 py-2 text-right">Dég.</th>
                <th className="px-3 py-2 text-right">Port.</th>
                <th className="px-3 py-2 text-right">Vit.</th>
                <th className="px-3 py-2">Auto</th>
                <th className="px-3 py-2">Contre</th>
                <th className="px-3 py-2">Coût</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {visibles.map((u) => {
                const icone = icones.find((i) => i.id === u.icone);
                return (
                  <tr key={u.id} className={`border-b border-edge/40 ${u.actif ? "" : "opacity-60"}`}>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <Vignette chemin={icone?.chemin} alt="" taille={24} />
                        <span>
                          <span className="text-slate-200">{u.nom}</span>
                          {u.pilotage === "auto" && (
                            <span className="ml-1.5 rounded border border-accent/40 px-1 text-[10px] uppercase text-accent">
                              vague
                            </span>
                          )}
                          {!u.actif && <span className="ml-1.5 text-[10px] uppercase text-slate-600">brouillon</span>}
                          <br />
                          <span className="font-mono text-[11px] text-slate-500">{u.code}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{u.age === 0 ? "—" : u.age}</td>
                    <td className="px-3 py-2 text-slate-400">{u.axe === "" ? "—" : libelleAxe(u.axe)}</td>
                    <td className="px-3 py-2 text-right text-slate-300">{u.vie}</td>
                    <td className="px-3 py-2 text-right text-slate-300">{u.degats}</td>
                    <td className="px-3 py-2 text-right text-slate-300">{u.portee}</td>
                    <td className="px-3 py-2 text-right text-slate-300">{u.vitesse}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{libelleCibleAuto(u.cible_auto)}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{libelleContre(u.contre)}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{resumeCout(coutDe(u))}</td>
                    <td className="px-3 py-2 text-right">
                      {aSupprimer === u.id ? (
                        <span className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-400">Supprimer ?</span>
                          <button className="btn-danger" onClick={() => void supprimer(u)}>
                            Oui
                          </button>
                          <button className="btn-ghost" onClick={() => setASupprimer(null)}>
                            Non
                          </button>
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-2">
                          <button
                            className="btn-ghost"
                            onClick={() => {
                              setErreurDialog(null);
                              setDialog({ unite: u });
                            }}
                          >
                            Modifier
                          </button>
                          <button className="btn-danger" onClick={() => setASupprimer(u.id)}>
                            Supprimer
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={11}>
                    Aucune unité ne correspond à ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <UniteDialog
          unite={dialog.unite}
          autres={unites.filter((u) => u.id !== dialog.unite?.id)}
          ages={ages}
          ressources={ressources}
          modeles={modeles}
          icones={icones}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}

/** Un filtre : « tout » plus des valeurs. Le même bloc cinq fois. */
function Filtre({
  id,
  libelle,
  valeur,
  options,
  onChange,
}: {
  id: string;
  libelle: string;
  valeur: string;
  options: { valeur: string; libelle: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {libelle}
      </label>
      <select id={id} className="input h-9 py-1" value={valeur} onChange={(e) => onChange(e.target.value)}>
        <option value="">tout</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </div>
  );
}

function UniteDialog({
  unite,
  autres,
  ages,
  ressources,
  modeles,
  icones,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  unite: Unite | null;
  autres: Unite[];
  ages: Age[];
  ressources: Ressource[];
  modeles: Modele3D[];
  icones: Icone[];
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (v: ValeursUnite) => void;
}) {
  const [v, setV] = useState<ValeursUnite>(() =>
    unite
      ? {
          code: unite.code,
          nom: unite.nom,
          description: unite.description ?? "",
          modele: unite.modele ?? "",
          icone: unite.icone ?? "",
          age: unite.age ?? 0,
          axe: unite.axe ?? "",
          pilotage: unite.pilotage ?? "joueur",
          vie: unite.vie ?? 1,
          degats: unite.degats ?? 0,
          portee: unite.portee ?? 0,
          vitesse: unite.vitesse ?? 0,
          cible_auto: unite.cible_auto ?? "",
          contre: unite.contre ?? "",
          cout: coutDe(unite),
          actif: unite.actif === true,
        }
      : UNITE_VIDE,
  );
  const maj = (patch: Partial<ValeursUnite>) => setV((x) => ({ ...x, ...patch }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const erreurs = erreursUnite(v, autres, ressources);
  const notes = avertissementsUnite(v);
  const iconeChoisie = icones.find((i) => i.id === v.icone);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form
        className="card w-full max-w-3xl p-5 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (erreurs.length === 0 && !saving) onSubmit(v);
        }}
      >
        <h2 className="text-lg font-semibold text-white">
          {unite ? `Modifier ${unite.nom}` : "Nouvelle unité"}
        </h2>

        {/* --- Identité --- */}
        <Section titre="Identité">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="u-nom" libelle="Nom">
              <input
                id="u-nom"
                className="input"
                value={v.nom}
                placeholder="Milicien à l'épieu"
                onChange={(e) => maj({ nom: e.target.value })}
              />
            </Champ>
            <Champ id="u-code" libelle="Code">
              <input
                id="u-code"
                className="input font-mono"
                value={v.code}
                placeholder="milicien_epieu"
                onChange={(e) => maj({ code: e.target.value })}
              />
            </Champ>
          </div>
          <Champ id="u-desc" libelle="Description">
            <textarea
              id="u-desc"
              className="input h-16"
              value={v.description}
              placeholder="Ce qu'elle fait, en une phrase."
              onChange={(e) => maj({ description: e.target.value })}
            />
          </Champ>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="u-age" libelle="Âge">
              <select
                id="u-age"
                className="input"
                value={v.age}
                onChange={(e) => maj({ age: entierDe(e.target.value) })}
              >
                <option value={0}>0 — hors âge</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {libelleAge(n, ages)}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ id="u-axe" libelle="Axe">
              <select
                id="u-axe"
                className="input"
                value={v.axe}
                onChange={(e) => maj({ axe: e.target.value as AxeUnite })}
              >
                {AXES.map((a) => (
                  <option key={a.valeur} value={a.valeur}>
                    {a.libelle}
                  </option>
                ))}
              </select>
            </Champ>
          </div>
          <Aide titre="L'âge et l'axe">
            <Terme nom="âge">
              Le joueur accède à son âge et à tous les précédents. Un âge 0 n'est produit nulle part.
            </Terme>
            <Terme nom="axe">
              Vide avant l'âge {AGE_DES_AXES}. Ensuite : Science bat Génétique, Génétique bat
              Archéomages, Archéomages bat Science — et « Trinité » est réservée aux suprêmes de
              l'âge 7.
            </Terme>
          </Aide>
        </Section>

        {/* --- Combat --- */}
        <Section titre="Combat">
          <div className="grid gap-4 sm:grid-cols-4">
            <Nombre id="u-vie" libelle="Vie" min={1} valeur={v.vie} onChange={(vie) => maj({ vie })} />
            <Nombre id="u-deg" libelle="Dégâts" valeur={v.degats} onChange={(degats) => maj({ degats })} />
            <Nombre id="u-por" libelle="Portée (cases)" valeur={v.portee} onChange={(portee) => maj({ portee })} />
            <Nombre id="u-vit" libelle="Vitesse (cases/tour)" valeur={v.vitesse} onChange={(vitesse) => maj({ vitesse })} />
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Champ id="u-cible" libelle="Cible d'une vague automatique">
              <select
                id="u-cible"
                className="input"
                value={v.cible_auto}
                onChange={(e) => maj({ cible_auto: e.target.value as CibleAuto })}
              >
                {CIBLES_AUTO.map((c) => (
                  <option key={c.valeur} value={c.valeur}>
                    {c.libelle}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ id="u-contre" libelle="Famille dominée (contre)">
              <select
                id="u-contre"
                className="input"
                value={v.contre}
                onChange={(e) => maj({ contre: e.target.value as Contre })}
              >
                {CONTRES.map((c) => (
                  <option key={c.valeur} value={c.valeur}>
                    {c.libelle}
                  </option>
                ))}
              </select>
            </Champ>
          </div>
          <Aide titre="Pourquoi DEUX champs de cible">
            <Terme nom="cible automatique">
              Ce que vise l'unité <b>quand elle joue seule</b>, en vague : le bâtiment, une unité, ou
              ce qu'elle a sous le nez. Sans objet pour une unité que le joueur commande.
            </Terme>
            <Terme nom="contre">
              La famille qu'elle <b>domine</b> — la triangulation. Elle vaut toujours, vague ou pas.
              Les confondre reviendrait à donner un seul réglage à deux règles : la première codée
              écraserait l'autre sans que rien ne le dise.
            </Terme>
          </Aide>
        </Section>

        {/* --- Production --- */}
        <Section titre="Production">
          <Champ id="u-pilotage" libelle="Qui la joue">
            <select
              id="u-pilotage"
              className="input"
              value={v.pilotage}
              onChange={(e) => maj({ pilotage: e.target.value as Pilotage })}
            >
              {PILOTAGES.map((p) => (
                <option key={p.valeur} value={p.valeur}>
                  {p.libelle}
                </option>
              ))}
            </select>
          </Champ>

          {v.pilotage === "auto" ? (
            <p className="mt-2 rounded border border-edge bg-ink/40 p-2 text-xs text-slate-400">
              Une vague automatique est <b>gratuite</b> (CDC 1.37) : elle n'a pas de coût, et le
              rythme est tenu par le quai, pas par un prix. Le réglage de la vague — quelles unités,
              tous les combien de tours, par quel chemin — vit sur le <b>modèle de damier</b>, pas
              ici.
            </p>
          ) : (
            <div className="mt-2">
              <p className="label">Coût, par ressource envoyée depuis l'empire</p>
              <LignesCout
                lignes={v.cout}
                ressources={ressources}
                onChange={(cout) => maj({ cout })}
              />
            </div>
          )}
        </Section>

        {/* --- Apparence --- */}
        <Section titre="Apparence">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="u-modele" libelle="Modèle 3D">
              <select
                id="u-modele"
                className="input"
                value={v.modele}
                onChange={(e) => maj({ modele: e.target.value })}
              >
                <option value="">aucun</option>
                {modeles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {libelleModele(m)}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ id="u-icone" libelle="Icône">
              <div className="flex items-center gap-2">
                <Vignette chemin={iconeChoisie?.chemin} alt="" taille={36} />
                <select
                  id="u-icone"
                  className="input"
                  value={v.icone}
                  onChange={(e) => maj({ icone: e.target.value })}
                >
                  <option value="">aucune</option>
                  {icones.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nom?.trim() || i.chemin}
                    </option>
                  ))}
                </select>
              </div>
            </Champ>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            ⚠️ Aucun prefab d'unité n'existe encore dans le projet Unity : ces deux champs peuvent
            rester vides, le catalogue se saisit sans eux.
          </p>
        </Section>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={v.actif} onChange={(e) => maj({ actif: e.target.checked })} />
          Active — elle peut être produite en bataille
        </label>

        {notes.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-amber-400">
            {notes.map((n) => (
              <li key={n}>⚠️ {n}</li>
            ))}
          </ul>
        )}

        {erreurs.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-amber-300">
            {erreurs.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        {erreur && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            {erreur}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={saving || erreurs.length > 0}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded border border-edge/60 p-3">
      <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">{titre}</p>
      {children}
    </div>
  );
}

function Champ({ id, libelle, children }: { id: string; libelle: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 first:mt-0">
      <label className="label" htmlFor={id}>
        {libelle}
      </label>
      {children}
    </div>
  );
}

function Nombre({
  id,
  libelle,
  valeur,
  min = 0,
  onChange,
}: {
  id: string;
  libelle: string;
  valeur: number;
  min?: number;
  onChange: (n: number) => void;
}) {
  return (
    <Champ id={id} libelle={libelle}>
      <input
        id={id}
        type="number"
        step={1}
        min={min}
        className="input"
        value={valeur}
        onChange={(e) => onChange(entierDe(e.target.value))}
      />
    </Champ>
  );
}

/**
 * Les lignes de coût. Même forme que le `cout` d'un palier de tuile — une
 * quantité, une ressource — moins le `mode` : une unité se paie, elle
 * n'immobilise personne.
 */
function LignesCout({
  lignes,
  ressources,
  onChange,
}: {
  lignes: LigneCoutUnite[];
  ressources: Ressource[];
  onChange: (l: LigneCoutUnite[]) => void;
}) {
  const maj = (i: number, patch: Partial<LigneCoutUnite>) =>
    onChange(lignes.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  return (
    <div>
      {lignes.length === 0 ? (
        <p className="text-xs text-slate-600">
          Aucun coût : le joueur en produirait autant qu'il veut, gratuitement.
        </p>
      ) : (
        <div className="space-y-1">
          {lignes.map((ligne, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                className="input h-9 w-20 py-1"
                value={ligne.quantite}
                onChange={(e) => maj(i, { quantite: entierDe(e.target.value) })}
              />
              <select
                className="input h-9 w-48 py-1"
                value={ligne.ressource}
                onChange={(e) => maj(i, { ressource: e.target.value })}
              >
                <option value="">choisir une ressource</option>
                {parAlphabet(ressources).map((r) => (
                  <option key={r.id} value={r.code}>
                    {r.nom}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ml-auto text-xs text-slate-500 hover:text-red-400"
                onClick={() => onChange(lignes.filter((_, k) => k !== i))}
              >
                retirer
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className="mt-1 text-xs text-accent hover:underline"
        onClick={() => onChange([...lignes, { ressource: "", quantite: 1 }])}
      >
        + ligne
      </button>
    </div>
  );
}
