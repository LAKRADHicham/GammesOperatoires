import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  Bell,
  Search,
  UserRound,
} from "lucide-react";

import api from "../api/axios";

import Sidebar from "./Sidebar";

import "./AppLayout.css";


/* ============================================================
   TYPES
   ============================================================ */

interface AppLayoutProps {
  children: ReactNode;
}

interface CurrentUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;

  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;

  titre_poste?: string | null;
  corps_metier?: string | null;
  telephone?: string | null;
  role?: string | null;
}


/* ============================================================
   LIBELLÉ DU RÔLE
   ============================================================ */

function getRoleLabel(
  role?: string | null,
): string {
  switch (role?.toLowerCase()) {
    case "redacteur":
      return "Éditeur";

    case "administrateur":
      return "Administrateur";

    case "validateur":
      return "Validateur";

    case "lecteur":
      return "Lecteur";

    default:
      return "Éditeur";
  }
}


/* ============================================================
   APP LAYOUT
   ============================================================ */

function AppLayout({
  children,
}: AppLayoutProps) {

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [userLoading, setUserLoading] =
    useState(true);


  /* ==========================================================
     CHARGEMENT UTILISATEUR
     ========================================================== */

  const loadCurrentUser =
    useCallback(async () => {

      try {
        const response =
          await api.get<CurrentUser>(
            "/me/",
          );

        setUser(response.data);

        /*
         * On garde également les informations
         * utilisateur à jour dans le localStorage.
         */
        localStorage.setItem(
          "user",
          JSON.stringify(response.data),
        );

      } catch (error) {
        console.error(
          "Impossible de charger l'utilisateur connecté :",
          error,
        );

        /*
         * Si l'API n'est temporairement pas disponible,
         * on essaie le cache local.
         */
        try {
          const cachedUser =
            localStorage.getItem("user");

          if (cachedUser) {
            const parsedUser =
              JSON.parse(
                cachedUser,
              ) as CurrentUser;

            setUser(parsedUser);
          }

        } catch (cacheError) {
          console.error(
            "Impossible de lire l'utilisateur en cache :",
            cacheError,
          );
        }

      } finally {
        setUserLoading(false);
      }

    }, []);


  /* ==========================================================
     INITIALISATION
     ========================================================== */

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);


  /* ==========================================================
     ACTUALISATION APRÈS MODIFICATION DU PROFIL
     ========================================================== */

  useEffect(() => {

    const handleProfileUpdated = () => {
      void loadCurrentUser();
    };

    window.addEventListener(
      "user-profile-updated",
      handleProfileUpdated,
    );

    return () => {
      window.removeEventListener(
        "user-profile-updated",
        handleProfileUpdated,
      );
    };

  }, [loadCurrentUser]);


  /* ==========================================================
     NOM COMPLET
     ========================================================== */

  const displayName =
    useMemo(() => {

      if (!user) {
        return "Utilisateur";
      }

      const fullName = [
        user.first_name,
        user.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      return (
        fullName ||
        user.username ||
        "Utilisateur"
      );

    }, [user]);


  /* ==========================================================
     RÔLE
     ========================================================== */

  const displayRole =
    useMemo(() => {

      if (!user) {
        return "Éditeur";
      }

      return getRoleLabel(
        user.role,
      );

    }, [user]);


  /* ==========================================================
     AFFICHAGE
     ========================================================== */

  return (
    <div className="application">

      <Sidebar />

      <div className="application-content">

        {/* ====================================================
            TOPBAR
            ==================================================== */}

        <header className="topbar">

          {/* ==================================================
              RECHERCHE
              ================================================== */}

          <div className="topbar-search-wrap">

            <div className="search-box">

              <Search size={18} />

              <input
                type="text"
                placeholder="Rechercher un équipement, une gamme..."
                aria-label="Recherche"
              />

            </div>

          </div>


          {/* ==================================================
              ACTIONS
              ================================================== */}

          <div className="topbar-actions">

            {/* Notifications */}

            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
            >

              <Bell size={19} />

              <span className="notification-badge">
                3
              </span>

            </button>


            <div className="topbar-divider" />


            {/* ================================================
                UTILISATEUR CONNECTÉ
                ================================================ */}

            <div className="user-info">

              <div className="user-avatar">

                <UserRound size={20} />

              </div>


              <div className="user-copy">

                <strong>
                  {userLoading
                    ? "Chargement..."
                    : displayName}
                </strong>

                <span>
                  {userLoading
                    ? "..."
                    : displayRole}
                </span>

              </div>

            </div>

          </div>

        </header>


        {/* ====================================================
            CONTENU DE LA PAGE
            ==================================================== */}

        <main className="page-content">
          {children}
        </main>

      </div>

    </div>
  );
}

export default AppLayout;