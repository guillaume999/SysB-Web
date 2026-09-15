// ============================================================
//  ForumSujet.tsx — /forum/sujet/:id : un sujet et ses réponses.
//  L'auteur (ou l'admin) corrige et supprime ; supprimer le sujet supprime
//  ses réponses (cascade PocketBase).
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Erreur, SupprimerEnPlace, TexteBrut } from "@/components/Communaute";
import { FormulairePost } from "@/components/ForumFormulaires";
import { useAuth } from "@/lib/auth";
import {
  chargerSujet,
  messageRefus,
  modifierReponse,
  modifierSujet,
  nomAuteur,
  participant,
  peutModifier,
  peutRepondre,
  raisonRefus,
  repondre,
  supprimerReponse,
  supprimerSujet,
  type Message,
  type Salon,
  type Sujet,
} from "@/lib/forum";
import { dateLisible } from "@/lib/news";

export default function ForumSujet() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user, estAdmin } = useAuth();
  const qui = participant(user, estAdmin);

  const [sujet, setSujet] = useState<Sujet | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [reponses, setReponses] = useState<Message[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  /** Ce qu'on corrige : "sujet", l'id d'une réponse, ou rien. */
  const [edite, setEdite] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurPost, setErreurPost] = useState<string | null>(null);
  const [suppression, setSuppression] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await chargerSujet(id);
      setSujet(r.sujet);
      setSalon(r.salon);
      setReponses(r.reponses);
    } catch (e) {
      setErreur(messageRefus(e, "Impossible de charger ce sujet."));
    } finally {
      setChargement(false);
    }
  }, [id]);

  useEffect(() => {
    void charger();
  }, [charger]);

  /** Enveloppe commune : occupe, erreur, rechargement. */
  const agir = async (geste: () => Promise<unknown>, apres?: () => void) => {
    setSaving(true);
    setErreurPost(null);
    try {
      await geste();
      apres?.();
      await charger();
      return true;
    } catch (e) {
      setErreurPost(messageRefus(e, "Envoi impossible."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (cible: "sujet" | string) => {
    setSuppression(cible);
    try {
      if (cible === "sujet" && sujet) {
        await supprimerSujet(sujet.id);
        navigate(`/forum/${sujet.salon}`);
        return;
      }
      await supprimerReponse(cible);
      setReponses((l) => l.filter((m) => m.id !== cible));
    } catch (e) {
      setErreur(messageRefus(e, "Suppression impossible."));
    } finally {
      setSuppression(null);
    }
  };

  const permis = salon ? peutRepondre(salon, qui) : false;
  const raison = salon ? raisonRefus(permis, qui, "reponse") : null;

  const entete = (p: Sujet | Message) => (
    <p className="text-xs text-slate-500">
      <span className="font-medium text-slate-300">{nomAuteur(p.auteur_nom)}</span> · {dateLisible(p.created)}
      {p.updated.slice(0, 16) !== p.created.slice(0, 16) && " · modifié"}
    </p>
  );

  const outils = (p: Sujet | Message, cible: string, quoi: string) =>
    peutModifier(p, qui) &&
    edite !== cible && (
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          className="text-xs text-slate-500 hover:text-white"
          onClick={() => {
            setErreurPost(null);
            setEdite(cible);
          }}
        >
          Modifier
        </button>
        <SupprimerEnPlace quoi={quoi} occupe={suppression === cible} onConfirme={() => void supprimer(cible)} />
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm">
        <Link to="/forum" className="text-slate-400 hover:text-white">Forum</Link>
        {salon && (
          <>
            <span className="text-slate-600"> / </span>
            <Link to={`/forum/${salon.id}`} className="text-slate-400 hover:text-white">{salon.nom}</Link>
          </>
        )}
      </p>
      <div className="mt-2">
        <Erreur>{erreur}</Erreur>
      </div>
      {chargement && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}

      {sujet && (
        <>
          <article className="card mt-2 p-4 sm:p-5">
            {edite === "sujet" ? (
              <FormulairePost
                avecTitre
                titreInitial={sujet.titre}
                contenuInitial={sujet.contenu}
                libelle="Enregistrer"
                saving={saving}
                erreur={erreurPost}
                onCancel={() => setEdite(null)}
                onSubmit={(t, c) => agir(() => modifierSujet(sujet.id, t, c), () => setEdite(null))}
              />
            ) : (
              <>
                <h1 className="break-words text-2xl font-semibold text-white">{sujet.titre}</h1>
                <div className="mt-1">{entete(sujet)}</div>
                <div className="mt-3">
                  <TexteBrut texte={sujet.contenu} />
                </div>
                {outils(
                  sujet,
                  "sujet",
                  reponses.length > 0 ? `ce sujet et ses ${reponses.length} réponse${reponses.length > 1 ? "s" : ""}` : "ce sujet",
                )}
              </>
            )}
          </article>

          <h2 className="mt-6 text-sm font-medium uppercase tracking-wide text-slate-400">
            {reponses.length} réponse{reponses.length > 1 ? "s" : ""}
          </h2>
          <ul className="mt-2 space-y-3">
            {reponses.map((m) => (
              <li key={m.id} className="card p-4">
                {edite === m.id ? (
                  <FormulairePost
                    avecTitre={false}
                    contenuInitial={m.contenu}
                    libelle="Enregistrer"
                    saving={saving}
                    erreur={erreurPost}
                    onCancel={() => setEdite(null)}
                    onSubmit={(_t, c) => agir(() => modifierReponse(m.id, c), () => setEdite(null))}
                  />
                ) : (
                  <>
                    {entete(m)}
                    <div className="mt-2">
                      <TexteBrut texte={m.contenu} />
                    </div>
                    {outils(m, m.id, "cette réponse")}
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            {permis && qui ? (
              <div className="card p-4">
                <h2 className="mb-2 text-sm font-medium text-white">Répondre</h2>
                <FormulairePost
                  avecTitre={false}
                  libelle="Envoyer"
                  saving={saving && edite === null}
                  erreur={edite === null ? erreurPost : null}
                  onSubmit={(_t, c) => agir(() => repondre(sujet.id, c, qui))}
                />
              </div>
            ) : (
              raison && (
                <p className="text-sm text-slate-500">
                  {raison}
                  {!qui && (
                    <>
                      {" "}
                      <Link to="/connexion" className="text-accent hover:underline">Se connecter</Link>
                    </>
                  )}
                </p>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
