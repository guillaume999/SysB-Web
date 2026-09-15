// ============================================================
//  MaGuilde.tsx — /guilde (tout compte connecté, 15/09)
//  Sans guilde : les guildes existantes (demander à entrer), mes demandes et
//  invitations, et fonder la sienne si l'âge de jeu le permet.
//  Avec : les membres et leurs rôles, les demandes à traiter, inviter un
//  joueur, la description, quitter / transmettre / dissoudre, et le salon.
//
//  ⚠️ Tout passe par les routes du serveur (`lib/guildes.ts`) : les boutons
//  cachés ici ne protègent rien, c'est le serveur qui refuse.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Aide, { Terme } from "@/components/Aide";
import { Erreur, Pastille, TexteBrut } from "@/components/Communaute";
import {
  DESCRIPTION_MAX,
  NOM_MAX,
  changerRole,
  chargerEtat,
  chercherJoueurs,
  creer,
  demander,
  dissoudre,
  exclure,
  gere,
  inviter,
  libelleRole,
  lienAvec,
  modifierDescription,
  nomValide,
  officiersRestants,
  peutExclure,
  quitter,
  raisonCreation,
  repondre,
  verdict,
  type Demande,
  type EtatGuildes,
  type Membre,
} from "@/lib/guildes";

export default function MaGuilde() {
  const [etat, setEtat] = useState<EtatGuildes | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setEtat(await chargerEtat());
      setErreur(null);
    } catch (e) {
      setErreur(verdict(e, "Impossible de lire les guildes."));
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  /** Un geste : occupe, message du serveur, rechargement. */
  const faire = async (cle: string, geste: () => Promise<{ verdict?: string }>) => {
    setOccupe(cle);
    setErreur(null);
    setInfo(null);
    try {
      const r = await geste();
      setInfo(r.verdict ?? null);
      await charger();
      return true;
    } catch (e) {
      setErreur(verdict(e, "Action impossible."));
      return false;
    } finally {
      setOccupe(null);
    }
  };

  if (!etat)
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-white">Ma guilde</h1>
        <div className="mt-4">
          <Erreur>{erreur}</Erreur>
        </div>
        {!erreur && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}
      </div>
    );

  const invitations = etat.mes_demandes.filter((d) => d.sens === "invitation");
  const envoyees = etat.mes_demandes.filter((d) => d.sens === "demande");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Ma guilde</h1>
        <p className="mt-1 text-sm text-slate-400">
          Ton âge de jeu : <span className="text-slate-200">{etat.age}</span> · une guilde compte au plus{" "}
          {etat.reglages.membres_max} membres.
        </p>
      </div>
      <Erreur>{erreur}</Erreur>
      {info && <p className="rounded border border-emerald-900/60 bg-emerald-950/30 p-2 text-sm text-emerald-300">{info}</p>}

      {etat.ma_guilde ? (
        <SaGuilde etat={etat} occupe={occupe} faire={faire} />
      ) : (
        <>
          {invitations.length > 0 && (
            <Section titre="Invitations reçues">
              {invitations.map((d) => (
                <LigneDemande
                  key={d.id}
                  titre={d.guilde_nom}
                  sous="t'invite à la rejoindre"
                  occupe={occupe === d.id}
                  onAccepter={() => void faire(d.id, () => repondre(d.id, true))}
                  onRefuser={() => void faire(d.id, () => repondre(d.id, false))}
                />
              ))}
            </Section>
          )}
          {envoyees.length > 0 && (
            <Section titre="Mes demandes en cours">
              {envoyees.map((d) => (
                <LigneDemande
                  key={d.id}
                  titre={d.guilde_nom}
                  sous="en attente d'un chef ou d'un officier"
                  occupe={occupe === d.id}
                  libelleRefus="Annuler"
                  onRefuser={() => void faire(d.id, () => repondre(d.id, false))}
                />
              ))}
            </Section>
          )}
          <Fonder etat={etat} occupe={occupe === "creer"} faire={faire} />
          <Section titre={`Guildes (${etat.guildes.length})`}>
            {etat.guildes.length === 0 && <p className="text-sm text-slate-500">Aucune guilde pour l'instant.</p>}
            {etat.guildes.map((g) => {
              const lien = lienAvec(etat, g.id);
              const pleine = g.membres >= etat.reglages.membres_max;
              return (
                <div key={g.id} className="card flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="break-words font-medium text-white">{g.nom}</p>
                    <p className="text-xs text-slate-500">
                      chef {g.chef_nom || "?"} · {g.membres} / {etat.reglages.membres_max} membres
                    </p>
                    {g.description && (
                      <div className="mt-2">
                        <TexteBrut texte={g.description} />
                      </div>
                    )}
                  </div>
                  {lien === "demande" ? (
                    <Pastille actif={false}>demande envoyée</Pastille>
                  ) : lien === "invitation" ? (
                    <Pastille actif>invitation reçue</Pastille>
                  ) : (
                    <button
                      className="btn-primary shrink-0"
                      disabled={pleine || occupe === g.id}
                      title={pleine ? "Guilde complète" : undefined}
                      onClick={() => void faire(g.id, () => demander(g.id))}
                    >
                      {pleine ? "Complète" : occupe === g.id ? "…" : "Demander à entrer"}
                    </button>
                  )}
                </div>
              );
            })}
          </Section>
        </>
      )}

      <Aide>
        <Terme nom="Entrer">
          sur demande (acceptée par le chef ou un officier) ou sur invitation (que tu acceptes). On n'est que dans une
          guilde à la fois : en entrer une efface tes autres demandes.
        </Terme>
        <Terme nom="Rôles">
          le chef fait tout ; un officier accepte les demandes, invite et exclut un simple membre ; au plus{" "}
          {etat.reglages.officiers_max} officiers.
        </Terme>
        <Terme nom="Fonder">
          il faut avoir atteint l'âge de jeu {etat.reglages.age_min_creation} — le plus haut âge dont tu possèdes tous
          les bâtiments requis, sur l'ensemble de tes plateaux.
        </Terme>
        <Terme nom="Dans le jeu">tu peux inviter un joueur et répondre à tes invitations ; le reste se gère ici.</Terme>
      </Aide>
    </div>
  );
}

