import uuid

from django.db import models


# ============================================================
# EQUIPEMENTS
# ============================================================

class Equipement(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    code = models.CharField(
        max_length=100,
        unique=True,
    )

    nom = models.CharField(
        max_length=255,
    )

    constructeur = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    type = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    reference = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    actif = models.BooleanField(
        null=True,
        blank=True,
        default=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    updated_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "equipements"

    def __str__(self):
        return f"{self.code} - {self.nom}"


# ============================================================
# GAMMES OPERATOIRES
# ============================================================

class GammeOperatoire(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    code = models.CharField(
        max_length=100,
        unique=True,
    )

    designation = models.CharField(
        max_length=500,
    )

    abreviation = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    equipement = models.ForeignKey(
        Equipement,
        models.DO_NOTHING,
        db_column="equipement_id",
        related_name="gammes",
        null=True,
        blank=True,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    actif = models.BooleanField(
        null=True,
        blank=True,
        default=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    updated_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "gammes_operatoires"

    def __str__(self):
        return f"{self.code} - {self.designation}"


# ============================================================
# VERSIONS DES GAMMES
# ============================================================

class GammeVersion(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    gamme = models.ForeignKey(
        GammeOperatoire,
        models.DO_NOTHING,
        db_column="gamme_id",
        related_name="versions",
    )

    numero_version = models.IntegerField()

    code_version = models.CharField(
        max_length=20,
    )

    date_version = models.DateField()

    redacteur = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    valideur = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    modifications = models.TextField(
        null=True,
        blank=True,
    )

    statut = models.TextField(
        null=True,
        blank=True,
    )

    type_maintenance = models.TextField(
        null=True,
        blank=True,
    )

    periodicite = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    main_oeuvre = models.IntegerField(
        null=True,
        blank=True,
    )

    duree_minutes = models.IntegerField(
        null=True,
        blank=True,
    )

    referentiel = models.BooleanField(
        null=True,
        blank=True,
    )

    rapport = models.BooleanField(
        null=True,
        blank=True,
    )

    production = models.BooleanField(
        null=True,
        blank=True,
    )

    arret = models.BooleanField(
        null=True,
        blank=True,
    )

    degrade = models.BooleanField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    updated_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "gamme_versions"

        unique_together = (
            ("gamme", "numero_version"),
        )

    def __str__(self):
        return f"{self.gamme.code} - {self.code_version}"


# ============================================================
# EPI
# ============================================================

class EPI(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    nom = models.CharField(
        max_length=255,
        unique=True,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    image_url = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "epis"

    def __str__(self):
        return self.nom


# ============================================================
# VERSION - EPI
# ============================================================

class VersionEPI(models.Model):
    pk = models.CompositePrimaryKey(
        "version_id",
        "epi_id",
    )

    version = models.ForeignKey(
        GammeVersion,
        models.DO_NOTHING,
        db_column="version_id",
        related_name="version_epis",
    )

    epi = models.ForeignKey(
        EPI,
        models.DO_NOTHING,
        db_column="epi_id",
        related_name="epi_versions",
    )

    class Meta:
        managed = False
        db_table = "version_epis"

    def __str__(self):
        return f"{self.version.code_version} - {self.epi.nom}"


# ============================================================
# RISQUES
# ============================================================

class Risque(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    nom = models.CharField(
        max_length=255,
        unique=True,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    image_url = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "risques"

    def __str__(self):
        return self.nom


class VersionRisque(models.Model):
    pk = models.CompositePrimaryKey(
        "version_id",
        "risque_id",
    )

    version = models.ForeignKey(
        GammeVersion,
        models.DO_NOTHING,
        db_column="version_id",
        related_name="version_risques",
    )

    risque = models.ForeignKey(
        Risque,
        models.DO_NOTHING,
        db_column="risque_id",
        related_name="risque_versions",
    )

    class Meta:
        managed = False
        db_table = "version_risques"

    def __str__(self):
        return f"{self.version.code_version} - {self.risque.nom}"


# ============================================================
# OUTILLAGES
# ============================================================

class Outillage(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    nom = models.CharField(
        max_length=255,
        unique=True,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    image_url = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "outillages"

    def __str__(self):
        return self.nom


class VersionOutillage(models.Model):
    pk = models.CompositePrimaryKey(
        "version_id",
        "outillage_id",
    )

    version = models.ForeignKey(
        GammeVersion,
        models.DO_NOTHING,
        db_column="version_id",
        related_name="version_outillages",
    )

    outillage = models.ForeignKey(
        Outillage,
        models.DO_NOTHING,
        db_column="outillage_id",
        related_name="outillage_versions",
    )

    quantite = models.IntegerField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "version_outillages"

    def __str__(self):
        return f"{self.version.code_version} - {self.outillage.nom}"


# ============================================================
# PIECES DE RECHANGE
# ============================================================

class PieceRechange(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    code = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    nom = models.CharField(
        max_length=255,
    )

    constructeur = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    reference = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    image_url = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "pieces_rechange"

    def __str__(self):
        if self.code:
            return f"{self.code} - {self.nom}"

        return self.nom


class VersionPieceRechange(models.Model):
    pk = models.CompositePrimaryKey(
        "version_id",
        "piece_id",
    )

    version = models.ForeignKey(
        GammeVersion,
        models.DO_NOTHING,
        db_column="version_id",
        related_name="version_pieces_rechange",
    )

    piece = models.ForeignKey(
        PieceRechange,
        models.DO_NOTHING,
        db_column="piece_id",
        related_name="piece_versions",
    )

    quantite = models.IntegerField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "version_pieces_rechange"

    def __str__(self):
        return f"{self.version.code_version} - {self.piece.nom}"


# ============================================================
# ETAPES
# ============================================================

class Etape(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    version = models.ForeignKey(
        GammeVersion,
        models.DO_NOTHING,
        db_column="version_id",
        related_name="etapes",
    )

    numero = models.IntegerField()

    titre = models.CharField(
        max_length=500,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    duree_minutes = models.IntegerField(
        null=True,
        blank=True,
    )

    ordre = models.IntegerField()

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    updated_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "etapes"

        unique_together = (
            ("version", "numero"),
        )

    def __str__(self):
        return f"{self.numero} - {self.titre}"


# ============================================================
# ACTIONS ETAPES
# ============================================================

class ActionEtape(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    etape = models.ForeignKey(
        Etape,
        models.DO_NOTHING,
        db_column="etape_id",
        related_name="actions",
    )

    ordre = models.IntegerField()

    contenu = models.TextField()

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "actions_etapes"

        unique_together = (
            ("etape", "ordre"),
        )

    def __str__(self):
        return f"Action {self.ordre} - {self.etape.titre}"


# ============================================================
# IMAGES ETAPES
# ============================================================

class EtapeImage(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    etape = models.ForeignKey(
        Etape,
        models.DO_NOTHING,
        db_column="etape_id",
        related_name="images",
    )

    image_url = models.TextField()

    description = models.TextField(
        null=True,
        blank=True,
    )

    ordre = models.IntegerField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "etape_images"

    def __str__(self):
        return f"Image - {self.etape.titre}"


# ============================================================
# DOCUMENTS LIES
# ============================================================

class DocumentLie(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    version = models.ForeignKey(
        GammeVersion,
        models.DO_NOTHING,
        db_column="version_id",
        related_name="documents",
    )

    titre = models.CharField(
        max_length=255,
    )

    reference = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    fichier_url = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "documents_lies"

    def __str__(self):
        return self.titre


# ============================================================
# RECOMMANDATIONS
# ============================================================

class Recommandation(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    version = models.ForeignKey(
        GammeVersion,
        models.DO_NOTHING,
        db_column="version_id",
        related_name="recommandations",
    )

    titre = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    contenu = models.TextField()

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "recommandations"

    def __str__(self):
        return self.titre or "Recommandation"


# ============================================================
# QR CODE
# ============================================================

class QRCodeGamme(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    gamme = models.OneToOneField(
        GammeOperatoire,
        models.DO_NOTHING,
        db_column="gamme_id",
        related_name="qr_code",
    )

    token = models.UUIDField(
        unique=True,
        null=True,
        blank=True,
        default=uuid.uuid4,
    )

    actif = models.BooleanField(
        null=True,
        blank=True,
        default=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "qr_codes"

    def __str__(self):
        return f"QR - {self.gamme.code}"


# ============================================================
# FICHIERS GENERES
# ============================================================

class FichierGenere(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    version = models.ForeignKey(
        GammeVersion,
        models.DO_NOTHING,
        db_column="version_id",
        related_name="fichiers_generes",
    )

    type_fichier = models.CharField(
        max_length=20,
    )

    fichier_url = models.TextField()

    nom_fichier = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "fichiers_generes"

    def __str__(self):
        return self.nom_fichier or self.type_fichier


# ============================================================
# MEDIAS
# ============================================================

class Media(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    nom = models.CharField(
        max_length=255,
    )

    categorie = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    fichier_url = models.TextField()

    description = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "medias"

    def __str__(self):
        return self.nom