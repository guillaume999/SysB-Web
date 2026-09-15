// ============================================================
//  News.tsx — /news, LISIBLE SANS CONNEXION (15/09).
//  L'admin y écrit, corrige, dépublie et supprime. Tout le monde lit.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { Erreur, SupprimerEnPlace } from "@/components/Communaute";
import Markdown from "@/components/Markdown";
import NewsDialog from "@/components/NewsDialog";
import { useAuth } from "@/lib/auth";
import {
  chargerNews,
  dateLisible,
  enregistrerNews,
  supprimerNews,
  urlImage,
  type News as UneNews,
  type ValeursNews,
} from "@/lib/news";
import { messageErreur } from "@/lib/pb";

export default function News() {
  const { user, estAdmin } = useAuth();
  const [items, setItems] = useState<UneNews[]>([]);
  const [page, setPage] = useState(1);
  const [fin, setFin] = useState(true);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [edition, setEdition] = useState<UneNews | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [erreurFiche, setErreurFiche] = useState<string | null>(null);
  const [suppression, setSuppression] = useState<string | null>(null);

  const charger = useCallback(async (p: number) => {
    setChargement(true);
    setErreur(null);
    try {
      const r = await chargerNews(p);
      setItems((avant) => (p === 1 ? r.items : [...avant, ...r.items]));
      setFin(r.fin);
      setPage(p);
    } catch (e) {
      setErreur(messageErreur(e, "Impossible de charger les news."));
    } finally {
      setChargement(false);
    }
  }, []);

  // Recharger quand on se connecte / déconnecte : un admin voit les brouillons.
  useEffect(() => {
    void charger(1);
  }, [charger, estAdmin]);

  const enregistrer = async (v: ValeursNews) => {
    setSaving(true);
    setErreurFiche(null);
    try {
      await enregistrerNews(edition ?? null, v, user?.id ?? null);
      setEdition(undefined);
      await charger(1);
    } catch (e) {
      setErreurFiche(messageErreur(e, "Enregistrement impossible."));
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (id: string) => {
    setSuppression(id);
    try {
      await supprimerNews(id);
      setItems((l) => l.filter((n) => n.id !== id));
    } catch (e) {
      setErreur(messageErreur(e, "Suppression impossible."));
    } finally {
      setSuppression(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-white">News</h1>
        {estAdmin && (
          <button
            className="btn-primary ml-auto"
            onClick={() => {
              setErreurFiche(null);
              setEdition(null);
            }}
          >
            Nouvelle news
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-400">Les nouvelles du jeu SysB.</p>

      <div className="mt-4">
        <Erreur>{erreur}</Erreur>
      </div>

      <div className="mt-4 space-y-6">
        {items.map((n) => {
          const img = urlImage(n);
          return (
            <article key={n.id} className="card overflow-hidden">
              {img && <img src={img} alt="" className="max-h-80 w-full object-cover" />}
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="min-w-0 break-words text-xl font-semibold text-white">{n.titre}</h2>
                  {!n.publiee && (
                    <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[11px] text-amber-300">brouillon</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {dateLisible(n.created)}
                  {n.updated.slice(0, 16) !== n.created.slice(0, 16) && ` · modifiée le ${dateLisible(n.updated)}`}
                </p>
                {n.contenu.trim() && (
                  <div className="mt-3 break-words text-sm">
                    <Markdown source={n.contenu} />
                  </div>
                )}
                {estAdmin && (
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-edge pt-3">
                    <button
                      className="text-xs text-slate-400 hover:text-white"
                      onClick={() => {
                        setErreurFiche(null);
                        setEdition(n);
                      }}
                    >
                      Modifier
                    </button>
                    <SupprimerEnPlace quoi="cette news" occupe={suppression === n.id} onConfirme={() => void supprimer(n.id)} />
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {!chargement && items.length === 0 && !erreur && (
          <p className="text-sm text-slate-500">Aucune news pour l'instant.</p>
        )}
        {chargement && <p className="text-sm text-slate-500">Chargement…</p>}
        {!chargement && !fin && (
          <button className="btn-ghost w-full" onClick={() => void charger(page + 1)}>
            Voir les news plus anciennes
          </button>
        )}
      </div>

      {edition !== undefined && (
        <NewsDialog
          news={edition}
          saving={saving}
          erreur={erreurFiche}
          onCancel={() => setEdition(undefined)}
          onSubmit={(v) => void enregistrer(v)}
        />
      )}
    </div>
  );
}
