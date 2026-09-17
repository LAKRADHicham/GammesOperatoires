import re

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import connection, transaction

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


# ============================================================
# PROFIL UTILISATEUR
# ============================================================

DEFAULT_ROLE = "redacteur"


def create_profile_if_missing(user_id: int) -> None:
    """
    Crée automatiquement un profil professionnel pour
    l'utilisateur s'il n'en possède pas encore.

    Tous les nouveaux utilisateurs ont le rôle 'redacteur'.
    Le frontend affiche ce rôle sous le libellé 'Éditeur'.
    """

    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO profils_utilisateurs (
                user_id,
                role,
                actif,
                created_at,
                updated_at
            )
            VALUES (
                %s,
                %s,
                TRUE,
                NOW(),
                NOW()
            )
            ON CONFLICT (user_id)
            DO NOTHING
            """,
            [
                user_id,
                DEFAULT_ROLE,
            ],
        )


def get_professional_profile(user_id: int) -> dict:
    """
    Retourne les informations professionnelles
    d'un utilisateur.
    """

    create_profile_if_missing(user_id)

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                titre_poste,
                corps_metier,
                telephone,
                role,
                actif
            FROM profils_utilisateurs
            WHERE user_id = %s
            LIMIT 1
            """,
            [user_id],
        )

        row = cursor.fetchone()

    if not row:
        return {
            "titre_poste": None,
            "corps_metier": None,
            "telephone": None,
            "role": DEFAULT_ROLE,
            "actif": True,
        }

    return {
        "titre_poste": row[0],
        "corps_metier": row[1],
        "telephone": row[2],
        "role": row[3] or DEFAULT_ROLE,
        "actif": row[4],
    }


# ============================================================
# JWT
# ============================================================

def create_jwt_tokens(user: User) -> dict:
    """
    Génère les tokens SimpleJWT.
    """

    refresh = RefreshToken.for_user(user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ============================================================
# SERIALISATION UTILISATEUR
# ============================================================

def serialize_user(user: User) -> dict:
    """
    Retourne les informations complètes de l'utilisateur
    avec son profil professionnel.
    """

    professional = get_professional_profile(user.id)

    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,

        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_active": user.is_active,

        "titre_poste": professional["titre_poste"],
        "corps_metier": professional["corps_metier"],
        "telephone": professional["telephone"],
        "role": professional["role"],
    }


# ============================================================
# USERNAME AUTOMATIQUE
# ============================================================

def generate_unique_username(email: str) -> str:
    """
    Génère automatiquement un username unique
    depuis l'adresse email.
    """

    base = email.split("@")[0]

    base = re.sub(
        r"[^a-zA-Z0-9._-]",
        "",
        base,
    )

    if not base:
        base = "utilisateur"

    username = base
    counter = 1

    while User.objects.filter(
        username=username
    ).exists():

        username = f"{base}{counter}"
        counter += 1

    return username


