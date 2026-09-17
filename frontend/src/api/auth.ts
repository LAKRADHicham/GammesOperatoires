import api from "./axios";

type LoginResponse = { access: string; refresh: string };
type JwtPayload = { exp?: number };

/** Décode le payload d'un JWT afin de lire uniquement sa date d'expiration. */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch (error) {
    console.warn("JWT illisible.", error);
    return null;
  }
}

/** Vérifie que l'access token n'est pas déjà expiré, avec 15 s de marge. */
export function isTokenUsable(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp > Math.floor(Date.now() / 1000) + 15;
}

/** Connecte l'utilisateur et stocke les deux jetons afin qu'ils survivent à F5. */
export async function login(username: string, password: string): Promise<void> {
  const response = await api.post<LoginResponse>("/token/", { username, password });
  localStorage.setItem("access_token", response.data.access);
  localStorage.setItem("refresh_token", response.data.refresh);
}

/** Supprime complètement la session locale. */
export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/** Retourne l'access token actuellement mémorisé. */
export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

/** Retourne le refresh token actuellement mémorisé. */
export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

/**
 * Indique si la session peut être utilisée ou restaurée.
 * Un refresh token présent autorise la page à rester ouverte pendant qu'Axios renouvelle l'access token.
 */
export function isAuthenticated(): boolean {
  return isTokenUsable(getAccessToken()) || Boolean(getRefreshToken());
}
