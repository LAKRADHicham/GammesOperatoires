import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  isAuthenticated,
  login,
} from "../api/auth";

import api from "../api/axios";

import "./Login.css";


/* ============================================================
   TYPES GOOGLE
   ============================================================ */

type GoogleCredentialResponse = {
  credential: string;
  select_by?: string;
};


type GoogleIdConfiguration = {
  client_id: string;

  callback: (
    response: GoogleCredentialResponse,
  ) => void;

  auto_select?: boolean;

  cancel_on_tap_outside?: boolean;
};


type GoogleButtonConfiguration = {
  type?: "standard" | "icon";

  theme?:
    | "outline"
    | "filled_blue"
    | "filled_black";

  size?:
    | "large"
    | "medium"
    | "small";

  text?:
    | "signin_with"
    | "signup_with"
    | "continue_with"
    | "signin";

  shape?:
    | "rectangular"
    | "pill"
    | "circle"
    | "square";

  logo_alignment?:
    | "left"
    | "center";

  width?: number;
};


type GoogleAccountsId = {
  initialize: (
    config: GoogleIdConfiguration,
  ) => void;

  renderButton: (
    parent: HTMLElement,
    options: GoogleButtonConfiguration,
  ) => void;

  disableAutoSelect: () => void;
};


declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}


/* ============================================================
   TYPES API
   ============================================================ */

type AuthUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;

  role?: string | null;
  titre_poste?: string | null;
  corps_metier?: string | null;
  telephone?: string | null;
};


type GoogleLoginResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};


type ApiErrorData = {
  detail?: string;
  message?: string;
};


/* ============================================================
   GOOGLE
   ============================================================ */

const GOOGLE_SCRIPT_ID =
  "google-identity-services";

const GOOGLE_SCRIPT_URL =
  "https://accounts.google.com/gsi/client";


/* ============================================================
   SAUVEGARDE AUTHENTIFICATION GOOGLE
   ============================================================ */

