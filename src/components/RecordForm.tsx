import { useEffect, useState } from "react";
import JsonField from "@/components/JsonField";
import { emptyValue, type PbCollection, type PbField } from "@/lib/schema";

export type FormValues = Record<string, unknown>;

/** Convertit un record PocketBase en valeurs de formulaire (les json passent en texte). */
function toFormValues(collection: PbCollection, record: FormValues | null): FormValues {
  const values: FormValues = {};
  for (const field of collection.fields) {
    const current = record?.[field.name];
    if (field.type === "json") {
      values[field.name] =
        current === undefined || current === null || current === ""
          ? ""
          : typeof current === "string"
            ? current
            : JSON.stringify(current, null, 2);
    } else {
      values[field.name] = current ?? emptyValue(field);
    }
  }
  return values;
}

/** Repasse les valeurs de formulaire vers le format attendu par l'API. */
function toPayload(collection: PbCollection, values: FormValues): { data: FormValues; error: string | null } {
  const data: FormValues = {};
  for (const field of collection.fields) {
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
          {record ? "Modifier" : "Nouveau"} — <span className="text-slate-400">{collection.label}</span>
        </h2>

        <div className="space-y-4">
          {collection.fields.map((field) => (
            <div key={field.name}>
              <label className="label" htmlFor={field.name}>
                {field.name}
                {field.required && <span className="ml-1 text-red-400">*</span>}
              </label>
              <FieldInput field={field} value={values[field.name]} onChange={(v) => set(field.name, v)} />
              {field.hint && <p className="mt-1 text-xs text-slate-600">{field.hint}</p>}
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">{error}</p>
        )}

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

    case "select":
      return (
        <select
          id={field.name}
          className="input"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {(field.values ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case "editor":
      return (
        <textarea
          id={field.name}
          className="input min-h-[8rem]"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return field.multiline ? (
        <textarea
          id={field.name}
          className="input min-h-[7rem] font-mono text-xs"
          spellCheck={false}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={field.name}
          className="input"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
