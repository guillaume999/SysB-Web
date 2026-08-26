import Aide, { Terme } from "@/components/Aide";
import { codeInconnu, libelleRessource, type Ressource } from "@/lib/ressources";
import {
  MODES_COUT,
  PERIODE_PAR_DEFAUT,
  formatDuree,
  palierVide,
  rendEnVeille,
  type LigneCout,
  type LigneFlux,
  type ModeCout,
  type Palier,
} from "@/lib/tuiles";

/**
 * Ce qu'une tuile coute, palier par palier — **reconstruit de zero le
 * 2026-08-26**, sur quatre decisions de l'utilisateur prises ce jour-la :
 *
 *  1. les paliers tout de suite, mais **tout dans un seul onglet** ;
 *  2. **deux modes** seulement : paye / mobilise. Le troisieme (`requis`,
 *     verifie sans etre preleve) est supprime ;
 *  3. **la veille rend TOUT ce qui est mobilise** — regle unique, aucun reglage
 *     par ligne. L'ancien drapeau `libere_si_inactif` a disparu avec elle ;
 *  4. **c'est le joueur qui met en veille**, jamais la penurie : celle-ci fait
 *     ralentir la production au prorata, un mecanisme qui existe deja.
 *
 * La consequence de (3) n'est saisie nulle part : elle se DEDUIT des lignes
 * mobilisees, et se relit en clair sous chaque palier. Un reglage de moins,
 * et rien qui puisse contredire la regle.
 */
