// ============================================================
//  Guildes.tsx — /guildes (admin, 15/09)
//  Les LIMITES des guildes (une fiche `reglages_guildes`) et la liste des
//  guildes, avec leurs membres ; l'admin peut en dissoudre une.
//
//  ⚠️ Les limites valent pour la SUITE : baisser « membres max » n'exclut
//  personne, cela ferme seulement les nouvelles entrées. Idem pour les
//  officiers et l'âge minimum.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Erreur, Pastille, SupprimerEnPlace } from "@/components/Communaute";
import {
  REGLAGES_DEFAUT,
  chargerEtat,
  chargerReglages,
  chargerTousMembres,
  dissoudreAdmin,
  enregistrerReglages,
  erreurReglages,
  libelleRole,
  verdict,
  type FicheReglages,
  type Membre,
  type ResumeGuilde,
} from "@/lib/guildes";
import { messageErreur } from "@/lib/pb";

const CHAMPS: { cle: keyof Omit<FicheReglages, "id">; label: string; aide: string }[] = [
  { cle: "membres_max", label: "Membres max par guilde", aide: "chef compris" },
  { cle: "officiers_max", label: "Officiers max par guilde", aide: "0 = aucun officier" },
  { cle: "delai_salon_s", label: "Anti-spam du salon (s)", aide: "délai entre deux messages d'un même joueur ; 0 = aucun" },
  { cle: "age_min_creation", label: "Âge de jeu pour fonder", aide: "0 = sans condition, 1 à 7 sinon" },
];

export default function Guildes() {
  const [fiche, setFiche] = useState<FicheReglages>({ ...REGLAGES_DEFAUT });
  const [saisie, setSaisie] = useState<Record<string, string>>({});
  const [guildes, setGuildes] = useState<ResumeGuilde[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurFiche, setErreurFiche] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [suppression, setSuppression] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const [f, e, m] = await Promise.all([chargerReglages(), chargerEtat(), chargerTousMembres()]);
      setFiche(f);
      setSaisie(Object.fromEntries(CHAMPS.map((c) => [c.cle, String(f[c.cle])])));
      setGuildes(e.guildes);
      setMembres(m);
      setErreur(null);
    } catch (e) {
      const err = e as { status?: number };
      setErreur(
        err.status === 404
          ? "Les guildes ne sont pas encore en service : lance patch-guildes-2026-09-15.js, puis déploie le serveur."
          : verdict(e, "Chargement impossible."),
      );
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const parGuilde = useMemo(() => {
    const m = new Map<string, Membre[]>();
    for (const x of membres) m.set(x.guilde, [...(m.get(x.guilde) ?? []), x]);
    return m;
  }, [membres]);

  const valeurs = (): FicheReglages => ({
    id: fiche.id,
    membres_max: Number(saisie.membres_max),
    officiers_max: Number(saisie.officiers_max),
    delai_salon_s: Number(saisie.delai_salon_s),
    age_min_creation: Number(saisie.age_min_creation),
  });

  const enregistrer = async () => {
    const v = valeurs();
    const faute = erreurReglages(v);
    setErreurFiche(faute);
    setInfo(null);
    if (faute) return;
    setSaving(true);
    try {
      setFiche(await enregistrerReglages(v));
      setInfo("Limites enregistrées.");
    } catch (e) {
      setErreurFiche(messageErreur(e, "Enregistrement impossible."));
    } finally {
      setSaving(false);
    }
  };

  const dissoudre = async (id: string) => {
    setSuppression(id);
    try {
      await dissoudreAdmin(id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Dissolution impossible."));
    } finally {
      setSuppression(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Guildes</h1>
        <p className="mt-1 text-sm text-slate-400">Les limites communes à toutes les guildes, et les guildes existantes.</p>
      </div>
      <Erreur>{erreur}</Erreur>
      {chargement && <p className="text-sm text-slate-500">Chargement…</p>}

      <section className="card p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-white">Limites</h2>
        {!fiche.id && !chargement && (
          <p className="mt-1 text-xs text-amber-300">
            Aucune fiche enregistrée : le serveur applique ses valeurs par défaut (celles affichées).
          </p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CHAMPS.map((c) => (
            <div key={c.cle}>
              <label className="label" htmlFor={`r-${c.cle}`}>
                {c.label}
              </label>
              <input
                id={`r-${c.cle}`}
                className="input"
                type="number"
                min={0}
                step={1}
                value={saisie[c.cle] ?? ""}
                onChange={(e) => setSaisie((s) => ({ ...s, [c.cle]: e.target.value }))}
              />
              <p className="mt-1 text-xs text-slate-500">{c.aide}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <Erreur>{erreurFiche}</Erreur>
          {info && <p className="text-sm text-emerald-300">{info}</p>}
          <button className="btn-primary" disabled={saving || chargement} onClick={() => void enregistrer()}>
            {saving ? "…" : "Enregistrer les limites"}
          </button>
        </div>
        <Aide>
          <Terme nom="Pour la suite seulement">
            baisser une limite n'exclut personne et ne rétrograde aucun officier : elle ferme les nouvelles entrées,
            nominations et fondations.
          </Terme>
          <Terme nom="Âge de jeu">
            le plus haut âge dont le joueur possède tous les bâtiments requis (onglet Âges), sur l'ensemble de ses
            plateaux. Un système de points viendra plus tard.
          </Terme>
          <Terme nom="Salon">
            réservé aux membres ; l'anti-spam compte par joueur. L'admin peut supprimer un message depuis PocketBase
            (collection <code>messages_guilde</code>).
          </Terme>
        </Aide>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
          {guildes.length} guilde{guildes.length > 1 ? "s" : ""}
        </h2>
        <div className="space-y-2">
          {guildes.map((g) => {
            const liste = parGuilde.get(g.id) ?? [];
            return (
              <div key={g.id} className="card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button className="min-w-0 text-left" onClick={() => setOuverte(ouverte === g.id ? null : g.id)}>
                    <span className="break-words font-medium text-white">{g.nom}</span>{" "}
                    <span className="text-xs text-slate-500">
                      · chef {g.chef_nom || "?"} · {g.membres} / {fiche.membres_max} membres
                    </span>
                  </button>
                  <SupprimerEnPlace
                    quoi={`la guilde « ${g.nom} » (membres, demandes et salon)`}
                    occupe={suppression === g.id}
                    onConfirme={() => void dissoudre(g.id)}
                  />
                </div>
                {ouverte === g.id && (
                  <ul className="mt-2 flex flex-wrap gap-2 border-t border-edge pt-2">
                    {liste.map((m) => (
                      <li key={m.id} className="text-sm text-slate-300">
                        {m.nom || "sans pseudo"} <Pastille actif={m.role !== "membre"}>{libelleRole(m.role)}</Pastille>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {!chargement && guildes.length === 0 && !erreur && (
            <p className="text-sm text-slate-500">Aucune guilde pour l'instant.</p>
          )}
        </div>
      </section>
    </div>
  );
}
