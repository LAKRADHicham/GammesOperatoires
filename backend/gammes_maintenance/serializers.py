"""
====================================================================
SERIALIZERS - API REST GAMMES MAINTENANCE
====================================================================

Ce fichier transforme les objets Django en données JSON utilisables
par le frontend React, et inversement.

Exemple :

Objet Django :
    Equipement(code="EQP-000001", nom="COFFRET PC")

JSON envoyé au frontend :
    {
        "id": "...",
        "code": "EQP-000001",
        "nom": "COFFRET PC",
        ...
    }

Les serializers permettent également de :

- valider les données reçues du frontend ;
- créer de nouveaux équipements ;
- modifier les équipements existants ;
- exposer les relations entre les différents modèles ;
- construire les données utilisées par le Wizard.

====================================================================
"""

from rest_framework import serializers

from .models import (
    Equipement,
    GammeOperatoire,
    GammeVersion,
    EPI,
    VersionEPI,
    Risque,
    VersionRisque,
    Outillage,
    VersionOutillage,
    PieceRechange,
    VersionPieceRechange,
    DocumentLie,
    Recommandation,
    Etape,
    ActionEtape,
    EtapeImage,
    QRCodeGamme,
    FichierGenere,
    Media,
    Entreprise,
)


# ====================================================================
# EQUIPEMENTS
# ====================================================================

class EquipementSerializer(serializers.ModelSerializer):
    """
    Serializer principal des équipements.

    Il permet :

    GET
        Lire les équipements.

    POST
        Créer un nouvel équipement.

    PUT / PATCH
        Modifier un équipement existant.

    DELETE
        La suppression est gérée par le ViewSet.

    Les champs disponibles correspondent au modèle Equipement et
    donc à la table PostgreSQL / Supabase :

        public.equipements
    """

    class Meta:
        model = Equipement

        # ------------------------------------------------------------
        # CHAMPS EXPOSES PAR L'API
        # ------------------------------------------------------------
        #
        # On les écrit explicitement plutôt que d'utiliser "__all__".
        #
        # Cela permet de savoir exactement quelles données sont
        # accessibles depuis le frontend et évite qu'un futur champ
        # ajouté au modèle soit automatiquement exposé par l'API.
        # ------------------------------------------------------------

        fields = [
            "id",
            "code",
            "nom",

            # Localisation
            "batiment",
            "etage",
            "local",

            # Classification
            "domaine",

            # Caractéristiques
            "reference",
            "quantite",
            "constructeur",
            "modele",

            # Maintenance
            "gamme_job_plan",
            "date_intervention",
            "workorder_genere_par",

            # Informations complémentaires
            "type",
            "description",
            "image_url",

            # Statut
            "actif",

            # Traçabilité
            "created_at",
            "updated_at",
        ]

        # ------------------------------------------------------------
        # CHAMPS EN LECTURE SEULE
        # ------------------------------------------------------------
        #
        # Ces champs ne doivent normalement pas être renseignés
        # manuellement par le frontend.
        # ------------------------------------------------------------

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

        # ------------------------------------------------------------
        # CONFIGURATION DE CERTAINS CHAMPS
        # ------------------------------------------------------------

        extra_kwargs = {

            # Le code est obligatoire.
            "code": {
                "required": True,
            },

            # Le nom de l'équipement est obligatoire.
            "nom": {
                "required": True,
                "allow_blank": False,
            },

            # Les autres champs sont facultatifs.
            "batiment": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "etage": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "local": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "domaine": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "reference": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "constructeur": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "modele": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "gamme_job_plan": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "workorder_genere_par": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "type": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "description": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },
        }

    # ----------------------------------------------------------------
    # VALIDATION DU CODE
    # ----------------------------------------------------------------

    def validate_code(self, value):
        """
        Nettoie et valide le code équipement.

        Exemple :

            " eqp-000001 "

        devient :

            "EQP-000001"
        """

        if not value:
            raise serializers.ValidationError(
                "Le code de l'équipement est obligatoire."
            )

        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Le code de l'équipement est obligatoire."
            )

        return value

    # ----------------------------------------------------------------
    # VALIDATION DU NOM
    # ----------------------------------------------------------------

    def validate_nom(self, value):
        """
        Supprime les espaces inutiles autour du nom.

        Exemple :

            "  COFFRET PC  "

        devient :

            "COFFRET PC"
        """

        if not value:
            raise serializers.ValidationError(
                "Le nom de l'équipement est obligatoire."
            )

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le nom de l'équipement est obligatoire."
            )

        return value

    # ----------------------------------------------------------------
    # VALIDATION DE LA QUANTITE
    # ----------------------------------------------------------------

    def validate_quantite(self, value):
        """
        Vérifie que la quantité n'est pas négative.
        """

        if value is None:
            return 1

        if value < 0:
            raise serializers.ValidationError(
                "La quantité ne peut pas être négative."
            )

        return value

    # ----------------------------------------------------------------
    # NETTOYAGE GLOBAL
    # ----------------------------------------------------------------

    def validate(self, attrs):
        """
        Nettoyage général avant l'enregistrement.

        Les champs textuels facultatifs sont nettoyés avec strip()
        afin d'éviter d'enregistrer des valeurs comme :

            "   Schneider   "

        à la place de :

            "Schneider"

        Cela sera également utile pour les listes déroulantes du
        Wizard, car cela limite les faux doublons.
        """

        champs_texte = [
            "batiment",
            "etage",
            "local",
            "domaine",
            "reference",
            "constructeur",
            "modele",
            "gamme_job_plan",
            "workorder_genere_par",
            "type",
            "description",
            "image_url",
        ]

        for champ in champs_texte:

            if champ not in attrs:
                continue

            valeur = attrs.get(champ)

            if isinstance(valeur, str):

                valeur = valeur.strip()

                # Une chaîne vide est convertie en NULL.
                #
                # Cela évite d'avoir simultanément :
                #
                # constructeur = ""
                #
                # et
                #
                # constructeur = NULL
                #
                # dans la base.
                attrs[champ] = valeur if valeur else None

        return attrs


