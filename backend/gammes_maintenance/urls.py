"""
====================================================================
URLS - APPLICATION GAMMES MAINTENANCE
====================================================================

Ce fichier définit les routes de l'API de l'application métier.

Il relie les URL HTTP aux ViewSets et aux vues définies dans :

    gammes_maintenance/views.py

Architecture générale :

    Frontend React
        ↓
    URL API
        ↓
    urls.py
        ↓
    ViewSet / APIView
        ↓
    Serializer
        ↓
    Model Django
        ↓
    PostgreSQL / Supabase


====================================================================
ROLE DU DEFAULTROUTER
====================================================================

Django REST Framework fournit DefaultRouter.

Lorsqu'un ViewSet est enregistré comme ceci :

    router.register(
        r"equipements",
        EquipementViewSet,
        basename="equipement",
    )

Django REST Framework génère automatiquement les routes CRUD.

Par exemple :

    GET
    /equipements/

        Liste des équipements.


    POST
    /equipements/

        Création d'un équipement.


    GET
    /equipements/{id}/

        Consultation d'un équipement.


    PUT
    /equipements/{id}/

        Modification complète.


    PATCH
    /equipements/{id}/

        Modification partielle.


    DELETE
    /equipements/{id}/

        Suppression.


Les méthodes décorées avec :

    @action(...)

dans les ViewSets sont également ajoutées automatiquement.

Par exemple, dans EquipementViewSet :

    @action(
        detail=False,
        methods=["get"],
        url_path="options",
    )

génère automatiquement :

    GET /equipements/options/


Et :

    @action(
        detail=False,
        methods=["get"],
        url_path="next-code",
    )

génère automatiquement :

    GET /equipements/next-code/


Il n'est donc PAS nécessaire d'ajouter manuellement ces routes
dans urlpatterns.

====================================================================
"""


# ====================================================================
# IMPORTS DJANGO
# ====================================================================

from django.urls import (
    include,
    path,
)


# ====================================================================
# DJANGO REST FRAMEWORK
# ====================================================================

from rest_framework.routers import DefaultRouter


# ====================================================================
# IMPORT DES VUES
# ====================================================================
#
# Tous les ViewSets utilisés par le router sont importés ici.
#
# Les vues classiques :
#
#     DashboardAPIView
#     qr_resolve
#     me
#
# sont également importées car elles seront déclarées directement
# dans urlpatterns.
#
# ====================================================================
from rest_framework.routers import DefaultRouter

from .auth_views import google_login

from .views import (
    # ----------------------------------------------------------------
    # Equipements
    # ----------------------------------------------------------------
    EquipementViewSet,

    # ----------------------------------------------------------------
    # Gammes et versions
    # ----------------------------------------------------------------
    GammeOperatoireViewSet,
    GammeVersionViewSet,

    # ----------------------------------------------------------------
    # EPI
    # ----------------------------------------------------------------
    EPIViewSet,
    VersionEPIViewSet,

    # ----------------------------------------------------------------
    # Risques
    # ----------------------------------------------------------------
    RisqueViewSet,
    VersionRisqueViewSet,

    # ----------------------------------------------------------------
    # Outillages
    # ----------------------------------------------------------------
    OutillageViewSet,
    VersionOutillageViewSet,

    # ----------------------------------------------------------------
    # Pièces de rechange
    # ----------------------------------------------------------------
    PieceRechangeViewSet,
    VersionPieceRechangeViewSet,

    # ----------------------------------------------------------------
    # Etapes / Actions / Images
    # ----------------------------------------------------------------
    EtapeViewSet,
    ActionEtapeViewSet,
    EtapeImageViewSet,

    # ----------------------------------------------------------------
    # Documents et recommandations
    # ----------------------------------------------------------------
    DocumentLieViewSet,
    RecommandationViewSet,

    # ----------------------------------------------------------------
    # QR Codes
    # ----------------------------------------------------------------
    QRCodeGammeViewSet,

    # ----------------------------------------------------------------
    # Fichiers générés
    # ----------------------------------------------------------------
    FichierGenereViewSet,

    # ----------------------------------------------------------------
    # Médias
    # ----------------------------------------------------------------
    MediaViewSet,

    # ----------------------------------------------------------------
    # Dashboard
    # ----------------------------------------------------------------
    DashboardAPIView,

    # ----------------------------------------------------------------
    # QR Code public
    # ----------------------------------------------------------------
    qr_resolve,

    # ----------------------------------------------------------------
    # Profil utilisateur
    # ----------------------------------------------------------------
    me,
)


