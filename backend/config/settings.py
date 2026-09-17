# ============================================================
# DJANGO SETTINGS
# ============================================================

import os

from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# CHARGEMENT DU FICHIER .env
# ============================================================

load_dotenv(
    BASE_DIR / ".env"
)


# ============================================================
# SÉCURITÉ DJANGO
# ============================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-development-key",
)


DEBUG = (
    os.getenv(
        "DEBUG",
        "True",
    ).lower()
    ==
    "true"
)


# ============================================================
# HOSTS
# ============================================================

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
]


# Permet d'ajouter des hosts depuis .env :
#
# ALLOWED_HOSTS=127.0.0.1,localhost,mon-domaine.com

extra_allowed_hosts = os.getenv(
    "ALLOWED_HOSTS",
    "",
)

if extra_allowed_hosts:

    for host in extra_allowed_hosts.split(","):

        host = host.strip()

        if (
            host
            and
            host not in ALLOWED_HOSTS
        ):
            ALLOWED_HOSTS.append(
                host
            )


# ============================================================
# GOOGLE OAUTH
# ============================================================

GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "",
)


# ============================================================
# APPLICATIONS
# ============================================================

INSTALLED_APPS = [

    # --------------------------------------------------------
    # DJANGO
    # --------------------------------------------------------

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",


    # --------------------------------------------------------
    # API
    # --------------------------------------------------------

    "rest_framework",

    "rest_framework_simplejwt",


    # --------------------------------------------------------
    # CORS
    # --------------------------------------------------------

    "corsheaders",


    # --------------------------------------------------------
    # APPLICATION
    # --------------------------------------------------------

    "gammes_maintenance.apps.GammesMaintenanceConfig",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [

    "django.middleware.security.SecurityMiddleware",


    # --------------------------------------------------------
    # CORS
    # Doit être placé avant CommonMiddleware.
    # --------------------------------------------------------

    "corsheaders.middleware.CorsMiddleware",


    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URLS
# ============================================================

ROOT_URLCONF = "config.urls"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND":
            "django.template.backends.django.DjangoTemplates",

        "DIRS":
            [],

        "APP_DIRS":
            True,

        "OPTIONS": {
            "context_processors": [

                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# WSGI
# ============================================================

WSGI_APPLICATION = "config.wsgi.application"


# ============================================================
# BASE DE DONNÉES POSTGRESQL / SUPABASE
# ============================================================

DATABASES = {

    "default": {

        "ENGINE":
            "django.db.backends.postgresql",

        "NAME":
            os.getenv(
                "DB_NAME",
                "postgres",
            ),

        "USER":
            os.getenv(
                "DB_USER",
                "postgres",
            ),

        "PASSWORD":
            os.getenv(
                "DB_PASSWORD",
                "",
            ),

        "HOST":
            os.getenv(
                "DB_HOST",
                "localhost",
            ),

        "PORT":
            os.getenv(
                "DB_PORT",
                "5432",
            ),

        # ----------------------------------------------------
        # Important avec Supabase Pooler :
        # évite de conserver inutilement les connexions
        # pendant le développement.
        # ----------------------------------------------------

        "CONN_MAX_AGE":
            int(
                os.getenv(
                    "DB_CONN_MAX_AGE",
                    "0",
                )
            ),

        "OPTIONS": {

            "sslmode":
                os.getenv(
                    "DB_SSLMODE",
                    "require",
                ),
        },
    },
}


# ============================================================
# VALIDATION DES MOTS DE PASSE
# ============================================================

AUTH_PASSWORD_VALIDATORS = [

    {
        "NAME":
            "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation.MinimumLengthValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation.CommonPasswordValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# ============================================================
# INTERNATIONALISATION
# ============================================================

LANGUAGE_CODE = "fr-fr"

TIME_ZONE = "Europe/Paris"

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC
# ============================================================

STATIC_URL = "static/"


# ============================================================
# MEDIA
# ============================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ============================================================
# PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = (
    "django.db.models.BigAutoField"
)


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {

    # --------------------------------------------------------
    # JWT
    # --------------------------------------------------------

    "DEFAULT_AUTHENTICATION_CLASSES": (

        "rest_framework_simplejwt.authentication.JWTAuthentication",

    ),


    # --------------------------------------------------------
    # Par défaut les API nécessitent une authentification.
    #
    # register / login / google utilisent AllowAny
    # directement dans auth_views.py.
    # --------------------------------------------------------

    "DEFAULT_PERMISSION_CLASSES": (

        "rest_framework.permissions.IsAuthenticated",

    ),


    # --------------------------------------------------------
    # JSON
    # --------------------------------------------------------

    "DEFAULT_RENDERER_CLASSES": (

        "rest_framework.renderers.JSONRenderer",

    ),


    "DEFAULT_PARSER_CLASSES": (

        "rest_framework.parsers.JSONParser",

        "rest_framework.parsers.FormParser",

        "rest_framework.parsers.MultiPartParser",

    ),
}


# ============================================================
# SIMPLE JWT
# ============================================================

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME":
        timedelta(
            minutes=60
        ),

    "REFRESH_TOKEN_LIFETIME":
        timedelta(
            days=7
        ),

    "ROTATE_REFRESH_TOKENS":
        True,

    "BLACKLIST_AFTER_ROTATION":
        False,

    "AUTH_HEADER_TYPES": (
        "Bearer",
    ),
}


# ============================================================
# CORS - FRONTEND REACT / VITE
# ============================================================

CORS_ALLOWED_ORIGINS = [

    "http://localhost:5173",

    "http://127.0.0.1:5173",

]


# ============================================================
# CORS - VERCEL
# ============================================================

CORS_ALLOWED_ORIGIN_REGEXES = [

    r"^https://.*\.vercel\.app$",

]


# ============================================================
# CSRF
# ============================================================

CSRF_TRUSTED_ORIGINS = [

    "http://localhost:5173",

    "http://127.0.0.1:5173",

]


# ============================================================
# AJOUT DES ORIGINES DEPUIS .env
#
# Exemple :
#
# CORS_ALLOWED_ORIGINS=https://mon-site.com
# CSRF_TRUSTED_ORIGINS=https://mon-site.com
# ============================================================

extra_cors_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "",
)


if extra_cors_origins:

    for origin in extra_cors_origins.split(","):

        origin = origin.strip()

        if (
            origin
            and
            origin not in CORS_ALLOWED_ORIGINS
        ):

            CORS_ALLOWED_ORIGINS.append(
                origin
            )


extra_csrf_origins = os.getenv(
    "CSRF_TRUSTED_ORIGINS",
    "",
)


if extra_csrf_origins:

    for origin in extra_csrf_origins.split(","):

        origin = origin.strip()

        if (
            origin
            and
            origin not in CSRF_TRUSTED_ORIGINS
        ):

            CSRF_TRUSTED_ORIGINS.append(
                origin
            )


# ============================================================
# TAILLE DES UPLOADS
# ============================================================

DATA_UPLOAD_MAX_MEMORY_SIZE = (
    10 * 1024 * 1024
)

FILE_UPLOAD_MAX_MEMORY_SIZE = (
    10 * 1024 * 1024
)