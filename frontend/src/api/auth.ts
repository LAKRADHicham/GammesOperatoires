import api from "./axios";

type LoginResponse = { access: string; refresh: string };
type RefreshResponse = { access: string; refresh?: string };
type JwtPayload = { exp?: number };

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenUsable(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp > Math.floor(Date.now() / 1000) + 15;
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem("refresh_token");
}

export function saveTokens(access: string, refresh?: string): void {
  sessionStorage.setItem("access_token", access);
  if (refresh) sessionStorage.setItem("refresh_token", refresh);

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

function clearTokens(): void {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export async function login(username: string, password: string): Promise<void> {
  const response = await api.post<LoginResponse>("/token/", {
    username,
    password,
  });

  if (!response.data.access || !response.data.refresh) {
    throw new Error("Le serveur n'a pas retourné les jetons JWT attendus.");
  }

  saveTokens(response.data.access, response.data.refresh);
}

export function logout(): void {
  clearTokens();
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken || !isTokenUsable(refreshToken)) {
    logout();
    return false;
  }

  try {
    const response = await api.post<RefreshResponse>("/token/refresh/", {
      refresh: refreshToken,
    });

    if (!response.data.access) {
      logout();
      return false;
    }

    saveTokens(response.data.access, response.data.refresh);
    return true;
  } catch {
    logout();
    return false;
  }
}

export async function validateSession(): Promise<boolean> {
  if (isTokenUsable(getAccessToken())) return true;
  return refreshAccessToken();
}

export function isAuthenticated(): boolean {
  return isTokenUsable(getAccessToken()) || isTokenUsable(getRefreshToken());
}
