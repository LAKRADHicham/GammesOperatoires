from django.db import connection

from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)


# ============================================================
# RÔLES
# ============================================================

ROLE_ADMIN = "administrateur"
ROLE_EDITOR = "redacteur"
ROLE_VALIDATOR = "validateur"
ROLE_READER = "lecteur"


# ============================================================
# RÉCUPÉRATION DU RÔLE
# ============================================================

def role_of(user):
    """
    Retourne le rôle applicatif de l'utilisateur.

    Les rôles sont stockés dans la table :
        profils_utilisateurs

    Tous les utilisateurs standards sont actuellement
    considérés comme Éditeurs / redacteur.
    """

    if (
        not user
        or not user.is_authenticated
    ):
        return None

    # --------------------------------------------------------
    # SUPERUSER DJANGO
    # --------------------------------------------------------

    if user.is_superuser:
        return ROLE_ADMIN

    # --------------------------------------------------------
    # PROFIL PROFESSIONNEL
    # --------------------------------------------------------

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    role,
                    actif
                FROM profils_utilisateurs
                WHERE user_id = %s
                LIMIT 1
                """,
                [
                    user.id,
                ],
            )

            row = cursor.fetchone()

    except Exception:
        return None

    # --------------------------------------------------------
    # AUCUN PROFIL
    # --------------------------------------------------------

    if not row:
        return ROLE_EDITOR

    role = row[0]
    actif = row[1]

    # --------------------------------------------------------
    # PROFIL DÉSACTIVÉ
    # --------------------------------------------------------

    if actif is False:
        return None

    # --------------------------------------------------------
    # RÔLE VIDE
    # --------------------------------------------------------

    if not role:
        return ROLE_EDITOR

    role = str(role).strip().lower()

    # --------------------------------------------------------
    # COMPATIBILITÉ ANCIENNES VALEURS
    # --------------------------------------------------------

    aliases = {
        "admin": ROLE_ADMIN,
        "administrateur": ROLE_ADMIN,

        "editeur": ROLE_EDITOR,
        "éditeur": ROLE_EDITOR,
        "redacteur": ROLE_EDITOR,
        "rédacteur": ROLE_EDITOR,

        "validateur": ROLE_VALIDATOR,

        "lecteur": ROLE_READER,

        "technicien": ROLE_EDITOR,
    }

    return aliases.get(
        role,
        ROLE_EDITOR,
    )


# ============================================================
# PERMISSIONS CRUD
# ============================================================

class RoleBasedModelPermission(BasePermission):
    """
    Permissions générales de l'application.

    Lecture :
        administrateur
        redacteur
        validateur
        lecteur

    Création / modification / suppression :
        administrateur
        redacteur
        validateur
    """

    def has_permission(
        self,
        request,
        view,
    ):

        if (
            not request.user
            or not request.user.is_authenticated
        ):
            return False

        role = role_of(
            request.user
        )

        # ----------------------------------------------------
        # LECTURE
        # ----------------------------------------------------

        if request.method in SAFE_METHODS:

            return role in {
                ROLE_ADMIN,
                ROLE_EDITOR,
                ROLE_VALIDATOR,
                ROLE_READER,
            }

        # ----------------------------------------------------
        # ÉCRITURE
        # ----------------------------------------------------

        return role in {
            ROLE_ADMIN,
            ROLE_EDITOR,
            ROLE_VALIDATOR,
        }


# ============================================================
# VALIDATION D'UNE VERSION
# ============================================================

class CanValidate(BasePermission):
    """
    Permission pour valider une gamme.

    Pour le moment, puisque tous les utilisateurs doivent
    fonctionner comme Éditeurs, les éditeurs peuvent également
    effectuer la validation.
    """

    def has_permission(
        self,
        request,
        view,
    ):

        if (
            not request.user
            or not request.user.is_authenticated
        ):
            return False

        role = role_of(
            request.user
        )

        return role in {
            ROLE_ADMIN,
            ROLE_EDITOR,
            ROLE_VALIDATOR,
        }