# ============================================================
# INSCRIPTION CLASSIQUE
# POST /api/auth/register/
# ============================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):

    first_name = str(
        request.data.get(
            "first_name",
            "",
        )
    ).strip()

    last_name = str(
        request.data.get(
            "last_name",
            "",
        )
    ).strip()

    email = str(
        request.data.get(
            "email",
            "",
        )
    ).strip().lower()

    password = str(
        request.data.get(
            "password",
            "",
        )
    )

    # --------------------------------------------------------
    # VALIDATION EMAIL
    # --------------------------------------------------------

    if not email:
        return Response(
            {
                "detail":
                    "L'adresse e-mail est obligatoire."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # VALIDATION PASSWORD
    # --------------------------------------------------------

    if not password:
        return Response(
            {
                "detail":
                    "Le mot de passe est obligatoire."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # EMAIL EXISTANT
    # --------------------------------------------------------

    if User.objects.filter(
        email__iexact=email
    ).exists():

        return Response(
            {
                "detail":
                    "Un compte existe déjà avec cette adresse e-mail."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # VALIDATION PASSWORD DJANGO
    # --------------------------------------------------------

    try:
        validate_password(password)

    except ValidationError as exc:

        return Response(
            {
                "password":
                    list(exc.messages)
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    username = generate_unique_username(
        email
    )

    # --------------------------------------------------------
    # CRÉATION
    # --------------------------------------------------------

    with transaction.atomic():

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        create_profile_if_missing(
            user.id
        )

    tokens = create_jwt_tokens(user)

    return Response(
        {
            **tokens,
            "user": serialize_user(user),
        },
        status=status.HTTP_201_CREATED,
    )


# ============================================================
# LOGIN CLASSIQUE
# POST /api/auth/login/
# ============================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):

    identifier = str(
        request.data.get(
            "email",
            request.data.get(
                "username",
                "",
            ),
        )
    ).strip()

    password = str(
        request.data.get(
            "password",
            "",
        )
    )

    if not identifier or not password:

        return Response(
            {
                "detail":
                    "Identifiant et mot de passe obligatoires."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = None

    # --------------------------------------------------------
    # ESSAI AVEC EMAIL
    # --------------------------------------------------------

    email_user = User.objects.filter(
        email__iexact=identifier
    ).first()

    if email_user:

        user = authenticate(
            username=email_user.username,
            password=password,
        )

    # --------------------------------------------------------
    # ESSAI AVEC USERNAME
    # --------------------------------------------------------

    if user is None:

        user = authenticate(
            username=identifier,
            password=password,
        )

    # --------------------------------------------------------
    # IDENTIFIANTS INCORRECTS
    # --------------------------------------------------------

    if user is None:

        return Response(
            {
                "detail":
                    "Identifiant ou mot de passe incorrect."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # --------------------------------------------------------
    # COMPTE INACTIF
    # --------------------------------------------------------

    if not user.is_active:

        return Response(
            {
                "detail":
                    "Ce compte utilisateur est désactivé."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    create_profile_if_missing(
        user.id
    )

    tokens = create_jwt_tokens(user)

    return Response(
        {
            **tokens,
            "user": serialize_user(user),
        },
        status=status.HTTP_200_OK,
    )


# ============================================================
# GOOGLE LOGIN
# POST /api/auth/google/
# ============================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):

    credential = request.data.get(
        "credential"
    )

    if not credential:

        return Response(
            {
                "detail":
                    "Le jeton Google est obligatoire."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # GOOGLE CLIENT ID
    # --------------------------------------------------------

    google_client_id = getattr(
        settings,
        "GOOGLE_CLIENT_ID",
        "",
    )

    if not google_client_id:

        return Response(
            {
                "detail":
                    "GOOGLE_CLIENT_ID n'est pas configuré sur le serveur."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # --------------------------------------------------------
    # VÉRIFICATION TOKEN GOOGLE
    # --------------------------------------------------------

    try:

        google_data = (
            id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                google_client_id,
            )
        )

    except ValueError:

        return Response(
            {
                "detail":
                    "Le jeton Google est invalide."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    except Exception as exc:

        print(
            "Erreur Google OAuth :",
            exc,
        )

        return Response(
            {
                "detail":
                    "Impossible de vérifier le compte Google."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # --------------------------------------------------------
    # INFORMATIONS GOOGLE
    # --------------------------------------------------------

    email = str(
        google_data.get(
            "email",
            "",
        )
    ).strip().lower()

    email_verified = google_data.get(
        "email_verified",
        False,
    )

    first_name = str(
        google_data.get(
            "given_name",
            "",
        )
    ).strip()

    last_name = str(
        google_data.get(
            "family_name",
            "",
        )
    ).strip()

    # --------------------------------------------------------
    # EMAIL
    # --------------------------------------------------------

    if not email:

        return Response(
            {
                "detail":
                    "Google n'a pas retourné d'adresse e-mail."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # EMAIL VÉRIFIÉ
    # --------------------------------------------------------

    if not email_verified:

        return Response(
            {
                "detail":
                    "L'adresse e-mail Google n'est pas vérifiée."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # --------------------------------------------------------
    # CRÉATION / RÉCUPÉRATION UTILISATEUR
    # --------------------------------------------------------

    try:

        with transaction.atomic():

            user = User.objects.filter(
                email__iexact=email
            ).first()

            # ------------------------------------------------
            # NOUVEAU COMPTE
            # ------------------------------------------------

            if user is None:

                username = (
                    generate_unique_username(
                        email
                    )
                )

                user = User.objects.create(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                )

                user.set_unusable_password()

                user.save()

            # ------------------------------------------------
            # COMPTE EXISTANT
            # ------------------------------------------------

            else:

                changed_fields = []

                if (
                    not user.first_name
                    and first_name
                ):
                    user.first_name = first_name
                    changed_fields.append(
                        "first_name"
                    )

                if (
                    not user.last_name
                    and last_name
                ):
                    user.last_name = last_name
                    changed_fields.append(
                        "last_name"
                    )

                if changed_fields:
                    user.save(
                        update_fields=
                            changed_fields
                    )

            # ------------------------------------------------
            # PROFIL PROFESSIONNEL
            # ------------------------------------------------

            create_profile_if_missing(
                user.id
            )

    except Exception as exc:

        print(
            "Erreur création compte Google :",
            exc,
        )

        return Response(
            {
                "detail":
                    "Impossible de connecter le compte Google."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # --------------------------------------------------------
    # COMPTE ACTIF
    # --------------------------------------------------------

    if not user.is_active:

        return Response(
            {
                "detail":
                    "Ce compte utilisateur est désactivé."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # --------------------------------------------------------
    # JWT
    # --------------------------------------------------------

    tokens = create_jwt_tokens(user)

    return Response(
        {
            **tokens,
            "user": serialize_user(user),
        },
        status=status.HTTP_200_OK,
    )


# ============================================================
# MON PROFIL
#
# GET   /api/me/
# PATCH /api/me/
# ============================================================

@api_view([
    "GET",
    "PATCH",
])
@permission_classes([
    IsAuthenticated,
])
def me(request):

    user = request.user

    create_profile_if_missing(
        user.id
    )

    # ========================================================
    # GET
    # ========================================================

    if request.method == "GET":

        return Response(
            serialize_user(user),
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # PATCH
    # ========================================================

    first_name = request.data.get(
        "first_name",
        user.first_name,
    )

    last_name = request.data.get(
        "last_name",
        user.last_name,
    )

    titre_poste = request.data.get(
        "titre_poste"
    )

    corps_metier = request.data.get(
        "corps_metier"
    )

    telephone = request.data.get(
        "telephone"
    )

    # --------------------------------------------------------
    # NETTOYAGE
    # --------------------------------------------------------

    first_name = (
        str(first_name).strip()
        if first_name is not None
        else ""
    )

    last_name = (
        str(last_name).strip()
        if last_name is not None
        else ""
    )

    titre_poste = (
        str(titre_poste).strip()
        if titre_poste
        else None
    )

    corps_metier = (
        str(corps_metier).strip()
        if corps_metier
        else None
    )

    telephone = (
        str(telephone).strip()
        if telephone
        else None
    )

    # --------------------------------------------------------
    # SAUVEGARDE
    # --------------------------------------------------------

    with transaction.atomic():

        # ----------------------------------------------------
        # DJANGO USER
        # ----------------------------------------------------

        user.first_name = first_name
        user.last_name = last_name

        user.save(
            update_fields=[
                "first_name",
                "last_name",
            ]
        )

        # ----------------------------------------------------
        # PROFIL PROFESSIONNEL
        #
        # Le rôle n'est PAS modifiable depuis cette route.
        # ----------------------------------------------------

        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE profils_utilisateurs
                SET
                    titre_poste = %s,
                    corps_metier = %s,
                    telephone = %s,
                    updated_at = NOW()
                WHERE user_id = %s
                """,
                [
                    titre_poste,
                    corps_metier,
                    telephone,
                    user.id,
                ],
            )

    # --------------------------------------------------------
    # RÉPONSE ACTUALISÉE
    # --------------------------------------------------------

    return Response(
        serialize_user(user),
        status=status.HTTP_200_OK,
    )