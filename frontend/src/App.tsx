import type { ReactNode } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import TechnicalBackground from "./components/TechnicalBackground";

/* ============================================================
   PAGES PUBLIQUES
   ============================================================ */

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";

/* ============================================================
   DASHBOARD
   ============================================================ */

import DashboardPage from "./pages/dashboard/DashboardPage";

/* ============================================================
   ÉQUIPEMENTS
   ============================================================ */

import EquipementsPage from "./pages/equipements/Equipements";

/* ============================================================
   ENTREPRISES / LOGOS
   ============================================================ */

import EntreprisesPage from "./pages/Entreprises/Entreprises";

/* ============================================================
   GAMMES
   ============================================================ */

import GammesList from "./pages/gammes/GammesList";
import GammeCreate from "./pages/gammes/GammeCreate";
import GammeDetail from "./pages/gammes/GammeDetail";

/* ============================================================
   RÉFÉRENTIELS
   ============================================================ */

import ReferentielsManagerPage
  from "./pages/referentiels/ReferentielsManagerPage";

import EPIPage
  from "./pages/referentiels/EPIPage";

import EPCPage
  from "./pages/referentiels/EPCPage";

import RisquesPage
  from "./pages/referentiels/RisquesPage";

import OutillagesPage
  from "./pages/referentiels/OutillagesPage";

import PiecesPage
  from "./pages/referentiels/PiecesPage";

/* ============================================================
   MODULES
   ============================================================ */

import VersionsPage
  from "./pages/modules/VersionsPage";

import PlansMaintenancePage
  from "./pages/modules/PlansMaintenancePage";

import DocumentsPage
  from "./pages/modules/DocumentsPage";

import QRCodesPage
  from "./pages/modules/QRCodesPage";

import ExportsPage
  from "./pages/modules/ExportsPage";

import SimpleModulePage
  from "./pages/modules/SimpleModulePage";

/* ============================================================
   PROFIL
   ============================================================ */

import ProfilePage
  from "./pages/profile/ProfilePage";

/* ============================================================
   STYLE GLOBAL
   ============================================================ */

import "./styles/GreenWhiteTheme.css";
import "./styles/MotionPolish.css";

/* ============================================================
   LAYOUT PROTÉGÉ
   ============================================================ */

function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppLayout>
        {children}
      </AppLayout>
    </ProtectedRoute>
  );
}

/* ============================================================
   APPLICATION
   ============================================================ */

export default function App() {
  return (
    <BrowserRouter>
      <TechnicalBackground />

      <Routes>

        {/* ====================================================
            ACCUEIL PUBLIC
            ==================================================== */}

        <Route
          path="/"
          element={<HomePage />}
        />

        {/* ====================================================
            AUTHENTIFICATION
            ==================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/inscription"
          element={<Register />}
        />

        {/* ====================================================
            DASHBOARD PRIVÉ
            ==================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            KPI
            ==================================================== */}

        <Route
          path="/kpi"
          element={
            <ProtectedLayout>
              <SimpleModulePage
                title="Indicateurs / KPI"
                subtitle="MTBF, MTTR, disponibilité et performance maintenance"
              />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            ÉQUIPEMENTS
            ==================================================== */}

        <Route
          path="/equipements"
          element={
            <ProtectedLayout>
              <EquipementsPage />
            </ProtectedLayout>
          }
        />
        {/* ====================================================
    ENTREPRISES / LOGOS
    ==================================================== */}

        <Route
          path="/entreprises"
          element={
            <ProtectedLayout>
              <EntreprisesPage />
            </ProtectedLayout>
          }
      />

        {/* ====================================================
            GAMMES
            ==================================================== */}

        {/* Liste des gammes */}
        <Route
          path="/gammes"
          element={
            <ProtectedLayout>
              <GammesList />
            </ProtectedLayout>
          }
        />

        {/* Création d'une nouvelle gamme */}
        <Route
          path="/gammes/nouvelle"
          element={
            <ProtectedLayout>
              <GammeCreate />
            </ProtectedLayout>
          }
        />

        {/* Ancienne URL de création */}
        <Route
          path="/gammes/new"
          element={
            <Navigate
              to="/gammes/nouvelle"
              replace
            />
          }
        />

        {/* Voir une gamme */}
        <Route
          path="/gammes/:id"
          element={
            <ProtectedLayout>
              <GammeDetail />
            </ProtectedLayout>
          }
        />

        {/* Modifier une gamme */}
        <Route
          path="/gammes/:id/modifier"
          element={
            <ProtectedLayout>
              <GammeCreate />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            VERSIONS
            ==================================================== */}

        <Route
          path="/versions"
          element={
            <ProtectedLayout>
              <VersionsPage />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            PLANS DE MAINTENANCE
            ==================================================== */}

        <Route
          path="/plans-maintenance"
          element={
            <ProtectedLayout>
              <PlansMaintenancePage />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            RÉFÉRENTIELS
            ==================================================== */}

        <Route
          path="/referentiels"
          element={
            <ProtectedLayout>
              <ReferentielsManagerPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/referentiels/epis"
          element={
            <ProtectedLayout>
              <EPIPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/referentiels/epc"
          element={
            <ProtectedLayout>
              <EPCPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/referentiels/risques"
          element={
            <ProtectedLayout>
              <RisquesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/referentiels/outillages"
          element={
            <ProtectedLayout>
              <OutillagesPage />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            REDIRECTIONS RÉFÉRENTIELS
            ==================================================== */}

        <Route
          path="/epis"
          element={
            <Navigate
              to="/referentiels/epis"
              replace
            />
          }
        />

        <Route
          path="/risques"
          element={
            <Navigate
              to="/referentiels/risques"
              replace
            />
          }
        />

        <Route
          path="/outillages"
          element={
            <Navigate
              to="/referentiels/outillages"
              replace
            />
          }
        />

        {/* ====================================================
            PIÈCES
            ==================================================== */}

        <Route
          path="/pieces"
          element={
            <ProtectedLayout>
              <PiecesPage />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            DOCUMENTS
            ==================================================== */}

        <Route
          path="/documents"
          element={
            <ProtectedLayout>
              <DocumentsPage />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            QR CODES
            ==================================================== */}

        <Route
          path="/qr-codes"
          element={
            <ProtectedLayout>
              <QRCodesPage />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            EXPORTS
            ==================================================== */}

        <Route
          path="/exports"
          element={
            <ProtectedLayout>
              <ExportsPage />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            PROFIL
            ==================================================== */}

        <Route
          path="/profil"
          element={
            <ProtectedLayout>
              <ProfilePage />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            PARAMÈTRES
            ==================================================== */}

        <Route
          path="/parametres"
          element={
            <ProtectedLayout>
              <SimpleModulePage
                title="Paramètres"
                subtitle="Configuration générale de l'application"
              />
            </ProtectedLayout>
          }
        />

        {/* ====================================================
            ROUTE INCONNUE
            ==================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}