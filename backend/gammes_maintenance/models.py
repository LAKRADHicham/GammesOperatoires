"""
====================================================================
MODELES DJANGO - APPLICATION GAMMES MAINTENANCE
====================================================================

Ce fichier contient les modèles Django représentant les tables
PostgreSQL / Supabase utilisées par l'application.

IMPORTANT :
-----------
La majorité des modèles utilisent :

    managed = False

Cela signifie que Django utilise les tables existantes dans Supabase,
mais qu'il ne doit pas créer, modifier ou supprimer ces tables.

Les modifications de structure de la base doivent donc être réalisées
directement dans PostgreSQL / Supabase.

====================================================================
"""

import uuid

from django.db import models
from django.utils import timezone


# ====================================================================
# EQUIPEMENTS
# ====================================================================

class Equipement(models.Model):
    """
    Représente un équipement physique présent sur le site.

    Cette table contient notamment :

    - l'identification de l'équipement ;
    - sa localisation ;
    - son domaine technique ;
    - son constructeur et son modèle ;
    - sa référence ;
    - les informations de maintenance associées ;
    - son statut actif/inactif.

    Table PostgreSQL correspondante :
        public.equipements
    """

    # ----------------------------------------------------------------
    # IDENTIFIANT TECHNIQUE
    # ----------------------------------------------------------------

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    # UUID unique utilisé comme clé primaire.
    #
    # Exemple :
    # 550e8400-e29b-41d4-a716-446655440000
    #
    # Cet identifiant est utilisé notamment pour les relations
    # avec d'autres tables comme gammes_operatoires.


    # ----------------------------------------------------------------
    # IDENTIFICATION DE L'EQUIPEMENT
    # ----------------------------------------------------------------

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    # Code unique de l'équipement.
    #
    # Exemples :
    # EQP-000001
    # EQP-000002
    # EQP-035561
    #
    # unique=True empêche deux équipements d'avoir le même code.


    nom = models.TextField()

    # Nom ou désignation de l'équipement.
    #
    # Correspond à la colonne Excel :
    # "Equipements"
    #
    # Exemple :
    # COFFRET PC
    # COLONNE DE CURAGE
    # POMPE DE RELEVAGE
    #
    # TextField est utilisé pour éviter la limite VARCHAR(255).


    # =================================================================
    # LOCALISATION
    # =================================================================

    batiment = models.TextField(
        null=True,
        blank=True,
    )

    # Bâtiment dans lequel se trouve l'équipement.
    #
    # Correspond à :
    # "Batiments/Building"


    etage = models.TextField(
        null=True,
        blank=True,
    )

    # Niveau / étage de l'équipement.
    #
    # Correspond à :
    # "Etage/Floor"
    #
    # Exemple :
    # ETAGE 0
    # ETAGE 1
    # SOUS-SOL


    local = models.TextField(
        null=True,
        blank=True,
    )

    # Localisation détaillée.
    #
    # Correspond à :
    # "Local"
    #
    # Exemple :
    # ZONE EXTERIEUR | ETAGE 0 | POINT S


    # =================================================================
    # CLASSIFICATION TECHNIQUE
    # =================================================================

    domaine = models.TextField(
        null=True,
        blank=True,
    )

    # Domaine technique de l'équipement.
    #
    # Correspond à :
    # "DOMAINE"
    #
    # Exemples :
    # ELECTRICITE
    # PLOMBERIE
    # CVC
    # MENUISERIE / SERRURERIE


    # =================================================================
    # CARACTERISTIQUES DE L'EQUIPEMENT
    # =================================================================

    reference = models.TextField(
        null=True,
        blank=True,
    )

    # Référence fabricant ou référence technique.
    #
    # Correspond à :
    # "REFERENCE"


    quantite = models.IntegerField(
        default=1,
    )

    # Nombre d'équipements représentés par cette ligne.
    #
    # Correspond à :
    # "QUANTITE"
    #
    # Par défaut :
    # 1


    constructeur = models.TextField(
        null=True,
        blank=True,
    )

    # Fabricant / marque.
    #
    # Correspond à :
    # "FABRICANT / MARQUE/BRAND"
    #
    # Exemples :
    # Schneider
    # Siemens
    # ABB
    # SICK


    modele = models.TextField(
        null=True,
        blank=True,
    )

    # Modèle de l'équipement.
    #
    # Correspond à :
    # "MODEL"


    # =================================================================
    # INFORMATIONS DE MAINTENANCE
    # =================================================================

    gamme_job_plan = models.TextField(
        null=True,
        blank=True,
    )

    # Gamme ou Job Plan associé à l'équipement.
    #
    # Correspond à :
    # "GAMME / Job plans"
    #
    # Exemple :
    # PREVENTIVE | 1A | MENUISERIE / SERRURERIE


    date_intervention = models.DateField(
        null=True,
        blank=True,
    )

    # Date d'intervention associée à l'équipement.
    #
    # Correspond à :
    # "intervention Date"
    #
    # PostgreSQL stocke la date au format :
    # YYYY-MM-DD
    #
    # Exemple :
    # 2025-12-31


    workorder_genere_par = models.TextField(
        null=True,
        blank=True,
    )

    # Indique la source ou l'élément ayant généré
    # le Work Order.
    #
    # Correspond à :
    # "Workorder généré par"


    # =================================================================
    # INFORMATIONS COMPLEMENTAIRES
    # =================================================================

    type = models.TextField(
        null=True,
        blank=True,
    )

    # Type d'équipement.
    #
    # Ce champ existait déjà dans l'ancienne structure.
    # Il est conservé pour assurer la compatibilité avec
    # le reste de l'application.


    description = models.TextField(
        null=True,
        blank=True,
    )

    # Description libre de l'équipement.


    # =================================================================
    # STATUT
    # =================================================================

    actif = models.BooleanField(
        default=True,
    )

    # Indique si l'équipement est actif.
    #
    # True  = équipement actif
    # False = équipement désactivé


    # =================================================================
    # TRAÇABILITE
    # =================================================================

    # Date de création de l’équipement.
    # Django renseigne automatiquement cette valeur lors du INSERT.
    # Cela évite d’envoyer NULL à Supabase lorsque created_at est NOT NULL.
    created_at = models.DateTimeField(
        default=timezone.now,
        editable=False,
    )

    # Date de dernière modification.
    # auto_now=True renseigne la date à la création et la met à jour à chaque save().
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        # Django ne gère pas physiquement cette table.
        # La structure est gérée directement dans Supabase.
        managed = False

        # Nom exact de la table PostgreSQL.
        db_table = "equipements"


    def __str__(self):
        """
        Représentation lisible de l'équipement.

        Exemple :
            EQP-000001 - COFFRET PC
        """
        return f"{self.code} - {self.nom}"


