import Aide, { Terme } from "@/components/Aide";
import {
  DESTINATIONS_TRANSFERT,
  avertissementsEchanges,
  erreursEchanges,
  formatDuree,
  marcheVide,
  transfertVide,
  type CapaciteMarche,
  type CapaciteTransfert,
  type DestinationTransfert,
  type Logistique,
  type Palier,
} from "@/lib/tuiles";

/**
 * L'onglet **Échanges** de la fiche tuile (16/09) : ce qu'un palier sait faire
 * HORS de son plateau.
 *
 *   Palier 1
 *     ☑ Transfert (quai)   destinations ☑ autres plateaux ☐ TPT ☐ porte (bientôt)
 *                          2 envois à la fois · 100 par envoi · 10 min de voyage
 *     ☑ Marché universel   3 offres · 50 par offre · 5 min d'acheminement
 *
 * ⚠️ Les capacités vivent sur le PALIER (`niveaux[i].transfert` / `.marche`) :
 * un port qui s'améliore envoie plus, plus vite. Le choix de la ressource, de
 * la quantité et de la destination se fait EN JEU, sur la case.
 */
export default function TuileEchanges({
  paliers,
  logistique,
  onChange,
}: {
  paliers: Palier[];
  logistique: Logistique;
  onChange: (paliers: Palier[]) => void;
}) {
  const maj = (index: number, patch: Partial<Palier>) =>
    onChange(paliers.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const avertissements = avertissementsEchanges(paliers, logistique);

  return (
    <div>
      <p className="label mb-0">Échanges hors du plateau, palier par palier</p>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Le joueur choisit en jeu la ressource, la quantité et la destination. Ici, on déclare ce que
        le bâtiment <strong>peut</strong> faire à chaque palier. Les paliers s&apos;ajoutent dans
        l&apos;onglet Coût.
      </p>

      <Aide titre="Transfert, quai, marché universel">
        <Terme nom="transfert">
          Le bâtiment envoie une ressource de <strong>son coffre</strong> vers un autre plateau du
          joueur. La cargaison voyage pendant la durée déclarée ici.
        </Terme>
        <Terme nom="quai">
          Tout bâtiment qui transfère est aussi un quai : c&apos;est dans son coffre que les
          cargaisons arrivent. La monnaie (FluxStock) va dans la réserve du plateau, mais il lui
          faut un quai quand même.
        </Terme>
        <Terme nom="à l'arrivée">
          <strong>Pas de quai</strong>, ou un quai <strong>détruit</strong> pendant le voyage : la
          cargaison est <strong>perdue</strong>. Des quais <strong>pleins</strong> : la cargaison
          <strong> attend</strong> et entre dès qu&apos;il y a de la place. Un quai qui ne stocke pas
          la ressource ne la recevra jamais : perdue aussi.
        </Terme>
        <Terme nom="marché universel">
          Le joueur bloque une quantité de son coffre et la met en vente, au prix et dans la monnaie
          (un FluxStock) de son choix. Tout joueur la voit dans <em>Porte → Marché universel</em>.
          L&apos;acheteur achète l&apos;offre <strong>entière</strong>, paie tout de suite et reçoit
          la marchandise après la durée déclarée, sur son quai — l&apos;achat est refusé si le
          plateau qui reçoit n&apos;a pas de quai capable de la stocker. Le vendeur ne fait qu&apos;envoyer. Annuler rend la marchandise ; un marché
          détruit la perd.
        </Terme>
        <Terme nom="ne voyagent pas">
          La population (mobilise) et les indicateurs.
        </Terme>
      </Aide>

      {paliers.map((p, i) => {
        const erreurs = erreursEchanges(p);
        return (
          <div key={i} className="mt-3 rounded border border-edge p-2">
            <p className="text-xs font-semibold text-slate-300">
              Palier {i + 1}
              {i === 0 ? " — construction" : " — amélioration"}
            </p>
            <BlocTransfert valeur={p.transfert} onChange={(transfert) => maj(i, { transfert })} />
            <BlocMarche valeur={p.marche} onChange={(marche) => maj(i, { marche })} />
            {erreurs.length > 0 && (
              <ul className="mt-1 ml-4 list-disc text-[11px] text-red-300">
                {erreurs.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {avertissements.map((a) => (
        <p key={a} className="mt-2 text-[11px] leading-tight text-amber-400">
          ⚠️ {a}
        </p>
      ))}
    </div>
  );
}

function Nombre({
  valeur,
  min,
  onChange,
  suffixe,
}: {
  valeur: number;
  min: number;
  onChange: (n: number) => void;
  suffixe: string;
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-slate-400">
      <input
        type="number"
        min={min}
        step={1}
        className={`input h-8 w-20 py-1 ${valeur < min ? "border-red-700" : ""}`}
        value={valeur}
        onChange={(e) => onChange(Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
      />
      {suffixe}
    </label>
  );
}

function BlocTransfert({
  valeur,
  onChange,
}: {
  valeur: CapaciteTransfert | null;
  onChange: (v: CapaciteTransfert | null) => void;
}) {
  const coche = (d: DestinationTransfert, oui: boolean) => {
    if (!valeur) return;
    const autres = valeur.destinations.filter((x) => x !== d);
    onChange({ ...valeur, destinations: oui ? [...autres, d] : autres });
  };
  return (
    <div className="mt-2 rounded border border-edge/60 p-2">
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={valeur !== null}
          onChange={(e) => onChange(e.target.checked ? transfertVide() : null)}
        />
        Transfert — ce bâtiment envoie vers d&apos;autres plateaux, et c&apos;est un quai
      </label>
      {valeur && (
        <div className="mt-2 space-y-2 pl-5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            Destinations :
            {DESTINATIONS_TRANSFERT.map((d) => (
              <label
                key={d.valeur}
                title={d.aide}
                className={`flex items-center gap-1 ${d.bientot ? "opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  disabled={d.bientot && !valeur.destinations.includes(d.valeur)}
                  checked={valeur.destinations.includes(d.valeur)}
                  onChange={(e) => coche(d.valeur, e.target.checked)}
                />
                {d.libelle}
                {d.bientot && <span className="text-[10px] text-slate-500">(bientôt)</span>}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Nombre
              valeur={valeur.envois_max}
              min={1}
              suffixe="envoi(s) en route à la fois"
              onChange={(envois_max) => onChange({ ...valeur, envois_max })}
            />
            <Nombre
              valeur={valeur.quantite_max}
              min={1}
              suffixe="unités au plus par envoi"
              onChange={(quantite_max) => onChange({ ...valeur, quantite_max })}
            />
            <Nombre
              valeur={valeur.duree_minutes}
              min={0}
              suffixe={`min de voyage (${formatDuree(valeur.duree_minutes * 60)})`}
              onChange={(duree_minutes) => onChange({ ...valeur, duree_minutes })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BlocMarche({
  valeur,
  onChange,
}: {
  valeur: CapaciteMarche | null;
  onChange: (v: CapaciteMarche | null) => void;
}) {
  return (
    <div className="mt-2 rounded border border-edge/60 p-2">
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={valeur !== null}
          onChange={(e) => onChange(e.target.checked ? marcheVide() : null)}
        />
        Marché universel — ce bâtiment met en vente
      </label>
      {valeur && (
        <div className="mt-2 flex flex-wrap items-center gap-4 pl-5">
          <Nombre
            valeur={valeur.offres_max}
            min={1}
            suffixe="offre(s) ouvertes à la fois"
            onChange={(offres_max) => onChange({ ...valeur, offres_max })}
          />
          <Nombre
            valeur={valeur.quantite_max}
            min={1}
            suffixe="unités au plus par offre"
            onChange={(quantite_max) => onChange({ ...valeur, quantite_max })}
          />
          <Nombre
            valeur={valeur.duree_minutes}
            min={0}
            suffixe={`min d'acheminement vers l'acheteur (${formatDuree(valeur.duree_minutes * 60)})`}
            onChange={(duree_minutes) => onChange({ ...valeur, duree_minutes })}
          />
        </div>
      )}
    </div>
  );
}
