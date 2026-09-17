from pathlib import Path
import shutil

from django.conf import settings
from django.core.management.base import BaseCommand

from gammes_maintenance.models import (
    EPI,
    Outillage,
    PieceRechange,
    Risque,
)


RISQUES = [
    {
        "nom": "Risque mécanique",
        "description": "Coincement, entraînement, happement ou contact avec des pièces mécaniques en mouvement.",
        "image_url": "risques/mecanique.png",
    },
    {
        "nom": "Risque électrique",
        "description": "Contact direct ou indirect avec une source électrique pouvant provoquer électrisation, électrocution ou arc électrique.",
        "image_url": "risques/electrique.png",
    },
    {
        "nom": "Risque thermique",
        "description": "Contact avec des surfaces, fluides ou équipements à température élevée.",
        "image_url": "risques/thermique.png",
    },
    {
        "nom": "Chute de plain-pied",
        "description": "Glissade, trébuchement ou chute au même niveau pendant l'intervention.",
        "image_url": "risques/chute.png",
    },
    {
        "nom": "Chute de hauteur",
        "description": "Risque de chute depuis une plateforme, échelle, toiture, nacelle ou zone surélevée.",
        "image_url": "risques/chute.png",
    },
    {
        "nom": "Chute d'objets",
        "description": "Risque lié à la chute d'outils, de pièces ou de charges situées en hauteur.",
        "image_url": "risques/chute_objet.png",
    },
    {
        "nom": "Risque chimique",
        "description": "Exposition à des produits chimiques dangereux par contact, inhalation ou projection.",
        "image_url": "risques/chimique.png",
    },
    {
        "nom": "Coupure",
        "description": "Coupure par outil, arête vive, tôle ou pièce métallique.",
        "image_url": "risques/coupure.png",
    },
    {
        "nom": "Écrasement",
        "description": "Écrasement d'une partie du corps entre deux éléments ou sous une charge.",
        "image_url": "risques/ecrasement.png",
    },
    {
        "nom": "Accès interdit",
        "description": "Zone interdite aux personnes non autorisées pendant l'intervention.",
        "image_url": "risques/acces_interdit.png",
    },
    {
        "nom": "Incendie",
        "description": "Présence d'une source d'inflammation ou de matières pouvant provoquer un incendie.",
        "image_url": "risques/incendie.png",
    },
    {
        "nom": "Bruit",
        "description": "Exposition à un niveau sonore susceptible d'endommager l'audition.",
        "image_url": "risques/bruit.png",
    },
    {
        "nom": "Poussières",
        "description": "Exposition ou inhalation de poussières générées par l'installation ou l'intervention.",
        "image_url": "risques/poussiere.png",
    },
    {
        "nom": "Explosion / ATEX",
        "description": "Explosion liée à des gaz, vapeurs, poussières combustibles ou équipements sous pression.",
        "image_url": "risques/explosion.png",
    },
    {
        "nom": "TMS / Ergonomie",
        "description": "Troubles musculosquelettiques liés aux postures, efforts, manutentions ou gestes répétitifs.",
        "image_url": "risques/ergonomie.png",
    },
    {
        "nom": "Risque biologique",
        "description": "Exposition possible à des agents biologiques ou matières contaminées.",
        "image_url": "risques/biologique.png",
    },
    {
        "nom": "Convoyeur en mouvement",
        "description": "Happement, pincement ou entraînement par un convoyeur en fonctionnement.",
        "image_url": "risques/convoyeur.png",
    },
    {
        "nom": "Heurt / collision",
        "description": "Choc contre un équipement, une structure, un engin ou une personne.",
        "image_url": None,
    },
    {
        "nom": "Levage / charge suspendue",
        "description": "Risque associé aux opérations de levage et à la présence d'une charge suspendue.",
        "image_url": None,
    },
    {
        "nom": "Gaz sous pression",
        "description": "Présence de bouteilles, circuits ou équipements contenant du gaz sous pression.",
        "image_url": None,
    },
    {
        "nom": "Espace confiné",
        "description": "Atmosphère dangereuse, manque d'oxygène ou difficulté d'évacuation en espace confiné.",
        "image_url": None,
    },
    {
        "nom": "Froid",
        "description": "Exposition à des températures basses ou contact avec des surfaces froides.",
        "image_url": None,
    },
    {
        "nom": "Produit corrosif",
        "description": "Brûlure ou dégradation causée par un produit corrosif.",
        "image_url": None,
    },
    {
        "nom": "Haute pression / fluide sous pression",
        "description": "Projection ou injection de fluide liée à une pression hydraulique, pneumatique ou process.",
        "image_url": None,
    },
    {
        "nom": "Redémarrage intempestif",
        "description": "Remise en mouvement ou réalimentation non maîtrisée de l'équipement pendant l'intervention.",
        "image_url": None,
    },
]


