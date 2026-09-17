from django.db import connection, transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


def dictfetchall(cursor):
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def dictfetchone(cursor):
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [column[0] for column in cursor.description]
    return dict(zip(columns, row))


class ReferentielCategoriesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, code, libelle, type_source, table_source, ordre, actif
                FROM referentiel_categories
                WHERE actif = TRUE
                ORDER BY ordre, libelle
                """
            )
            return Response(dictfetchall(cursor))


class ReferentielValeursAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categorie = (request.query_params.get("categorie") or "").strip()
        include_inactive = (
            request.query_params.get("include_inactive", "false").lower() == "true"
        )

        if not categorie:
            return Response(
                {"detail": "Le paramètre categorie est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        where_actif = "" if include_inactive else "AND actif = TRUE"

        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT id, categorie, code, libelle, ordre, actif,
                       created_at, updated_at
                FROM referentiel_valeurs
                WHERE categorie = %s
                {where_actif}
                ORDER BY ordre, libelle
                """,
                [categorie],
            )
            return Response(dictfetchall(cursor))

    @transaction.atomic
    def post(self, request):
        categorie = (request.data.get("categorie") or "").strip()
        code = (request.data.get("code") or "").strip().lower().replace(" ", "_")
        libelle = (request.data.get("libelle") or "").strip()
        ordre = request.data.get("ordre", 0)
        actif = bool(request.data.get("actif", True))

        if not categorie or not code or not libelle:
            return Response(
                {"detail": "categorie, code et libelle sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO referentiel_valeurs
                    (categorie, code, libelle, ordre, actif)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, categorie, code, libelle, ordre, actif,
                          created_at, updated_at
                """,
                [categorie, code, libelle, ordre, actif],
            )
            created = dictfetchone(cursor)

        return Response(created, status=status.HTTP_201_CREATED)


class ReferentielValeurDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, valeur_id):
        allowed = {"code", "libelle", "ordre", "actif"}
        payload = {key: request.data[key] for key in allowed if key in request.data}

        if not payload:
            return Response(
                {"detail": "Aucune donnée à modifier."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignments = []
        params = []

        for key, value in payload.items():
            if key == "code" and isinstance(value, str):
                value = value.strip().lower().replace(" ", "_")
            if key == "libelle" and isinstance(value, str):
                value = value.strip()
            assignments.append(f"{key} = %s")
            params.append(value)

        assignments.append("updated_at = NOW()")
        params.append(valeur_id)

        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                UPDATE referentiel_valeurs
                SET {', '.join(assignments)}
                WHERE id = %s
                RETURNING id, categorie, code, libelle, ordre, actif,
                          created_at, updated_at
                """,
                params,
            )
            updated = dictfetchone(cursor)

        if updated is None:
            return Response(
                {"detail": "Valeur introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(updated)

    def delete(self, request, valeur_id):
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM referentiel_valeurs WHERE id = %s RETURNING id",
                [valeur_id],
            )
            deleted = cursor.fetchone()

        if deleted is None:
            return Response(
                {"detail": "Valeur introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class EPCListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        include_inactive = (
            request.query_params.get("include_inactive", "false").lower() == "true"
        )
        where_actif = "" if include_inactive else "WHERE actif = TRUE"

        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT id, nom, description, image_url, actif
                FROM epcs
                {where_actif}
                ORDER BY nom
                """
            )
            return Response(dictfetchall(cursor))

    def post(self, request):
        nom = (request.data.get("nom") or "").strip()
        if not nom:
            return Response(
                {"detail": "Le nom est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO epcs (nom, description, image_url, actif)
                VALUES (%s, %s, %s, TRUE)
                ON CONFLICT (nom) DO UPDATE SET
                    description = EXCLUDED.description,
                    image_url = EXCLUDED.image_url,
                    actif = TRUE,
                    updated_at = NOW()
                RETURNING id, nom, description, image_url, actif
                """,
                [nom, request.data.get("description"), request.data.get("image_url")],
            )
            row = dictfetchone(cursor)

        return Response(row, status=status.HTTP_201_CREATED)


class EPCDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, epc_id):
        nom = request.data.get("nom")
        description = request.data.get("description")
        image_url = request.data.get("image_url")
        actif = request.data.get("actif")

        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE epcs
                SET nom = COALESCE(NULLIF(%s, ''), nom),
                    description = COALESCE(%s, description),
                    image_url = COALESCE(%s, image_url),
                    actif = COALESCE(%s, actif),
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id, nom, description, image_url, actif
                """,
                [nom, description, image_url, actif, epc_id],
            )
            row = dictfetchone(cursor)

        if row is None:
            return Response({"detail": "EPC introuvable."}, status=404)
        return Response(row)

    def delete(self, request, epc_id):
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM epcs WHERE id = %s RETURNING id", [epc_id])
            deleted = cursor.fetchone()
        if deleted is None:
            return Response({"detail": "EPC introuvable."}, status=404)
        return Response(status=204)


class VersionEPCListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        version = request.data.get("version")
        epc = request.data.get("epc")
        if not version or not epc:
            return Response(
                {"detail": "version et epc sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO version_epcs (version_id, epc_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
                """,
                [version, epc],
            )

        return Response({"version": version, "epc": epc}, status=201)


class VersionMetadataAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, version_id):
        type_arret = request.data.get("type_arret")
        redacteur = request.data.get("redacteur")
        valideur = request.data.get("valideur")

        with connection.cursor() as cursor:
            cursor.execute("SELECT statut FROM gamme_versions WHERE id = %s", [version_id])
            row = cursor.fetchone()
            if not row:
                return Response({"detail": "Version introuvable."}, status=404)

            if row[0] in {"validee", "archivee"}:
                return Response(
                    {"detail": "Une version validée ou archivée est non modifiable."},
                    status=409,
                )

            cursor.execute(
                """
                UPDATE gamme_versions
                SET type_arret = COALESCE(%s, type_arret),
                    arret = CASE
                        WHEN %s IS NULL THEN arret
                        WHEN %s = 'aucun' THEN FALSE
                        ELSE TRUE
                    END,
                    redacteur = COALESCE(NULLIF(%s, ''), redacteur),
                    valideur = COALESCE(NULLIF(%s, ''), valideur),
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id, type_arret, redacteur, valideur, arret
                """,
                [type_arret, type_arret, type_arret, redacteur, valideur, version_id],
            )
            result = dictfetchone(cursor)

        return Response(result)


class GammeExtraMetadataAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, gamme_id):
        corps_metier = request.data.get("corps_metier")
        type_redaction = request.data.get("type_redaction")
        image_url = request.data.get("image_url")

        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE gammes_operatoires
                SET corps_metier = COALESCE(%s, corps_metier),
                    type_redaction = COALESCE(%s, type_redaction),
                    image_url = COALESCE(%s, image_url),
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id, code, designation, abreviation,
                          corps_metier, type_redaction, image_url
                """,
                [corps_metier, type_redaction, image_url, gamme_id],
            )
            result = dictfetchone(cursor)

        if result is None:
            return Response({"detail": "Gamme introuvable."}, status=404)
        return Response(result)