type Faire = (cle: string, geste: () => Promise<{ verdict?: string }>) => Promise<boolean>;

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">{titre}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function LigneDemande({
  titre,
  sous,
  occupe,
  onAccepter,
  onRefuser,
  libelleRefus = "Refuser",
}: {
  titre: string;
  sous: string;
  occupe: boolean;
  onAccepter?: () => void;
  onRefuser: () => void;
  libelleRefus?: string;
}) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="break-words font-medium text-white">{titre}</p>
        <p className="text-xs text-slate-500">{sous}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {onAccepter && (
          <button className="btn-primary" disabled={occupe} onClick={onAccepter}>
            Accepter
          </button>
        )}
        <button className="btn-ghost" disabled={occupe} onClick={onRefuser}>
          {occupe ? "…" : libelleRefus}
        </button>
      </div>
    </div>
  );
}

function Fonder({ etat, occupe, faire }: { etat: EtatGuildes; occupe: boolean; faire: Faire }) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const raison = raisonCreation(etat);
  const v = nomValide(nom);
  return (
    <Section titre="Fonder une guilde">
      <form
        className="card space-y-3 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await faire("creer", () => creer(v.nom, description))) {
            setNom("");
            setDescription("");
          }
        }}
      >
        {raison && <p className="text-sm text-amber-300">{raison}</p>}
        <div>
          <label className="label" htmlFor="nom-guilde">Nom</label>
          <input
            id="nom-guilde"
            className="input"
            value={nom}
            maxLength={NOM_MAX + 10}
            disabled={!!raison}
            onChange={(e) => setNom(e.target.value)}
            placeholder="3 à 30 caractères"
          />
        </div>
        <div>
          <label className="label" htmlFor="desc-guilde">Description (facultative)</label>
          <textarea
            id="desc-guilde"
            className="input min-h-20"
            value={description}
            maxLength={DESCRIPTION_MAX}
            disabled={!!raison}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button className="btn-primary" disabled={!!raison || !v.ok || occupe}>
          {occupe ? "…" : "Fonder"}
        </button>
      </form>
    </Section>
  );
}

