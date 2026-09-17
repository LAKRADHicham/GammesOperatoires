import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================================================
   AJOUT ACCESS TOKEN
   ============================================================ */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken =
      sessionStorage.getItem("access_token");

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================
   REFRESH
   ============================================================ */

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken =
    sessionStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post<{
      access: string;
      refresh?: string;
    }>(
      `${API_URL}/token/refresh/`,
      {
        refresh: refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const newAccessToken = response.data.access;

    if (!newAccessToken) {
      return null;
    }

    sessionStorage.setItem(
      "access_token",
      newAccessToken
    );

    if (response.data.refresh) {
      sessionStorage.setItem(
        "refresh_token",
        response.data.refresh
      );
    }

    return newAccessToken;
  } catch {
    return null;
  }
}

/* ============================================================
   INTERCEPTOR 401
   ============================================================ */

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as
        | (InternalAxiosRequestConfig & {
            _retry?: boolean;
          })
        | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/token/refresh/")
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise =
          performRefresh().finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      }

      // Session réellement terminée
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("user");

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
