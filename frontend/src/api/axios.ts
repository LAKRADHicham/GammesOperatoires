import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "/api";

/* ============================================================
   INSTANCE AXIOS
   ============================================================ */

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================================================
   REQUÊTES
   ============================================================ */

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig
  ) => {
    const accessToken =
      localStorage.getItem("access_token");

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================
   ÉTAT DU REFRESH
   ============================================================ */

let refreshPromise: Promise<string | null> | null = null;

/* ============================================================
   RENOUVELLEMENT DU TOKEN
   ============================================================ */

async function performRefresh(): Promise<string | null> {
  const refreshToken =
    localStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  try {
    /*
     * axios est utilisé directement ici et non "api"
     * afin d'éviter une boucle dans l'interceptor.
     */
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

    const newAccessToken =
      response.data.access;

    if (!newAccessToken) {
      return null;
    }

    localStorage.setItem(
      "access_token",
      newAccessToken
    );

    /*
     * SimpleJWT peut éventuellement effectuer
     * une rotation du refresh token.
     */
    if (response.data.refresh) {
      localStorage.setItem(
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
   RÉPONSES
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

    /*
     * Si Django répond 401, on tente UNE fois
     * de renouveler l'access token.
     */
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(
        "/token/refresh/"
      )
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise =
          performRefresh().finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken =
        await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      }

      /*
       * Refresh invalide ou expiré :
       * destruction complète de la session.
       */
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      /*
       * On ne redirige que si nécessaire.
       */
      if (
        window.location.pathname !== "/login"
      ) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
