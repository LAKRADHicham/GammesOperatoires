from django.db import connection, transaction
from django.db.models import Count, Max
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Equipement,
    GammeOperatoire,
    GammeVersion,
    EPI,
    VersionEPI,
    Risque,
    Outillage,
    PieceRechange,
    DocumentLie,
    Recommandation,
    Etape,
    ActionEtape,
    EtapeImage,
    VersionRisque,
    VersionOutillage,
    VersionPieceRechange,
    QRCodeGamme,
    FichierGenere,
    Media,
    Entreprise,
)

from .serializers import (
    EquipementSerializer,
    GammeOperatoireSerializer,
    GammeVersionSerializer,
    EPISerializer,
    VersionEPISerializer,
    RisqueSerializer,
    OutillageSerializer,
    PieceRechangeSerializer,
    DocumentLieSerializer,
    RecommandationSerializer,
    EtapeSerializer,
    ActionEtapeSerializer,
    EtapeImageSerializer,
    VersionRisqueSerializer,
    VersionOutillageSerializer,
    VersionPieceRechangeSerializer,
    QRCodeGammeSerializer,
    FichierGenereSerializer,
    MediaSerializer,
    EntrepriseSerializer,
)

from .permissions import (
    RoleBasedModelPermission,
    CanValidate,
)

from .services.versioning import (
    clone_version,
    recalculate_duration,
)

from .services.documents import (
    generate_pdf,
    generate_docx,
)



# ============================================================
# NOM COMPLET DE L'UTILISATEUR
# ============================================================

def get_user_display_name(user):
    """
    Retourne le nom complet du profil connecté.
    Exemple : Safaa Lakrad.
    Fallback : username si prénom/nom non renseignés.
    """
    if user is None:
        return "-"

    try:
        full_name = user.get_full_name().strip()
    except Exception:
        full_name = ""

    if full_name:
        return full_name

    first_name = str(getattr(user, "first_name", "") or "").strip()
    last_name = str(getattr(user, "last_name", "") or "").strip()
    full_name = f"{first_name} {last_name}".strip()

    if full_name:
        return full_name

    try:
        username = user.get_username()
    except Exception:
        username = getattr(user, "username", None)

    return str(username or "-")


# ============================================================
# BASE VIEWSET
# ============================================================

class BaseModelViewSet(viewsets.ModelViewSet):

    permission_classes = [
        RoleBasedModelPermission
    ]


# ============================================================
# EQUIPEMENTS
# ============================================================

class EquipementViewSet(BaseModelViewSet):

    queryset = Equipement.objects.all()

    serializer_class = EquipementSerializer

    search_fields = [
        "code",
        "nom",
        "constructeur",
        "type",
        "reference",
        "description",
    ]

    ordering_fields = [
        "code",
        "nom",
        "constructeur",
        "created_at",
        "updated_at",
    ]


# ============================================================
# EPI
# ============================================================

class EPIViewSet(BaseModelViewSet):

    queryset = EPI.objects.all()

    serializer_class = EPISerializer

    search_fields = [
        "nom",
        "description",
    ]

    ordering_fields = [
        "nom",
        "created_at",
    ]


# ============================================================
# VERSION - EPI
# ============================================================

class VersionEPIViewSet(BaseModelViewSet):

    queryset = VersionEPI.objects.select_related(
        "epi",
        "version",
    )

    serializer_class = VersionEPISerializer


# ============================================================
# RISQUES
# ============================================================

class RisqueViewSet(BaseModelViewSet):

    queryset = Risque.objects.all()

    serializer_class = RisqueSerializer

    search_fields = [
        "nom",
        "description",
    ]

    ordering_fields = [
        "nom",
        "created_at",
    ]


# ============================================================
# OUTILLAGES
# ============================================================

class OutillageViewSet(BaseModelViewSet):

    queryset = Outillage.objects.all()

    serializer_class = OutillageSerializer

    search_fields = [
        "nom",
        "description",
    ]

    ordering_fields = [
        "nom",
        "created_at",
    ]


# ============================================================
# PIECES
# ============================================================

