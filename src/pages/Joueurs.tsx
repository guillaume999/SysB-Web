import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { useAuth } from "@/lib/auth";
import { messageErreur } from "@/lib/pb";
import {
  correspond,
  dateLisible,
  enregistrerJoueur,
  libelleRole,
  loadJoueurs,
  type Joueur,
  type ValeursJoueur,
} from "@/lib/joueurs";

/**
 * Les comptes joueurs : la liste, et une fenêtre pour corriger une fiche.
 *
 * Pas de bouton « Nouveau » — un compte naît dans le jeu, à l'inscription — et pas de
 * changement de rôle : donner « admin » ouvre l'écriture sur tout le contenu, donc ça
 * se fait à la main dans l'admin PocketBase.
 */
export default function Joueurs() {
  const { user, signOut } = useAuth();

  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");

  const [dialog, setDialog] = useState<{ joueur: Joueur } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setJoueurs(await loadJoueurs());
    } catch (e) {
      setErreur(messageErreur(e, "Chargement des joueurs impossible."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const visibles = useMemo(
    () => joueurs.filter((j) => correspond(j, recherche)),
    [joueurs, recherche],
  );

  const enregistrer = async (valeurs: ValeursJoueur) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      const cible = dialog.joueur;
      const motDePasseChange = valeurs.motDePasse !== "";
      await enregistrerJoueur(cible, valeurs);
      setDialog(null);

      // Changer son propre mot de passe invalide le jeton en cours : autant sortir
      // proprement plutôt que de laisser l'écran échouer à la requête suivante.
      if (motDePasseChange && cible.id === user?.id) {
        signOut();
        return;
      }

      setMessage(
        motDePasseChange
          ? `Fiche enregistrée. ${cible.pseudo || cible.email} devra se reconnecter dans le jeu avec son nouveau mot de passe.`
          : "Fiche enregistrée.",
      );
      await charger();
    } catch (e) {
      setErreurDialog(messageErreur(e, "Enregistrement refusé."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Joueurs</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Les comptes du jeu. On ne les crée pas ici — un compte naît à l'inscription, dans le
            jeu — mais on peut corriger un pseudo, réparer un email et redonner un mot de passe à
            quelqu'un qui a perdu le sien.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => void charger()}>
            Recharger
          </button>
        </div>
      </header>

      <Aide titre="Ce que cet écran change, et ce qu'il ne change pas">
        <Terme nom="pseudo">
          Le nom affiché en jeu. Se corrige sans conséquence : rien d'autre n'y fait référence.
        </Terme>
        <Terme nom="email">
          L'identifiant de connexion. Le modifier repasse le compte en « non vérifié » et c'est le
          nouvel email qu'il faudra saisir pour se connecter.
        </Terme>
        <Terme nom="mot de passe">
          Se remplace sans connaître l'ancien, mais ne se lit pas — PocketBase n'en garde qu'une
          empreinte. Le joueur est déconnecté de ses appareils et doit ressaisir le nouveau.
        </Terme>
        <Terme nom="rôle">
          Volontairement non modifiable ici. « admin » donne le droit d'écrire tout le contenu du
          jeu et d'ouvrir ce site : ça se change à la main dans l'admin PocketBase, sur
          pb-sysb.physiooffice.com/_/.
        </Terme>
        <Terme nom="suppression">
          Absente elle aussi : supprimer un compte laisserait ses plateaux orphelins. À faire dans
          l'admin PocketBase, après avoir regardé ce qui lui appartient.
        </Terme>
      </Aide>

      {erreur && (
        <p className="mb-4 mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
          {erreur}
        </p>
      )}
      {message && (
        <p className="mb-4 mt-4 flex items-start justify-between gap-3 rounded border border-emerald-900/60 bg-emerald-950/30 p-2 text-sm text-emerald-300">
          <span>{message}</span>
          <button className="text-xs text-emerald-400 hover:text-white" onClick={() => setMessage(null)}>
            Fermer
          </button>
        </p>
      )}

      <div className="mb-3 mt-4 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher un pseudo, un email…"
        />
        <span className="text-xs text-slate-500">
          {chargement
            ? "Chargement…"
            : `${visibles.length} compte${visibles.length > 1 ? "s" : ""}${
                recherche.trim() ? ` sur ${joueurs.length}` : ""
              }`}
        </span>
      </div>

      {!chargement && joueurs.length === 0 ? (
        <div className="card p-5 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Aucun compte visible.</p>
          <p className="mt-2 max-w-2xl">
            Soit personne ne s'est encore inscrit, soit la règle de lecture de la collection{" "}
            <code className="text-slate-300">users</code> ne laisse pas un admin voir les autres
            comptes. Elle doit contenir{" "}
            <code className="text-slate-300">@request.auth.role = "admin"</code>.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2 font-medium">pseudo</th>
                <th className="px-3 py-2 font-medium">email</th>
                <th className="w-24 px-3 py-2 font-medium">rôle</th>
                <th className="w-28 px-3 py-2 font-medium">inscrit le</th>
                <th className="w-28 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {chargement && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Chargement…
                  </td>
                </tr>
              )}
              {!chargement && visibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Aucun compte ne correspond à « {recherche.trim()} ».
                  </td>
                </tr>
              )}
              {!chargement &&
                visibles.map((j) => (
                  <tr key={j.id} className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
                    <td className="px-3 py-2 text-slate-200">
                      {j.pseudo?.trim() || <span className="text-slate-600">sans pseudo</span>}
                      {j.id === user?.id && (
                        <span className="ml-2 text-[10px] uppercase text-slate-500">toi</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      <span className="font-mono text-xs">{j.email || "—"}</span>
                      {!j.verified && (
                        <span
                          className="ml-2 rounded border border-amber-900/60 px-1.5 py-0.5 text-[10px] uppercase text-amber-400"
                          title="Email jamais confirmé par un clic dans le mail de vérification."
                        >
                          non vérifié
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${
                          j.role === "admin"
                            ? "border-accent/60 text-accent"
                            : "border-edge text-slate-400"
                        }`}
                      >
                        {libelleRole(j.role)}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-xs text-slate-500">
                      {dateLisible(j.created)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="text-xs text-accent hover:underline"
                        onClick={() => {
                          setErreurDialog(null);
                          setMessage(null);
                          setDialog({ joueur: j });
                        }}
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <JoueurDialog
          joueur={dialog.joueur}
          cestMoi={dialog.joueur.id === user?.id}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}

/** Formulaire court : il vit dans le même fichier plutôt que d'ouvrir un module pour trois champs. */
function JoueurDialog({
  joueur,
  cestMoi,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  joueur: Joueur;
  cestMoi: boolean;
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: ValeursJoueur) => void;
}) {
  const [pseudo, setPseudo] = useState(joueur.pseudo ?? "");
  const [email, setEmail] = useState(joueur.email ?? "");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [changeMotDePasse, setChangeMotDePasse] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const emailNet = email.trim();
  const emailChange = emailNet.toLowerCase() !== (joueur.email ?? "").toLowerCase();
  const emailInvalide = emailNet !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailNet);
  const motDePasseCourt = changeMotDePasse && motDePasse.length > 0 && motDePasse.length < 8;
  const motDePasseDifferent = changeMotDePasse && confirmation !== motDePasse;
  const rienAFaire =
    pseudo.trim() === (joueur.pseudo ?? "") && !emailChange && !(changeMotDePasse && motDePasse !== "");

  const bloque =
    saving ||
    emailNet === "" ||
    emailInvalide ||
    motDePasseCourt ||
    motDePasseDifferent ||
    (changeMotDePasse && motDePasse === "") ||
    rienAFaire;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (bloque) return;
          onSubmit({
            pseudo: pseudo.trim(),
            email: emailNet,
            motDePasse: changeMotDePasse ? motDePasse : "",
          });
        }}
        className="card w-full max-w-lg p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-white">Fiche du joueur</h2>
        <p className="mt-1 text-xs text-slate-500">
          Compte créé le {dateLisible(joueur.created)} ·{" "}
          <span className="font-mono">{joueur.id}</span>
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="joueur-pseudo">
              Pseudo
            </label>
            <input
              id="joueur-pseudo"
              className="input"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Samp"
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-500">Le nom affiché en jeu.</p>
          </div>

          <div>
            <label className="label" htmlFor="joueur-email">
              Email
            </label>
            <input
              id="joueur-email"
              className="input font-mono text-xs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joueur@exemple.com"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              C'est aussi son identifiant de connexion.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded border border-edge bg-ink/40 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent"
              checked={changeMotDePasse}
              onChange={(e) => {
                setChangeMotDePasse(e.target.checked);
                setMotDePasse("");
                setConfirmation("");
              }}
            />
            Donner un nouveau mot de passe
          </label>

          {changeMotDePasse && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="joueur-mdp">
                  Nouveau mot de passe
                </label>
                <input
                  id="joueur-mdp"
                  type="password"
                  className="input"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                />
              </div>
              <div>
                <label className="label" htmlFor="joueur-mdp2">
                  Confirmation
                </label>
                <input
                  id="joueur-mdp2"
                  type="password"
                  className="input"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-slate-500 sm:col-span-2">
                {cestMoi
                  ? "C'est ton propre compte : tu seras déconnecté du site aussitôt enregistré."
                  : "Le joueur sera déconnecté du jeu et devra saisir ce mot de passe — pense à le lui transmettre, il ne sera plus lisible ensuite."}
              </p>
            </div>
          )}
        </div>

        {emailChange && (
          <p className="mt-4 rounded border border-amber-900/60 bg-amber-950/30 p-2 text-sm text-amber-300">
            L'email change : le compte repassera en « non vérifié » et la connexion se fera
            désormais avec {emailNet}.
          </p>
        )}
        {emailInvalide && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Cet email n'a pas une forme valide.
          </p>
        )}
        {motDePasseCourt && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            PocketBase demande au moins 8 caractères.
          </p>
        )}
        {!motDePasseCourt && motDePasseDifferent && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">
            Les deux saisies ne correspondent pas.
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
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
