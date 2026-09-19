import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  return "http://127.0.0.1:8000/api";
}

const API_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

interface RefreshResponse {
  access: string;
  refresh?: string;
}

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function getAccessToken(): string | null {
  return sessionStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  return sessionStorage.getItem("refresh_token");
}

function clearAuthentication(): void {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

function redirectToLogin(): void {
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

function isAuthenticationRequest(url?: string): boolean {
  if (!url) return false;

  return (
    url.includes("/token/refresh/") ||
    url === "/token/" ||
    url.endsWith("/token/") ||
    url.includes("/auth/login/") ||
    url.includes("/auth/google/") ||
    url.includes("/auth/register/")
  );
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post<RefreshResponse>(
      `${API_URL}/token/refresh/`,
      { refresh: refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 30000,
      },
    );

    const newAccessToken = response.data.access;
    if (!newAccessToken) return null;

    sessionStorage.setItem("access_token", newAccessToken);

    if (response.data.refresh) {
      sessionStorage.setItem("refresh_token", response.data.refresh);
    }

    return newAccessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (!originalRequest) return Promise.reject(error);

    if (isAuthenticationRequest(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!getRefreshToken()) {
      clearAuthentication();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = performRefresh().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;

    if (!newAccessToken) {
      clearAuthentication();
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  },
);

export default api;