# ====================================================================
# CREATION DU ROUTER
# ====================================================================
#
# DefaultRouter va générer automatiquement les routes REST
# correspondant aux différents ViewSets.
#
# ====================================================================

router = DefaultRouter()


# ====================================================================
# EQUIPEMENTS
# ====================================================================
#
# Routes principales générées :
#
# GET
#     /equipements/
#
# POST
#     /equipements/
#
# GET
#     /equipements/{id}/
#
# PUT
#     /equipements/{id}/
#
# PATCH
#     /equipements/{id}/
#
# DELETE
#     /equipements/{id}/
#
#
# Grâce aux nouvelles actions définies dans EquipementViewSet,
# le router génère également :
#
# GET
#     /equipements/options/
#
# GET
#     /equipements/next-code/
#
#
# Ces deux dernières routes seront utilisées par le futur
# Wizard de création d'un équipement.
#
# ====================================================================

router.register(
    r"equipements",
    EquipementViewSet,
    basename="equipement",
)


# ====================================================================
# GAMMES OPERATOIRES
# ====================================================================
#
# Routes CRUD :
#
#     /gammes/
#     /gammes/{id}/
#
# Actions supplémentaires du ViewSet :
#
#     /gammes/{id}/versions/
#     /gammes/{id}/active_version/
#
# ====================================================================

router.register(
    r"gammes",
    GammeOperatoireViewSet,
    basename="gamme",
)


# ====================================================================
# VERSIONS DES GAMMES
# ====================================================================
#
# Routes CRUD :
#
#     /versions/
#     /versions/{id}/
#
# Actions supplémentaires :
#
#     POST /versions/{id}/clone/
#     POST /versions/{id}/submit/
#     POST /versions/{id}/validate_version/
#     POST /versions/{id}/recalculate/
#     POST /versions/{id}/export_pdf/
#     POST /versions/{id}/export_word/
#
# ====================================================================

router.register(
    r"versions",
    GammeVersionViewSet,
    basename="version",
)


# ====================================================================
# EPI
# ====================================================================
#
# Référentiel des équipements de protection individuelle.
#
# Routes :
#
#     /epis/
#     /epis/{id}/
#
# ====================================================================

router.register(
    r"epis",
    EPIViewSet,
    basename="epi",
)


# ====================================================================
# ASSOCIATION VERSION / EPI
# ====================================================================
#
# Permet d'associer un EPI à une version de gamme.
#
# ====================================================================

router.register(
    r"version-epis",
    VersionEPIViewSet,
    basename="version-epi",
)


# ====================================================================
# RISQUES
# ====================================================================
#
# Référentiel des risques.
#
# ====================================================================

router.register(
    r"risques",
    RisqueViewSet,
    basename="risque",
)


# ====================================================================
# ASSOCIATION VERSION / RISQUE
# ====================================================================

router.register(
    r"version-risques",
    VersionRisqueViewSet,
    basename="version-risque",
)


# ====================================================================
# OUTILLAGES
# ====================================================================
#
# Référentiel des outils nécessaires aux interventions.
#
# ====================================================================

router.register(
    r"outillages",
    OutillageViewSet,
    basename="outillage",
)


# ====================================================================
# ASSOCIATION VERSION / OUTILLAGE
# ====================================================================

router.register(
    r"version-outillages",
    VersionOutillageViewSet,
    basename="version-outillage",
)


# ====================================================================
# PIECES DE RECHANGE
# ====================================================================
#
# Référentiel des pièces de rechange.
#
# ====================================================================

router.register(
    r"pieces",
    PieceRechangeViewSet,
    basename="piece",
)


# ====================================================================
# ASSOCIATION VERSION / PIECE
# ====================================================================

router.register(
    r"version-pieces",
    VersionPieceRechangeViewSet,
    basename="version-piece",
)


# ====================================================================
# ETAPES
# ====================================================================
#
# Chaque version de gamme peut contenir plusieurs étapes.
#
# ====================================================================

router.register(
    r"etapes",
    EtapeViewSet,
    basename="etape",
)


