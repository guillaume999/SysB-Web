// ============================================================
//  Tuto.tsx
//  ONGLET TUTO (18/09) — la suite de cartes que le jeu montre la PREMIÈRE FOIS
//  qu'un joueur ouvre une planète.
//
//  Ce que l'admin fait ici : écrire les cartes, les ranger, en désactiver une.
//  Ce que le jeu en fait : les enchaîner sur fond assombri, avec « Suivant » et
//  « Passer », puis retenir sur le compte du joueur qu'il les a vues
//  (`users.tutos_vus`).
//
//  ⚠️ L'APERÇU N'EST PAS UNE DÉCORATION : le texte part dans TextMeshPro, sans
//  Markdown et sans mise en forme. Voir la carte telle qu'elle sera est le seul
//  moyen de juger la longueur d'un texte sans lancer le jeu.
//
//  ⚠️ CHANGER L'ORDRE ÉCRIT PLUSIEURS RECORDS (renumérotation 1…n, voir
//  `lib/tuto.ts`) : c'est ce qui répare les rangs en double laissés par une
//  suppression.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { messageErreur } from "@/lib/pb";
import {
  CARTE_VIDE,
  GROUPE_PAR_DEFAUT,
  MAX_TEXTE,
  MAX_TITRE,
  appliquerOrdres,
  cartesJouees,
  deplacer,
  enregistrerCarte,
  erreursCarte,
  groupes,
  loadCartes,
  normaliserGroupe,
  ordonner,
  supprimerCarte,
  type CarteTuto,
  type ValeursCarte,
} from "@/lib/tuto";

