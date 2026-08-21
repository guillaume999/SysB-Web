import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { pb, PB_URL } from "@/lib/pb";
import { useAuth } from "@/lib/auth";
import { COLLECTIONS } from "@/lib/schema";

interface Carte {
  cle: string;
  to: string;
  /** Collection dont on compte les records. */
  collection: string;
  label: string;
  hint: string;
}

/** Tableau de bord : combien de records par collection, pour voir ce qui reste à peupler. */
export default function Home() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  const cartes = useMemo<Carte[]>(
    () => [
      {
        cle: "tuiles",
        to: "/tuiles",
        collection: "tuiles",
        label: "Tuiles",
        hint: "Modèles 3D du jeu associés à un nom et à un tileId.",
      },
      ...COLLECTIONS.map((c) => ({
        cle: c.id,
        to: `/c/${c.name}`,
        collection: c.name,
        label: c.label,
        hint: c.hint,
      })),
    ],
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const carte of cartes) {
        try {
          const list = await pb.collection(carte.collection).getList(1, 1);
          if (!cancelled) setCounts((c) => ({ ...c, [carte.collection]: list.totalItems }));
        } catch {
          if (!cancelled) setCounts((c) => ({ ...c, [carte.collection]: null }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cartes]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Contenu du jeu</h1>
      <p className="mt-1 text-sm text-slate-500">
        Connecté en tant que {String(user?.pseudo || user?.email)} (rôle admin) sur{" "}
        <span className="text-slate-400">{PB_URL}</span>.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cartes.map((carte) => {
          const count = counts[carte.collection];
          return (
            <Link key={carte.cle} to={carte.to} className="card p-4 transition-colors hover:border-accent">
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium text-white">{carte.label}</h2>
                <span className={`text-2xl font-semibold ${count === 0 ? "text-amber-400" : "text-slate-300"}`}>
                  {count === undefined ? "…" : count === null ? "—" : count}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{carte.hint}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