EPIS = [
    ("Casque de sécurité", "Protection de la tête contre les chocs et chutes d'objets."),
    ("Casquette coquée", "Protection légère de la tête en environnement sans risque majeur de chute d'objet."),
    ("Casque avec jugulaire", "Protection de la tête adaptée notamment au travail en hauteur."),
    ("Lunettes de sécurité", "Protection des yeux contre projections et particules."),
    ("Lunettes étanches", "Protection renforcée contre poussières, liquides et projections."),
    ("Visière de protection", "Protection du visage contre projections, copeaux ou produits."),
    ("Écran facial", "Protection intégrale du visage pour opérations présentant un risque de projection."),
    ("Casque antibruit", "Protection auditive en environnement bruyant."),
    ("Bouchons d'oreilles", "Protection auditive individuelle contre l'exposition au bruit."),
    ("Masque FFP2", "Protection respiratoire contre poussières et particules."),
    ("Masque FFP3", "Protection respiratoire renforcée contre particules fines et aérosols."),
    ("Demi-masque respiratoire", "Protection respiratoire avec filtres adaptés au produit ou contaminant."),
    ("Gants de protection mécanique", "Protection des mains lors des opérations mécaniques courantes."),
    ("Gants anti-coupure", "Protection des mains contre arêtes vives et pièces métalliques."),
    ("Gants isolants électriques", "Protection adaptée aux opérations électriques selon niveau d'habilitation."),
    ("Gants chimiques", "Protection des mains lors de la manipulation de produits chimiques."),
    ("Gants thermiques", "Protection contre surfaces ou pièces chaudes/froides."),
    ("Chaussures de sécurité S1", "Protection des pieds en environnement industriel intérieur."),
    ("Chaussures de sécurité S3", "Protection renforcée des pieds, semelle anti-perforation et résistance à l'humidité."),
    ("Bottes de sécurité", "Protection des pieds en zone humide ou exposée aux projections."),
    ("Vêtements de travail", "Tenue adaptée aux opérations de maintenance."),
    ("Gilet haute visibilité", "Améliore la visibilité de l'intervenant en zone de circulation."),
    ("Combinaison de protection", "Protection du corps contre salissures et agressions liées à l'intervention."),
    ("Vêtements ignifugés", "Protection du corps en présence d'un risque thermique ou de flamme."),
    ("Harnais antichute", "Protection contre le risque de chute lors des travaux en hauteur."),
    ("Longe avec absorbeur d'énergie", "Équipement de liaison utilisé avec un harnais pour travaux en hauteur."),
]


OUTILLAGES = [
    ("Tournevis plat", "Serrage et desserrage de vis à fente."),
    ("Tournevis cruciforme", "Serrage et desserrage de vis cruciformes."),
    ("Tournevis Torx", "Serrage et desserrage de vis Torx."),
    ("Tournevis isolé", "Travaux électriques adaptés au domaine de tension."),
    ("Jeu de clés plates", "Serrage et desserrage d'écrous et boulons."),
    ("Jeu de clés mixtes", "Clés plates et à œil pour travaux mécaniques."),
    ("Jeu de clés Allen", "Serrage de vis six pans creux."),
    ("Clé à molette", "Clé réglable pour écrous de différentes dimensions."),
    ("Clé à pipe", "Serrage d'écrous dans des zones d'accès spécifiques."),
    ("Clé dynamométrique", "Serrage au couple spécifié."),
    ("Cliquet et douilles", "Serrage rapide avec assortiment de douilles."),
    ("Pince universelle", "Préhension, torsion et petits travaux mécaniques."),
    ("Pince coupante", "Coupe de fils, colliers ou petits éléments."),
    ("Pince à bec", "Préhension de petites pièces ou accès difficile."),
    ("Pince multiprise", "Préhension de raccords et pièces de différents diamètres."),
    ("Marteau", "Frappe et montage mécanique."),
    ("Maillet", "Frappe sans marquage important des surfaces."),
    ("Cutter", "Découpe de matériaux légers."),
    ("Scie à métaux", "Découpe de profils ou pièces métalliques."),
    ("Perceuse-visseuse", "Perçage et vissage."),
    ("Perforateur", "Perçage de supports durs."),
    ("Meuleuse", "Découpe, ébarbage et meulage."),
    ("Clé à choc", "Desserrage et serrage rapide d'assemblages."),
    ("Multimètre", "Mesure de tension, courant, résistance et continuité."),
    ("Pince ampèremétrique", "Mesure de courant sans ouverture du circuit."),
    ("VAT", "Vérification d'absence de tension."),
    ("Mégohmmètre", "Mesure de résistance d'isolement."),
    ("Caméra thermique", "Inspection thermographique des équipements."),
    ("Thermomètre infrarouge", "Mesure sans contact de température."),
    ("Vibromètre", "Mesure du niveau vibratoire des machines."),
    ("Tachymètre", "Mesure de vitesse de rotation."),
    ("Manomètre", "Mesure de pression."),
    ("Pied à coulisse", "Mesure dimensionnelle."),
    ("Micromètre", "Mesure dimensionnelle de précision."),
    ("Comparateur", "Contrôle de déplacement, jeu ou faux-rond."),
    ("Tensiomètre courroie", "Contrôle de tension des courroies."),
    ("Alignement laser", "Alignement d'arbres et machines tournantes."),
    ("Extracteur de roulement", "Démontage de roulements et bagues."),
    ("Pompe à graisse", "Graissage manuel des organes mécaniques."),
    ("Kit de consignation", "Cadenas, étiquettes et accessoires de consignation."),
    ("Escabeau industriel", "Accès en hauteur de faible niveau."),
    ("Nacelle élévatrice", "Accès sécurisé aux zones de travail en hauteur."),
]


