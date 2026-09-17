import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

/* ============================================================
   CONFIGURATION API
   ============================================================ */

/*
 * En production Vercel :
 *   /api
 *
 * En local, tu peux définir dans .env.local :
 *   VITE_API_URL=http://127.0.0.1:8000/api
 */
const API_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  "/api";


/* ============================================================
   INSTANCE AXIOS PRINCIPALE
   ============================================================ */

const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
  },
});


/* ============================================================
   OUTILS SESSION
   ============================================================ */

function getAccessToken(): string | null {
  return sessionStorage.getItem(
    "access_token"
  );
}


function getRefreshToken(): string | null {
  return sessionStorage.getItem(
    "refresh_token"
  );
}


function clearAuthentication(): void {
  /*
   * Session actuelle
   */
  sessionStorage.removeItem(
    "access_token"
  );

  sessionStorage.removeItem(
    "refresh_token"
  );

  sessionStorage.removeItem(
    "user"
  );


  /*
   * Nettoyage des anciens tokens
   * éventuellement présents depuis
   * l'ancienne version de l'application.
   *
   * remembered_username n'est PAS supprimé.
   */
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );

  localStorage.removeItem(
    "user"
  );
}


/* ============================================================
   INTERCEPTOR REQUEST
   ============================================================ */

/*
 * Ajoute automatiquement l'access token
 * aux requêtes API lorsqu'il existe.
 */

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig
  ) => {
    const accessToken =
      getAccessToken();


    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }


    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


/* ============================================================
   REFRESH TOKEN
   ============================================================ */

/*
 * Cette variable empêche plusieurs refresh
 * simultanés lorsque plusieurs requêtes
 * reçoivent un 401 au même moment.
 */

let refreshPromise:
  Promise<string | null> | null =
  null;


/* ============================================================
   EFFECTUER LE REFRESH
   ============================================================ */

async function performRefresh():
  Promise<string | null> {

  const refreshToken =
    getRefreshToken();


  if (!refreshToken) {
    return null;
  }


  try {
    /*
     * IMPORTANT :
     *
     * On utilise axios directement et non
     * l'instance "api".
     *
     * Cela évite de déclencher les interceptors
     * pendant le refresh.
     */

    const response =
      await axios.post<{
        access: string;
        refresh?: string;
      }>(
        `${API_URL}/token/refresh/`,

        {
          refresh: refreshToken,
        },

        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );


    const newAccessToken =
      response.data.access;


    if (!newAccessToken) {
      return null;
    }


    /*
     * Sauvegarde du nouvel access token.
     */

    sessionStorage.setItem(
      "access_token",
      newAccessToken
    );


    /*
     * Si SimpleJWT utilise la rotation
     * des refresh tokens.
     */

    if (response.data.refresh) {
      sessionStorage.setItem(
        "refresh_token",
        response.data.refresh
      );
    }


    return newAccessToken;

  } catch (error) {
    console.error(
      "Échec du renouvellement du token :",
      error
    );

    return null;
  }
}


/* ============================================================
   IDENTIFICATION DES ROUTES AUTH
   ============================================================ */

function isAuthenticationRequest(
  url?: string
): boolean {

  if (!url) {
    return false;
  }


  return (
    url.includes("/token/") ||
    url.includes("/token/refresh/") ||
    url.includes("/auth/login/") ||
    url.includes("/auth/google/") ||
    url.includes("/auth/register/")
  );
}


/* ============================================================
   INTERCEPTOR RESPONSE
   ============================================================ */

api.interceptors.response.use(

  /*
   * Réponse normale
   */

  (response) => {
    return response;
  },


  /*
   * Erreur API
   */

  async (error: AxiosError) => {

    const originalRequest =
      error.config as
        | (
            InternalAxiosRequestConfig & {
              _retry?: boolean;
            }
          )
        | undefined;


    /*
     * Impossible d'identifier
     * la requête originale.
     */

    if (!originalRequest) {
      return Promise.reject(error);
    }


    /*
     * =========================================================
     * IMPORTANT : ROUTES DE CONNEXION
     * =========================================================
     *
     * Un 401 pendant :
     *
     * POST /token/
     * POST /auth/login/
     * POST /auth/google/
     *
     * signifie que la connexion elle-même
     * a échoué.
     *
     * On NE tente PAS de refresh.
     */

    if (
      isAuthenticationRequest(
        originalRequest.url
      )
    ) {
      return Promise.reject(error);
    }


    /*
     * =========================================================
     * ACCESS TOKEN EXPIRÉ
     * =========================================================
     */

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {

      originalRequest._retry =
        true;


      /*
       * Une seule opération de refresh
       * à la fois.
       */

      if (!refreshPromise) {
        refreshPromise =
          performRefresh().finally(
            () => {
              refreshPromise = null;
            }
          );
      }


      const newAccessToken =
        await refreshPromise;


      /*
       * =======================================================
       * REFRESH RÉUSSI
       * =======================================================
       */

      if (newAccessToken) {

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;


        /*
         * Rejoue la requête qui avait échoué.
         */

        return api(
          originalRequest
        );
      }


      /*
       * =======================================================
       * REFRESH ÉCHOUÉ
       * =======================================================
       */

      clearAuthentication();


      /*
       * Retour vers Login.
       */

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.replace(
          "/login"
        );
      }
    }


    return Promise.reject(error);
  }
);


/* ============================================================
   EXPORT
   ============================================================ */

export default api;
