from django.urls import path

from .v2_api import (
    EPCDetailAPIView,
    EPCListCreateAPIView,
    GammeExtraMetadataAPIView,
    ReferentielCategoriesAPIView,
    ReferentielValeurDetailAPIView,
    ReferentielValeursAPIView,
    VersionEPCListCreateAPIView,
    VersionMetadataAPIView,
)

urlpatterns = [
    path(
        "referentiel-categories/",
        ReferentielCategoriesAPIView.as_view(),
        name="v2-referentiel-categories",
    ),
    path(
        "referentiels/",
        ReferentielValeursAPIView.as_view(),
        name="v2-referentiels",
    ),
    path(
        "referentiels/<uuid:valeur_id>/",
        ReferentielValeurDetailAPIView.as_view(),
        name="v2-referentiel-detail",
    ),
    path("epcs/", EPCListCreateAPIView.as_view(), name="v2-epcs"),
    path("epcs/<uuid:epc_id>/", EPCDetailAPIView.as_view(), name="v2-epc-detail"),
    path(
        "version-epcs/",
        VersionEPCListCreateAPIView.as_view(),
        name="v2-version-epcs",
    ),
    path(
        "versions/<uuid:version_id>/metadata/",
        VersionMetadataAPIView.as_view(),
        name="v2-version-metadata",
    ),
    path(
        "gammes/<uuid:gamme_id>/metadata/",
        GammeExtraMetadataAPIView.as_view(),
        name="v2-gamme-metadata",
    ),
]