function saveGoogleAuthentication(
  data: GoogleLoginResponse,
) {
  /*
   * IMPORTANT :
   *
   * Les données d'authentification sont stockées
   * dans sessionStorage.
   *
   * Elles survivent à F5 / Ctrl+R,
   * mais sont supprimées lorsque la session
   * du navigateur est fermée.
   */

  sessionStorage.setItem(
    "access_token",
    data.access,
  );

  sessionStorage.setItem(
    "refresh_token",
    data.refresh,
  );

  sessionStorage.setItem(
    "user",
    JSON.stringify(data.user),
  );


  /*
   * Nettoyage des anciens tokens éventuellement
   * laissés dans localStorage par une ancienne
   * version de l'application.
   */

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
   PAGE LOGIN
   ============================================================ */

export default function Login() {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* ==========================================================
     STATES
     ========================================================== */

  /*
   * remembered_username reste volontairement
   * dans localStorage.
   *
   * Cela permet de mémoriser uniquement le nom
   * d'utilisateur sans maintenir la connexion.
   */

  const [
    username,
    setUsername,
  ] = useState(
    localStorage.getItem(
      "remembered_username",
    ) || "",
  );


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    rememberMe,
    setRememberMe,
  ] = useState(
    Boolean(
      localStorage.getItem(
        "remembered_username",
      ),
    ),
  );


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  /* ==========================================================
     GOOGLE BUTTON REF
     ========================================================== */

  const googleButtonRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  /* ==========================================================
     GOOGLE CLIENT ID
     ========================================================== */

  const googleClientId =
    import.meta.env
      .VITE_GOOGLE_CLIENT_ID ||
    "";


  /* ==========================================================
     DESTINATION APRÈS CONNEXION
     ========================================================== */

  const getDestination =
    useCallback((): string => {
      const state =
        location.state as
          | {
              from?: string;
            }
          | null;

      return (
        state?.from ||
        "/dashboard"
      );
    }, [location.state]);


  /* ==========================================================
     UTILISATEUR DÉJÀ CONNECTÉ
     ========================================================== */

  useEffect(() => {
    /*
     * isAuthenticated() utilise maintenant
     * sessionStorage via auth.ts.
     *
     * Si l'access token est encore valide,
     * inutile d'afficher la page de connexion.
     */

    if (isAuthenticated()) {
      navigate(
        "/dashboard",
        {
          replace: true,
        },
      );
    }
  }, [navigate]);


  /* ==========================================================
     GOOGLE CALLBACK
     ========================================================== */

  const handleGoogleCredential =
    useCallback(
      async (
        response:
          GoogleCredentialResponse,
      ) => {
        if (!response.credential) {
          setError(
            "Google n'a pas retourné de jeton d'authentification.",
          );

          return;
        }


        setGoogleLoading(true);
        setError("");


        try {
          /*
           * axios.ts contient déjà le baseURL.
           *
           * En local :
           *
           * http://127.0.0.1:8000/api
           *
           * En production :
           *
           * /api
           *
           * Donc :
           *
           * /auth/google/
           *
           * devient automatiquement :
           *
           * /api/auth/google/
           */

          const result =
            await api.post<GoogleLoginResponse>(
              "/auth/google/",
              {
                credential:
                  response.credential,
              },
            );


          /*
           * Sauvegarde dans sessionStorage.
           */

          saveGoogleAuthentication(
            result.data,
          );


          /*
           * Redirection vers la page
           * initialement demandée ou dashboard.
           */

          navigate(
            getDestination(),
            {
              replace: true,
            },
          );

        } catch (err: unknown) {
          console.error(
            "Erreur connexion Google :",
            err,
          );


          let message =
            "Impossible de se connecter avec Google.";


          if (
            typeof err === "object" &&
            err !== null &&
            "response" in err
          ) {
            const axiosError =
              err as {
                response?: {
                  data?: ApiErrorData;
                };
              };


            message =
              axiosError.response?.data
                ?.detail ||
              axiosError.response?.data
                ?.message ||
              message;
          }


          setError(message);

        } finally {
          setGoogleLoading(false);
        }
      },

      [
        getDestination,
        navigate,
      ],
    );


  /* ==========================================================
     INITIALISATION GOOGLE
     ========================================================== */

  const initializeGoogle =
    useCallback(() => {
      if (
        !window.google ||
        !googleButtonRef.current ||
        !googleClientId
      ) {
        return;
      }


      /*
       * Nettoyage du conteneur avant
       * le rendu du bouton.
       */

      googleButtonRef.current.innerHTML =
        "";


      window.google.accounts.id.initialize(
        {
          client_id:
            googleClientId,

          callback:
            handleGoogleCredential,

          /*
           * IMPORTANT :
           *
           * Google ne doit pas sélectionner
           * automatiquement un compte.
           */

          auto_select:
            false,

          cancel_on_tap_outside:
            true,
        },
      );


      /*
       * Bouton officiel Google.
       */

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type:
            "standard",

          theme:
            "outline",

          size:
            "large",

          text:
            "continue_with",

          shape:
            "rectangular",

          logo_alignment:
            "left",

          width:
            300,
        },
      );

    }, [
      googleClientId,
      handleGoogleCredential,
    ]);


  /* ==========================================================
     CHARGEMENT GOOGLE IDENTITY SERVICES
     ========================================================== */

  useEffect(() => {
    if (!googleClientId) {
      console.error(
        "VITE_GOOGLE_CLIENT_ID n'est pas configuré.",
      );

      return;
    }


    /*
     * Google déjà chargé.
     */

    if (window.google) {
      initializeGoogle();

      return;
    }


    /*
     * Script déjà présent dans la page.
     */

    const existingScript =
      document.getElementById(
        GOOGLE_SCRIPT_ID,
      ) as HTMLScriptElement | null;


    if (existingScript) {
      existingScript.addEventListener(
        "load",
        initializeGoogle,
      );


      return () => {
        existingScript.removeEventListener(
          "load",
          initializeGoogle,
        );
      };
    }


    /*
     * Création du script Google
     * Identity Services.
     */

    const script =
      document.createElement(
        "script",
      );


    script.id =
      GOOGLE_SCRIPT_ID;


    script.src =
      GOOGLE_SCRIPT_URL;


    script.async =
      true;


    script.defer =
      true;


    script.addEventListener(
      "load",
      initializeGoogle,
    );


    script.addEventListener(
      "error",
      () => {
        setError(
          "Impossible de charger le service de connexion Google.",
        );
      },
    );


    document.head.appendChild(
      script,
    );


    return () => {
      script.removeEventListener(
        "load",
        initializeGoogle,
      );
    };

  }, [
    googleClientId,
    initializeGoogle,
  ]);


  /* ==========================================================
     LOGIN CLASSIQUE
     ========================================================== */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError("");


      /* --------------------------------------------------------
         VALIDATION USERNAME
         -------------------------------------------------------- */

      if (!username.trim()) {
        setError(
          "Veuillez saisir votre identifiant.",
        );

        return;
      }


      /* --------------------------------------------------------
         VALIDATION PASSWORD
         -------------------------------------------------------- */

      if (!password) {
        setError(
          "Veuillez saisir votre mot de passe.",
        );

        return;
      }


      setLoading(true);


      try {
        /*
         * login() utilise auth.ts.
         *
         * auth.ts sauvegarde maintenant :
         *
         * access_token
         * refresh_token
         *
         * dans sessionStorage.
         */

        await login(
          username.trim(),
          password,
        );


        /*
         * ======================================================
         * SE SOUVENIR DE MOI
         * ======================================================
         *
         * On conserve uniquement le username.
         *
         * Aucun token n'est conservé ici.
         */

        if (rememberMe) {
          localStorage.setItem(
            "remembered_username",
            username.trim(),
          );

        } else {
          localStorage.removeItem(
            "remembered_username",
          );
        }


        /*
         * ======================================================
         * VÉRIFICATION ACCESS TOKEN
         * ======================================================
         *
         * IMPORTANT :
         *
         * On vérifie maintenant sessionStorage
         * et NON localStorage.
         */

        const accessToken =
          sessionStorage.getItem(
            "access_token",
          );


        if (!accessToken) {
          throw new Error(
            "Le serveur n'a pas retourné de jeton d'accès.",
          );
        }


        /*
         * Connexion réussie.
         */

        navigate(
          getDestination(),
          {
            replace: true,
          },
        );

      } catch (err: unknown) {
        console.error(
          "Erreur connexion :",
          err,
        );


        setError(
          "Identifiant ou mot de passe incorrect.",
        );

      } finally {
        setLoading(false);
      }
    };


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="login-page">

      {/* ======================================================
          PANNEAU GAUCHE
          ====================================================== */}

      <section className="login-brand-panel">

        <div className="login-brand-content">

          {/* LOGO */}

          <div className="login-logo">

            <div className="login-logo-icon">
              🔧
            </div>

            <div>
              <strong>
                Gammes
              </strong>

              <span>
                Maintenance
              </span>
            </div>

          </div>


          {/* INTRO */}

          <div className="login-brand-main">

            <span className="login-brand-badge">
              MAINTENANCE INDUSTRIELLE
            </span>


            <h1>
              Gammes
              <br />
              Maintenance
            </h1>


            <p className="login-brand-description">
              Vos procédures de maintenance
              digitalisées, centralisées et
              accessibles en toute sécurité.
            </p>


            {/* FEATURES */}

            <div className="login-features">

              <div className="login-feature">

                <div className="login-feature-icon">
                  ♨
                </div>

                <div>
                  <strong>
                    Équipements
                  </strong>

                  <span>
                    Gestion centralisée du parc
                  </span>
                </div>

              </div>


              <div className="login-feature">

                <div className="login-feature-icon">
                  ▤
                </div>

                <div>
                  <strong>
                    Gammes opératoires
                  </strong>

                  <span>
                    Procédures et versioning
                  </span>
                </div>

              </div>


              <div className="login-feature">

                <div className="login-feature-icon">
                  ♢
                </div>

                <div>
                  <strong>
                    Sécurité & conformité
                  </strong>

                  <span>
                    EPI, risques et traçabilité
                  </span>
                </div>

              </div>

            </div>

          </div>


          <p className="login-quote">
            « Une maintenance plus sûre,
            plus simple et plus efficace. »
          </p>

        </div>

      </section>


      {/* ======================================================
          PANNEAU DROIT
          ====================================================== */}

      <section className="login-form-panel">

        <div className="login-card">

          {/* HEADER */}

          <div className="login-card-header">

            <div className="login-lock-icon">
              <LockKeyhole size={22} />
            </div>


            <div>

              <h2>
                Connexion
              </h2>

              <p>
                Accédez à votre espace
                de travail
              </p>

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          {/* FORMULAIRE */}

          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* USERNAME */}

            <div className="login-field">

              <label
                htmlFor="username"
              >
                Utilisateur
              </label>


              <div className="login-input-wrapper">

                <User
                  size={17}
                  className="login-input-icon"
                />


                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}

                  onChange={(event) =>
                    setUsername(
                      event.target.value,
                    )
                  }

                  placeholder="Votre identifiant"

                  disabled={
                    loading ||
                    googleLoading
                  }
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="login-field">

              <label
                htmlFor="password"
              >
                Mot de passe
              </label>


              <div className="login-input-wrapper">

                <LockKeyhole
                  size={17}
                  className="login-input-icon"
                />


                <input
                  id="password"

                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }

                  autoComplete="current-password"

                  value={password}

                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }

                  placeholder="Votre mot de passe"

                  disabled={
                    loading ||
                    googleLoading
                  }
                />


                <button
                  type="button"

                  className="login-password-toggle"

                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous,
                    )
                  }

                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>

              </div>

            </div>


            {/* REMEMBER USERNAME */}

            <label className="login-remember">

              <input
                type="checkbox"

                checked={
                  rememberMe
                }

                onChange={(event) =>
                  setRememberMe(
                    event.target.checked,
                  )
                }
              />


              <span>
                Se souvenir de moi
              </span>

            </label>


            {/* LOGIN BUTTON */}

            <button
              type="submit"

              className="login-submit"

              disabled={
                loading ||
                googleLoading
              }
            >

              {loading
                ? "Connexion..."
                : "Se connecter"}


              {!loading && (
                <span>
                  →
                </span>
              )}

            </button>

          </form>


          {/* ==================================================
              SÉPARATEUR
              ================================================== */}

          <div className="login-separator">

            <span />

            <p>
              ou
            </p>

            <span />

          </div>


          {/* ==================================================
              GOOGLE
              ================================================== */}

          <div className="login-google-section">

            {!googleClientId ? (

              <div className="login-google-error">
                Connexion Google non configurée.
              </div>

            ) : (

              <>
                <div
                  ref={
                    googleButtonRef
                  }

                  className="login-google-button"
                />


                {googleLoading && (
                  <p className="login-google-loading">
                    Connexion Google en cours...
                  </p>
                )}
              </>

            )}

          </div>


          {/* ==================================================
              FOOTER
              ================================================== */}

          <div className="login-security">

            <ShieldCheck
              size={15}
            />

            <span>
              Connexion sécurisée par JWT
            </span>

          </div>

        </div>

      </section>

    </div>
  );
}
