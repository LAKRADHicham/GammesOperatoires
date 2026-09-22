from django.db import transaction

from django.db.models import (
    Max,
    Sum,
)

from django.utils import timezone

from ..models import (
    GammeVersion,
    VersionEPI,
    VersionRisque,
    VersionOutillage,
    VersionPieceRechange,
    Etape,
    ActionEtape,
    EtapeImage,
    DocumentLie,
    Recommandation,
)


# ============================================================
# RECALCUL DUREE
# ============================================================

def recalculate_duration(
    version,
):

    result = version.etapes.aggregate(
        total=Sum(
            "duree_minutes"
        )
    )

    total = (
        result["total"] or 0
    )

    version.duree_minutes = total

    version.updated_at = timezone.now()

    version.save(
        update_fields=[
            "duree_minutes",
            "updated_at",
        ]
    )

    return total


# ============================================================
# PROCHAIN NUMERO VERSION
# ============================================================

def get_next_version_number(
    gamme,
):

    max_number = gamme.versions.aggregate(
        max_number=Max(
            "numero_version"
        )
    )["max_number"]

    if max_number is None:

        return 0

    return max_number + 1


# ============================================================
# CLONER VERSION
# ============================================================

@transaction.atomic
def clone_version(
    source,
    user,
    modifications="Nouvelle révision",
):

    gamme = source.gamme

    next_number = get_next_version_number(
        gamme
    )

    # --------------------------------------------------------
    # REDACTEUR
    # --------------------------------------------------------

    if (
        user is not None
        and getattr(
            user,
            "is_authenticated",
            False,
        )
    ):

        redacteur = user.get_username()

    else:

        redacteur = None

    # --------------------------------------------------------
    # NOUVELLE VERSION
    # --------------------------------------------------------

    new_version = GammeVersion.objects.create(

        gamme=gamme,

        numero_version=
            next_number,

        code_version=
            f"V{next_number}",

        date_version=
            timezone.localdate(),

        redacteur=
            redacteur,

        valideur=
            None,

        modifications=
            modifications,

        statut=
            "en_cours_modification",

        type_maintenance=
            source.type_maintenance,

        periodicite=
            source.periodicite,

        main_oeuvre=
            source.main_oeuvre,

        duree_minutes=
            source.duree_minutes,

        referentiel=
            source.referentiel,

        rapport=
            source.rapport,

        production=
            source.production,

        arret=
            source.arret,

        degrade=
            source.degrade,

        created_at=
            timezone.now(),

        updated_at=
            timezone.now(),
    )

    # ========================================================
    # COPIE EPI
    # ========================================================

    epis = (
        source.version_epis
        .select_related(
            "epi"
        )
        .all()
    )

    for relation in epis:

        VersionEPI.objects.create(
            version=
                new_version,

            epi=
                relation.epi,
        )

    # ========================================================
    # COPIE RISQUES
    # ========================================================

    risques = (
        source.version_risques
        .select_related(
            "risque"
        )
        .all()
    )

    for relation in risques:

        VersionRisque.objects.create(
            version=
                new_version,

            risque=
                relation.risque,
        )

    # ========================================================
    # COPIE OUTILLAGES
    # ========================================================

    outillages = (
        source.version_outillages
        .select_related(
            "outillage"
        )
        .all()
    )

    for relation in outillages:

        VersionOutillage.objects.create(

            version=
                new_version,

            outillage=
                relation.outillage,

            quantite=
                relation.quantite,
        )

    # ========================================================
    # COPIE PIECES
    # ========================================================

    pieces = (
        source.version_pieces_rechange
        .select_related(
            "piece"
        )
        .all()
    )

    for relation in pieces:

        VersionPieceRechange.objects.create(

            version=
                new_version,

            piece=
                relation.piece,

            quantite=
                relation.quantite,
        )

    # ========================================================
    # COPIE ETAPES
    # ========================================================

    etapes = (
        source.etapes
        .prefetch_related(
            "actions",
            "images",
        )
        .order_by(
            "ordre"
        )
    )

    for old_etape in etapes:

        new_etape = Etape.objects.create(

            version=
                new_version,

            numero=
                old_etape.numero,

            titre=
                old_etape.titre,

            description=
                old_etape.description,

            duree_minutes=
                old_etape.duree_minutes,

            ordre=
                old_etape.ordre,

            created_at=
                timezone.now(),

            updated_at=
                timezone.now(),
        )

        # ====================================================
        # ACTIONS
        # ====================================================

        for old_action in (
            old_etape.actions.all()
        ):

            ActionEtape.objects.create(

                etape=
                    new_etape,

                ordre=
                    old_action.ordre,

                contenu=
                    old_action.contenu,

                created_at=
                    timezone.now(),
            )

        # ====================================================
        # IMAGES
        # ====================================================

        for old_image in (
            old_etape.images.all()
        ):

            EtapeImage.objects.create(

                etape=
                    new_etape,

                image_url=
                    old_image.image_url,

                description=
                    old_image.description,

                ordre=
                    old_image.ordre,

                created_at=
                    timezone.now(),
            )

    # ========================================================
    # DOCUMENTS
    # ========================================================

    for document in (
        source.documents.all()
    ):

        DocumentLie.objects.create(

            version=
                new_version,

            titre=
                document.titre,

            reference=
                document.reference,

            description=
                document.description,

            fichier_url=
                document.fichier_url,

            created_at=
                timezone.now(),
        )

    # ========================================================
    # RECOMMANDATIONS
    # ========================================================

    for recommandation in (
        source.recommandations.all()
    ):

        Recommandation.objects.create(

            version=
                new_version,

            titre=
                recommandation.titre,

            contenu=
                recommandation.contenu,

            created_at=
                timezone.now(),
        )

    # ========================================================
    # RECALCUL DUREE
    # ========================================================

    recalculate_duration(
        new_version
    )

    return new_version