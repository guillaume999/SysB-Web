import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import Ages from "@/pages/Ages";
import Home from "@/pages/Home";
import Joueurs from "@/pages/Joueurs";
import Login from "@/pages/Login";
import Modeles3D from "@/pages/Modeles3D";
import MaPlanete from "@/pages/MaPlanete";
import Planetes from "@/pages/Planetes";
import ListePlateaux from "@/pages/ListePlateaux";
import PlateauEditeur from "@/pages/PlateauEditeur";
import Ressources from "@/pages/Ressources";
import Technologies from "@/pages/Technologies";
import Tuiles from "@/pages/Tuiles";
import { accueil } from "@/lib/acces";
import { useAuth } from "@/lib/auth";
import { estConcepteur, usePartage } from "@/lib/partage";

/**
 * Le document de conception pèse ~115 Ko de texte inliné au build : chargé à la
 * demande, il ne ralentit pas l'ouverture des huit écrans de contenu.
 */
const Conception = lazy(() => import("@/pages/Conception"));

export default function App() {
  const { user, estAdmin, loading } = useAuth();
  const { portee, chargement } = usePartage();
  const concepteur = estConcepteur(portee);

  if (loading) return <Centered>Chargement de la session…</Centered>;

  if (!user)
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );

  // ⚠️ ATTENDRE les modèles avant de router : sans ça, un concepteur qui ouvre
  //    `/tuiles` directement se ferait renvoyer sur /conception par le joker,
  //    une fraction de seconde avant que sa portée soit connue — et son lien
  //    serait perdu.
  if (chargement) return <Centered>Chargement des modèles…</Centered>;

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
        {/*
          ⚠️ « Ma planète » est ouvert à TOUT COMPTE CONNECTÉ, admin compris :
          l'administrateur a lui aussi une planète à lui, distincte de celles du
          jeu. C'est donc une route DEHORS des deux blocs conditionnels.
        */}
        <Route path="/ma-planete" element={<MaPlanete />} />
        <Route
          path="/conception"
          element={
            <Suspense fallback={<p className="text-sm text-slate-500">Chargement du document…</p>}>
              <Conception />
            </Suspense>
          }
        />
        {/*
          ⚠️ ADMIN ou CONCEPTEUR, jamais les deux : `porteeDe` laisse la liste
          des modèles VIDE pour un admin, donc `estConcepteur` y est faux. Les
          deux blocs ne peuvent pas déclarer la même route en même temps.
        */}
        {concepteur && (
          <>
            <Route path="/modeles" element={<ListePlateaux source="templates" />} />
            <Route path="/modeles/:id" element={<PlateauEditeur source="templates" />} />
            <Route path="/tuiles" element={<Tuiles />} />
            <Route path="/ressources" element={<Ressources />} />
            <Route path="/technologies" element={<Technologies />} />
          </>
        )}
        {estAdmin && (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/3dmodeltuile" element={<Modeles3D />} />
            <Route path="/tuiles" element={<Tuiles />} />
            <Route path="/ressources" element={<Ressources />} />
            <Route path="/ages" element={<Ages />} />
            <Route path="/technologies" element={<Technologies />} />
            <Route path="/modeles" element={<ListePlateaux source="templates" />} />
            <Route path="/modeles/:id" element={<PlateauEditeur source="templates" />} />
            <Route path="/planetes" element={<Planetes />} />
            <Route path="/plateaux" element={<ListePlateaux source="plateaux" />} />
            <Route path="/plateaux/:id" element={<PlateauEditeur source="plateaux" />} />
            <Route path="/joueurs" element={<Joueurs />} />
          </>
        )}
        <Route path="*" element={<Navigate to={accueil(estAdmin, concepteur)} replace />} />
      </Routes>
    </Layout>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">{children}</div>;
}