export default function Tuto() {
  const [cartes, setCartes] = useState<CarteTuto[]>([]);
  const [groupe, setGroupe] = useState(GROUPE_PAR_DEFAUT);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ carte: CarteTuto | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setCartes(await loadCartes());
    } catch (e) {
      setErreur(
        messageErreur(
          e,
          "Chargement du tutoriel impossible. La collection `tuto_messages` existe-t-elle ? " +
            "(patch-tuto-2026-09-18.js)",
        ),
      );
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const planetes = useMemo(() => groupes(cartes), [cartes]);
  const liste = useMemo(() => ordonner(cartes, groupe), [cartes, groupe]);
  const jouees = useMemo(() => cartesJouees(cartes, groupe), [cartes, groupe]);

  const enregistrer = async (v: ValeursCarte) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      await enregistrerCarte(dialog.carte, v, cartes);
      setDialog(null);
      setGroupe(v.groupe.trim());
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setSaving(false);
    }
  };

  const bouger = async (id: string, sens: -1 | 1) => {
    const rangs = deplacer(cartes, groupe, id, sens);
    if (rangs.length === 0) return;
    setOccupe(true);
    setErreur(null);
    try {
      await appliquerOrdres(rangs);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Impossible de changer l'ordre."));
    } finally {
      setOccupe(false);
    }
  };

  const supprimer = async (c: CarteTuto) => {
    setErreur(null);
    try {
      await supprimerCarte(c.id);
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
          <h1 className="text-xl font-semibold text-white">Tuto</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Les cartes qui s'ouvrent la première fois qu'un joueur arrive sur une planète. Il les
            fait défiler avec « Suivant », ou les coupe avec « Passer » — dans les deux cas, elles
            ne reviennent plus.
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
              setDialog({ carte: null });
            }}
          >
            Nouvelle carte
          </button>
        </div>
      </header>

      <Aide titre="Ce qu'il faut savoir avant d'écrire une carte">
        <Terme nom="planète">
          Une suite de cartes par planète : <code className="font-mono text-slate-300">terre</code>{" "}
          est celle que tout le monde voit en arrivant. Écrire des cartes sous un autre nom de
          planète — en minuscules, sans accent — lui donne son propre tutoriel, sans rien changer au
          jeu.
        </Terme>
        <Terme nom="une carte = un écran">
          Le jeu n'en affiche qu'une à la fois, centrée, sur fond assombri. Un texte long n'est pas
          coupé : il rétrécit. L'aperçu de la fiche montre ce que ça donne.
        </Terme>
        <Terme nom="pas de mise en forme">
          Le texte part tel quel dans le jeu : ni gras, ni listes, ni liens. Les retours à la ligne,
          eux, sont gardés.
        </Terme>
        <Terme nom="active">
          Une carte décochée reste écrite mais le jeu l'ignore — c'est le brouillon. L'ordre, lui,
          se règle avec les flèches : il n'y a rien à taper.
        </Terme>
        <Terme nom="déjà vu">
          Un joueur qui a vu la suite ne la reverra pas, même si vous en ajoutez une carte : le
          souvenir est sur son compte (<code className="font-mono text-slate-300">tutos_vus</code>),
          par planète.
        </Terme>
      </Aide>

      {erreur && (
        <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-500">Planète</span>
        {planetes.map((g) => (
          <button
            key={g}
            className={g === groupe ? "btn-primary" : "btn-ghost"}
            onClick={() => setGroupe(g)}
          >
            {g}
          </button>
        ))}
        <span className="ml-2 text-xs text-slate-500">
          {jouees.length} carte(s) montrée(s) en jeu
          {liste.length !== jouees.length && ` · ${liste.length - jouees.length} inactive(s)`}
        </span>
      </div>

      {chargement && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}

      {!chargement && liste.length === 0 && (
        <p className="card mt-4 p-4 text-sm text-slate-500">
          Aucune carte pour « {groupe} ». Tant que la liste est vide, le jeu n'ouvre rien à
          l'arrivée sur cette planète.
        </p>
      )}

      {!chargement && liste.length > 0 && (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Titre</th>
                <th className="px-3 py-2">Texte</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {liste.map((c, i) => (
                <tr key={c.id} className="border-b border-edge/40 align-top">
                  <td className="px-3 py-2 text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="font-mono">{i + 1}</span>
                      <button
                        className="btn-ghost px-1.5 py-0.5"
                        title="Monter"
                        disabled={i === 0 || occupe}
                        onClick={() => void bouger(c.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        className="btn-ghost px-1.5 py-0.5"
                        title="Descendre"
                        disabled={i === liste.length - 1 || occupe}
                        onClick={() => void bouger(c.id, 1)}
                      >
                        ↓
                      </button>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-200">{c.titre || <em>sans titre</em>}</td>
                  <td className="max-w-md px-3 py-2 text-slate-400">
                    <span className="line-clamp-2 whitespace-pre-line break-words">{c.texte}</span>
                  </td>
                  <td className="px-3 py-2">
                    {c.actif ? (
                      <span className="text-slate-300">oui</span>
                    ) : (
                      <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[11px] text-amber-300">
                        inactive
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {aSupprimer === c.id ? (
                      <span className="flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-400">Supprimer ?</span>
                        <button className="btn-danger" onClick={() => void supprimer(c)}>
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
                            setDialog({ carte: c });
                          }}
                        >
                          Modifier
                        </button>
                        <button className="btn-danger" onClick={() => setASupprimer(c.id)}>
                          Supprimer
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <CarteDialog
          carte={dialog.carte}
          groupeCourant={groupe}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}

function CarteDialog({
  carte,
  groupeCourant,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  carte: CarteTuto | null;
  /** La planète regardée : celle d'une carte neuve. */
  groupeCourant: string;
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (v: ValeursCarte) => void;
}) {
  const [groupe, setGroupe] = useState(carte?.groupe ?? groupeCourant ?? CARTE_VIDE.groupe);
  const [titre, setTitre] = useState(carte?.titre ?? CARTE_VIDE.titre);
  const [texte, setTexte] = useState(carte?.texte ?? CARTE_VIDE.texte);
  const [actif, setActif] = useState(carte?.actif ?? CARTE_VIDE.actif);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const valeurs: ValeursCarte = { groupe, titre, texte, actif };
  const erreurs = erreursCarte(valeurs);
  const changeDePlanete = carte !== null && carte.groupe !== groupe.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form
        className="card w-full max-w-3xl p-5 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (erreurs.length === 0 && !saving) onSubmit(valeurs);
        }}
      >
        <h2 className="text-lg font-semibold text-white">
          {carte ? `Modifier « ${carte.titre || "sans titre"} »` : "Nouvelle carte"}
        </h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="tuto-groupe">
                  Planète
                </label>
                <input
                  id="tuto-groupe"
                  className="input font-mono"
                  value={groupe}
                  placeholder="terre"
                  onChange={(e) => setGroupe(e.target.value)}
                  onBlur={(e) => setGroupe(normaliserGroupe(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 pb-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={actif}
                    onChange={(e) => setActif(e.target.checked)}
                  />
                  Montrée en jeu
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="tuto-titre">
                Titre
              </label>
              <input
                id="tuto-titre"
                className="input"
                value={titre}
                placeholder="Bienvenue sur la Terre"
                maxLength={MAX_TITRE}
                onChange={(e) => setTitre(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="tuto-texte">
                Texte
              </label>
              <textarea
                id="tuto-texte"
                className="input min-h-40"
                value={texte}
                placeholder="Te voici sur ta colonie…"
                maxLength={MAX_TEXTE}
                onChange={(e) => setTexte(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                {texte.length} / {MAX_TEXTE} caractères · pas de mise en forme, les retours à la
                ligne sont gardés
              </p>
            </div>

            {changeDePlanete && (
              <p className="mt-4 rounded border border-amber-900/60 bg-amber-950/30 p-2 text-xs text-amber-200">
                Cette carte change de planète : elle se posera à la fin de la suite de «{" "}
                {groupe.trim()} ».
              </p>
            )}
          </div>

          <div>
            <p className="label">Aperçu en jeu</p>
            <ApercuCarte titre={titre} texte={texte} />
          </div>
        </div>

        {erreurs.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-amber-300">
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

/**
 * La carte telle que le jeu la dessine : fond assombri, cadre sombre, titre,
 * texte, « Passer » à gauche et « Suivant » à droite.
 *
 * ⚠️ Les couleurs sont celles de `CadreAccueil` côté Unity (cadre 0.09/0.11/0.15,
 * bouton 0.20/0.25/0.33). Les changer d'un côté sans l'autre fait mentir
 * l'aperçu — c'est son seul travail d'être fidèle.
 */
function ApercuCarte({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="flex aspect-[9/16] w-full max-w-xs items-center justify-center rounded border border-edge bg-black/70 p-4">
      <div
        className="w-full rounded p-4"
        style={{ backgroundColor: "rgb(23,28,38)", border: "1px solid rgb(51,64,84)" }}
      >
        {titre.trim() && (
          <p className="break-words text-center text-base font-semibold text-white">{titre}</p>
        )}
        <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-line break-words text-left text-sm text-slate-200">
          {texte.trim() || "…"}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="rounded px-3 py-1.5 text-xs text-slate-400">Passer</span>
          <span
            className="rounded px-4 py-1.5 text-xs text-white"
            style={{ backgroundColor: "rgb(51,64,84)" }}
          >
            Suivant
          </span>
        </div>
      </div>
    </div>
  );
}
