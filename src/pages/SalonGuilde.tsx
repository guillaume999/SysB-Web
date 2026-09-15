// ============================================================
//  SalonGuilde.tsx — /guilde/salon (membres de la guilde seulement, 15/09)
//
//  ⚠️ CE QUI REND LE SALON PRIVÉ, C'EST LE SERVEUR : la route répond 403 à
//  qui n'est pas membre, et la collection `messages_guilde` n'est lisible que
//  par l'admin. La page, elle, se contente de le dire.
//
//  ⚠️ RELÈVE TOUTES LES 5 s (le neuf seulement, `apres` = le dernier affiché),
//  et un compte à rebours d'anti-spam recalé sur chaque réponse du serveur.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Erreur, TexteBrut } from "@/components/Communaute";
import { useAuth } from "@/lib/auth";
import {
  MESSAGE_MAX,
  attenteDuRefus,
  ecrireSalon,
  lireSalon,
  verdict,
  type Guilde,
  type MessageGuilde,
} from "@/lib/guildes";
import { dateLisible } from "@/lib/news";

const RELEVE_MS = 5000;

export default function SalonGuilde() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageGuilde[]>([]);
  const [guilde, setGuilde] = useState<Guilde | null>(null);
  const [interdit, setInterdit] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [texte, setTexte] = useState("");
  const [attente, setAttente] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const dernier = useRef("");
  const bas = useRef<HTMLDivElement>(null);

  const ajouter = useCallback((neufs: MessageGuilde[]) => {
    if (neufs.length === 0) return;
    setMessages((l) => {
      const vus = new Set(l.map((m) => m.id));
      const suite = [...l, ...neufs.filter((m) => !vus.has(m.id))];
      return suite.slice(-300);
    });
    for (const m of neufs) if (m.created > dernier.current) dernier.current = m.created;
    setTimeout(() => bas.current?.scrollIntoView({ block: "end" }), 0);
  }, []);

  const relever = useCallback(async () => {
    try {
      const premier = !dernier.current;
      const r = await lireSalon(dernier.current);
      setGuilde(r.guilde);
      // ⚠️ L'attente se lit AVANT `ajouter`, qui avance `dernier` : après, ce
      // ne serait plus « le premier chargement ».
      if (premier) setAttente(r.attente);
      ajouter(r.messages);
      setErreur(null);
    } catch (e) {
      const err = e as { status?: number };
      if (err.status === 403) setInterdit(true);
      else setErreur(verdict(e, "Salon illisible."));
    }
  }, [ajouter]);

  useEffect(() => {
    void relever();
    const id = setInterval(() => void relever(), RELEVE_MS);
    return () => clearInterval(id);
  }, [relever]);

  useEffect(() => {
    if (attente <= 0) return;
    const id = setTimeout(() => setAttente((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [attente]);

  if (interdit)
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-white">Salon de guilde</h1>
        <p className="mt-4 text-sm text-slate-400">
          Ce salon est réservé aux membres d'une guilde. <Link to="/guilde" className="text-accent hover:underline">Rejoins-en une ou fonde la tienne</Link>.
        </p>
      </div>
    );

  const envoyer = async () => {
    if (!texte.trim() || attente > 0 || envoi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await ecrireSalon(texte);
      setTexte("");
      if (r.message) ajouter([r.message]);
      setAttente(r.attente ?? 0);
    } catch (e) {
      setErreur(verdict(e, "Envoi impossible."));
      const s = attenteDuRefus(e);
      if (s > 0) setAttente(s);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <p className="text-sm">
        <Link to="/guilde" className="text-slate-400 hover:text-white">Ma guilde</Link>
        <span className="text-slate-600"> / </span>
        <span className="text-slate-300">Salon</span>
      </p>
      <h1 className="mt-1 break-words text-2xl font-semibold text-white">{guilde ? guilde.nom : "Salon de guilde"}</h1>
      <div className="mt-2">
        <Erreur>{erreur}</Erreur>
      </div>

      <div className="card mt-3 max-h-[60vh] min-h-48 space-y-3 overflow-y-auto p-3 sm:p-4">
        {messages.length === 0 && <p className="text-sm text-slate-500">Aucun message. Lance la conversation !</p>}
        {messages.map((m) => (
          <div key={m.id} className={m.auteur === user?.id ? "border-l-2 border-accent pl-2" : "pl-2.5"}>
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-300">{m.auteur_nom || "joueur sans pseudo"}</span> ·{" "}
              {dateLisible(m.created)}
            </p>
            <TexteBrut texte={m.contenu} />
          </div>
        ))}
        <div ref={bas} />
      </div>

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void envoyer();
        }}
      >
        <textarea
          className="input min-h-12 flex-1"
          value={texte}
          maxLength={MESSAGE_MAX}
          placeholder="Écrire à ta guilde…"
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void envoyer();
            }
          }}
        />
        <button className="btn-primary sm:w-32" disabled={!texte.trim() || attente > 0 || envoi}>
          {envoi ? "…" : attente > 0 ? `${attente} s` : "Envoyer"}
        </button>
      </form>
      <p className="mt-1 text-xs text-slate-500">Entrée pour envoyer, Maj + Entrée pour aller à la ligne.</p>
    </div>
  );
}
