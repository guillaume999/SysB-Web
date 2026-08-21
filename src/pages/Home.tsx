import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { pb, PB_URL } from "@/lib/pb";
import { useAuth } from "@/lib/auth";
import { COLLECTIONS } from "@/lib/schema";

/** Tableau de bord : combien de records par collection, pour voir ce qui reste à peupler. */
export default function Home() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const collection of COLLECTIONS) {
        try {
          const list = await pb.collection(collection.name).getList(1, 1);
          if (!cancelled) setCounts((c) => ({ ...c, [collection.name]: list.totalItems }));
        } catch {
          if (!cancelled) setCounts((c) => ({ ...c, [collection.name]: null }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Contenu du jeu</h1>
      <p className="mt-1 text-sm text-slate-500">
        Connecté en tant que {String(user?.pseudo || user?.email)} (rôle admin) sur{" "}
        <span className="text-slate-400">{PB_URL}</span>.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((collection) => {
          const count = counts[collection.name];
          return (
            <Link
              key={collection.id}
              to={`/c/${collection.name}`}
              className="card p-4 transition-colors hover:border-accent"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium text-white">{collection.label}</h2>
                <span className={`text-2xl font-semibold ${count === 0 ? "text-amber-400" : "text-slate-300"}`}>
                  {count === undefined ? "…" : count === null ? "—" : count}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{collection.hint}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
