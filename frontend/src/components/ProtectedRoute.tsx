import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../api/auth";

type ProtectedRouteProps = { children: ReactNode };

/**
 * Protège une page privée tout en autorisant la restauration de session par refresh token.
 * Cela évite qu'un simple F5 renvoie vers /login alors que la session est encore récupérable.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>{children}</>;
}
