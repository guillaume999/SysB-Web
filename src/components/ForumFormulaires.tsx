// ============================================================
//  ForumFormulaires.tsx — la fiche d'un salon (admin) et le formulaire
//  d'un message (sujet ou réponse, création ou correction).
// ============================================================

import { useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Erreur, Fenetre } from "@/components/Communaute";
import { MAX_TEXTE, MAX_TITRE, erreurPost, erreurSalon, type Salon, type ValeursSalon } from "@/lib/forum";

export function SalonDialog({
  salon,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  salon: Salon | null;
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (v: ValeursSalon) => void;
}) {
  const [v, setV] = useState<ValeursSalon>({
    nom: salon?.nom ?? "",
    description: salon?.description ?? "",
    ordre: salon?.ordre ?? 0,
    // Un nouveau salon est ouvert aux joueurs : c'est le cas courant.
    sujets_joueurs: salon?.sujets_joueurs ?? true,
    reponses_joueurs: salon?.reponses_joueurs ?? true,
  });
  const [local, setLocal] = useState<string | null>(null);
  const maj = (p: Partial<ValeursSalon>) => setV((a) => ({ ...a, ...p }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const err = erreurSalon(v);
    setLocal(err);
    if (!err) onSubmit(v);
  };

  return (
    <Fenetre titre={salon ? "Modifier le salon" : "Nouveau salon"} onFermer={onCancel}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          <div>
            <label className="label" htmlFor="salon-nom">Nom</label>
            <input id="salon-nom" className="input" value={v.nom} maxLength={100} autoFocus onChange={(e) => maj({ nom: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="salon-ordre">Ordre</label>
            <input
              id="salon-ordre"
              type="number"
              className="input"
              value={v.ordre}
              onChange={(e) => maj({ ordre: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="salon-desc">Description</label>
          <textarea
            id="salon-desc"
            className="input min-h-[5rem]"
            value={v.description}
            maxLength={1000}
            onChange={(e) => maj({ description: e.target.value })}
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="label">Ce que les joueurs peuvent faire</legend>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={v.sujets_joueurs} onChange={(e) => maj({ sujets_joueurs: e.target.checked })} />
            Ouvrir un sujet
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={v.reponses_joueurs} onChange={(e) => maj({ reponses_joueurs: e.target.checked })} />
            Répondre aux sujets
          </label>
          <Aide>
            <Terme nom="Lecture">toujours ouverte à tous, même sans compte.</Terme>
            <Terme nom="Ouvrir un sujet">décoché, seul l'admin crée des sujets (ex. un salon « Annonces »).</Terme>
            <Terme nom="Répondre">décoché, seul l'admin répond. Les deux cases sont indépendantes : « Annonces » avec réponses ouvertes = les joueurs commentent.</Terme>
            <Terme nom="Déjà écrit">décocher n'efface rien ; un joueur garde le droit de corriger ou supprimer ses propres messages.</Terme>
            <Terme nom="Ordre">les salons s'affichent du plus petit au plus grand, puis par nom.</Terme>
          </Aide>
        </fieldset>
        <Erreur>{local || erreur}</Erreur>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : salon ? "Enregistrer" : "Créer le salon"}
          </button>
        </div>
      </form>
    </Fenetre>
  );
}

/**
 * Le formulaire d'un message. `avecTitre` pour un sujet. En ligne (pas de
 * fenêtre) : il s'ouvre là où l'on écrit.
 */
export function FormulairePost({
  avecTitre,
  titreInitial = "",
  contenuInitial = "",
  libelle,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  avecTitre: boolean;
  titreInitial?: string;
  contenuInitial?: string;
  libelle: string;
  saving: boolean;
  erreur: string | null;
  onCancel?: () => void;
  onSubmit: (titre: string, contenu: string) => Promise<boolean> | void;
}) {
  const [titre, setTitre] = useState(titreInitial);
  const [contenu, setContenu] = useState(contenuInitial);
  const [local, setLocal] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const err = erreurPost(avecTitre ? titre : null, contenu);
    setLocal(err);
    if (err) return;
    // Vider seulement si l'envoi a réussi : sinon le texte tapé serait perdu.
    if ((await onSubmit(titre, contenu)) === true) {
      setTitre("");
      setContenu("");
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      {avecTitre && (
        <input
          className="input"
          placeholder="Titre du sujet"
          aria-label="Titre du sujet"
          value={titre}
          maxLength={MAX_TITRE}
          onChange={(e) => setTitre(e.target.value)}
        />
      )}
      <textarea
        className="input min-h-[7rem]"
        placeholder="Ton message"
        aria-label="Message"
        value={contenu}
        maxLength={MAX_TEXTE}
        onChange={(e) => setContenu(e.target.value)}
      />
      <Erreur>{local || erreur}</Erreur>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>Annuler</button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Envoi…" : libelle}
        </button>
      </div>
    </form>
  );
}
