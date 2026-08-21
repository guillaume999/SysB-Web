import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import CollectionPage from "@/pages/CollectionPage";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import { useAuth } from "@/lib/auth";
import { loadCollections, type PbCollection } from "@/lib/schema";

export default function App() {
  const { user, loading } = useAuth();
  const [collections, setCollections] = useState<PbCollection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Le schéma n'est lisible qu'une fois authentifié en superuser.
  useEffect(() => {
    if (!user) {
      setCollections(null);
      return;
    }
    let cancelled = false;
    loadCollections()
      .then((list) => !cancelled && setCollections(list))
      .catch((e: { message?: string }) => !cancelled && setError(e.message ?? "Schéma illisible."));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <Centered>Chargement de la session…</Centered>;
  if (!user)
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  if (error) return <Centered>{error}</Centered>;
  if (!collections) return <Centered>Lecture du schéma…</Centered>;

  return (
    <Layout collections={collections}>
      <Routes>
        <Route path="/" element={<Home collections={collections} />} />
        <Route path="/c/:name" element={<CollectionPage collections={collections} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">{children}</div>;
}
