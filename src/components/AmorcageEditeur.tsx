import { amorcageVide, type Amorcage, type RessourceDepart } from "@/lib/plateaux";
import { codeInconnu, parAlphabet, type Ressource } from "@/lib/ressources";

/**
 * Comment une partie démarre sur ce modèle de plateau.
 *
 * ⚠️ **Les bâtiments offerts ne sont plus ici.** Ils ont quitté cet écran le
 * 2026-08-26, sur demande de l'utilisateur : la gratuité est redevenue une
 * règle de la tuile (`{regle: "gratuite", offerts}` dans son onglet Placement).
 * Il ne doit y en avoir qu'un seul endroit. Ne pas la réintroduire ici sans
 * retirer l'autre.
 *
 * Il ne reste donc que la dotation en ressources. Deux mécanismes coexistent,
 * et c'est voulu :
 *  - le **coffre d'une case**, dans l'onglet d'inspection — pour placer
 *    précisément quelque chose à un endroit précis ;
 *  - la **liste ci-dessous** — pour la dotation globale, sans avoir à aller
 *    cliquer une case.
 */
export default function AmorcageEditeur({
  amorcage,
  ressources,
  onChange,
}: {
  amorcage: Amorcage | null;
  ressources: Ressource[];
  onChange: (a: Amorcage) => void;
}) {
  const a = amorcage ?? amorcageVide();
  const dotation = a.ressources_depart ?? [];

  const majDotation = (lignes: RessourceDepart[]) => onChange({ ...a, ressources_depart: lignes });

  return (
    <div className="space-y-6">
      {/* ── La dotation de départ ─────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="label mb-0">Ressources de départ</p>
          <button
            type="button"
            className="text-xs text-accent hover:underline"
            onClick={() =>
              majDotation([...dotation, { ressource: ressources[0]?.code ?? "", quantite: 100 }])
            }
          >
            + ajouter
          </button>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Versées dans les <strong>entrepôts</strong> du plateau à sa création, en respectant leur
          capacité. Un entrepôt ne se déclare pas : c&apos;est une tuile qui <em>récolte</em> et
          qui <em>envoie</em>. Si le modèle n&apos;en a aucune, la dotation n&apos;a nulle part où
          aller — le jeu le signale plutôt que de la faire disparaître.
        </p>

        {dotation.length === 0 ? (
          <p className="mt-1 text-xs text-slate-600">aucune</p>
        ) : (
          <div className="mt-2 space-y-2">
            {dotation.map((ligne, i) => {
              const inconnue = codeInconnu(ressources, ligne.ressource);
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    className="input h-9 w-40 py-1"
                    value={ligne.ressource}
                    onChange={(e) =>
                      majDotation(
                        dotation.map((l, k) =>
                          k === i ? { ...l, ressource: e.target.value } : l,
                        ),
                      )
                    }
                  >
                    {inconnue && (
                      <option value={ligne.ressource}>{ligne.ressource} (inconnue)</option>
                    )}
                    {parAlphabet(ressources).map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.nom}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="input h-9 w-28 py-1"
                    value={ligne.quantite}
                    onChange={(e) =>
                      majDotation(
                        dotation.map((l, k) =>
                          k === i ? { ...l, quantite: Number(e.target.value) } : l,
                        ),
                      )
                    }
                    aria-label="quantité"
                  />

                  <button
                    type="button"
                    className="ml-auto text-xs text-slate-500 hover:text-red-400"
                    onClick={() => majDotation(dotation.filter((_, k) => k !== i))}
                  >
                    retirer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
