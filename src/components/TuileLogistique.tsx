import {
  ROLES_LOGISTIQUE,
  casesCouvertes,
  logistiqueVide,
  type Logistique,
  type RoleLogistique,
} from "@/lib/tuiles";
import type { Ressource } from "@/lib/ressources";

/**
 * Rôle logistique d'une tuile — le modèle de couverture.
 *
 * Un collecteur draine, à `debit`, les stocks locaux des producteurs dans son
 * rayon. Ce qui est dans un collecteur est disponible pour la population ; ce qui
 * est resté chez le producteur ne l'est pas. Un consommateur fait l'inverse :
 * il puise dans les collecteurs à portée.
 *
 * Les navettes visibles en jeu sont une **animation** de ce transfert, pas une
 * simulation d'agents : c'est ce qui permet de recalculer huit heures hors ligne
 * avec une formule au lieu de rejouer huit heures de déplacements.
 */
export default function TuileLogistique({
  logistique,
  ressources,
  onChange,
}: {
  logistique: Logistique | null;
  ressources: Ressource[];
  onChange: (l: Logistique | null) => void;
}) {
  const maj = (patch: Partial<Logistique>) =>
    logistique && onChange({ ...logistique, ...patch });

  return (
    <div>
      <p className="label">Rôle logistique</p>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input h-9 w-44 py-1"
          value={logistique?.role ?? ""}
          onChange={(e) =>
            onChange(e.target.value ? logistiqueVide(e.target.value as RoleLogistique) : null)
          }
        >
          <option value="">aucun</option>
          {ROLES_LOGISTIQUE.map((r) => (
            <option key={r.valeur} value={r.valeur}>
              {r.libelle}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-slate-500">
          {ROLES_LOGISTIQUE.find((r) => r.valeur === logistique?.role)?.aide ??
            "la tuile ne transporte rien"}
        </span>
      </div>

      {logistique && (
        <div className="mt-3 space-y-3 rounded border border-edge bg-ink/40 p-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* rayon null = tout le plateau. Zéro reste la case elle-même. */}
            <label className="flex items-center gap-1 text-xs text-slate-500">
              Rayon
              <input
                type="number"
                min={0}
                step={1}
                disabled={logistique.rayon === null}
                className="input h-9 w-16 py-1 disabled:opacity-40"
                value={logistique.rayon ?? 0}
                onChange={(e) => maj({ rayon: Number(e.target.value) })}
              />
              {logistique.rayon !== null && (
                <span className="text-slate-600">({casesCouvertes(logistique.rayon)} cases)</span>
              )}
            </label>
            <label className="flex items-center gap-1 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={logistique.rayon === null}
                onChange={(e) => maj({ rayon: e.target.checked ? null : 5 })}
              />
              tout le plateau
            </label>

            <label className="flex items-center gap-1 text-xs text-slate-500">
              Débit
              <input
                type="number"
                min={0}
                step={1}
                className="input h-9 w-20 py-1"
                value={logistique.debit.quantite}
                onChange={(e) =>
                  maj({ debit: { ...logistique.debit, quantite: Number(e.target.value) } })
                }
              />
              toutes les
              <input
                type="number"
                min={1}
                step={1}
                className="input h-9 w-20 py-1"
                value={logistique.debit.periode_s}
                onChange={(e) =>
                  maj({ debit: { ...logistique.debit, periode_s: Number(e.target.value) } })
                }
              />
              s
            </label>

            <label className="flex items-center gap-1 text-xs text-slate-500">
              Capacité
              <input
                type="number"
                min={0}
                step={1}
                className="input h-9 w-24 py-1"
                value={logistique.capacite}
                onChange={(e) => maj({ capacite: Number(e.target.value) })}
              />
            </label>
          </div>

          <div>
            <p className="label mb-1">Ressources acceptées</p>
            <select
              multiple
              size={Math.min(6, Math.max(3, ressources.length))}
              className="input h-auto w-72 py-1"
              value={logistique.ressources}
              onChange={(e) =>
                maj({ ressources: Array.from(e.target.selectedOptions, (o) => o.value) })
              }
            >
              {ressources.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.nom}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Aucune sélection = toutes les ressources. Sélectionne pour spécialiser l'entrepôt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