class PieceRechangeViewSet(BaseModelViewSet):

    queryset = PieceRechange.objects.all()

    serializer_class = PieceRechangeSerializer

    search_fields = [
        "code",
        "nom",
        "constructeur",
        "reference",
        "description",
    ]

    ordering_fields = [
        "code",
        "nom",
        "constructeur",
        "created_at",
    ]


# ============================================================
# DOCUMENTS
# ============================================================

class DocumentLieViewSet(BaseModelViewSet):

    queryset = DocumentLie.objects.select_related(
        "version"
    )

    serializer_class = DocumentLieSerializer

    search_fields = [
        "titre",
        "reference",
        "description",
    ]


# ============================================================
# RECOMMANDATIONS
# ============================================================

class RecommandationViewSet(BaseModelViewSet):

    queryset = Recommandation.objects.select_related(
        "version"
    )

    serializer_class = RecommandationSerializer

    search_fields = [
        "titre",
        "contenu",
    ]


# ============================================================
# ETAPES
# ============================================================

class EtapeViewSet(BaseModelViewSet):

    queryset = (
        Etape.objects
        .select_related("version")
        .prefetch_related(
            "actions",
            "images",
        )
    )

    serializer_class = EtapeSerializer

    search_fields = [
        "titre",
        "description",
    ]

    ordering_fields = [
        "numero",
        "ordre",
        "duree_minutes",
        "created_at",
    ]


# ============================================================
# ACTIONS
# ============================================================

class ActionEtapeViewSet(BaseModelViewSet):

    queryset = ActionEtape.objects.select_related(
        "etape"
    )

    serializer_class = ActionEtapeSerializer

    search_fields = [
        "contenu",
    ]

    ordering_fields = [
        "ordre",
        "created_at",
    ]


# ============================================================
# IMAGES
# ============================================================

class EtapeImageViewSet(BaseModelViewSet):

    queryset = EtapeImage.objects.select_related(
        "etape"
    )

    serializer_class = EtapeImageSerializer

    ordering_fields = [
        "ordre",
        "created_at",
    ]


# ============================================================
# VERSION - RISQUES
# ============================================================

class VersionRisqueViewSet(BaseModelViewSet):

    queryset = VersionRisque.objects.select_related(
        "risque",
        "version",
    )

    serializer_class = VersionRisqueSerializer


# ============================================================
# VERSION - OUTILLAGES
# ============================================================

class VersionOutillageViewSet(BaseModelViewSet):

    queryset = VersionOutillage.objects.select_related(
        "outillage",
        "version",
    )

    serializer_class = VersionOutillageSerializer


# ============================================================
# VERSION - PIECES
# ============================================================

class VersionPieceRechangeViewSet(BaseModelViewSet):

    queryset = VersionPieceRechange.objects.select_related(
        "piece",
        "version",
    )

    serializer_class = VersionPieceRechangeSerializer


# ============================================================
# QR CODES
# ============================================================

class QRCodeGammeViewSet(BaseModelViewSet):

    queryset = QRCodeGamme.objects.select_related(
        "gamme"
    )

    serializer_class = QRCodeGammeSerializer


# ============================================================
# FICHIERS GENERES
# ============================================================

class FichierGenereViewSet(BaseModelViewSet):

    queryset = FichierGenere.objects.select_related(
        "version"
    )

    serializer_class = FichierGenereSerializer

    search_fields = [
        "type_fichier",
        "nom_fichier",
    ]

    ordering_fields = [
        "created_at",
    ]


# ============================================================
# MEDIAS
# ============================================================

class MediaViewSet(BaseModelViewSet):

    queryset = Media.objects.all()

    serializer_class = MediaSerializer

    search_fields = [
        "nom",
        "categorie",
        "description",
    ]

    ordering_fields = [
        "nom",
        "categorie",
        "created_at",
    ]


# ============================================================
# GAMMES OPERATOIRES
# ============================================================