# ====================================================================
# GAMMES OPERATOIRES
# ====================================================================

class GammeOperatoireSerializer(serializers.ModelSerializer):
    """
    Serializer d'une gamme opératoire.

    equipement_detail permet au frontend de recevoir directement
    les informations de l'équipement associé à la gamme.
    """

    equipement_detail = EquipementSerializer(
        source="equipement",
        read_only=True,
    )

    class Meta:
        model = GammeOperatoire
        fields = "__all__"


# ====================================================================
# EPI
# ====================================================================

class EPISerializer(serializers.ModelSerializer):
    """
    Serializer du référentiel des EPI.
    """

    class Meta:
        model = EPI
        fields = "__all__"


# ====================================================================
# ASSOCIATION VERSION / EPI
# ====================================================================

class VersionEPISerializer(serializers.ModelSerializer):
    """
    Serializer de l'association entre une version de gamme
    et un équipement de protection individuelle.
    """

    epi_detail = EPISerializer(
        source="epi",
        read_only=True,
    )

    class Meta:
        model = VersionEPI
        fields = "__all__"


# ====================================================================
# RISQUES
# ====================================================================

class RisqueSerializer(serializers.ModelSerializer):
    """
    Serializer du référentiel des risques.
    """

    class Meta:
        model = Risque
        fields = "__all__"


# ====================================================================
# ASSOCIATION VERSION / RISQUE
# ====================================================================

class VersionRisqueSerializer(serializers.ModelSerializer):
    """
    Serializer de l'association entre une version de gamme
    et un risque.
    """

    risque_detail = RisqueSerializer(
        source="risque",
        read_only=True,
    )

    class Meta:
        model = VersionRisque
        fields = "__all__"


# ====================================================================
# OUTILLAGES
# ====================================================================

class OutillageSerializer(serializers.ModelSerializer):
    """
    Serializer du référentiel des outillages.
    """

    class Meta:
        model = Outillage
        fields = "__all__"


# ====================================================================
# ASSOCIATION VERSION / OUTILLAGE
# ====================================================================

class VersionOutillageSerializer(serializers.ModelSerializer):
    """
    Serializer de l'association entre une version de gamme
    et un outillage.

    outillage_detail permet de récupérer directement
    les informations de l'outil associé.
    """

    outillage_detail = OutillageSerializer(
        source="outillage",
        read_only=True,
    )

    class Meta:
        model = VersionOutillage
        fields = "__all__"


# ====================================================================
# PIECES DE RECHANGE
# ====================================================================

class PieceRechangeSerializer(serializers.ModelSerializer):
    """
    Serializer du référentiel des pièces de rechange.
    """

    class Meta:
        model = PieceRechange
        fields = "__all__"


# ====================================================================
# ASSOCIATION VERSION / PIECE DE RECHANGE
# ====================================================================

class VersionPieceRechangeSerializer(serializers.ModelSerializer):
    """
    Serializer de l'association entre une version de gamme
    et une pièce de rechange.
    """

    piece_detail = PieceRechangeSerializer(
        source="piece",
        read_only=True,
    )

    class Meta:
        model = VersionPieceRechange
        fields = "__all__"


# ====================================================================
# ACTIONS DES ETAPES
# ====================================================================

class ActionEtapeSerializer(serializers.ModelSerializer):
    """
    Serializer d'une action appartenant à une étape.
    """

    class Meta:
        model = ActionEtape
        fields = "__all__"


# ====================================================================
# IMAGES DES ETAPES
# ====================================================================

