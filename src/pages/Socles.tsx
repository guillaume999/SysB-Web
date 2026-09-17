// ============================================================
//  Socles.tsx
//  ONGLET SOCLES (17/09) — les couleurs que peut prendre le socle d'une case.
//
//  Une tuile choisit ici sa couleur de socle (onglet Tuiles, champ « Socle ») ;
//  sa FORME, elle, viendra de l'altitude de la case.
//
//  ⚠️ Ajouter une couleur ne suffit pas : le jeu a besoin du matériau
//  correspondant dans le projet Unity. Il se fabrique en une fois avec
//  « SySB → Synchroniser les socles ». C'est dit sur l'écran, parce que la
//  panne (« ma couleur n'apparaît pas en jeu ») ne se diagnostique pas depuis
//  le site.
//
//  Voir `lib/socles.ts` pour la raison de la liste fermée : une couleur = un
//  matériau partagé, donc un seul ordre de dessin pour toutes les cases qui la
//  portent.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { messageErreur } from "@/lib/pb";
import {
  SOCLE_VIDE,
  cheminMateriau,
  enregistrerSocle,
  erreursSocle,
  loadSocles,
  supprimerSocle,
  usagesParSocle,
  type Socle,
  type ValeursSocle,
} from "@/lib/socles";
import { loadTuiles, type Tuile } from "@/lib/tuiles";