class GammeOperatoireViewSet(BaseModelViewSet):

    queryset = (
        GammeOperatoire.objects
        .select_related("equipement")
        .prefetch_related("versions")
    )

    serializer_class = GammeOperatoireSerializer

    search_fields = [
        "code",
        "designation",
        "abreviation",
        "equipement__nom",
        "equipement__code",
    ]

    ordering_fields = [
        "code",
        "designation",
        "created_at",
        "updated_at",
    ]

    @transaction.atomic
    def perform_create(self, serializer):

        gamme = serializer.save()

        QRCodeGamme.objects.get_or_create(
            gamme=gamme,
            defaults={
                "actif": True,
            },
        )

        GammeVersion.objects.create(
            gamme=gamme,
            numero_version=0,
            code_version="V0",
            date_version=timezone.localdate(),
            redacteur=get_user_display_name(self.request.user),
            statut="en_cours_creation",
        )

    @action(
        detail=True,
        methods=["get"],
    )
    def versions(self, request, pk=None):

        gamme = self.get_object()

        versions = gamme.versions.all().order_by(
            "-numero_version"
        )

        serializer = GammeVersionSerializer(
            versions,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data
        )

    @action(
        detail=True,
        methods=["get"],
    )
    def active_version(
        self,
        request,
        pk=None,
    ):

        gamme = self.get_object()

        version = (
            gamme.versions
            .filter(
                statut="validee"
            )
            .order_by(
                "-numero_version"
            )
            .first()
        )

        if version is None:
            return Response(None)

        serializer = GammeVersionSerializer(
            version,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data
        )


# ============================================================
# VERSIONS
# ============================================================

