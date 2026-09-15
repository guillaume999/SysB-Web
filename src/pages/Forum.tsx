// ============================================================
//  Forum.tsx — /forum : la liste des salons. LISIBLE SANS CONNEXION.
//  L'admin crée, modifie, range et supprime les salons.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Erreur, Pastille, SupprimerEnPlace } from "@/components/Communaute";
import { SalonDialog } from "@/components/ForumFormulaires";
import { useAuth } from "@/lib/auth";
import {
  chargerSalons,
  compterSujetsParSalon,
  enregistrerSalon,
  supprimerSalon,
  type Salon,
  type ValeursSalon,
} from "@/lib/forum";
import { messageErreur } from "@/lib/pb";

export default function Forum() {
  const { user, estAdmin } = useAuth();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [compte, setCompte] = useState<Map<string, number>>(new Map());
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [edition, setEdition] = useState<Salon | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [erreurFiche, setErreurFiche] = useState<string | null>(null);
  const [suppression, setSuppression] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const [s, c] = await Promise.all([chargerSalons(), compterSujetsParSalon()]);
      setSalons(s);
      setCompte(c);
    } catch (e) {
      setErreur(messageErreur(e, "Impossible de charger le forum."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const enregistrer = async (v: ValeursSalon) => {
    setSaving(true);
    setErreurFiche(null);
    try {
      await enregistrerSalon(edition ?? null, v);
      setEdition(undefined);
      await charger();
    } catch (e) {
      setErreurFiche(messageErreur(e, "Enregistrement impossible."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (id: string) => {
    setSuppression(id);
    try {
      await supprimerSalon(id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Suppression impossible."));
    } finally {
      setSuppression(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-white">Forum</h1>
        {estAdmin && (
          <button
            className="btn-primary ml-auto"
            onClick={() => {
              setErreurFiche(null);
              setEdition(null);
            }}
          >
            Nouveau salon
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-400">
        {user ? "Choisis un salon." : "Lecture libre — connecte-toi pour écrire."}
      </p>

      <div className="mt-4">
        <Erreur>{erreur}</Erreur>
      </div>

      <ul className="mt-4 space-y-3">
        {salons.map((s) => {
          const n = compte.get(s.id) ?? 0;
          return (
            <li key={s.id} className="card p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Link to={`/forum/${s.id}`} className="min-w-0 break-words text-lg font-semibold text-white hover:text-accent">
                  {s.nom}
                </Link>
                <span className="text-xs text-slate-500">
                  {n} sujet{n > 1 ? "s" : ""}
                </span>
              </div>
              {s.description && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-400">{s.description}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pastille actif={s.sujets_joueurs}>
                  {s.sujets_joueurs ? "sujets ouverts aux joueurs" : "sujets : admin seul"}
                </Pastille>
                <Pastille actif={s.reponses_joueurs}>
                  {s.reponses_joueurs ? "réponses ouvertes aux joueurs" : "réponses : admin seul"}
                </Pastille>
              </div>
              {estAdmin && (
                <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-edge pt-2">
                  <button
                    className="text-xs text-slate-400 hover:text-white"
                    onClick={() => {
                      setErreurFiche(null);
                      setEdition(s);
                    }}
                  >
                    Modifier
                  </button>
                  <SupprimerEnPlace
                    quoi={n > 0 ? `ce salon et ses ${n} sujet${n > 1 ? "s" : ""}` : "ce salon"}
                    occupe={suppression === s.id}
                    onConfirme={() => void supprimer(s.id)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {chargement && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}
      {!chargement && salons.length === 0 && !erreur && (
        <p className="mt-4 text-sm text-slate-500">
          {estAdmin ? "Aucun salon : crée le premier." : "Le forum n'a pas encore de salon."}
        </p>
      )}

      {edition !== undefined && (
        <SalonDialog
          salon={edition}
          saving={saving}
          erreur={erreurFiche}
          onCancel={() => setEdition(undefined)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}
