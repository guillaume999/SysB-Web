import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import RecordForm, { type FormValues } from "@/components/RecordForm";
import { pb } from "@/lib/pb";
import { COLLECTION_INFO, fieldsOf, titleFieldOf, type PbCollection } from "@/lib/schema";

const PER_PAGE = 50;

/** Aperçu court d'une valeur pour la vue tableau. */
function preview(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    const text = JSON.stringify(value);
    return text.length > 60 ? `${text.slice(0, 57)}…` : text;
  }
  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

export default function CollectionPage({ collections }: { collections: PbCollection[] }) {
  const { name = "" } = useParams();
  const collection = useMemo(() => collections.find((c) => c.name === name), [collections, name]);

  const [records, setRecords] = useState<FormValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FormValues | null | undefined>(undefined); // undefined = fermé
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!collection) return;
    setLoading(true);
    setError(null);
    try {
      const list = await pb.collection(collection.name).getList(1, PER_PAGE, { sort: "-created" });
      setRecords(list.items as unknown as FormValues[]);
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message ?? "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    setSearch("");
    void load();
  }, [load]);

  if (!collection) {
    return <p className="text-slate-400">Collection « {name} » introuvable.</p>;
  }

  const columns = fieldsOf(collection)
    .filter((f) => f.type !== "autodate" && f.type !== "password")
    .slice(0, 6);
  const title = titleFieldOf(collection);

  const visible = records.filter((record) =>
    search.trim() === ""
      ? true
      : JSON.stringify(record).toLowerCase().includes(search.trim().toLowerCase()),
  );

  const save = async (data: FormValues) => {
    setSaving(true);
    setError(null);
    try {
      if (editing && editing.id) {
        await pb.collection(collection.name).update(String(editing.id), data);
      } else {
        await pb.collection(collection.name).create(data);
      }
      setEditing(undefined);
      await load();
    } catch (e) {
      const err = e as { message?: string; response?: { data?: Record<string, { message?: string }> } };
      const details = Object.entries(err.response?.data ?? {})
        .map(([field, info]) => `${field} : ${info?.message ?? ""}`)
        .join(" · ");
      setError(details || err.message || "Enregistrement refusé.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record: FormValues) => {
    const label = String(record[title] ?? record.id);
    if (!window.confirm(`Supprimer « ${label} » ? Cette action est définitive.`)) return;
    try {
      await pb.collection(collection.name).delete(String(record.id));
      await load();
    } catch (e) {
      setError((e as { message?: string }).message ?? "Suppression refusée.");
    }
  };

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {COLLECTION_INFO[collection.name]?.label ?? collection.name}
          </h1>
          <p className="text-sm text-slate-500">
            {COLLECTION_INFO[collection.name]?.hint ?? `Collection ${collection.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input w-48"
            placeholder="Filtrer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-ghost" onClick={() => void load()}>
            Recharger
          </button>
          <button className="btn-primary" onClick={() => setEditing(null)}>
            + Nouveau
          </button>
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">{error}</p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-slate-400">
              {columns.map((column) => (
                <th key={column.name} className="px-3 py-2 font-medium">
                  {column.name}
                </th>
              ))}
              <th className="w-32 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-slate-500">
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-slate-500">
                  Aucun record. Clique sur « + Nouveau » pour en créer un.
                </td>
              </tr>
            )}
            {!loading &&
              visible.map((record) => (
                <tr key={String(record.id)} className="border-b border-edge/60 last:border-0 hover:bg-ink/40">
                  {columns.map((column) => (
                    <td key={column.name} className="px-3 py-2 align-top text-slate-300">
                      {preview(record[column.name])}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <button className="text-xs text-accent hover:underline" onClick={() => setEditing(record)}>
                      Modifier
                    </button>
                    <button
                      className="ml-3 text-xs text-slate-500 hover:text-red-400"
                      onClick={() => void remove(record)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-600">
        {visible.length} record{visible.length > 1 ? "s" : ""} affiché{visible.length > 1 ? "s" : ""}
        {records.length >= PER_PAGE && ` (${PER_PAGE} max par page)`}
      </p>

      {editing !== undefined && (
        <RecordForm
          collection={collection}
          record={editing}
          saving={saving}
          onCancel={() => setEditing(undefined)}
          onSubmit={(data) => void save(data)}
        />
      )}
    </div>
  );
}