# ====================================================================
# ACTIONS
# ====================================================================
#
# Chaque étape peut contenir plusieurs actions.
#
# ====================================================================

router.register(
    r"actions",
    ActionEtapeViewSet,
    basename="action",
)


# ====================================================================
# IMAGES DES ETAPES
# ====================================================================
#
# Permet d'associer des images aux différentes étapes.
#
# ====================================================================

router.register(
    r"images-etapes",
    EtapeImageViewSet,
    basename="image-etape",
)


# ====================================================================
# DOCUMENTS
# ====================================================================
#
# Documents techniques associés aux versions :
#
# - notices ;
# - procédures ;
# - schémas ;
# - documents constructeur ;
# - etc.
#
# ====================================================================

router.register(
    r"documents",
    DocumentLieViewSet,
    basename="document",
)


# ====================================================================
# RECOMMANDATIONS
# ====================================================================

router.register(
    r"recommandations",
    RecommandationViewSet,
    basename="recommandation",
)


# ====================================================================
# QR CODES
# ====================================================================
#
# Gestion interne des QR Codes des gammes.
#
# ====================================================================

router.register(
    r"qr-codes",
    QRCodeGammeViewSet,
    basename="qr-code",
)


# ====================================================================
# FICHIERS GENERES
# ====================================================================
#
# Historique des fichiers générés :
#
# - PDF ;
# - Word ;
# - autres exports éventuels.
#
# ====================================================================

router.register(
    r"fichiers",
    FichierGenereViewSet,
    basename="fichier",
)


# ====================================================================
# MEDIAS
# ====================================================================
#
# Bibliothèque des médias utilisés par l'application.
#
# ====================================================================

router.register(
    r"medias",
    MediaViewSet,
    basename="media",
)


# ====================================================================
# URLPATTERNS
# ====================================================================
#
# urlpatterns contient :
#
# 1. toutes les routes générées automatiquement par le router ;
# 2. le Dashboard ;
# 3. la résolution publique des QR Codes ;
# 4. le profil de l'utilisateur connecté.
#
# ====================================================================

urlpatterns = [

    # ----------------------------------------------------------------
    # AUTHENTIFICATION GOOGLE
    # ----------------------------------------------------------------
    # POST /api/auth/google/
    path(
        "auth/google/",
        google_login,
        name="google-login",
    ),

    # ----------------------------------------------------------------
    # ROUTES DU DEFAULTROUTER
    # ----------------------------------------------------------------
    # ----------------------------------------------------------------
    #
    # Cette instruction inclut toutes les routes enregistrées
    # précédemment :
    #
    # /equipements/
    # /gammes/
    # /versions/
    # /epis/
    # /risques/
    # /outillages/
    # /pieces/
    # /etapes/
    # etc.
    #
    # Elle inclut également automatiquement les @action définies
    # dans les différents ViewSets.
    #
    # ----------------------------------------------------------------

    path(
        "",
        include(
            router.urls
        ),
    ),


    # ----------------------------------------------------------------
    # DASHBOARD
    # ----------------------------------------------------------------
    #
    # GET /dashboard/
    #
    # Retourne notamment :
    #
    # - nombre de gammes ;
    # - nombre d'équipements ;
    # - nombre de versions ;
    # - répartition par statut ;
    # - répartition par type de maintenance ;
    # - répartition par constructeur ;
    # - versions récentes.
    #
    # ----------------------------------------------------------------

    path(
        "dashboard/",
        DashboardAPIView.as_view(),
        name="dashboard",
    ),


    # ----------------------------------------------------------------
    # QR CODE PUBLIC
    # ----------------------------------------------------------------
    #
    # Exemple :
    #
    # GET /qr/GAMME-001/
    #
    # Cette route permet de retrouver la version validée
    # d'une gamme à partir de son code.
    #
    # ----------------------------------------------------------------

    path(
        "qr/<str:code>/",
        qr_resolve,
        name="qr-resolve",
    ),


    # ----------------------------------------------------------------
    # PROFIL UTILISATEUR
    # ----------------------------------------------------------------
    #
    # GET /me/
    #
    #     Lecture du profil.
    #
    # PATCH /me/
    #
    #     Modification du profil.
    #
    # ----------------------------------------------------------------

    path(
        "me/",
        me,
        name="me",
    ),
]