export default function Socles() {
  const [socles, setSocles] = useState<Socle[]>([]);
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ socle: Socle | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      // Les tuiles en chargement TOLÉRANT : elles ne servent qu'à compter les
      // usages. L'écran doit rester ouvrable même si le catalogue ne répond pas.
      const [s, t] = await Promise.all([loadSocles(), loadTuiles().catch(() => [] as Tuile[])]);
      setSocles(s);
      setTuiles(t);
    } catch (e) {
      setErreur(
        messageErreur(
          e,
          "Chargement des socles impossible. La collection `socles` existe-t-elle ? " +
            "(patch-socles-2026-09-17.js)",
        ),
      );
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const usages = useMemo(() => usagesParSocle(tuiles), [tuiles]);

  const enregistrer = async (v: ValeursSocle) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      await enregistrerSocle(dialog.socle, v);
      setDialog(null);
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (s: Socle) => {
    setErreur(null);
    try {
      await supprimerSocle(s.id);
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
          <h1 className="text-xl font-semibold text-white">Socles</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Les couleurs que peut prendre le socle d'une case. Une tuile en choisit une dans son
            onglet Identité ; la hauteur du socle, elle, vient de l'altitude de la case.
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
              setDialog({ socle: null });
            }}
          >
            Nouvelle couleur
          </button>
        </div>
      </header>

      <Aide titre="Ce qu'il faut savoir avant d'en ajouter une">
        <Terme nom="code">
          Le code devient un nom de fichier dans Unity :{" "}
          <code className="font-mono text-slate-300">Socle_&lt;code&gt;.mat</code>. D'où les
          minuscules sans accent ni espace. Le changer sur une couleur déjà posée rend son matériau
          introuvable en jeu tant que la synchronisation n'a pas été relancée.
        </Terme>
        <Terme nom="matériau partagé">
          Toutes les cases d'une même couleur se dessinent en un seul lot. C'est pour ça que la
          couleur se choisit dans cette liste au lieu d'être tapée sur chaque tuile : une teinte par
          case ferait un ordre de dessin par case, et le téléphone ne suivrait pas.
        </Terme>
        <Terme nom="synchroniser">
          Une couleur ajoutée ici n'existe pas encore dans le projet Unity. Lance{" "}
          <b>SySB → Synchroniser les socles</b> : il crée ou met à jour les matériaux depuis cette
          liste. Sans ça, le jeu retombe sur le socle vert et le dit dans la console.
        </Terme>
        <Terme nom="supprimer">
          Impossible tant qu'une tuile porte la couleur : change-les d'abord. Le compte de chaque
          ligne dit combien il y en a.
        </Terme>
      </Aide>

      {erreur && (
        <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {chargement && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}

      {!chargement && socles.length === 0 && (
        <p className="card mt-4 p-4 text-sm text-slate-500">
          Aucune couleur déclarée. Le patch en pose trois (vert, beige, bleu) — celles des socles
          qui existent déjà dans le jeu.
        </p>
      )}

      {!chargement && socles.length > 0 && (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Couleur</th>
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Matériau Unity</th>
                <th className="px-3 py-2">Tuiles</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {socles.map((s) => {
                const n = usages.get(s.id) ?? 0;
                return (
                  <tr key={s.id} className="border-b border-edge/40">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-6 w-6 rounded border border-edge"
                          style={{ backgroundColor: s.couleur }}
                          aria-hidden
                        />
                        <span className="font-mono text-xs text-slate-400">{s.couleur}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-200">{s.nom || <em>sans nom</em>}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-300">{s.code}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                      {cheminMateriau(s.code)}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{n === 0 ? "—" : n}</td>
                    <td className="px-3 py-2 text-right">
                      {aSupprimer === s.id ? (
                        <span className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-400">Supprimer ?</span>
                          <button className="btn-danger" onClick={() => void supprimer(s)}>
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
                              setDialog({ socle: s });
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            className="btn-danger"
                            disabled={n > 0}
                            title={
                              n > 0
                                ? `${n} tuile(s) portent cette couleur : change-les d'abord.`
                                : undefined
                            }
                            onClick={() => setASupprimer(s.id)}
                          >
                            Supprimer
                          </button>
                        </span>
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
        <SocleDialog
          socle={dialog.socle}
          autres={socles.filter((s) => s.id !== dialog.socle?.id)}
          usages={dialog.socle ? (usages.get(dialog.socle.id) ?? 0) : 0}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}

function SocleDialog({
  socle,
  autres,
  usages,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  socle: Socle | null;
  /** Les AUTRES couleurs — celles dont le code est déjà pris. */
  autres: Socle[];
  /** Combien de tuiles portent celle-ci, pour prévenir avant de changer son code. */
  usages: number;
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (v: ValeursSocle) => void;
}) {
  const [code, setCode] = useState(socle?.code ?? SOCLE_VIDE.code);
  const [nom, setNom] = useState(socle?.nom ?? SOCLE_VIDE.nom);
  const [couleur, setCouleur] = useState(socle?.couleur ?? SOCLE_VIDE.couleur);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const valeurs: ValeursSocle = { code, nom, couleur };
  const erreurs = erreursSocle(valeurs, autres);
  const codeChange = socle !== null && socle.code !== code.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form
        className="card w-full max-w-lg p-5 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (erreurs.length === 0 && !saving) onSubmit(valeurs);
        }}
      >
        <h2 className="text-lg font-semibold text-white">
          {socle ? `Modifier ${socle.nom || socle.code}` : "Nouvelle couleur de socle"}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="socle-nom">
              Nom
            </label>
            <input
              id="socle-nom"
              className="input"
              value={nom}
              placeholder="Roche"
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="socle-code">
              Code
            </label>
            <input
              id="socle-code"
              className="input font-mono"
              value={code}
              placeholder="roche"
              onChange={(e) => setCode(e.target.value)}
            />
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              {cheminMateriau(code || "…")}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="socle-couleur">
            Couleur
          </label>
          <div className="flex items-center gap-3">
            <input
              id="socle-couleur"
              type="color"
              className="h-10 w-16 rounded border border-edge bg-ink"
              value={/^#[0-9a-fA-F]{6}$/.test(couleur) ? couleur : "#000000"}
              onChange={(e) => setCouleur(e.target.value.toUpperCase())}
            />
            <input
              className="input font-mono"
              value={couleur}
              placeholder="#04CC0D"
              onChange={(e) => setCouleur(e.target.value)}
            />
          </div>
        </div>

        {codeChange && usages > 0 && (
          <p className="mt-4 rounded border border-amber-900/60 bg-amber-950/30 p-2 text-xs text-amber-200">
            {usages} tuile(s) portent cette couleur. Changer son code change le nom du matériau :
            relance « SySB → Synchroniser les socles » dans Unity, sinon ces tuiles retomberont sur
            le socle vert.
          </p>
        )}

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
