# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class ActionsEtapes(models.Model):
    id = models.UUIDField(primary_key=True)
    etape = models.ForeignKey('Etapes', models.DO_NOTHING)
    ordre = models.IntegerField()
    contenu = models.TextField()
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'actions_etapes'
        unique_together = (('etape', 'ordre'),)


class DocumentsLies(models.Model):
    id = models.UUIDField(primary_key=True)
    version = models.ForeignKey('GammeVersions', models.DO_NOTHING)
    titre = models.CharField(max_length=255)
    reference = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    fichier_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'documents_lies'


class Epis(models.Model):
    id = models.UUIDField(primary_key=True)
    nom = models.CharField(unique=True, max_length=255)
    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'epis'


class Equipements(models.Model):
    id = models.UUIDField(primary_key=True)
    code = models.CharField(unique=True, max_length=100)
    nom = models.CharField(max_length=255)
    constructeur = models.CharField(max_length=255, blank=True, null=True)
    type = models.CharField(max_length=255, blank=True, null=True)
    reference = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    actif = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'equipements'


class EtapeImages(models.Model):
    id = models.UUIDField(primary_key=True)
    etape = models.ForeignKey('Etapes', models.DO_NOTHING)
    image_url = models.TextField()
    description = models.TextField(blank=True, null=True)
    ordre = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'etape_images'


class Etapes(models.Model):
    id = models.UUIDField(primary_key=True)
    version = models.ForeignKey('GammeVersions', models.DO_NOTHING)
    numero = models.IntegerField()
    titre = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    duree_minutes = models.IntegerField(blank=True, null=True)
    ordre = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'etapes'
        unique_together = (('version', 'numero'),)


class FichiersGeneres(models.Model):
    id = models.UUIDField(primary_key=True)
    version = models.ForeignKey('GammeVersions', models.DO_NOTHING)
    type_fichier = models.CharField(max_length=20)
    fichier_url = models.TextField()
    nom_fichier = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'fichiers_generes'


class GammeVersions(models.Model):
    id = models.UUIDField(primary_key=True)
    gamme = models.ForeignKey('GammesOperatoires', models.DO_NOTHING)
    numero_version = models.IntegerField()
    code_version = models.CharField(max_length=20)
    date_version = models.DateField()
    redacteur = models.CharField(max_length=255, blank=True, null=True)
    valideur = models.CharField(max_length=255, blank=True, null=True)
    modifications = models.TextField(blank=True, null=True)
    statut = models.TextField(blank=True, null=True)  # This field type is a guess.
    type_maintenance = models.TextField(blank=True, null=True)  # This field type is a guess.
    periodicite = models.CharField(max_length=100, blank=True, null=True)
    main_oeuvre = models.IntegerField(blank=True, null=True)
    duree_minutes = models.IntegerField(blank=True, null=True)
    referentiel = models.BooleanField(blank=True, null=True)
    rapport = models.BooleanField(blank=True, null=True)
    production = models.BooleanField(blank=True, null=True)
    arret = models.BooleanField(blank=True, null=True)
    degrade = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'gamme_versions'
        unique_together = (('gamme', 'numero_version'),)


class GammesOperatoires(models.Model):
    id = models.UUIDField(primary_key=True)
    code = models.CharField(unique=True, max_length=100)
    designation = models.CharField(max_length=500)
    abreviation = models.CharField(max_length=100, blank=True, null=True)
    equipement = models.ForeignKey(Equipements, models.DO_NOTHING, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    actif = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'gammes_operatoires'


class Medias(models.Model):
    id = models.UUIDField(primary_key=True)
    nom = models.CharField(max_length=255)
    categorie = models.CharField(max_length=100, blank=True, null=True)
    fichier_url = models.TextField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'medias'


class Outillages(models.Model):
    id = models.UUIDField(primary_key=True)
    nom = models.CharField(unique=True, max_length=255)
    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'outillages'


class PiecesRechange(models.Model):
    id = models.UUIDField(primary_key=True)
    code = models.CharField(unique=True, max_length=100, blank=True, null=True)
    nom = models.CharField(max_length=255)
    constructeur = models.CharField(max_length=255, blank=True, null=True)
    reference = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'pieces_rechange'


class QrCodes(models.Model):
    id = models.UUIDField(primary_key=True)
    gamme = models.OneToOneField(GammesOperatoires, models.DO_NOTHING)
    token = models.UUIDField(unique=True, blank=True, null=True)
    actif = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'qr_codes'


class Recommandations(models.Model):
    id = models.UUIDField(primary_key=True)
    version = models.ForeignKey(GammeVersions, models.DO_NOTHING)
    titre = models.CharField(max_length=255, blank=True, null=True)
    contenu = models.TextField()
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'recommandations'


class Risques(models.Model):
    id = models.UUIDField(primary_key=True)
    nom = models.CharField(unique=True, max_length=255)
    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'risques'


class VersionOutillages(models.Model):
    pk = models.CompositePrimaryKey('version_id', 'outillage_id')
    version = models.ForeignKey(GammeVersions, models.DO_NOTHING)
    outillage = models.ForeignKey(Outillages, models.DO_NOTHING)
    quantite = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'version_outillages'


class VersionPiecesRechange(models.Model):
    pk = models.CompositePrimaryKey('version_id', 'piece_id')
    version = models.ForeignKey(GammeVersions, models.DO_NOTHING)
    piece = models.ForeignKey(PiecesRechange, models.DO_NOTHING)
    quantite = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'version_pieces_rechange'


class VersionRisques(models.Model):
    pk = models.CompositePrimaryKey('version_id', 'risque_id')
    version = models.ForeignKey(GammeVersions, models.DO_NOTHING)
    risque = models.ForeignKey(Risques, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'version_risques'