class EtapeImageSerializer(serializers.ModelSerializer):
    """
    Serializer d'une image associée à une étape.
    """

    class Meta:
        model = EtapeImage
        fields = "__all__"


# ====================================================================
# ETAPES
# ====================================================================

class EtapeSerializer(serializers.ModelSerializer):
    """
    Serializer complet d'une étape.

    Les actions et les images associées sont directement
    intégrées dans le JSON retourné au frontend.
    """

    actions = ActionEtapeSerializer(
        many=True,
        read_only=True,
    )

    images = EtapeImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Etape
        fields = "__all__"


# ====================================================================
# DOCUMENTS LIES
# ====================================================================

class DocumentLieSerializer(serializers.ModelSerializer):
    """
    Serializer des documents liés à une version de gamme.
    """

    class Meta:
        model = DocumentLie
        fields = "__all__"


# ====================================================================
# RECOMMANDATIONS
# ====================================================================

class RecommandationSerializer(serializers.ModelSerializer):
    """
    Serializer des recommandations associées aux gammes.
    """

    class Meta:
        model = Recommandation
        fields = "__all__"


# ====================================================================
# FICHIERS GENERES
# ====================================================================

class FichierGenereSerializer(serializers.ModelSerializer):
    """
    Serializer des fichiers générés par l'application.
    """

    class Meta:
        model = FichierGenere
        fields = "__all__"


# ====================================================================
# QR CODES
# ====================================================================

class QRCodeGammeSerializer(serializers.ModelSerializer):
    """
    Serializer des QR Codes associés aux gammes.
    """

    class Meta:
        model = QRCodeGamme
        fields = "__all__"


# ====================================================================
# MEDIAS
# ====================================================================

class MediaSerializer(serializers.ModelSerializer):
    """
    Serializer de la bibliothèque des médias.
    """

    class Meta:
        model = Media
        fields = "__all__"


# ====================================================================
# VERSION COMPLETE D'UNE GAMME
# ====================================================================

class GammeVersionSerializer(serializers.ModelSerializer):
    """
    Serializer détaillé d'une version de gamme.

    Il rassemble toutes les informations nécessaires au frontend :

    - étapes ;
    - actions ;
    - images ;
    - EPI ;
    - risques ;
    - outillages ;
    - pièces de rechange ;
    - documents ;
    - recommandations ;
    - fichiers générés.

    Il représente donc une grande partie de la structure complète
    d'une gamme opératoire.
    """

    # ----------------------------------------------------------------
    # ETAPES
    # ----------------------------------------------------------------

    etapes = EtapeSerializer(
        many=True,
        read_only=True,
    )

    # ----------------------------------------------------------------
    # EPI
    # ----------------------------------------------------------------

    epis = VersionEPISerializer(
        source="version_epis",
        many=True,
        read_only=True,
    )

    # ----------------------------------------------------------------
    # RISQUES
    # ----------------------------------------------------------------

    risques = VersionRisqueSerializer(
        source="version_risques",
        many=True,
        read_only=True,
    )

    # ----------------------------------------------------------------
    # OUTILLAGES
    # ----------------------------------------------------------------

    outillages = VersionOutillageSerializer(
        source="version_outillages",
        many=True,
        read_only=True,
    )

    # ----------------------------------------------------------------
    # PIECES DE RECHANGE
    # ----------------------------------------------------------------

    pieces_rechange = VersionPieceRechangeSerializer(
        source="version_pieces_rechange",
        many=True,
        read_only=True,
    )

    # ----------------------------------------------------------------
    # DOCUMENTS
    # ----------------------------------------------------------------

    documents = DocumentLieSerializer(
        many=True,
        read_only=True,
    )

    # ----------------------------------------------------------------
    # RECOMMANDATIONS
    # ----------------------------------------------------------------

    recommandations = RecommandationSerializer(
        many=True,
        read_only=True,
    )

    # ----------------------------------------------------------------
    # FICHIERS GENERES
    # ----------------------------------------------------------------

    fichiers_generes = FichierGenereSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = GammeVersion
        fields = "__all__"
    # ============================================================
# ENTREPRISES / LOGOS
# ============================================================
# Serializer utilisé par l'API pour convertir les entreprises
# entre les objets Django et les données JSON.
#
# Il permettra notamment :
# - d'afficher la liste des entreprises ;
# - d'ajouter une entreprise ;
# - de modifier une entreprise ;
# - de supprimer une entreprise ;
# - de récupérer le nom et le logo pour les gammes.
# ============================================================

class EntrepriseSerializer(serializers.ModelSerializer):

    class Meta:
        # Modèle associé à la table Supabase "entreprises".
        model = Entreprise

        # Champs exposés par l'API.
        fields = [
            "id",
            "nom",
            "logo_url",
            "actif",
            "created_at",
            "updated_at",
        ]

        # Ces champs sont générés automatiquement par la base
        # et ne doivent pas être saisis depuis le frontend.
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]