function SaGuilde({ etat, occupe, faire }: { etat: EtatGuildes; occupe: string | null; faire: Faire }) {
  const ma = etat.ma_guilde!;
  const chef = ma.role === "chef";
  const places = officiersRestants(ma.membres, etat.reglages);
  const [confirme, setConfirme] = useState<string | null>(null);
  const [description, setDescription] = useState(ma.guilde.description);
  const [edite, setEdite] = useState(false);

  useEffect(() => setDescription(ma.guilde.description), [ma.guilde.description]);

  /** Un geste qui demande un second clic. */
  const deuxFois = (cle: string, geste: () => Promise<{ verdict?: string }>) => {
    if (confirme !== cle) {
      setConfirme(cle);
      return;
    }
    setConfirme(null);
    void faire(cle, geste);
  };
  const libelle = (cle: string, texte: string) => (confirme === cle ? "Confirmer ?" : occupe === cle ? "…" : texte);

  return (
    <>
      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold text-white">{ma.guilde.nom}</h2>
            <p className="text-xs text-slate-500">
              {ma.membres.length} / {etat.reglages.membres_max} membres · tu es {libelleRole(ma.role).toLowerCase()}
            </p>
          </div>
          <Link to="/guilde/salon" className="btn-primary shrink-0">
            Salon de la guilde
          </Link>
        </div>
        {edite ? (
          <div className="mt-3 space-y-2">
            <textarea
              className="input min-h-20"
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="btn-primary"
                disabled={occupe === "desc"}
                onClick={async () => {
                  if (await faire("desc", () => modifierDescription(description))) setEdite(false);
                }}
              >
                Enregistrer
              </button>
              <button className="btn-ghost" onClick={() => setEdite(false)}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            {ma.guilde.description ? (
              <TexteBrut texte={ma.guilde.description} />
            ) : (
              <p className="text-sm text-slate-500">Pas de description.</p>
            )}
            {chef && (
              <button className="mt-2 text-xs text-slate-500 hover:text-white" onClick={() => setEdite(true)}>
                Modifier la description
              </button>
            )}
          </div>
        )}
      </div>

      {gere(ma.role) && ma.demandes && ma.demandes.length > 0 && (
        <Section titre="Demandes et invitations en cours">
          {ma.demandes.map((d: Demande) => (
            <LigneDemande
              key={d.id}
              titre={d.joueur_nom || "joueur sans pseudo"}
              sous={d.sens === "demande" ? "demande à entrer" : "invité, en attente de sa réponse"}
              occupe={occupe === d.id}
              onAccepter={d.sens === "demande" ? () => void faire(d.id, () => repondre(d.id, true)) : undefined}
              libelleRefus={d.sens === "demande" ? "Refuser" : "Annuler"}
              onRefuser={() => void faire(d.id, () => repondre(d.id, false))}
            />
          ))}
        </Section>
      )}

      {gere(ma.role) && <Inviter faire={faire} occupe={occupe} membres={ma.membres} />}

      <Section titre={`Membres${chef ? ` · ${places} place${places > 1 ? "s" : ""} d'officier libre${places > 1 ? "s" : ""}` : ""}`}>
        <div className="card divide-y divide-edge">
          {ma.membres.map((m: Membre) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <span className="break-words text-slate-100">{m.nom || "joueur sans pseudo"}</span>{" "}
                <Pastille actif={m.role !== "membre"}>{libelleRole(m.role)}</Pastille>
              </div>
              <div className="flex flex-wrap gap-2">
                {chef && m.role === "membre" && (
                  <button
                    className="btn-ghost px-2 py-1 text-xs"
                    disabled={places === 0 || occupe === `o${m.id}`}
                    title={places === 0 ? "Plus de place d'officier" : undefined}
                    onClick={() => void faire(`o${m.id}`, () => changerRole(m.joueur, "officier"))}
                  >
                    Nommer officier
                  </button>
                )}
                {chef && m.role === "officier" && (
                  <button
                    className="btn-ghost px-2 py-1 text-xs"
                    disabled={occupe === `o${m.id}`}
                    onClick={() => void faire(`o${m.id}`, () => changerRole(m.joueur, "membre"))}
                  >
                    Redevenir membre
                  </button>
                )}
                {chef && m.role !== "chef" && (
                  <button
                    className="btn-ghost px-2 py-1 text-xs"
                    onClick={() => deuxFois(`c${m.id}`, () => changerRole(m.joueur, "chef"))}
                  >
                    {libelle(`c${m.id}`, "Transmettre la guilde")}
                  </button>
                )}
                {peutExclure(ma.role, m.role) && (
                  <button
                    className="btn-danger px-2 py-1 text-xs"
                    onClick={() => deuxFois(`x${m.id}`, () => exclure(m.joueur))}
                  >
                    {libelle(`x${m.id}`, "Exclure")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex flex-wrap gap-3">
        {chef ? (
          <button className="btn-danger" onClick={() => deuxFois("dissoudre", dissoudre)}>
            {libelle("dissoudre", "Dissoudre la guilde")}
          </button>
        ) : (
          <button className="btn-danger" onClick={() => deuxFois("quitter", quitter)}>
            {libelle("quitter", "Quitter la guilde")}
          </button>
        )}
        {confirme && (
          <button className="btn-ghost" onClick={() => setConfirme(null)}>
            Annuler
          </button>
        )}
      </div>
      {chef && (
        <p className="text-xs text-slate-500">
          Le chef ne quitte pas sa guilde : transmets-la à un membre (tu deviens officier s'il reste une place), ou
          dissous-la — ses membres, ses demandes et son salon disparaissent.
        </p>
      )}
    </>
  );
}

function Inviter({ faire, occupe, membres }: { faire: Faire; occupe: string | null; membres: Membre[] }) {
  const [q, setQ] = useState("");
  const [trouves, setTrouves] = useState<{ id: string; pseudo: string }[]>([]);
  const [recherche, setRecherche] = useState<string | null>(null);

  useEffect(() => {
    const texte = q.trim();
    if (texte.length < 2) {
      setTrouves([]);
      return;
    }
    // Une requête par mot, pas par lettre.
    const minuteur = setTimeout(async () => {
      try {
        setTrouves(await chercherJoueurs(texte));
        setRecherche(null);
      } catch (e) {
        setRecherche(verdict(e, "Recherche impossible."));
      }
    }, 400);
    return () => clearTimeout(minuteur);
  }, [q]);

  const dejaLa = new Set(membres.map((m) => m.joueur));
  return (
    <Section titre="Inviter un joueur">
      <div className="card space-y-2 p-3">
        <input className="input" placeholder="Pseudo du joueur (2 lettres au moins)" value={q} onChange={(e) => setQ(e.target.value)} />
        {recherche && <p className="text-xs text-red-300">{recherche}</p>}
        {trouves.map((j) => (
          <div key={j.id} className="flex items-center justify-between gap-2">
            <span className="break-words text-sm text-slate-200">{j.pseudo}</span>
            {dejaLa.has(j.id) ? (
              <span className="text-xs text-slate-500">déjà membre</span>
            ) : (
              <button
                className="btn-ghost px-2 py-1 text-xs"
                disabled={occupe === `i${j.id}`}
                onClick={() => void faire(`i${j.id}`, () => inviter(j.id))}
              >
                Inviter
              </button>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
