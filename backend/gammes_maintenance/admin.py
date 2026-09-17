from django.contrib import admin

from .models import (
    Equipement,
    GammeOperatoire,
    GammeVersion,
    EPI,
    Risque,
    Outillage,
    PieceRechange,
    DocumentLie,
    Recommandation,
    Etape,
    ActionEtape,
    EtapeImage,
    QRCodeGamme,
    FichierGenere,
    Media,
)


# ============================================================
# MODELES SIMPLES
# ============================================================

admin.site.register(
    Equipement
)

admin.site.register(
    GammeOperatoire
)

admin.site.register(
    GammeVersion
)

admin.site.register(
    EPI
)

admin.site.register(
    Risque
)

admin.site.register(
    Outillage
)

admin.site.register(
    PieceRechange
)

admin.site.register(
    DocumentLie
)

admin.site.register(
    Recommandation
)

admin.site.register(
    Etape
)

admin.site.register(
    ActionEtape
)

admin.site.register(
    EtapeImage
)

admin.site.register(
    QRCodeGamme
)

admin.site.register(
    FichierGenere
)

admin.site.register(
    Media
)


# ============================================================
# IMPORTANT
# ============================================================

# Les modèles suivants utilisent une clé primaire composite :
#
# VersionEPI
# VersionRisque
# VersionOutillage
# VersionPieceRechange
#
# Ils ne doivent pas être enregistrés directement dans
# Django Admin.