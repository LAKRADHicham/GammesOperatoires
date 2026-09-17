import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";


/* ============================================================
   CONFIGURATION API
   ============================================================ */

/**
 * URL de base de l'API Django.
 *
 * Développement :
 * http://127.0.0.1:8000/api
 *
 * Production :
 * définie avec VITE_API_URL
 */
function getApiBaseUrl(): string {
  const envUrl =
    import.meta.env.VITE_API_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  return "http://127.0.0.1:8000/api";
}


/* ============================================================
   INSTANCE AXIOS
   ============================================================ */

const api = axios.create({
  baseURL: getApiBaseUrl(),

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  timeout: 30000,
});


/* ============================================================
   TYPES
   ============================================================ */

interface RefreshResponse {
  access: string;
  refresh?: string;
}

interface RetryRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}


/* ============================================================
   GESTION DU REFRESH TOKEN
   ============================================================ */

let isRefreshing = false;

let refreshSubscribers: Array<
  (accessToken: string) => void
> = [];


/**
 * Ajoute une requête en attente pendant
 * le renouvellement du token.
 */
function subscribeTokenRefresh(
  callback: (accessToken: string) => void,
): void {
  refreshSubscribers.push(callback);
}


/**
 * Relance toutes les requêtes en attente
 * après renouvellement du token.
 */
function notifyTokenRefreshed(
  accessToken: string,
): void {
  refreshSubscribers.forEach(
    (callback) => {
      callback(accessToken);
    },
  );

  refreshSubscribers = [];
}


/**
 * Supprime les requêtes en attente.
 */
function clearRefreshSubscribers(): void {
  refreshSubscribers = [];
}


/* ============================================================
   DÉCONNEXION LOCALE
   ============================================================ */

function clearAuthentication(): void {
  localStorage.removeItem(
    "access_token",
  );

  localStorage.removeItem(
    "refresh_token",
  );

  localStorage.removeItem(
    "user",
  );
}


/* ============================================================
   INTERCEPTEUR REQUEST
   ============================================================ */

/**
 * Ajoute automatiquement :
 *
 * Authorization: Bearer <access_token>
 *
 * sur les requêtes authentifiées.
 */
api.interceptors.request.use(
  (
    config:
      InternalAxiosRequestConfig,
  ) => {
    const accessToken =
      localStorage.getItem(
        "access_token",
      );

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);


/* ============================================================
   INTERCEPTEUR RESPONSE
   ============================================================ */

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (
    error: AxiosError,
  ) => {
    const originalRequest =
      error.config as
        | RetryRequestConfig
        | undefined;


    /*
     * Si aucune configuration de requête
     * n'est disponible, on retourne l'erreur.
     */
    if (!originalRequest) {
      return Promise.reject(error);
    }


    /*
     * SimpleJWT retourne normalement 401
     * lorsqu'un access token est expiré.
     *
     * Certains endpoints/configurations
     * peuvent retourner 403.
     */
    const status =
      error.response?.status;


    const shouldRefresh =
      status === 401 ||
      status === 403;


    /*
     * Ne jamais essayer de refresh sur
     * l'endpoint de refresh lui-même.
     */
    const requestUrl =
      originalRequest.url || "";


    const isRefreshRequest =
      requestUrl.includes(
        "/token/refresh/",
      );


    /*
     * Ne pas boucler sur une requête
     * déjà rejouée.
     */
    if (
      !shouldRefresh ||
      originalRequest._retry ||
      isRefreshRequest
    ) {
      return Promise.reject(error);
    }


    const refreshToken =
      localStorage.getItem(
        "refresh_token",
      );


    /*
     * Pas de refresh token :
     * on supprime l'ancienne session.
     */
    if (!refreshToken) {
      clearAuthentication();

      return Promise.reject(error);
    }


    /* ========================================================
       UN REFRESH EST DÉJÀ EN COURS
       ======================================================== */

    if (isRefreshing) {
      return new Promise(
        (resolve) => {
          subscribeTokenRefresh(
            (
              newAccessToken:
                string,
            ) => {
              originalRequest.headers.Authorization =
                `Bearer ${newAccessToken}`;

              resolve(
                api(
                  originalRequest,
                ),
              );
            },
          );
        },
      );
    }


    /* ========================================================
       LANCEMENT DU REFRESH
       ======================================================== */

    originalRequest._retry = true;

    isRefreshing = true;


    try {
      /*
       * On utilise axios directement ici,
       * et non l'instance api,
       * pour éviter une boucle
       * d'intercepteurs.
       */
      const response =
        await axios.post<RefreshResponse>(
          `${getApiBaseUrl()}/token/refresh/`,
          {
            refresh:
              refreshToken,
          },
          {
            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            timeout: 30000,
          },
        );


      const newAccessToken =
        response.data.access;


      if (!newAccessToken) {
        throw new Error(
          "Le serveur n'a pas retourné de nouveau access token.",
        );
      }


      /* ======================================================
         ENREGISTREMENT NOUVEAU ACCESS TOKEN
         ====================================================== */

      localStorage.setItem(
        "access_token",
        newAccessToken,
      );


      /*
       * Si ROTATE_REFRESH_TOKENS est activé
       * et qu'un nouveau refresh est retourné,
       * on le sauvegarde également.
       */
      if (
        response.data.refresh
      ) {
        localStorage.setItem(
          "refresh_token",
          response.data.refresh,
        );
      }


      /* ======================================================
         RELANCE DES REQUÊTES EN ATTENTE
         ====================================================== */

      notifyTokenRefreshed(
        newAccessToken,
      );


      /* ======================================================
         RELANCE DE LA REQUÊTE ORIGINALE
         ====================================================== */

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;


      return api(
        originalRequest,
      );

    } catch (refreshError) {
      /*
       * Refresh invalide ou expiré.
       */
      clearRefreshSubscribers();

      clearAuthentication();


      /*
       * On redirige vers /login uniquement
       * si nous ne sommes pas déjà dessus.
       */
      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.href =
          "/login";
      }


      return Promise.reject(
        refreshError,
      );

    } finally {
      isRefreshing = false;
    }
  },
);


/* ============================================================
   EXPORT
   ============================================================ */

export default api;