PIECES = [
    ("BASE-MEC-001", "Roulement", "Transmission mécanique"),
    ("BASE-MEC-002", "Palier", "Transmission mécanique"),
    ("BASE-MEC-003", "Courroie", "Transmission mécanique"),
    ("BASE-MEC-004", "Chaîne de transmission", "Transmission mécanique"),
    ("BASE-MEC-005", "Pignon", "Transmission mécanique"),
    ("BASE-MEC-006", "Poulie", "Transmission mécanique"),
    ("BASE-MEC-007", "Accouplement", "Transmission mécanique"),
    ("BASE-MEC-008", "Rouleau de convoyeur", "Convoyage"),
    ("BASE-MEC-009", "Galet", "Convoyage"),
    ("BASE-MEC-010", "Bande transporteuse", "Convoyage"),
    ("BASE-MEC-011", "Tambour moteur", "Convoyage"),
    ("BASE-MEC-012", "Tambour de renvoi", "Convoyage"),
    ("BASE-MEC-013", "Guide chaîne", "Convoyage"),
    ("BASE-MEC-014", "Tendeur", "Transmission mécanique"),
    ("BASE-MEC-015", "Joint d'étanchéité", "Mécanique"),
    ("BASE-MEC-016", "Circlip", "Mécanique"),
    ("BASE-MEC-017", "Clavette", "Mécanique"),
    ("BASE-MOT-001", "Moteur électrique", "Motorisation"),
    ("BASE-MOT-002", "Motoréducteur", "Motorisation"),
    ("BASE-MOT-003", "Réducteur", "Motorisation"),
    ("BASE-MOT-004", "Frein moteur", "Motorisation"),
    ("BASE-MOT-005", "Ventilateur moteur", "Motorisation"),
    ("BASE-ELE-001", "Disjoncteur", "Électricité"),
    ("BASE-ELE-002", "Fusible", "Électricité"),
    ("BASE-ELE-003", "Contacteur", "Électricité"),
    ("BASE-ELE-004", "Relais", "Électricité"),
    ("BASE-ELE-005", "Relais thermique", "Électricité"),
    ("BASE-ELE-006", "Alimentation 24 VDC", "Électricité"),
    ("BASE-ELE-007", "Transformateur", "Électricité"),
    ("BASE-ELE-008", "Bornier", "Électricité"),
    ("BASE-ELE-009", "Sectionneur", "Électricité"),
    ("BASE-ELE-010", "Bouton poussoir", "Électricité"),
    ("BASE-ELE-011", "Bouton arrêt d'urgence", "Sécurité électrique"),
    ("BASE-ELE-012", "Voyant lumineux", "Électricité"),
    ("BASE-AUT-001", "Automate PLC", "Automatisme"),
    ("BASE-AUT-002", "Module d'entrées PLC", "Automatisme"),
    ("BASE-AUT-003", "Module de sorties PLC", "Automatisme"),
    ("BASE-AUT-004", "IHM", "Automatisme"),
    ("BASE-AUT-005", "Variateur de fréquence", "Automatisme"),
    ("BASE-AUT-006", "Servo variateur", "Automatisme"),
    ("BASE-AUT-007", "Codeur", "Automatisme"),
    ("BASE-AUT-008", "Capteur inductif", "Automatisme"),
    ("BASE-AUT-009", "Capteur photoélectrique", "Automatisme"),
    ("BASE-AUT-010", "Capteur capacitif", "Automatisme"),
    ("BASE-AUT-011", "Fin de course", "Automatisme"),
    ("BASE-AUT-012", "Barrière immatérielle", "Sécurité machine"),
    ("BASE-PNE-001", "Vérin pneumatique", "Pneumatique"),
    ("BASE-PNE-002", "Électrovanne pneumatique", "Pneumatique"),
    ("BASE-PNE-003", "Distributeur pneumatique", "Pneumatique"),
    ("BASE-PNE-004", "Pressostat", "Pneumatique"),
    ("BASE-PNE-005", "Régulateur pneumatique", "Pneumatique"),
    ("BASE-PNE-006", "Filtre pneumatique", "Pneumatique"),
    ("BASE-PNE-007", "Raccord pneumatique", "Pneumatique"),
    ("BASE-PNE-008", "Flexible pneumatique", "Pneumatique"),
    ("BASE-HYD-001", "Flexible hydraulique", "Hydraulique"),
    ("BASE-HYD-002", "Joint hydraulique", "Hydraulique"),
    ("BASE-HYD-003", "Filtre hydraulique", "Hydraulique"),
    ("BASE-HYD-004", "Pompe hydraulique", "Hydraulique"),
    ("BASE-HYD-005", "Électrovanne hydraulique", "Hydraulique"),
    ("BASE-HYD-006", "Capteur de pression", "Hydraulique"),
]


