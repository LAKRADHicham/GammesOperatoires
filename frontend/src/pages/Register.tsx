import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../api/axios";

import "../styles/Auth.css";


/* ============================================================
   TYPES
   ============================================================ */

type UserData = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
};


type AuthResponse = {
  access: string;
  refresh: string;
  created?: boolean;
  user: UserData;
};


type GoogleCredentialResponse = {
  credential: string;
  select_by?: string;
};


/* ============================================================
   GOOGLE GLOBAL
   ============================================================ */

/* ============================================================
   CONSTANTES GOOGLE
   ============================================================ */

const GOOGLE_SCRIPT_ID =
  "google-identity-services";


const GOOGLE_SCRIPT_URL =
  "https://accounts.google.com/gsi/client";


/* ============================================================
   FORMATAGE DES ERREURS
   ============================================================ */

function formatApiError(
  data: unknown
): string {

  if (!data) {

    return "Une erreur est survenue.";

  }


  if (
    typeof data === "string"
  ) {

    return data;

  }


  if (
    Array.isArray(data)
  ) {

    return data
      .map(formatApiError)
      .filter(Boolean)
      .join(" ");

  }


  if (
    typeof data === "object"
  ) {

    const objectData =
      data as Record<
        string,
        unknown
      >;


    return Object.values(
      objectData
    )
      .map(formatApiError)
      .filter(Boolean)
      .join(" ");

  }


  return String(data);

}


/* ============================================================
   ENREGISTREMENT JWT
   ============================================================ */

function saveAuthentication(
  data: AuthResponse
) {

  if (
    !data.access ||
    !data.refresh
  ) {

    throw new Error(
      "Les jetons JWT sont absents de la réponse."
    );

  }


  localStorage.setItem(
    "access_token",
    data.access
  );


  localStorage.setItem(
    "refresh_token",
    data.refresh
  );


  localStorage.setItem(
    "user",
    JSON.stringify(
      data.user
    )
  );

}


/* ============================================================
   PAGE INSCRIPTION
   ============================================================ */

