// ============================================================
//  NewsDialog.tsx — écrire ou corriger une news (admin).
//  Onglets Texte / Aperçu : l'aperçu est le rendu exact de la page News.
// ============================================================

import { useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import { Erreur, Fenetre } from "@/components/Communaute";
import Markdown from "@/components/Markdown";
import { erreurNews, urlImage, type News, type ValeursNews } from "@/lib/news";

export default function NewsDialog({
  news,
  saving,
  erreur,
  onCancel,
  onSubmit,
}: {
  news: News | null;
  saving: boolean;
  erreur: string | null;
  onCancel: () => void;
  onSubmit: (v: ValeursNews) => void;
}) {
  const [titre, setTitre] = useState(news?.titre ?? "");
  const [contenu, setContenu] = useState(news?.contenu ?? "");
  const [publiee, setPubliee] = useState(news?.publiee ?? true);
  const [image, setImage] = useState<File | null | undefined>(undefined);
  const [apercu, setApercu] = useState(false);
  const [local, setLocal] = useState<string | null>(null);

  const imageActuelle = image === undefined && news ? urlImage(news) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const v = { titre, contenu, publiee, image };
    const err = erreurNews(v);
    setLocal(err);
    if (!err) onSubmit(v);
  };

  return (
    <Fenetre titre={news ? "Modifier la news" : "Nouvelle news"} onFermer={onCancel}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="news-titre">Titre</label>
          <input
            id="news-titre"
            className="input"
            value={titre}
            maxLength={200}
            autoFocus
            onChange={(e) => setTitre(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center gap-3">
            <span className="label mb-0">Texte</span>
            <button type="button" className={`text-xs ${!apercu ? "text-white" : "text-slate-500"}`} onClick={() => setApercu(false)}>
              Écrire
            </button>
            <button type="button" className={`text-xs ${apercu ? "text-white" : "text-slate-500"}`} onClick={() => setApercu(true)}>
              Aperçu
            </button>
          </div>
          {apercu ? (
            <div className="min-h-[12rem] rounded-md border border-edge bg-ink p-3 text-sm">
              {contenu.trim() ? <Markdown source={contenu} /> : <p className="text-slate-500">Rien à afficher.</p>}
            </div>
          ) : (
            <textarea
              className="input min-h-[12rem] font-mono"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder={"## Mise à jour\n\n- **nouveau** bâtiment\n- [le forum](/forum)"}
            />
          )}
          <Aide titre="Mise en forme">
            <Terme nom="## Titre">un intertitre (### plus petit).</Terme>
            <Terme nom="**gras**, *italique*, `code`">dans une phrase.</Terme>
            <Terme nom="- élément">une liste à puces ; « 1. » pour une liste numérotée.</Terme>
            <Terme nom="[texte](https://…)">un lien — seuls http(s), mailto et les adresses du site (/forum) deviennent cliquables.</Terme>
            <Terme nom="ligne vide">sépare deux paragraphes.</Terme>
          </Aide>
        </div>

        <div>
          <span className="label">Image (facultative)</span>
          {imageActuelle && (
            <div className="mb-2 flex items-center gap-3">
              <img src={imageActuelle} alt="" className="h-16 rounded border border-edge object-cover" />
              <button type="button" className="text-xs text-slate-400 hover:text-red-400" onClick={() => setImage(null)}>
                Retirer l'image
              </button>
            </div>
          )}
          {image === null && <p className="mb-2 text-xs text-amber-300">L'image sera retirée à l'enregistrement.</p>}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="block text-sm text-slate-300"
            onChange={(e) => setImage(e.target.files?.[0] ?? undefined)}
          />
          <p className="mt-1 text-xs text-slate-500">PNG, JPEG, WebP ou GIF, 5 Mo au plus. Affichée en tête de la news.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={publiee} onChange={(e) => setPubliee(e.target.checked)} />
          Publiée — visible par tout le monde, connecté ou pas
        </label>
        {!publiee && <p className="text-xs text-slate-500">Brouillon : seuls les admins la voient.</p>}

        <Erreur>{local || erreur}</Erreur>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : news ? "Enregistrer" : "Publier"}
          </button>
        </div>
      </form>
    </Fenetre>
  );
}
