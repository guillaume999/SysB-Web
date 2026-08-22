import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { pb, PB_URL } from "@/lib/pb";
import { useAuth } from "@/lib/auth";

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
        cle: "tuile3dmodel",
        to: "/3dmodeltuile",
        collection: "tuile3dmodel",
        label: "3DmodelTuile",
        hint: "Les prefabs du jeu déclarés ici, un par modèle 3D utilisable.",
      },
      {
        cle: "ressources",
        to: "/ressources",
        collection: "ressources",
        label: "Ressources",
        hint: "Le vocabulaire du jeu, cité par tous les coûts et productions.",
      },
      {
        cle: "tuiles",
        to: "/tuiles",
        collection: "tuiles",
        label: "Tuiles",
        hint: "Le catalogue jouable : un modèle 3D plus ses règles de jeu.",
      },
      {
        cle: "templates",
        to: "/modeles",
        collection: "templates",
        label: "Modèles",
        hint: "Le terrain de départ, copié pour chaque joueur à sa première venue.",
      },
      {
        cle: "plateaux",
        to: "/plateaux",
        collection: "plateaux",
        label: "Plateaux des joueurs",
        hint: "Une copie par joueur et par type, née de son modèle.",
      },
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
