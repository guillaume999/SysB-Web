import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import PublicLayout from "@/components/PublicLayout";
import Ages from "@/pages/Ages";
import Forum from "@/pages/Forum";
import ForumSalon from "@/pages/ForumSalon";
import ForumSujet from "@/pages/ForumSujet";
import Home from "@/pages/Home";
import Icones from "@/pages/Icones";
import Joueurs from "@/pages/Joueurs";
import Login from "@/pages/Login";
import Modeles3D from "@/pages/Modeles3D";
import ListePlateaux from "@/pages/ListePlateaux";
import News from "@/pages/News";
import PlateauEditeur from "@/pages/PlateauEditeur";
import Ressources from "@/pages/Ressources";
import Technologies from "@/pages/Technologies";
import Tuiles from "@/pages/Tuiles";
import { accueil } from "@/lib/acces";
import { useAuth } from "@/lib/auth";

/**
 * Le document de conception pèse ~115 Ko de texte inliné au build : chargé à la
 * demande, il ne ralentit pas l'ouverture des neuf écrans de contenu.
 */
const Conception = lazy(() => import("@/pages/Conception"));

export default function App() {
  const { user, estAdmin, loading } = useAuth();

  if (loading) return <Centered>Chargement de la session…</Centered>;

  /**
   * ⚠️ LE VISITEUR NON CONNECTÉ (15/09) : il lit les News et le Forum, et
   * trouve la connexion sur /connexion. Toute autre adresse le renvoie sur les
   * News — plus sur la connexion comme avant.
   * Une fois connecté, /connexion n'existe plus : le joker l'envoie sur son
   * accueil, ce qui fait la redirection d'après connexion.
   */
  if (!user)
    return (
      <PublicLayout>
        <Routes>
          {routesPubliques}
          <Route path="/connexion" element={<Login />} />
          <Route path="*" element={<Navigate to="/news" replace />} />
        </Routes>
      </PublicLayout>
    );

  /**
   * ⚠️ LES ÉCRANS DE CONTENU N'EXISTENT PAS POUR UN JOUEUR — ils ne sont pas
   * seulement cachés de la barre latérale : la route elle-même est absente, donc
   * `/joueurs` tapé à la main tombe sur le joker et repart sur /conception.
   * Les masquer en gardant la route aurait donné une page d'erreurs PocketBase
   * à quiconque connaît l'adresse.
   *
   * ⚠️ Et ça ne PROTÈGE rien : ce qui protège les données, ce sont les règles
   * d'API PocketBase. Voir l'en-tête de `lib/acces.ts`.
   */
  return (
    <Layout>
      <Routes>
        {routesPubliques}
        <Route
          path="/conception"
          element={
            <Suspense fallback={<p className="text-sm text-slate-500">Chargement du document…</p>}>
              <Conception />
            </Suspense>
          }
        />
        {estAdmin && (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/3dmodeltuile" element={<Modeles3D />} />
            <Route path="/icones" element={<Icones />} />
            <Route path="/tuiles" element={<Tuiles />} />
            <Route path="/ressources" element={<Ressources />} />
            <Route path="/ages" element={<Ages />} />
            <Route path="/technologies" element={<Technologies />} />
            <Route path="/modeles" element={<ListePlateaux source="templates" />} />
            <Route path="/modeles/:id" element={<PlateauEditeur source="templates" />} />
            <Route path="/plateaux" element={<ListePlateaux source="plateaux" />} />
            <Route path="/plateaux/:id" element={<PlateauEditeur source="plateaux" />} />
            <Route path="/joueurs" element={<Joueurs />} />
          </>
        )}
        <Route path="*" element={<Navigate to={accueil(estAdmin)} replace />} />
      </Routes>
    </Layout>
  );
}

/**
 * Les routes LISIBLES SANS CONNEXION — les mêmes pour le visiteur et le compte
 * connecté (seuls les boutons d'écriture changent, dans les pages).
 * ⚠️ Une adresse ajoutée ici est ouverte à TOUT INTERNET : n'y mettre qu'un
 * écran dont les collections sont en lecture publique.
 */
const routesPubliques = (
  <>
    <Route path="/news" element={<News />} />
    <Route path="/forum" element={<Forum />} />
    <Route path="/forum/sujet/:id" element={<ForumSujet />} />
    <Route path="/forum/:salonId" element={<ForumSalon />} />
  </>
);

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">{children}</div>;
}
