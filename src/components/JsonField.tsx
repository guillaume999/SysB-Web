import { useMemo, useState } from "react";

/**
 * Éditeur pour les champs `json` de PocketBase.
 *
 * Le schéma SysB hérite de Firestore : `consomation`, `production`, `obtention`,
 * `niveaux`, `value`… sont des tableaux d'objets plats. Quand c'est le cas on
 * propose une grille de saisie ; sinon (ou sur demande) on retombe sur le JSON brut.
 */

type Row = Record<string, unknown>;

function parse(text: string): { value: unknown; error: string | null } {
  const trimmed = text.trim();
  if (trimmed === "") return { value: null, error: null };
  try {
    return { value: JSON.parse(trimmed), error: null };
  } catch (e) {
    return { value: null, error: (e as Error).message };
  }
}

/** Un tableau d'objets plats (pas de sous-objet, pas de sous-tableau) se saisit en grille. */
function asFlatRows(value: unknown): Row[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const ok = value.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      Object.values(item as Row).every((v) => v === null || typeof v !== "object"),
  );
  return ok ? (value as Row[]) : null;
}

function columnsOf(rows: Row[]): string[] {
  const seen: string[] = [];
  for (const row of rows) for (const key of Object.keys(row)) if (!seen.includes(key)) seen.push(key);
  return seen;
}

/** Conserve le type d'origine de la cellule (nombre, booléen, texte). */
function coerce(previous: unknown, next: string): unknown {
  if (typeof previous === "number") {
    const n = Number(next);
    return next.trim() === "" ? 0 : Number.isNaN(n) ? previous : n;
  }
  if (typeof previous === "boolean") return next === "true";
  return next;
}

export default function JsonField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [raw, setRaw] = useState(false);
  const { value: parsed, error } = useMemo(() => parse(value), [value]);
  const rows = raw ? null : asFlatRows(parsed);

  const writeRows = (next: Row[]) => onChange(JSON.stringify(next, null, 2));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {rows ? `${rows.length} entrée${rows.length > 1 ? "s" : ""}` : "JSON"}
        </span>
        <button type="button" className="text-xs text-accent hover:underline" onClick={() => setRaw((r) => !r)}>
          {raw ? "Vue tableau" : "Vue JSON brut"}
        </button>
      </div>

      {rows ? (
        <RowsEditor rows={rows} onChange={writeRows} />
      ) : (
        <textarea
          className="input min-h-[9rem] font-mono text-xs"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='ex. [{"ressource":"bois","type":"per_minute","valeur":3}]'
        />
      )}

      {error && <p className="text-xs text-red-400">JSON invalide : {error}</p>}
    </div>
  );
}

function RowsEditor({ rows, onChange }: { rows: Row[]; onChange: (next: Row[]) => void }) {
  const columns = columnsOf(rows);

  const setCell = (index: number, column: string, next: string) => {
    const copy = rows.map((r) => ({ ...r }));
    copy[index][column] = coerce(rows[index][column], next);
    onChange(copy);
  };

  const addRow = () => {
    const blank: Row = {};
    for (const column of columns) blank[column] = typeof rows[0]?.[column] === "number" ? 0 : "";
    onChange([...rows, blank]);
  };

  return (
    <div className="overflow-x-auto rounded-md border border-edge">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ink/60 text-left text-xs uppercase tracking-wide text-slate-400">
            {columns.map((column) => (
              <th key={column} className="px-2 py-1.5 font-medium">
                {column}
              </th>
            ))}
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-edge">
              {columns.map((column) => (
                <td key={column} className="px-1 py-1">
                  {typeof row[column] === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={row[column] as boolean}
                      onChange={(e) => setCell(index, column, String(e.target.checked))}
                    />
                  ) : (
                    <input
                      className="w-full rounded bg-transparent px-2 py-1 text-slate-100 focus:bg-ink focus:outline-none"
                      value={String(row[column] ?? "")}
                      onChange={(e) => setCell(index, column, e.target.value)}
                    />
                  )}
                </td>
              ))}
              <td className="px-1 text-center">
                <button
                  type="button"
                  title="Supprimer la ligne"
                  className="text-slate-500 hover:text-red-400"
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-edge p-1">
        <button type="button" className="text-xs text-accent hover:underline" onClick={addRow}>
          + Ajouter une ligne
        </button>
      </div>
    </div>
  );
}
