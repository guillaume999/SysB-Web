// ============================================================
//  Icones.tsx
//  ONGLET ICÔNES (15/09) — les dessins du site rangés par dossier, leur nom,
//  leur catégorie et à qui ils sont ouverts.
//
//  Voir `lib/icones.ts` pour les deux sources (fichiers du site / records
//  `icones`) et pourquoi aucune n'est complète à elle seule.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import fichiersDuSite from "virtual:icones-du-site";
import IconeDialog from "@/components/IconeDialog";
import {
  CATEGORIES_ICONE,
  FILTRE_ICONES_VIDE,
  enregistrerIcone,
  filtrerLignes,
  grouperIcones,
  libelleCategorie,
  nomAffiche,
  type FiltreIcones,
  type LigneIcone,
  type ValeursIcone,
} from "@/lib/icones";
import { loadJoueurs, type Joueur } from "@/lib/joueurs";
import { resumePartage } from "@/lib/partageJoueurs";
import { messageErreur } from "@/lib/pb";
import { loadIcones, type Icone } from "@/lib/planetes";

export default function Icones() {
  const [records, setRecords] = useState<Icone[]>([]);
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<FiltreIcones>(FILTRE_ICONES_VIDE);
  /** Dossiers repliés — tous ouverts à l'arrivée. */
  const [replies, setReplies] = useState<Set<string>>(new Set());

  const [ouverte, setOuverte] = useState<LigneIcone | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [i, j] = await Promise.all([loadIcones(), loadJoueurs().catch(() => [] as Joueur[])]);
      setRecords(i);
      setJoueurs(j);
    } catch (e) {
      setErreur(messageErreur(e, "Chargement des icônes impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const groupes = useMemo(() => grouperIcones(fichiersDuSite, records), [records]);
  const total = groupes.reduce((n, g) => n + g.lignes.length, 0);
  const nonDeclarees = groupes.reduce((n, g) => n + g.lignes.filter((l) => !l.record).length, 0);

  const visibles = useMemo(
    () =>
      groupes
        .map((g) => ({ ...g, lignes: filtrerLignes(g.lignes, filtre) }))
        .filter((g) => g.lignes.length > 0),
    [groupes, filtre],
  );
  const nbVisibles = visibles.reduce((n, g) => n + g.lignes.length, 0);
  const filtreActif =
    filtre.texte !== "" || filtre.dossier !== "" || filtre.categorie !== "";

  const enregistrer = async (v: ValeursIcone) => {
    if (!ouverte) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      await enregistrerIcone(ouverte, v);
      setOuverte(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setSaving(false);
    }
  };

  const basculerDossier = (d: string) =>
    setReplies((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Icônes</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Les icônes du jeu, par dossier. Clique une icône pour lui donner un nom, une catégorie
            (ressource, bâtiment, technologie, planète ou autre) et choisir à quels joueurs elle est
            ouverte. Une icône « pas encore déclarée » est créée en base à son premier
            enregistrement.
          </p>
        </div>
        <button className="btn-ghost" onClick={() => void charger()}>
          Recharger
        </button>
      </header>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <div className="card mb-4 p-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="ic-texte">
              Recherche
            </label>
            <input
              id="ic-texte"
              className="input"
              placeholder="nom ou chemin…"
              value={filtre.texte}
              onChange={(e) => setFiltre((f) => ({ ...f, texte: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="ic-dossier">
              Dossier
            </label>
            <select
              id="ic-dossier"
              className="input"
              value={filtre.dossier}
              onChange={(e) => setFiltre((f) => ({ ...f, dossier: e.target.value }))}
            >
              <option value="">Tous ({groupes.length})</option>
              {groupes.map((g) => (
                <option key={g.dossier} value={g.dossier}>
                  {g.dossier} ({g.lignes.length})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ic-categorie">
              Catégorie
            </label>
            <select
              id="ic-categorie"
              className="input"
              value={filtre.categorie}
              onChange={(e) => setFiltre((f) => ({ ...f, categorie: e.target.value }))}
            >
              <option value="">Toutes</option>
              {CATEGORIES_ICONE.map((c) => (
                <option key={c.valeur} value={c.valeur}>
                  {c.libelle}
                </option>
              ))}
              <option value="aucune">pas encore déclarées ({nonDeclarees})</option>
            </select>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            {nbVisibles} icône{nbVisibles > 1 ? "s" : ""} sur {total}
          </span>
          {filtreActif && (
            <button
              className="text-slate-400 hover:text-white"
              onClick={() => setFiltre(FILTRE_ICONES_VIDE)}
            >
              Tout afficher
            </button>
          )}
        </div>
      </div>

      {chargement && <p className="text-sm text-slate-500">Chargement…</p>}
      {!chargement && nbVisibles === 0 && (
        <p className="card p-4 text-sm text-slate-500">Aucune icône ne correspond.</p>
      )}

      <div className="space-y-4">
        {!chargement &&
          visibles.map((g) => {
            const replie = replies.has(g.dossier);
            return (
              <section key={g.dossier} className="card">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 border-b border-edge px-3 py-2 text-left"
                  onClick={() => basculerDossier(g.dossier)}
                  aria-expanded={!replie}
                >
                  <span className="font-mono text-sm text-white">{g.dossier}/</span>
                  <span className="text-xs text-slate-500">
                    {g.lignes.length} · {replie ? "déplier" : "replier"}
                  </span>
                </button>
                {!replie && (
                  <ul className="grid sm:grid-cols-2 xl:grid-cols-3">
                    {g.lignes.map((l) => (
                      <li key={l.chemin} className="border-b border-edge/40">
                        <button
                          type="button"
                          onClick={() => {
                            setErreurDialog(null);
                            setOuverte(l);
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-ink/40"
                        >
                          {l.url ? (
                            <img
                              src={l.url}
                              alt=""
                              loading="lazy"
                              className="h-9 w-9 shrink-0 rounded bg-ink/40"
                            />
                          ) : (
                            <span className="h-9 w-9 shrink-0 rounded border border-dashed border-edge" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-slate-200">
                              {nomAffiche(l)}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {l.record ? (
                                <>
                                  {libelleCategorie(l.record.usage)} ·{" "}
                                  {resumePartage(l.record, joueurs)}
                                </>
                              ) : (
                                <em className="text-amber-300/80">pas encore déclarée</em>
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
      </div>

      {ouverte && (
        <IconeDialog
          ligne={ouverte}
          joueurs={joueurs}
          joueursChargement={chargement}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setOuverte(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}