export default function TuileCouts({
  paliers,
  ressources,
  onChange,
}: {
  paliers: Palier[];
  ressources: Ressource[];
  onChange: (paliers: Palier[]) => void;
}) {
  const majPalier = (index: number, patch: Partial<Palier>) =>
    onChange(paliers.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const ajouterPalier = () => onChange([...paliers, palierVide(paliers.length + 1)]);

  // Renumerotation immediate : la position et le champ `niveau` ne doivent
  // jamais diverger a l'ecran, sinon on croit avoir retire le mauvais.
  const retirerPalier = (index: number) =>
    onChange(paliers.filter((_, i) => i !== index).map((p, i) => ({ ...p, niveau: i + 1 })));

  const nom = (code: string) => libelleRessource(ressources, code);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="label mb-0">Coûts, palier par palier</p>
        <button type="button" className="text-xs text-accent hover:underline" onClick={ajouterPalier}>
          + ajouter un palier
        </button>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Le palier 1 est la construction ; les suivants sont les améliorations.
      </p>

      <Aide titre="Payé, mobilisé, et ce que rend la veille">
        <Terme nom="payé">
          Prélevé du stock et <strong>perdu</strong>. 50 bois payés ne reviennent jamais — ni à la
          destruction, ni en veille.
        </Terme>
        <Terme nom="mobilisé">
          Retenu <strong>tant que le bâtiment vit</strong>, puis rendu. C'est le mode de la
          population : 6 habitants travaillent ici et ne travaillent nulle part ailleurs. Ils
          reviennent quand le bâtiment est détruit <em>ou mis en veille</em>.
        </Terme>
        <Terme nom="coût d'utilisation">
          Ce que le bâtiment consomme <strong>pendant qu'il tourne</strong>, en quantité par
          période. Jamais un taux à virgule : le calcul hors ligne multiplie des entiers, sans
          dérive d'arrondi sur douze heures.
          <br />
          ⚠️ <strong>Garde la même période partout</strong> ({PERIODE_PAR_DEFAUT} s par défaut) :
          le ralenti de production est exact à une unité près avec une période commune, à trois ou
          quatre quand elles sont mélangées.
        </Terme>
        <Terme nom="mise en veille">
          Le joueur éteint un bâtiment : il <strong>rend tout ce qu'il mobilise</strong>, arrête de
          consommer et arrête de produire. C'est ainsi qu'on récupère des ouvriers pour ailleurs.
          Rien à régler ici — la règle est la même pour toutes les tuiles, et la phrase sous chaque
          palier te dit ce que ça donnera.
        </Terme>
        <Terme nom="pénurie">
          Elle n'éteint <strong>rien</strong>. Quand une ressource manque, tout ralentit au
          prorata. La veille est une décision du joueur, pas une punition automatique.
        </Terme>
      </Aide>

      <div className="mt-2 space-y-3">
        {paliers.map((palier, index) => {
          const mobilise = rendEnVeille(palier);
          return (
            <div key={index} className="rounded border border-edge bg-ink/40 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-slate-300">
                  Palier {palier.niveau}
                  {index === 0 && <span className="ml-2 text-slate-500">construction</span>}
                </p>
                {paliers.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-red-400"
                    onClick={() => retirerPalier(index)}
                  >
                    retirer
                  </button>
                )}
              </div>

              <LignesCout
                titre="À la construction"
                lignes={palier.cout}
                ressources={ressources}
                onChange={(cout) => majPalier(index, { cout })}
              />

              <LignesFlux
                titre="Pendant qu'il tourne"
                lignes={palier.utilisation}
                ressources={ressources}
                onChange={(utilisation) => majPalier(index, { utilisation })}
              />

              {/* La relecture : c'est le seul endroit ou la regle de veille se
                  voit, puisqu'elle ne se saisit pas. */}
              <p className="mt-2 text-[11px] leading-tight text-slate-500">
                {mobilise.length === 0 && palier.utilisation.length === 0 ? (
                  "Ce palier ne mobilise rien et ne consomme rien : la mise en veille n'y changerait rien."
                ) : (
                  <>
                    En veille :{" "}
                    {mobilise.length > 0 ? (
                      <span className="text-slate-300">
                        rend {mobilise.map((l) => `${l.quantite} ${nom(l.ressource)}`).join(", ")}
                      </span>
                    ) : (
                      "ne rend rien"
                    )}
                    {palier.utilisation.length > 0 && ", et ne consomme plus rien"}.
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Les deux listes de lignes ────────────────────────────────────────────────
//
// Deux composants proches mais distincts : une ligne de cout porte un MODE, une
// ligne d'utilisation porte une PERIODE. Les fondre en un seul avec des champs
// optionnels rendrait chaque appel plus difficile a lire que les deux reunis.

function EnTete({ titre, onAjouter }: { titre: string; onAjouter: () => void }) {
  return (
    <div className="mt-2 flex items-baseline justify-between gap-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{titre}</p>
      <button type="button" className="text-xs text-accent hover:underline" onClick={onAjouter}>
        + ligne
      </button>
    </div>
  );
}

function ChoixRessource({
  code,
  ressources,
  onChange,
}: {
  code: string;
  ressources: Ressource[];
  onChange: (code: string) => void;
}) {
  // Un code disparu du vocabulaire doit rester VISIBLE : le faire tomber du
  // menu changerait la ligne en silence au premier reenregistrement.
  const inconnu = code !== "" && codeInconnu(ressources, code);
  return (
    <select
      className={`input h-9 w-44 py-1 ${inconnu ? "border-amber-700 text-amber-300" : ""}`}
      value={code}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">choisir une ressource</option>
      {inconnu && <option value={code}>{code} — inconnue</option>}
      {ressources.map((r) => (
        <option key={r.id} value={r.code}>
          {r.nom}
        </option>
      ))}
    </select>
  );
}

function LignesCout({
  titre,
  lignes,
  ressources,
  onChange,
}: {
  titre: string;
  lignes: LigneCout[];
  ressources: Ressource[];
  onChange: (lignes: LigneCout[]) => void;
}) {
  const maj = (i: number, patch: Partial<LigneCout>) =>
    onChange(lignes.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  return (
    <div>
      <EnTete
        titre={titre}
        onAjouter={() =>
          onChange([...lignes, { ressource: ressources[0]?.code ?? "", quantite: 1, mode: "paye" }])
        }
      />
      {lignes.length === 0 ? (
        <p className="text-xs text-slate-600">gratuit</p>
      ) : (
        <div className="space-y-1">
          {lignes.map((ligne, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                className="input h-9 w-20 py-1"
                value={ligne.quantite}
                onChange={(e) => maj(i, { quantite: Math.max(0, Number(e.target.value) || 0) })}
              />
              <ChoixRessource
                code={ligne.ressource}
                ressources={ressources}
                onChange={(ressource) => maj(i, { ressource })}
              />
              <select
                className="input h-9 w-32 py-1"
                value={ligne.mode}
                onChange={(e) => maj(i, { mode: e.target.value as ModeCout })}
                title={MODES_COUT.find((m) => m.valeur === ligne.mode)?.aide}
              >
                {MODES_COUT.map((m) => (
                  <option key={m.valeur} value={m.valeur}>
                    {m.libelle}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500">
                {MODES_COUT.find((m) => m.valeur === ligne.mode)?.aide}
              </span>
              <button
                type="button"
                className="ml-auto text-xs text-slate-500 hover:text-red-400"
                onClick={() => onChange(lignes.filter((_, k) => k !== i))}
              >
                retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LignesFlux({
  titre,
  lignes,
  ressources,
  onChange,
}: {
  titre: string;
  lignes: LigneFlux[];
  ressources: Ressource[];
  onChange: (lignes: LigneFlux[]) => void;
}) {
  const maj = (i: number, patch: Partial<LigneFlux>) =>
    onChange(lignes.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  // Une periode differente des autres lignes de la meme tuile coute de la
  // precision au ralenti : on le dit, sans l'interdire.
  const periodes = Array.from(new Set(lignes.map((l) => l.periode_s)));

  return (
    <div>
      <EnTete
        titre={titre}
        onAjouter={() =>
          onChange([
            ...lignes,
            { ressource: ressources[0]?.code ?? "", quantite: 1, periode_s: PERIODE_PAR_DEFAUT },
          ])
        }
      />
      {lignes.length === 0 ? (
        <p className="text-xs text-slate-600">ne consomme rien</p>
      ) : (
        <div className="space-y-1">
          {lignes.map((ligne, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                className="input h-9 w-20 py-1"
                value={ligne.quantite}
                onChange={(e) => maj(i, { quantite: Math.max(0, Number(e.target.value) || 0) })}
              />
              <ChoixRessource
                code={ligne.ressource}
                ressources={ressources}
                onChange={(ressource) => maj(i, { ressource })}
              />
              <label className="flex items-center gap-1 text-xs text-slate-500">
                toutes les
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="input h-9 w-24 py-1"
                  value={ligne.periode_s}
                  onChange={(e) =>
                    maj(i, { periode_s: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
                s
              </label>
              <span className="text-[11px] text-slate-500">
                soit {ligne.quantite} / {formatDuree(ligne.periode_s)}
              </span>
              <button
                type="button"
                className="ml-auto text-xs text-slate-500 hover:text-red-400"
                onClick={() => onChange(lignes.filter((_, k) => k !== i))}
              >
                retirer
              </button>
            </div>
          ))}
          {periodes.length > 1 && (
            <p className="text-[11px] text-amber-400">
              Ce palier mélange {periodes.length} périodes différentes. Le ralenti en cas de
              pénurie sera moins précis — garde la même période partout si tu peux.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
