import { useCallback, useEffect, useMemo, useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { useAuth, type Role } from "@/lib/auth";
import { messageErreur } from "@/lib/pb";
import {
  changerRole,
  correspond,
  creerJoueur,
  dateLisible,
  enregistrerJoueur,
  libelleRole,
  loadJoueurs,
  peutChangerLeRole,
  LONGUEUR_MOT_DE_PASSE,
  ROLES,
  ROLE_PAR_DEFAUT,
  type Joueur,
  type ValeursJoueur,
} from "@/lib/joueurs";

/**
 * Les comptes joueurs : la liste, la création d'un compte, et une fiche pour corriger
 * un compte existant ou changer son rôle.
 *
 * Deux chemins pour le rôle, volontairement : la **bascule admin** dans la ligne, pour
 * le geste courant (promouvoir quelqu'un, le rétrograder), et le **menu déroulant** de
 * la fiche, seul endroit d'où l'on atteint « testeur ».
 *
 * Toute confirmation se fait **en HTML dans le tableau**, jamais par `window.confirm` :
 * une popup native gèle l'automatisation du navigateur.
 *
 * Pas de suppression : elle laisserait des plateaux orphelins, et la règle `delete` de
 * PocketBase l'interdit de toute façon à un admin sur le compte d'un autre.
 */
export default function Joueurs() {
  const { user, signOut } = useAuth();

  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");

  /** `joueur: null` = fenêtre de création. */
  const [dialog, setDialog] = useState<{ joueur: Joueur | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [erreurDialog, setErreurDialog] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /** La bascule admin en attente de confirmation, dans la ligne du joueur visé. */
  const [bascule, setBascule] = useState<{ joueur: Joueur; vers: Role } | null>(null);
  const [basculeEnCours, setBasculeEnCours] = useState(false);

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

  const ouvrir = (joueur: Joueur | null) => {
    setErreurDialog(null);
    setMessage(null);
    setBascule(null);
    setDialog({ joueur });
  };

  const enregistrer = async (valeurs: ValeursJoueur) => {
    if (!dialog) return;
    setSaving(true);
    setErreurDialog(null);
    try {
      const cible = dialog.joueur;

      if (cible === null) {
        const { verifie } = await creerJoueur(valeurs);
        setDialog(null);
        setMessage(
          `Compte créé pour ${valeurs.pseudo.trim() || valeurs.email.trim()} (${libelleRole(valeurs.role)}). ` +
            `Transmets-lui son mot de passe : il n'est plus lisible ensuite.` +
            (verifie ? "" : " Le compte est resté « non vérifié » — sans conséquence pour se connecter."),
        );
        await charger();
        return;
      }

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

  const appliquerBascule = async () => {
    if (!bascule) return;
    setBasculeEnCours(true);
    setErreur(null);
    try {
      await changerRole(bascule.joueur, bascule.vers);
      const qui = bascule.joueur.pseudo?.trim() || bascule.joueur.email;
      setMessage(
        bascule.vers === "admin"
          ? `${qui} est maintenant admin : il peut ouvrir ce site et écrire tout le contenu du jeu.`
          : `${qui} n'est plus admin. Sa session sur ce site tombera à son prochain chargement de page.`,
      );
      setBascule(null);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e, "Changement de rôle refusé."));
    } finally {
      setBasculeEnCours(false);
    }
  };

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Joueurs</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Les comptes du jeu. On peut en créer un ici, corriger un pseudo, réparer un email,
            redonner un mot de passe à quelqu'un qui a perdu le sien, et donner ou retirer le rôle
            admin.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => void charger()}>
            Recharger
          </button>
          <button className="btn-primary" onClick={() => ouvrir(null)}>
            Nouveau joueur
          </button>
        </div>
      </header>

      <Aide titre="Ce que cet écran change, et ce qu'il ne change pas">
        <Terme nom="créer un compte">
          Le compte naît utilisable et « vérifié » : pas de mail de confirmation à cliquer. C'est
          toi qui choisis le mot de passe et qui le transmets — il n'est plus lisible après.
        </Terme>
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
        <Terme nom="rôle admin">
          Donne le droit d'ouvrir ce site et d'écrire tout le contenu du jeu : catalogue, plateaux
          modèles, comptes. À ne confier qu'à quelqu'un qui doit vraiment y toucher. Le retirer
          coupe cet accès dès le prochain chargement de page, sans rien casser côté jeu.
        </Terme>
        <Terme nom="testeur">
          Un joueur ordinaire côté droits — l'étiquette sert juste à repérer les comptes d'essai.
          Elle se pose depuis la fiche, pas depuis la liste.
        </Terme>
        <Terme nom="ton propre compte">
          Tu ne peux pas te retirer ton rôle admin : tu perdrais l'accès à ce site sur-le-champ, et
          s'il ne reste aucun autre admin, plus personne ne pourrait te le rendre autrement que
          dans l'admin PocketBase.
        </Terme>
        <Terme nom="suppression">
          Absente : supprimer un compte laisserait ses plateaux orphelins. À faire dans l'admin
          PocketBase, après avoir regardé ce qui lui appartient.
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
                <th className="w-52 px-3 py-2" />
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
                visibles.map((j) => {
                  const cestMoi = j.id === user?.id;
                  const estAdmin = j.role === "admin";
                  const confirme = bascule?.joueur.id === j.id;
                  return (
                    <LigneJoueur
                      key={j.id}
                      joueur={j}
                      cestMoi={cestMoi}
                      estAdmin={estAdmin}
                      peutBasculer={peutChangerLeRole(j, user?.id)}
                      confirme={confirme ? bascule : null}
                      basculeEnCours={basculeEnCours}
                      onModifier={() => ouvrir(j)}
                      onDemanderBascule={() =>
                        setBascule({ joueur: j, vers: estAdmin ? ROLE_PAR_DEFAUT : "admin" })
                      }
                      onAnnulerBascule={() => setBascule(null)}
                      onConfirmerBascule={() => void appliquerBascule()}
                    />
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <JoueurDialog
          joueur={dialog.joueur}
          cestMoi={dialog.joueur?.id === user?.id}
          saving={saving}
          erreur={erreurDialog}
          onCancel={() => setDialog(null)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}

/**
 * Une ligne, et la ligne de confirmation qui se déplie sous elle quand on demande une
 * bascule de rôle. Deux `<tr>` renvoyés d'un bloc : d'où le fragment.
 */
function LigneJoueur({
  joueur,
  cestMoi,
  estAdmin,
  peutBasculer,
  confirme,
  basculeEnCours,
  onModifier,
  onDemanderBascule,
  onAnnulerBascule,
  onConfirmerBascule,
}: {
  joueur: Joueur;
  cestMoi: boolean;
  estAdmin: boolean;
  peutBasculer: boolean;
  confirme: { joueur: Joueur; vers: Role } | null;
  basculeEnCours: boolean;
  onModifier: () => void;
  onDemanderBascule: () => void;
  onAnnulerBascule: () => void;
  onConfirmerBascule: () => void;
}) {
  const qui = joueur.pseudo?.trim() || joueur.email || joueur.id;

  return (
    <>
      <tr className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
        <td className="px-3 py-2 text-slate-200">
          {joueur.pseudo?.trim() || <span className="text-slate-600">sans pseudo</span>}
          {cestMoi && <span className="ml-2 text-[10px] uppercase text-slate-500">toi</span>}
        </td>
        <td className="px-3 py-2 text-slate-400">
          <span className="font-mono text-xs">{joueur.email || "—"}</span>
          {!joueur.verified && (
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
              estAdmin ? "border-accent/60 text-accent" : "border-edge text-slate-400"
            }`}
          >
            {libelleRole(joueur.role)}
          </span>
        </td>
        <td className="px-3 py-2 tabular-nums text-xs text-slate-500">
          {dateLisible(joueur.created)}
        </td>
        <td className="px-3 py-2 text-right">
          <div className="flex items-center justify-end gap-3">
            {peutBasculer && !confirme && (
              <button
                className="text-xs text-slate-400 hover:text-white hover:underline"
                onClick={onDemanderBascule}
              >
                {estAdmin ? "Retirer admin" : "Donner admin"}
              </button>
            )}
            <button className="text-xs text-accent hover:underline" onClick={onModifier}>
              Modifier
            </button>
          </div>
        </td>
      </tr>

      {confirme && (
        <tr className="border-b border-edge/60 bg-ink/60">
          <td colSpan={5} className="px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-slate-300">
                {confirme.vers === "admin" ? (
                  <>
                    Donner le rôle <strong className="text-accent">admin</strong> à {qui} ? Il
                    pourra ouvrir ce site et écrire tout le contenu du jeu.
                  </>
                ) : (
                  <>
                    Retirer le rôle admin à {qui} ? Il redevient un joueur ordinaire et perd
                    l'accès à ce site.
                  </>
                )}
              </span>
              <span className="flex gap-2">
                <button className="btn-ghost" onClick={onAnnulerBascule} disabled={basculeEnCours}>
                  Annuler
                </button>
                <button
                  className="btn-primary"
                  onClick={onConfirmerBascule}
                  disabled={basculeEnCours}
                >
                  {basculeEnCours ? "Un instant…" : "Confirmer"}
                </button>
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * La fenêtre sert aux deux cas : `joueur === null` pour une création, sinon la fiche du
 * compte. Elle vit dans le même fichier plutôt que d'ouvrir un module pour quatre champs.
 */
function JoueurDialog({
  joueur,
  cestMoi,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  joueur: Joueur | null;
  cestMoi: boolean;
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (valeurs: ValeursJoueur) => void;
}) {
  const creation = joueur === null;

  const [pseudo, setPseudo] = useState(joueur?.pseudo ?? "");
  const [email, setEmail] = useState(joueur?.email ?? "");
  const [role, setRole] = useState<Role>((joueur?.role || ROLE_PAR_DEFAUT) as Role);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  // En création le mot de passe est obligatoire : la case est cochée et verrouillée.
  const [changeMotDePasse, setChangeMotDePasse] = useState(creation);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const emailNet = email.trim();
  const emailChange = !creation && emailNet.toLowerCase() !== (joueur?.email ?? "").toLowerCase();
  const emailInvalide = emailNet !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailNet);
  const motDePasseCourt =
    changeMotDePasse && motDePasse.length > 0 && motDePasse.length < LONGUEUR_MOT_DE_PASSE;
  const motDePasseDifferent = changeMotDePasse && confirmation !== motDePasse;
  const roleChange = !creation && role !== joueur?.role;
  const rienAFaire =
    !creation &&
    pseudo.trim() === (joueur?.pseudo ?? "") &&
    !emailChange &&
    !roleChange &&
    !(changeMotDePasse && motDePasse !== "");

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
            role,
            motDePasse: changeMotDePasse ? motDePasse : "",
          });
        }}
        className="card w-full max-w-lg p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-white">
          {creation ? "Nouveau joueur" : "Fiche du joueur"}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {creation ? (
            "Le compte sera utilisable tout de suite, sans mail de confirmation."
          ) : (
            <>
              Compte créé le {dateLisible(joueur.created)} ·{" "}
              <span className="font-mono">{joueur.id}</span>
            </>
          )}
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

        <div className="mt-4">
          <label className="label" htmlFor="joueur-role">
            Rôle
          </label>
          <select
            id="joueur-role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={cestMoi}
          >
            {ROLES.map((r) => (
              <option key={r.valeur} value={r.valeur}>
                {r.libelle} — {r.aide}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {cestMoi
              ? "C'est ton propre compte : ton rôle n'est pas modifiable ici, tu perdrais l'accès au site."
              : "« admin » ouvre ce site et l'écriture de tout le contenu du jeu."}
          </p>
        </div>

        <div className="mt-4 rounded border border-edge bg-ink/40 p-3">
          {creation ? (
            <p className="text-sm text-slate-300">Mot de passe de départ</p>
          ) : (
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
          )}

          {changeMotDePasse && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="joueur-mdp">
                  {creation ? "Mot de passe" : "Nouveau mot de passe"}
                </label>
                <input
                  id="joueur-mdp"
                  type="password"
                  className="input"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  autoComplete="new-password"
                  placeholder={`${LONGUEUR_MOT_DE_PASSE} caractères minimum`}
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
                {creation
                  ? "Note-le avant d'enregistrer : il ne sera plus lisible ensuite, et c'est à toi de le transmettre au joueur."
                  : cestMoi
                    ? "C'est ton propre compte : tu seras déconnecté du site aussitôt enregistré."
                    : "Le joueur sera déconnecté du jeu et devra saisir ce mot de passe — pense à le lui transmettre, il ne sera plus lisible ensuite."}
              </p>
            </div>
          )}
        </div>

        {roleChange && (
          <p className="mt-4 rounded border border-amber-900/60 bg-amber-950/30 p-2 text-sm text-amber-300">
            {role === "admin"
              ? "Le rôle passe à « admin » : ce compte pourra ouvrir ce site et écrire tout le contenu du jeu."
              : `Le rôle passe à « ${libelleRole(role)} » : ce compte perdra l'accès à ce site.`}
          </p>
        )}
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
            PocketBase demande au moins {LONGUEUR_MOT_DE_PASSE} caractères.
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
            {saving ? "Enregistrement…" : creation ? "Créer le compte" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