class Command(BaseCommand):
    help = "Installe ou met à jour le référentiel industriel standard."

    def handle(self, *args, **options):
        self.stdout.write("Installation du référentiel industriel...")

        self._install_risk_images()

        created_risques = self._seed_risques()
        created_epis = self._seed_epis()
        created_outillages = self._seed_outillages()
        created_pieces = self._seed_pieces()

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Référentiel installé avec succès."))
        self.stdout.write(
            f"Risques créés : {created_risques} / {len(RISQUES)}"
        )
        self.stdout.write(
            f"EPI créés : {created_epis} / {len(EPIS)}"
        )
        self.stdout.write(
            f"Outillages créés : {created_outillages} / {len(OUTILLAGES)}"
        )
        self.stdout.write(
            f"Pièces créées : {created_pieces} / {len(PIECES)}"
        )

    def _install_risk_images(self):
        source_dir = (
            Path(__file__).resolve().parents[2]
            / "seed_assets"
            / "risques"
        )

        media_root = Path(settings.MEDIA_ROOT)
        target_dir = media_root / "risques"
        target_dir.mkdir(parents=True, exist_ok=True)

        if not source_dir.exists():
            self.stdout.write(
                self.style.WARNING(
                    "Dossier seed_assets/risques absent : images non copiées."
                )
            )
            return

        copied = 0

        for source in source_dir.glob("*.png"):
            target = target_dir / source.name
            shutil.copy2(source, target)
            copied += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{copied} image(s) de risques copiée(s) vers {target_dir}"
            )
        )

    def _seed_risques(self):
        created_count = 0

        for row in RISQUES:
            defaults = {
                "description": row["description"],
                "image_url": row["image_url"],
            }

            _, created = Risque.objects.update_or_create(
                nom=row["nom"],
                defaults=defaults,
            )

            if created:
                created_count += 1

        return created_count

    def _seed_epis(self):
        created_count = 0

        for nom, description in EPIS:
            _, created = EPI.objects.update_or_create(
                nom=nom,
                defaults={
                    "description": description,
                },
            )

            if created:
                created_count += 1

        return created_count

    def _seed_outillages(self):
        created_count = 0

        for nom, description in OUTILLAGES:
            _, created = Outillage.objects.update_or_create(
                nom=nom,
                defaults={
                    "description": description,
                },
            )

            if created:
                created_count += 1

        return created_count

    def _seed_pieces(self):
        created_count = 0

        for code, nom, categorie in PIECES:
            description = (
                f"Pièce standard de maintenance — catégorie : {categorie}."
            )

            _, created = PieceRechange.objects.update_or_create(
                code=code,
                defaults={
                    "nom": nom,
                    "description": description,
                },
            )

            if created:
                created_count += 1

        return created_count
