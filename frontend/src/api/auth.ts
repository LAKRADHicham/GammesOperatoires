import api from "./axios";

type LoginResponse = {
  access: string;
  refresh: string;
};

type RefreshResponse = {
  access: string;
  refresh?: string;
};

type JwtPayload = {
  exp?: number;
};

/* ============================================================
   JWT
   ============================================================ */

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const normalized = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "="
    );

    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch (error) {
    console.warn("JWT illisible.", error);
    return null;
  }
}

/* ============================================================
   VALIDATION DU TOKEN
   ============================================================ */

export function isTokenUsable(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);

  // Marge de sécurité de 15 secondes
  return payload.exp > now + 15;
}

/* ============================================================
   TOKENS
   ============================================================ */

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function saveTokens(
  access: string,
  refresh?: string
): void {
  localStorage.setItem("access_token", access);

  if (refresh) {
    localStorage.setItem("refresh_token", refresh);
  }
}

/* ============================================================
   LOGIN
   ============================================================ */

export async function login(
  username: string,
  password: string
): Promise<void> {
  const response = await api.post<LoginResponse>(
    "/token/",
    {
      username,
      password,
    }
  );

  saveTokens(
    response.data.access,
    response.data.refresh
  );
}

/* ============================================================
   LOGOUT
   ============================================================ */

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

/* ============================================================
   REFRESH TOKEN
   ============================================================ */

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    logout();
    return false;
  }

  /*
   * On vérifie d'abord localement que le refresh token
   * n'est pas déjà expiré.
   */
  if (!isTokenUsable(refreshToken)) {
    logout();
    return false;
  }

  try {
    const response = await api.post<RefreshResponse>(
      "/token/refresh/",
      {
        refresh: refreshToken,
      }
    );

    if (!response.data.access) {
      logout();
      return false;
    }

    saveTokens(
      response.data.access,
      response.data.refresh
    );

    return true;
  } catch (error) {
    console.warn(
      "Impossible de restaurer la session.",
      error
    );

    logout();

    return false;
  }
}

/* ============================================================
   VÉRIFICATION DE SESSION
   ============================================================ */

export async function validateSession(): Promise<boolean> {
  const accessToken = getAccessToken();

  /*
   * Access token encore valide :
   * aucune requête supplémentaire nécessaire.
   */
  if (isTokenUsable(accessToken)) {
    return true;
  }

  /*
   * Access expiré :
   * tentative de renouvellement avec le refresh token.
   */
  return refreshAccessToken();
}

/* ============================================================
   AUTHENTIFICATION SYNCHRONE
   ============================================================ */

/*
 * Cette fonction ne considère PLUS la simple présence
 * d'un refresh_token comme une authentification valide.
 */
export function isAuthenticated(): boolean {
  return isTokenUsable(getAccessToken());
}
