import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Joueurs from "@/pages/Joueurs";
import Login from "@/pages/Login";
import Modeles3D from "@/pages/Modeles3D";
import ListePlateaux from "@/pages/ListePlateaux";
import PlateauEditeur from "@/pages/PlateauEditeur";
import Ressources from "@/pages/Ressources";
import Tuiles from "@/pages/Tuiles";
import { useAuth } from "@/lib/auth";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Centered>Chargement de la session…</Centered>;

  if (!user)
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/3dmodeltuile" element={<Modeles3D />} />
        <Route path="/tuiles" element={<Tuiles />} />
        <Route path="/ressources" element={<Ressources />} />
        <Route path="/modeles" element={<ListePlateaux source="templates" />} />
        <Route path="/modeles/:id" element={<PlateauEditeur source="templates" />} />
        <Route path="/plateaux" element={<ListePlateaux source="plateaux" />} />
        <Route path="/plateaux/:id" element={<PlateauEditeur source="plateaux" />} />
      <Route path="/joueurs" element={<Joueurs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">{children}</div>;
}
