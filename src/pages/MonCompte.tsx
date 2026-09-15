import { useCallback, useEffect, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { useAuth } from "@/lib/auth";
import { AncienMotDePasseFaux, LONGUEUR_MAX_MOT_DE_PASSE, changerMonMotDePasse, loadMonCompte, problemeSaisie } from "@/lib/compte";
import { LONGUEUR_MOT_DE_PASSE, dateLisible, libelleRole, type Joueur } from "@/lib/joueurs";
import { messageErreur } from "@/lib/pb";

/**
 * « Mon compte » — ouvert à TOUT compte connecté (joueur, testeur, admin).
 *
 * La fiche est en LECTURE : pseudo, email et rôle se corrigent dans l'onglet
 * Joueurs, par un admin. Le seul geste d'écriture est le mot de passe, et il
 * passe par `lib/compte.ts` (vérification de l'actuel, puis reconnexion).
 */
export default function MonCompte() {
  const { user } = useAuth();
  const id = user?.id;

  const [fiche, setFiche] = useState<Joueur | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    setErreur(null);
    try {
      setFiche(await loadMonCompte(id));
    } catch (e) {
      setErreur(messageErreur(e, "Lecture de la fiche impossible."));
    }
  }, [id]);

  useEffect(() => {
    void charger();
  }, [charger]);

  return (
    <div className="max-w-2xl">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-white">Mon compte</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ton compte de jeu SysB — le même que dans l'application.
        </p>
      </header>

      {erreur && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">{erreur}</p>
      )}

      <section className="card p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Ma fiche</h2>
        {!fiche && !erreur && <p className="mt-3 text-sm text-slate-500">Chargement…</p>}
        {fiche && (
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
            <Ligne nom="Pseudo">{fiche.pseudo?.trim() || <span className="text-slate-500">—</span>}</Ligne>
            <Ligne nom="Email">
              <span className="break-all">{fiche.email}</span>
            </Ligne>
            <Ligne nom="Email vérifié">
              {fiche.verified ? "oui" : <span className="text-amber-300">non</span>}
            </Ligne>
            <Ligne nom="Rôle">{libelleRole(fiche.role ?? "")}</Ligne>
            <Ligne nom="Compte créé le">{dateLisible(fiche.created)}</Ligne>
            <Ligne nom="Identifiant">
              <code className="break-all text-xs text-slate-400">{fiche.id}</code>
            </Ligne>
          </dl>
        )}
        <Aide titre="Corriger ma fiche">
          <p>
            Le pseudo, l'email et le rôle ne se modifient pas ici : demande à un administrateur, qui
            les corrige depuis l'onglet Joueurs.
          </p>
          <Terme nom="email">
            C'est ton identifiant de connexion, sur ce site comme dans le jeu. Il n'est montré qu'à toi
            et aux administrateurs.
          </Terme>
        </Aide>
      </section>

      {fiche && <ChangerMotDePasse fiche={fiche} />}
    </div>
  );
}

function Ligne({ nom, children }: { nom: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-slate-500">{nom}</dt>
      <dd className="-mt-2 text-slate-200 sm:mt-0">{children}</dd>
    </>
  );
}

function ChangerMotDePasse({ fiche }: { fiche: Joueur }) {
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const envoyer = async (event: React.FormEvent) => {
    event.preventDefault();
    setErreur(null);
    setSucces(null);

    const saisie = { ancien, nouveau, confirmation };
    const probleme = problemeSaisie(saisie);
    if (probleme) {
      setErreur(probleme);
      return;
    }

    setEnCours(true);
    try {
      const resteConnecte = await changerMonMotDePasse(fiche, saisie);
      setAncien("");
      setNouveau("");
      setConfirmation("");
      // Si la reconnexion a échoué, la session est vidée et App bascule sur la
      // page publique : ce message ne sera pas vu, mais le mot de passe est bien changé.
      if (resteConnecte)
        setSucces(
          "Mot de passe changé. Tes autres appareils (dont le jeu) te demanderont le nouveau à la prochaine connexion.",
        );
    } catch (e) {
      if (e instanceof AncienMotDePasseFaux) {
        setErreur(e.message);
        setAncien("");
      } else {
        setErreur(messageErreur(e, "Changement du mot de passe refusé."));
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <section className="card mt-5 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-white">Changer mon mot de passe</h2>

      <form onSubmit={envoyer} className="mt-3 space-y-4">
        {/* Aide les gestionnaires de mots de passe à rattacher la saisie au bon compte. */}
        <input type="email" autoComplete="username" value={fiche.email} readOnly hidden />
        <div>
          <label className="label" htmlFor="mdp-actuel">Mot de passe actuel</label>
          <input
            id="mdp-actuel"
            type="password"
            autoComplete="current-password"
            className="input"
            value={ancien}
            onChange={(e) => setAncien(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="mdp-nouveau">Nouveau mot de passe</label>
          <input
            id="mdp-nouveau"
            type="password"
            autoComplete="new-password"
            className="input"
            minLength={LONGUEUR_MOT_DE_PASSE}
            maxLength={LONGUEUR_MAX_MOT_DE_PASSE}
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-slate-500">Au moins {LONGUEUR_MOT_DE_PASSE} caractères.</p>
        </div>
        <div>
          <label className="label" htmlFor="mdp-confirmation">Nouveau mot de passe, encore une fois</label>
          <input
            id="mdp-confirmation"
            type="password"
            autoComplete="new-password"
            className="input"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
          />
        </div>

        {erreur && (
          <p className="rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">{erreur}</p>
        )}
        {succes && (
          <p className="rounded border border-emerald-900/60 bg-emerald-950/40 p-2 text-sm text-emerald-300">{succes}</p>
        )}

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={enCours}>
          {enCours ? "Changement…" : "Changer le mot de passe"}
        </button>
      </form>

      <Aide>
        <Terme nom="mot de passe actuel">
          Demandé à chaque fois : c'est ce qui empêche quelqu'un qui passerait devant ta session
          ouverte de te le changer.
        </Terme>
        <Terme nom="après le changement">
          Tu restes connecté ici. Partout ailleurs — le jeu, un autre navigateur — l'ancienne session
          tombe et il faut saisir le nouveau mot de passe.
        </Terme>
        <Terme nom="mot de passe oublié">
          Ce formulaire ne sert que si tu connais l'actuel. Sinon, un administrateur peut t'en donner
          un nouveau depuis l'onglet Joueurs.
        </Terme>
      </Aide>
    </section>
  );
}
