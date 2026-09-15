// ============================================================
//  ForumSalon.tsx — /forum/:salonId : les sujets d'un salon.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Erreur } from "@/components/Communaute";
import { FormulairePost } from "@/components/ForumFormulaires";
import { useAuth } from "@/lib/auth";
import {
  chargerSalon,
  chargerSujets,
  messageRefus,
  nomAuteur,
  ouvrirSujet,
  participant,
  peutOuvrirSujet,
  raisonRefus,
  type Activite,
  type Salon,
  type Sujet,
} from "@/lib/forum";
import { dateLisible } from "@/lib/news";
import { messageErreur } from "@/lib/pb";

export default function ForumSalon() {
  const { salonId = "" } = useParams();
  const navigate = useNavigate();
  const { user, estAdmin } = useAuth();
  const qui = participant(user, estAdmin);

  const [salon, setSalon] = useState<Salon | null>(null);
  const [sujets, setSujets] = useState<Sujet[]>([]);
  const [activite, setActivite] = useState<Map<string, Activite>>(new Map());
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ecrire, setEcrire] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erreurPost, setErreurPost] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const [s, liste] = await Promise.all([chargerSalon(salonId), chargerSujets(salonId)]);
      setSalon(s);
      setSujets(liste.sujets);
      setActivite(liste.activite);
    } catch (e) {
      setErreur(messageRefus(e, messageErreur(e, "Impossible de charger ce salon.")));
    } finally {
      setChargement(false);
    }
  }, [salonId]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const permis = salon ? peutOuvrirSujet(salon, qui) : false;
  const raison = salon ? raisonRefus(permis, qui, "sujet") : null;

  const creer = async (titre: string, contenu: string) => {
    if (!qui || !salon) return false;
    setSaving(true);
    setErreurPost(null);
    try {
      const s = await ouvrirSujet(salon.id, titre, contenu, qui);
      navigate(`/forum/sujet/${s.id}`);
      return true;
    } catch (e) {
      setErreurPost(messageRefus(e, "Envoi impossible."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm">
        <Link to="/forum" className="text-slate-400 hover:text-white">← Forum</Link>
      </p>
      <Erreur>{erreur}</Erreur>
      {chargement && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}

      {salon && (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 break-words text-2xl font-semibold text-white">{salon.nom}</h1>
            {permis && !ecrire && (
              <button className="btn-primary ml-auto" onClick={() => setEcrire(true)}>
                Nouveau sujet
              </button>
            )}
          </div>
          {salon.description && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-400">{salon.description}</p>
          )}
          {raison && (
            <p className="mt-2 text-xs text-slate-500">
              {raison}
              {!qui && (
                <>
                  {" "}
                  <Link to="/connexion" className="text-accent hover:underline">Se connecter</Link>
                </>
              )}
            </p>
          )}

          {ecrire && (
            <div className="card mt-4 p-4">
              <FormulairePost
                avecTitre
                libelle="Publier le sujet"
                saving={saving}
                erreur={erreurPost}
                onCancel={() => setEcrire(false)}
                onSubmit={creer}
              />
            </div>
          )}

          <ul className="mt-4 divide-y divide-edge rounded-lg border border-edge bg-panel">
            {sujets.map((s) => {
              const a = activite.get(s.id);
              const n = a?.reponses ?? 0;
              return (
                <li key={s.id} className="p-3 sm:p-4">
                  <Link to={`/forum/sujet/${s.id}`} className="break-words font-medium text-white hover:text-accent">
                    {s.titre}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    par {nomAuteur(s.auteur_nom)} · {n} réponse{n > 1 ? "s" : ""}
                    {n > 0 && a && ` · dernière de ${nomAuteur(a.dernierAuteur)}, ${dateLisible(a.derniere)}`}
                    {n === 0 && ` · ${dateLisible(s.created)}`}
                  </p>
                </li>
              );
            })}
            {!chargement && sujets.length === 0 && (
              <li className="p-4 text-sm text-slate-500">Aucun sujet dans ce salon.</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