class GammeVersionViewSet(BaseModelViewSet):

    queryset = (
        GammeVersion.objects
        .select_related(
            "gamme"
        )
        .prefetch_related(
            "etapes__actions",
            "etapes__images",
            "version_epis__epi",
            "version_risques__risque",
            "version_outillages__outillage",
            "version_pieces_rechange__piece",
            "documents",
            "recommandations",
            "fichiers_generes",
        )
    )

    serializer_class = GammeVersionSerializer

    search_fields = [
        "gamme__code",
        "gamme__designation",
        "code_version",
        "modifications",
        "statut",
        "type_maintenance",
        "redacteur",
        "valideur",
    ]

    ordering_fields = [
        "numero_version",
        "date_version",
        "created_at",
        "updated_at",
    ]

    def perform_create(
        self,
        serializer,
    ):

        gamme = serializer.validated_data[
            "gamme"
        ]

        max_number = gamme.versions.aggregate(
            max_number=Max(
                "numero_version"
            )
        )["max_number"]

        if max_number is None:
            next_number = 0
        else:
            next_number = max_number + 1

        serializer.save(
            numero_version=next_number,
            code_version=f"V{next_number}",
            date_version=timezone.localdate(),
            redacteur=get_user_display_name(self.request.user),
            statut="en_cours_modification",
        )

    def update(
        self,
        request,
        *args,
        **kwargs,
    ):

        version = self.get_object()

        if version.statut in {
            "validee",
            "archivee",
        }:

            return Response(
                {
                    "detail": (
                        "Une version validée ou archivée "
                        "est non modifiable. "
                        "Clonez-la pour créer une nouvelle version."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        return super().update(
            request,
            *args,
            **kwargs,
        )

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):

        version = self.get_object()

        if version.statut not in {
            "en_cours_creation",
            "en_cours_modification",
        }:

            return Response(
                {
                    "detail": (
                        "Seule une version en cours de création "
                        "ou de modification peut être supprimée."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        return super().destroy(
            request,
            *args,
            **kwargs,
        )

    @action(
        detail=True,
        methods=["post"],
    )
    def clone(
        self,
        request,
        pk=None,
    ):

        source = self.get_object()

        modifications = request.data.get(
            "modifications",
            "Nouvelle révision",
        )

        new_version = clone_version(
            source,
            request.user,
            modifications,
        )

        serializer = self.get_serializer(
            new_version
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["post"],
    )
    def submit(
        self,
        request,
        pk=None,
    ):
        "Seule une version en cours de création "
        "ou de modification peut être envoyée en validation."

        version = self.get_object()

        if version.statut not in {
            "en_cours_creation",
            "en_cours_modification",
        }:

            return Response(
                {
                    "detail": (
                        "Seule une version en cours de création "
                        "ou de modification peut être envoyée en validation."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        # ----------------------------------------------------
        # EPI OBLIGATOIRE
        # ----------------------------------------------------

        if not version.version_epis.exists():

            return Response(
                {
                    "detail": (
                        "Au moins un EPI doit être "
                        "associé à la version."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # RISQUE OBLIGATOIRE
        # ----------------------------------------------------

        if not version.version_risques.exists():

            return Response(
                {
                    "detail": (
                        "Au moins un risque doit être "
                        "associé à la version."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # ETAPE OBLIGATOIRE
        # ----------------------------------------------------

        if not version.etapes.exists():

            return Response(
                {
                    "detail": (
                        "Au moins une étape est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        version.statut = "en_validation"

        version.updated_at = timezone.now()

        version.save(
            update_fields=[
                "statut",
                "updated_at",
            ]
        )

        return Response(
            self.get_serializer(
                version
            ).data
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[
            CanValidate
        ],
    )
    @transaction.atomic
    def validate_version(
        self,
        request,
        pk=None,
    ):

        version = self.get_object()

        if version.statut != "en_validation":

            return Response(
                {
                    "detail": (
                        "La version doit être en validation."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        # ----------------------------------------------------
        # ARCHIVER L'ANCIENNE VERSION
        # ----------------------------------------------------

        version.gamme.versions.filter(
            statut="validee"
        ).exclude(
            pk=version.pk
        ).update(
            statut="archivee",
            updated_at=timezone.now(),
        )

        # ----------------------------------------------------
        # VALIDER LA VERSION
        # ----------------------------------------------------

        version.statut = "validee"

        version.valideur = (
            get_user_display_name(request.user)
        )

        version.updated_at = timezone.now()

        recalculate_duration(
            version
        )

        version.save(
            update_fields=[
                "statut",
                "valideur",
                "updated_at",
            ]
        )

        return Response(
            self.get_serializer(
                version
            ).data
        )

    @action(
        detail=True,
        methods=["post"],
    )
    def recalculate(
        self,
        request,
        pk=None,
    ):

        version = self.get_object()

        total = recalculate_duration(
            version
        )

        return Response(
            {
                "duree_minutes": total,
            }
        )

    @action(
        detail=True,
        methods=["post"],
    )
    def export_pdf(
        self,
        request,
        pk=None,
    ):

        version = self.get_object()
        # Le téléchargement du PDF final valide la gamme
        if version.statut not in {"validee", "archivee"}:
            # Archiver l'ancienne version validée de cette gamme
            version.gamme.versions.filter(
                statut="validee"
            ).exclude(
                pk=version.pk
            ).update(
                statut="archivee",
                updated_at=timezone.now(),
            ) 
            version.statut = "validee"
            version.valideur = get_user_display_name(request.user)
            version.updated_at = timezone.now()

            version.save(
                update_fields=[
                    "statut",
                    "valideur",
                    "updated_at",
                ]
            )

        try:
            data, filename = generate_pdf(version)

        except Exception as exc:

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(
            data,
            content_type="application/pdf",
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{filename}"'
        )

        response["Cache-Control"] = "no-store"

        return response

    @action(
        detail=True,
        methods=["post"],
    )
    def export_word(
        self,
        request,
        pk=None,
    ):

        version = self.get_object()

        try:
            data, filename = generate_docx(version)

        except Exception as exc:

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(
            data,
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{filename}"'
        )

        response["Cache-Control"] = "no-store"

        return response


# ============================================================
# DASHBOARD
# ============================================================

class DashboardAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
    ):

        recentes = (
            GammeVersion.objects
            .select_related("gamme")
            .order_by(
                "-updated_at"
            )[:10]
        )

        return Response(
            {
                "gammes_total":
                    GammeOperatoire.objects.count(),

                "equipements_total":
                    Equipement.objects.count(),

                "versions_total":
                    GammeVersion.objects.count(),

                "par_statut":
                    list(
                        GammeVersion.objects
                        .values(
                            "statut"
                        )
                        .annotate(
                            total=Count(
                                "id"
                            )
                        )
                        .order_by(
                            "statut"
                        )
                    ),

                "par_type_maintenance":
                    list(
                        GammeVersion.objects
                        .values(
                            "type_maintenance"
                        )
                        .annotate(
                            total=Count(
                                "id"
                            )
                        )
                        .order_by(
                            "type_maintenance"
                        )
                    ),

                "par_constructeur":
                    list(
                        Equipement.objects
                        .values(
                            "constructeur"
                        )
                        .annotate(
                            total=Count(
                                "id"
                            )
                        )
                        .order_by(
                            "-total"
                        )[:20]
                    ),

                "recentes":
                    GammeVersionSerializer(
                        recentes,
                        many=True,
                        context={
                            "request": request,
                        },
                    ).data,
            }
        )


# ============================================================
# QR CODE PUBLIC
# ============================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def qr_resolve(
    request,
    code,
):

    gamme = get_object_or_404(
        GammeOperatoire,
        code=code,
        actif=True,
    )

    get_object_or_404(
        QRCodeGamme,
        gamme=gamme,
        actif=True,
    )

    version = (
        gamme.versions
        .filter(
            statut="validee"
        )
        .order_by(
            "-numero_version"
        )
        .first()
    )

    if version is None:

        return Response(
            {
                "detail":
                    "Aucune version validée disponible."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            "gamme":
                str(gamme.id),

            "code":
                gamme.code,

            "version_id":
                str(version.id),

            "version":
                version.code_version,

            "designation":
                gamme.designation,
        }
    )


# ============================================================
# UTILISATEUR / MON PROFIL
# ============================================================

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Endpoint du profil de l'utilisateur connecté.

    GET :
        Retourne :
        - les informations du compte Django ;
        - les informations professionnelles provenant
          de la table profils_utilisateurs.

    PATCH :
        Permet de modifier :
        - prénom ;
        - nom ;
        - adresse e-mail ;
        - titre du poste ;
        - profil ;
        - corps de métier ;
        - téléphone.
    """

    user = request.user


    # ========================================================
    # GET - LECTURE DU PROFIL
    # ========================================================

    if request.method == "GET":

        # ----------------------------------------------------
        # Valeurs par défaut
        # ----------------------------------------------------

        professional_profile = {
            "titre_poste": None,
            "profil": None,
            "corps_metier": None,
            "telephone": None,
            "profil_actif": True,
        }


        # ----------------------------------------------------
        # Lecture du profil professionnel dans Supabase
        # ----------------------------------------------------

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    titre_poste,
                    profil,
                    corps_metier,
                    telephone,
                    actif
                FROM profils_utilisateurs
                WHERE user_id = %s
                LIMIT 1
                """,
                [
                    user.id
                ],
            )

            row = cursor.fetchone()


        # ----------------------------------------------------
        # Si le profil existe
        # ----------------------------------------------------

        if row:

            professional_profile = {
                "titre_poste": row[0],
                "profil": row[1],
                "corps_metier": row[2],
                "telephone": row[3],
                "profil_actif": row[4],
            }


        # ----------------------------------------------------
        # Réponse API
        # ----------------------------------------------------

        return Response(
            {
                # --------------------------------------------
                # Informations Django
                # --------------------------------------------

                "id":
                    user.id,

                "username":
                    user.username,

                "email":
                    user.email,

                "first_name":
                    user.first_name,

                "last_name":
                    user.last_name,


                # --------------------------------------------
                # Permissions
                # --------------------------------------------

                "is_active":
                    user.is_active,

                "is_staff":
                    user.is_staff,

                "is_superuser":
                    user.is_superuser,


                # --------------------------------------------
                # Informations professionnelles
                # --------------------------------------------

                **professional_profile,
            }
        )


    # ========================================================
    # PATCH - MODIFICATION DU PROFIL
    # ========================================================

    if request.method == "PATCH":

        # ----------------------------------------------------
        # Données personnelles
        # ----------------------------------------------------

        first_name = request.data.get(
            "first_name",
            user.first_name,
        )

        last_name = request.data.get(
            "last_name",
            user.last_name,
        )

        email = request.data.get(
            "email",
            user.email,
        )


        # ----------------------------------------------------
        # Récupération du profil professionnel actuel
        #
        # Cette étape est importante :
        # si le frontend n'envoie qu'un seul champ,
        # les autres valeurs existantes ne doivent pas
        # être remplacées par NULL.
        # ----------------------------------------------------

        current_profile = {
            "titre_poste": None,
            "profil": None,
            "corps_metier": None,
            "telephone": None,
        }

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    titre_poste,
                    profil,
                    corps_metier,
                    telephone
                FROM profils_utilisateurs
                WHERE user_id = %s
                LIMIT 1
                """,
                [
                    user.id
                ],
            )

            row = cursor.fetchone()


        if row:

            current_profile = {
                "titre_poste": row[0],
                "profil": row[1],
                "corps_metier": row[2],
                "telephone": row[3],
            }


        # ----------------------------------------------------
        # Nouvelles valeurs professionnelles
        # ----------------------------------------------------

        titre_poste = request.data.get(
            "titre_poste",
            current_profile["titre_poste"],
        )

        profil = request.data.get(
            "profil",
            current_profile["profil"],
        )

        corps_metier = request.data.get(
            "corps_metier",
            current_profile["corps_metier"],
        )

        telephone = request.data.get(
            "telephone",
            current_profile["telephone"],
        )


        # ====================================================
        # TRANSACTION
        # ====================================================

        with transaction.atomic():

            # ------------------------------------------------
            # Mise à jour utilisateur Django
            # ------------------------------------------------

            user.first_name = first_name
            user.last_name = last_name
            user.email = email

            user.save(
                update_fields=[
                    "first_name",
                    "last_name",
                    "email",
                ]
            )


            # ------------------------------------------------
            # Création ou mise à jour du profil professionnel
            # ------------------------------------------------

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO profils_utilisateurs
                    (
                        user_id,
                        titre_poste,
                        profil,
                        corps_metier,
                        telephone,
                        actif,
                        created_at,
                        updated_at
                    )

                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        TRUE,
                        NOW(),
                        NOW()
                    )

                    ON CONFLICT (user_id)

                    DO UPDATE SET

                        titre_poste =
                            EXCLUDED.titre_poste,

                        profil =
                            EXCLUDED.profil,

                        corps_metier =
                            EXCLUDED.corps_metier,

                        telephone =
                            EXCLUDED.telephone,

                        updated_at =
                            NOW()
                    """,
                    [
                        user.id,
                        titre_poste,
                        profil,
                        corps_metier,
                        telephone,
                    ],
                )


        # ====================================================
        # RÉPONSE
        # ====================================================

        return Response(
            {
                # --------------------------------------------
                # Compte
                # --------------------------------------------

                "id":
                    user.id,

                "username":
                    user.username,

                "email":
                    user.email,

                "first_name":
                    user.first_name,

                "last_name":
                    user.last_name,


                # --------------------------------------------
                # Profil professionnel
                # --------------------------------------------

                "titre_poste":
                    titre_poste,

                "profil":
                    profil,

                "corps_metier":
                    corps_metier,

                "telephone":
                    telephone,


                # --------------------------------------------
                # Permissions
                # --------------------------------------------

                "is_active":
                    user.is_active,

                "is_staff":
                    user.is_staff,

                "is_superuser":
                    user.is_superuser,

                "profil_actif":
                    True,


                # --------------------------------------------
                # Confirmation
                # --------------------------------------------

                "detail":
                    "Profil mis à jour avec succès.",
            },
            status=status.HTTP_200_OK,
        )
    # ============================================================
# ENTREPRISES / LOGOS
# ============================================================
# API CRUD permettant de gérer les entreprises utilisées
# dans les gammes opératoires.
#
# Endpoints disponibles après ajout dans urls.py :
# GET    /api/entreprises/       -> liste
# POST   /api/entreprises/       -> ajout
# GET    /api/entreprises/{id}/  -> détail
# PATCH  /api/entreprises/{id}/  -> modification
# DELETE /api/entreprises/{id}/  -> suppression
# ============================================================

class EntrepriseViewSet(viewsets.ModelViewSet):

    # Toutes les entreprises, classées par nom.
    queryset = Entreprise.objects.all().order_by("nom")

    # Serializer utilisé pour les entrées/sorties JSON.
    serializer_class = EntrepriseSerializer

    # Permet la recherche par nom depuis le frontend.
    search_fields = ["nom"]

    # Permet de filtrer les entreprises actives/inactives.
    filterset_fields = ["actif"]