export default function Register() {

  const navigate =
    useNavigate();


  const googleButtonRef =
    useRef<HTMLDivElement | null>(
      null
    );


  /* ==========================================================
     FORMULAIRE
     ========================================================== */

  const [
    firstName,
    setFirstName,
  ] = useState("");


  const [
    lastName,
    setLastName,
  ] = useState("");


  const [
    email,
    setEmail,
  ] = useState("");


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    passwordConfirm,
    setPasswordConfirm,
  ] = useState("");


  /* ==========================================================
     ÉTAT
     ========================================================== */

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
     CLIENT ID GOOGLE
     ========================================================== */

  const googleClientId =
    import.meta.env
      .VITE_GOOGLE_CLIENT_ID as
      | string
      | undefined;


  /* ==========================================================
     CALLBACK GOOGLE
     ========================================================== */

  const handleGoogleCredential =
    useCallback(

      async (
        response:
          GoogleCredentialResponse
      ) => {

        /* ----------------------------------------------------
           Vérification credential
           ---------------------------------------------------- */

        if (
          !response.credential
        ) {

          setError(
            "Google n'a pas retourné de jeton d'identification."
          );

          return;

        }


        try {

          setGoogleLoading(
            true
          );


          setError("");


          /* --------------------------------------------------
             Envoi du token Google vers Django

             axios.ts contient déjà /api dans baseURL.

             URL finale :
             /api/auth/google/
             -------------------------------------------------- */

          const apiResponse =
            await api.post<AuthResponse>(
              "/auth/google/",
              {
                credential:
                  response.credential,
              }
            );


          /* --------------------------------------------------
             Enregistrement JWT
             -------------------------------------------------- */

          saveAuthentication(
            apiResponse.data
          );


          /* --------------------------------------------------
             Redirection
             -------------------------------------------------- */

          navigate(
            "/dashboard",
            {
              replace: true,
            }
          );


        } catch (err: unknown) {

          console.error(
            "Erreur connexion Google :",
            err
          );


          let apiData:
            unknown = null;


          if (
            typeof err === "object" &&
            err !== null &&
            "response" in err
          ) {

            const axiosError =
              err as {
                response?: {
                  data?: unknown;
                };
              };


            apiData =
              axiosError
                .response
                ?.data;

          }


          if (apiData) {

            setError(
              formatApiError(
                apiData
              )
            );

          } else if (
            err instanceof Error
          ) {

            setError(
              err.message
            );

          } else {

            setError(
              "Connexion Google impossible."
            );

          }

        } finally {

          setGoogleLoading(
            false
          );

        }

      },

      [
        navigate,
      ]

    );


  /* ==========================================================
     INITIALISATION GOOGLE IDENTITY SERVICES
     ========================================================== */

  useEffect(() => {

    /* --------------------------------------------------------
       Vérification Client ID
       -------------------------------------------------------- */

    if (
      !googleClientId
    ) {

      setError(
        "VITE_GOOGLE_CLIENT_ID n'est pas configuré."
      );

      return;

    }


    let cancelled =
      false;


    /* --------------------------------------------------------
       Initialisation Google
       -------------------------------------------------------- */

    const initializeGoogle =
      () => {

        if (
          cancelled ||
          !window.google ||
          !googleButtonRef.current
        ) {

          return;

        }


        /* ----------------------------------------------------
           Configuration Google Identity Services
           ---------------------------------------------------- */

        window.google.accounts.id.initialize(
          {
            client_id:
              googleClientId,

            callback:
              handleGoogleCredential,

            auto_select:
              false,

            cancel_on_tap_outside:
              true,
          }
        );


        /* ----------------------------------------------------
           Nettoyage éventuel du bouton précédent
           ---------------------------------------------------- */

        googleButtonRef.current.innerHTML =
          "";


        /* ----------------------------------------------------
           Bouton officiel Google
           ---------------------------------------------------- */

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
              345,
          }
        );

      };


    /* --------------------------------------------------------
       Vérifier si le script existe déjà
       -------------------------------------------------------- */

    const existingScript =
      document.getElementById(
        GOOGLE_SCRIPT_ID
      ) as HTMLScriptElement | null;


    if (
      existingScript
    ) {

      /* ------------------------------------------------------
         Google déjà chargé
         ------------------------------------------------------ */

      if (
        window.google
      ) {

        initializeGoogle();

      } else {

        /* ----------------------------------------------------
           Script présent mais pas encore chargé
           ---------------------------------------------------- */

        existingScript.addEventListener(
          "load",
          initializeGoogle
        );

      }


      return () => {

        cancelled =
          true;


        existingScript.removeEventListener(
          "load",
          initializeGoogle
        );

      };

    }


    /* --------------------------------------------------------
       Création du script Google
       -------------------------------------------------------- */

    const script =
      document.createElement(
        "script"
      );


    script.id =
      GOOGLE_SCRIPT_ID;


    script.src =
      GOOGLE_SCRIPT_URL;


    script.async =
      true;


    script.defer =
      true;


    /* --------------------------------------------------------
       Google chargé
       -------------------------------------------------------- */

    script.addEventListener(
      "load",
      initializeGoogle
    );


    /* --------------------------------------------------------
       Erreur de chargement
       -------------------------------------------------------- */

    const handleScriptError =
      () => {

        if (
          !cancelled
        ) {

          setError(
            "Impossible de charger le service de connexion Google."
          );

        }

      };


    script.addEventListener(
      "error",
      handleScriptError
    );


    /* --------------------------------------------------------
       Ajout du script
       -------------------------------------------------------- */

    document.head.appendChild(
      script
    );


    /* --------------------------------------------------------
       CLEANUP
       -------------------------------------------------------- */

    return () => {

      cancelled =
        true;


      script.removeEventListener(
        "load",
        initializeGoogle
      );


      script.removeEventListener(
        "error",
        handleScriptError
      );

    };

  }, [
    googleClientId,
    handleGoogleCredential,
  ]);


  /* ==========================================================
     INSCRIPTION CLASSIQUE
     ========================================================== */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      setError("");


      /* ------------------------------------------------------
         Vérification mot de passe
         ------------------------------------------------------ */

      if (
        password !==
        passwordConfirm
      ) {

        setError(
          "Les mots de passe ne correspondent pas."
        );

        return;

      }


      /* ------------------------------------------------------
         Longueur mot de passe
         ------------------------------------------------------ */

      if (
        password.length < 8
      ) {

        setError(
          "Le mot de passe doit contenir au moins 8 caractères."
        );

        return;

      }


      try {

        setLoading(
          true
        );


        /* ----------------------------------------------------
           Inscription Django
           ---------------------------------------------------- */

        const response =
          await api.post<AuthResponse>(
            "/auth/register/",
            {
              first_name:
                firstName.trim(),

              last_name:
                lastName.trim(),

              email:
                email
                  .trim()
                  .toLowerCase(),

              password,

              password_confirm:
                passwordConfirm,
            }
          );


        /* ----------------------------------------------------
           Sauvegarde JWT
           ---------------------------------------------------- */

        saveAuthentication(
          response.data
        );


        /* ----------------------------------------------------
           Après inscription classique :
           profil utilisateur
           ---------------------------------------------------- */

        navigate(
          "/profil",
          {
            replace: true,
          }
        );


      } catch (err: unknown) {

        console.error(
          "Erreur inscription :",
          err
        );


        let apiData:
          unknown = null;


        if (
          typeof err === "object" &&
          err !== null &&
          "response" in err
        ) {

          const axiosError =
            err as {
              response?: {
                data?: unknown;
              };
            };


          apiData =
            axiosError
              .response
              ?.data;

        }


        if (
          apiData
        ) {

          setError(
            formatApiError(
              apiData
            )
          );

        } else if (
          err instanceof Error
        ) {

          setError(
            err.message
          );

        } else {

          setError(
            "Impossible de créer le compte."
          );

        }


      } finally {

        setLoading(
          false
        );

      }

    };


  /* ==========================================================
     INTERFACE
     ========================================================== */

  return (

    <div
      className="auth-page"
    >

      <div
        className="auth-card"
      >


        {/* ====================================================
            LOGO / TITRE
            ==================================================== */}

        <div
          className="auth-logo"
        >
          Gammes Maintenance
        </div>


        <h1>
          Créer un compte
        </h1>


        <p>
          Créez votre compte pour accéder
          à l'application.
        </p>


        {/* ====================================================
            ERREUR
            ==================================================== */}

        {
          error && (

            <div
              className="auth-error"
              role="alert"
            >
              {error}
            </div>

          )
        }


        {/* ====================================================
            FORMULAIRE
            ==================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* --------------------------------------------------
              PRÉNOM / NOM
              -------------------------------------------------- */}

          <div
            className="auth-row"
          >


            <div
              className="auth-field"
            >

              <label
                htmlFor="register-first-name"
              >
                Prénom
              </label>


              <input
                id="register-first-name"
                type="text"
                value={firstName}
                onChange={
                  (event) =>
                    setFirstName(
                      event.target.value
                    )
                }
                autoComplete="given-name"
                disabled={
                  loading ||
                  googleLoading
                }
                required
              />

            </div>


            <div
              className="auth-field"
            >

              <label
                htmlFor="register-last-name"
              >
                Nom
              </label>


              <input
                id="register-last-name"
                type="text"
                value={lastName}
                onChange={
                  (event) =>
                    setLastName(
                      event.target.value
                    )
                }
                autoComplete="family-name"
                disabled={
                  loading ||
                  googleLoading
                }
                required
              />

            </div>


          </div>


          {/* --------------------------------------------------
              EMAIL
              -------------------------------------------------- */}

          <div
            className="auth-field"
          >

            <label
              htmlFor="register-email"
            >
              Adresse e-mail
            </label>


            <input
              id="register-email"
              type="email"
              value={email}
              onChange={
                (event) =>
                  setEmail(
                    event.target.value
                  )
              }
              autoComplete="email"
              placeholder="nom@entreprise.com"
              disabled={
                loading ||
                googleLoading
              }
              required
            />

          </div>


          {/* --------------------------------------------------
              MOT DE PASSE
              -------------------------------------------------- */}

          <div
            className="auth-field"
          >

            <label
              htmlFor="register-password"
            >
              Mot de passe
            </label>


            <input
              id="register-password"
              type="password"
              value={password}
              onChange={
                (event) =>
                  setPassword(
                    event.target.value
                  )
              }
              autoComplete="new-password"
              minLength={8}
              disabled={
                loading ||
                googleLoading
              }
              required
            />

          </div>


          {/* --------------------------------------------------
              CONFIRMATION
              -------------------------------------------------- */}

          <div
            className="auth-field"
          >

            <label
              htmlFor="register-password-confirm"
            >
              Confirmer le mot de passe
            </label>


            <input
              id="register-password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={
                (event) =>
                  setPasswordConfirm(
                    event.target.value
                  )
              }
              autoComplete="new-password"
              minLength={8}
              disabled={
                loading ||
                googleLoading
              }
              required
            />

          </div>


          {/* --------------------------------------------------
              CRÉATION
              -------------------------------------------------- */}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading ||
              googleLoading
            }
          >

            {
              loading
                ? "Création..."
                : "Créer mon compte"
            }

          </button>


        </form>


        {/* ====================================================
            SÉPARATEUR
            ==================================================== */}

        <div
          className="auth-separator"
        >

          <span>
            ou
          </span>

        </div>


        {/* ====================================================
            GOOGLE
            ==================================================== */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "center",

            alignItems:
              "center",

            width:
              "100%",

            minHeight:
              44,

            opacity:
              googleLoading
                ? 0.6
                : 1,

            pointerEvents:
              googleLoading
                ? "none"
                : "auto",
          }}
        >

          <div
            ref={
              googleButtonRef
            }
          />

        </div>


        {
          googleLoading && (

            <p
              style={{
                textAlign:
                  "center",

                marginTop:
                  10,

                fontSize:
                  12,
              }}
            >
              Connexion Google...
            </p>

          )
        }


        {/* ====================================================
            CONNEXION
            ==================================================== */}

        <div
          className="auth-footer"
        >

          Déjà un compte ?{" "}

          <Link
            to="/login"
          >
            Se connecter
          </Link>

        </div>


      </div>

    </div>

  );

}