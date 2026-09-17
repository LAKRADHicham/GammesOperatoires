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
)


class EquipementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Equipement
        fields = "__all__"


class GammeOperatoireSerializer(serializers.ModelSerializer):

    equipement_detail = EquipementSerializer(
        source="equipement",
        read_only=True,
    )

    class Meta:
        model = GammeOperatoire
        fields = "__all__"


class EPISerializer(serializers.ModelSerializer):

    class Meta:
        model = EPI
        fields = "__all__"


class VersionEPISerializer(serializers.ModelSerializer):

    epi_detail = EPISerializer(
        source="epi",
        read_only=True,
    )

    class Meta:
        model = VersionEPI
        fields = "__all__"


class RisqueSerializer(serializers.ModelSerializer):

    class Meta:
        model = Risque
        fields = "__all__"


class VersionRisqueSerializer(serializers.ModelSerializer):

    risque_detail = RisqueSerializer(
        source="risque",
        read_only=True,
    )

    class Meta:
        model = VersionRisque
        fields = "__all__"


class OutillageSerializer(serializers.ModelSerializer):

    class Meta:
        model = Outillage
        fields = "__all__"


class VersionOutillageSerializer(serializers.ModelSerializer):

    outillage_detail = OutillageSerializer(
        source="outillage",
        read_only=True,
    )

    class Meta:
        model = VersionOutillage
        fields = "__all__"


class PieceRechangeSerializer(serializers.ModelSerializer):

    class Meta:
        model = PieceRechange
        fields = "__all__"


class VersionPieceRechangeSerializer(serializers.ModelSerializer):

    piece_detail = PieceRechangeSerializer(
        source="piece",
        read_only=True,
    )

    class Meta:
        model = VersionPieceRechange
        fields = "__all__"


class ActionEtapeSerializer(serializers.ModelSerializer):

    class Meta:
        model = ActionEtape
        fields = "__all__"


class EtapeImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = EtapeImage
        fields = "__all__"


class EtapeSerializer(serializers.ModelSerializer):

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


class DocumentLieSerializer(serializers.ModelSerializer):

    class Meta:
        model = DocumentLie
        fields = "__all__"


class RecommandationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Recommandation
        fields = "__all__"


class FichierGenereSerializer(serializers.ModelSerializer):

    class Meta:
        model = FichierGenere
        fields = "__all__"


class QRCodeGammeSerializer(serializers.ModelSerializer):

    class Meta:
        model = QRCodeGamme
        fields = "__all__"


class MediaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Media
        fields = "__all__"


class GammeVersionSerializer(serializers.ModelSerializer):

    etapes = EtapeSerializer(
        many=True,
        read_only=True,
    )

    epis = VersionEPISerializer(
        source="version_epis",
        many=True,
        read_only=True,
    )

    risques = VersionRisqueSerializer(
        source="version_risques",
        many=True,
        read_only=True,
    )

    outillages = VersionOutillageSerializer(
        source="version_outillages",
        many=True,
        read_only=True,
    )

    pieces_rechange = VersionPieceRechangeSerializer(
        source="version_pieces_rechange",
        many=True,
        read_only=True,
    )

    documents = DocumentLieSerializer(
        many=True,
        read_only=True,
    )

    recommandations = RecommandationSerializer(
        many=True,
        read_only=True,
    )

    fichiers_generes = FichierGenereSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = GammeVersion
        fields = "__all__"