# ====================================================================
# GAMMES OPERATOIRES
# ====================================================================

class GammeOperatoire(models.Model):
    """
    Représente une gamme opératoire de maintenance.

    Une gamme peut être associée à un équipement grâce
    au champ equipement.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    code = models.CharField(
        max_length=100,
        unique=True,
    )

    # Code unique de la gamme opératoire.


    designation = models.CharField(
        max_length=500,
    )

    # Nom / désignation de la gamme.


    abreviation = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    # Abréviation éventuellement utilisée pour la gamme.


    equipement = models.ForeignKey(
        Equipement,
        models.DO_NOTHING,
        db_column="equipement_id",
        related_name="gammes",
        null=True,
        blank=True,
    )

    # Relation entre une gamme et un équipement.
    #
    # Dans PostgreSQL, la colonne utilisée est :
    #
    # equipement_id
    #
    # Elle contient l'UUID de l'équipement.
    #
    # related_name="gammes" permet par exemple :
    #
    # equipement.gammes.all()


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


# ====================================================================
# VERSIONS DES GAMMES
# ====================================================================

class GammeVersion(models.Model):
    """
    Représente une version d'une gamme opératoire.

    Une même gamme peut avoir plusieurs versions.
    """

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

        # Une gamme ne peut avoir qu'une seule fois
        # le même numéro de version.
        unique_together = (
            ("gamme", "numero_version"),
        )

    def __str__(self):
        return f"{self.gamme.code} - {self.code_version}"


# ====================================================================
# EPI - EQUIPEMENTS DE PROTECTION INDIVIDUELLE
# ====================================================================

class EPI(models.Model):
    """
    Référentiel des équipements de protection individuelle.
    """

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


# ====================================================================
# ASSOCIATION VERSION DE GAMME <-> EPI
# ====================================================================

class VersionEPI(models.Model):
    """
    Table d'association entre une version de gamme et un EPI.
    """

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


# ====================================================================
# RISQUES
# ====================================================================

class Risque(models.Model):
    """
    Référentiel des risques pouvant être associés
    aux opérations de maintenance.
    """

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
    """
    Association entre une version de gamme et un risque.
    """

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


# ====================================================================
# OUTILLAGES
# ====================================================================

class Outillage(models.Model):
    """
    Référentiel des outils utilisés pendant les interventions.
    """

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
    """
    Association entre une version de gamme et un outillage.

    La quantité nécessaire peut également être renseignée.
    """

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


# ====================================================================
# PIECES DE RECHANGE
# ====================================================================

class PieceRechange(models.Model):
    """
    Référentiel des pièces de rechange.
    """

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
    """
    Association entre une version de gamme et une pièce de rechange.
    """

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


# ====================================================================
# ETAPES DES GAMMES
# ====================================================================

class Etape(models.Model):
    """
    Représente une étape d'une version de gamme.
    """

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

        # Le numéro d'étape doit être unique
        # à l'intérieur d'une même version.
        unique_together = (
            ("version", "numero"),
        )

    def __str__(self):
        return f"{self.numero} - {self.titre}"


# ====================================================================
# ACTIONS DES ETAPES
# ====================================================================

class ActionEtape(models.Model):
    """
    Action élémentaire appartenant à une étape.
    """

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


# ====================================================================
# IMAGES DES ETAPES
# ====================================================================

class EtapeImage(models.Model):
    """
    Image ou illustration associée à une étape.
    """

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


# ====================================================================
# DOCUMENTS LIES
# ====================================================================

class DocumentLie(models.Model):
    """
    Document associé à une version de gamme.

    Exemple :
    - notice fabricant ;
    - procédure ;
    - schéma ;
    - documentation technique.
    """

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


# ====================================================================
# RECOMMANDATIONS
# ====================================================================

class Recommandation(models.Model):
    """
    Recommandation associée à une version de gamme.
    """

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


# ====================================================================
# QR CODE DES GAMMES
# ====================================================================

class QRCodeGamme(models.Model):
    """
    QR Code associé à une gamme opératoire.

    Une gamme possède au maximum un QR Code.
    """

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


# ====================================================================
# FICHIERS GENERES
# ====================================================================

class FichierGenere(models.Model):
    """
    Fichier généré automatiquement pour une version de gamme.

    Exemple :
    - PDF ;
    - document ;
    - export.
    """

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


# ====================================================================
# MEDIAS
# ====================================================================

class Media(models.Model):
    """
    Bibliothèque de médias de l'application.
    """

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