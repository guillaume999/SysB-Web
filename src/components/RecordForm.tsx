import { useEffect, useMemo, useState } from "react";
import JsonField from "@/components/JsonField";
import { editableFields, emptyValue, type PbCollection, type PbField } from "@/lib/schema";

export type FormValues = Record<string, unknown>;

/** Convertit un record PocketBase en valeurs de formulaire (les json passent en texte). */
function toFormValues(collection: PbCollection, record: FormValues | null): FormValues {
  const values: FormValues = {};
  for (const field of editableFields(collection)) {
    const current = record?.[field.name];
    if (field.type === "json") {
      values[field.name] =
        current === undefined || current === null || current === ""
          ? ""
          : typeof current === "string"
            ? current
            : JSON.stringify(current, null, 2);
    } else if (field.type === "password") {
      values[field.name] = "";
    } else {
      values[field.name] = current ?? emptyValue(field);
    }
  }
  return values;
}

/** Repasse les valeurs de formulaire vers le format attendu par l'API. */
function toPayload(collection: PbCollection, values: FormValues): { data: FormValues; error: string | null } {
  const data: FormValues = {};
  for (const field of editableFields(collection)) {
    const value = values[field.name];
    if (field.type === "json") {
      const text = String(value ?? "").trim();
      if (text === "") {
        data[field.name] = null;
        continue;
      }
      try {
        data[field.name] = JSON.parse(text);
      } catch (e) {
        return { data, error: `Champ « ${field.name} » : JSON invalide (${(e as Error).message}).` };
      }
    } else if (field.type === "number") {
      data[field.name] = value === "" || value === null ? null : Number(value);
    } else if (field.type === "password" && String(value ?? "") === "") {
      continue; // ne pas écraser le mot de passe si laissé vide
    } else {
      data[field.name] = value;
    }
  }
  return { data, error: null };
}

export default function RecordForm({
  collection,
  record,
  saving,
  onCancel,
  onSubmit,
}: {
  collection: PbCollection;
  record: FormValues | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (data: FormValues) => void;
}) {
  const fields = useMemo(() => editableFields(collection), [collection]);
  const [values, setValues] = useState<FormValues>(() => toFormValues(collection, record));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setValues(toFormValues(collection, record)), [collection, record]);

  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const { data, error: payloadError } = toPayload(collection, values);
    if (payloadError) {
      setError(payloadError);
      return;
    }
    setError(null);
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <form onSubmit={submit} className="card w-full max-w-2xl p-5 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {record ? "Modifier" : "Nouveau"} — <span className="text-slate-400">{collection.name}</span>
        </h2>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="label" htmlFor={field.name}>
                {field.name}
                {field.required && <span className="ml-1 text-red-400">*</span>}
                <span className="ml-2 font-normal normal-case text-slate-600">{field.type}</span>
              </label>
              <FieldInput field={field} value={values[field.name]} onChange={(v) => set(field.name, v)} />
            </div>
          ))}
        </div>

        {error && <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: PbField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  switch (field.type) {
    case "json":
      return <JsonField value={String(value ?? "")} onChange={onChange} />;

    case "bool":
      return (
        <input
          id={field.name}
          type="checkbox"
          className="h-4 w-4 accent-[#4c8dff]"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );

    case "number":
      return (
        <input
          id={field.name}
          type="number"
          step={field.onlyInt ? 1 : "any"}
          className="input"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );

    case "select": {
      const multi = (field.maxSelect ?? 1) > 1;
      const selected = multi ? (Array.isArray(value) ? value.map(String) : []) : String(value ?? "");
      return (
        <select
          id={field.name}
          multiple={multi}
          className="input"
          value={selected as string & string[]}
          onChange={(e) =>
            onChange(
              multi ? Array.from(e.target.selectedOptions).map((o) => o.value) : e.target.value,
            )
          }
        >
          {!multi && <option value="">—</option>}
          {(field.values ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    case "editor":
      return (
        <textarea
          id={field.name}
          className="input min-h-[8rem]"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "password":
      return (
        <input
          id={field.name}
          type="password"
          className="input"
          placeholder="laisser vide pour ne pas changer"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
        />
      );

    case "date":
      return (
        <input
          id={field.name}
          type="text"
          className="input"
          placeholder="YYYY-MM-DD HH:MM:SS"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "file":
      return (
        <p className="rounded border border-edge bg-ink/60 p-2 text-xs text-slate-500">
          Les fichiers se gèrent dans l'admin PocketBase (`/_/`) — pas encore pris en charge ici.
        </p>
      );

    case "relation":
      return (
        <input
          id={field.name}
          className="input font-mono text-xs"
          placeholder="id du record lié"
          value={Array.isArray(value) ? value.join(",") : String(value ?? "")}
          onChange={(e) =>
            onChange(
              (field.maxSelect ?? 1) > 1
                ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                : e.target.value,
            )
          }
        />
      );

    default:
      return (
        <input
          id={field.name}
          className="input"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
