import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  isAuthenticated,
  validateSession,
} from "../api/auth";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const location = useLocation();

  const [checking, setChecking] = useState(
    !isAuthenticated()
  );

  const [authenticated, setAuthenticated] = useState(
    isAuthenticated()
  );

  useEffect(() => {
    let active = true;

    async function checkSession() {
      /*
       * Access token encore valide :
       * pas besoin de faire un refresh.
       */
      if (isAuthenticated()) {
        if (active) {
          setAuthenticated(true);
          setChecking(false);
        }

        return;
      }

      /*
       * Access token absent ou expiré :
       * on vérifie réellement le refresh token auprès de Django.
       */
      const valid = await validateSession();

      if (active) {
        setAuthenticated(valid);
        setChecking(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  /* ============================================================
     VÉRIFICATION EN COURS
     ============================================================ */

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Vérification de la session...
      </div>
    );
  }

  /* ============================================================
     SESSION INVALIDE
     ============================================================ */

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  /* ============================================================
     SESSION VALIDE
     ============================================================ */

  return <>{children}</>;
}
