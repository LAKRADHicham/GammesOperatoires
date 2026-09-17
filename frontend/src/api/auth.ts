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
  } catch {
    return null;
  }
}

/* ============================================================
   TOKEN VALIDE ?
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

  return payload.exp > now + 15;
}

/* ============================================================
   TOKENS
   ============================================================ */

export function getAccessToken(): string | null {
  return sessionStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem("refresh_token");
}

export function saveTokens(
  access: string,
  refresh?: string
): void {
  sessionStorage.setItem("access_token", access);

  if (refresh) {
    sessionStorage.setItem("refresh_token", refresh);
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
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user");

  /*
   * Nettoyage des anciennes versions de l'application
   * qui utilisaient localStorage.
   */
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

/* ============================================================
   REFRESH ACCESS TOKEN
   ============================================================ */

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    logout();
    return false;
  }

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
  } catch {
    logout();
    return false;
  }
}

/* ============================================================
   SESSION
   ============================================================ */

export async function validateSession(): Promise<boolean> {
  const accessToken = getAccessToken();

  // Access encore valide
  if (isTokenUsable(accessToken)) {
    return true;
  }

  // Access expiré : tentative avec le refresh
  return refreshAccessToken();
}

export function isAuthenticated(): boolean {
  return isTokenUsable(getAccessToken());
}
