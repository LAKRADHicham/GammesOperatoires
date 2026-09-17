CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE gamme_versions
ADD COLUMN IF NOT EXISTS type_arret varchar(50);

UPDATE gamme_versions
SET type_arret = CASE WHEN arret IS TRUE THEN 'equipement' ELSE 'aucun' END
WHERE type_arret IS NULL;

CREATE TABLE IF NOT EXISTS epcs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom varchar(255) UNIQUE NOT NULL,
    description text,
    image_url text,
    actif boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS version_epcs (
    version_id uuid NOT NULL REFERENCES gamme_versions(id) ON DELETE CASCADE,
    epc_id uuid NOT NULL REFERENCES epcs(id) ON DELETE RESTRICT,
    PRIMARY KEY (version_id, epc_id)
);

CREATE TABLE IF NOT EXISTS profils_maintenance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom varchar(100) NOT NULL,
    prenom varchar(100),
    poste varchar(255),
    metier varchar(255),
    domaine varchar(255),
    actif boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referentiel_valeurs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie varchar(100) NOT NULL,
    code varchar(100) NOT NULL,
    libelle varchar(255) NOT NULL,
    ordre integer NOT NULL DEFAULT 0,
    actif boolean NOT NULL DEFAULT true,
    UNIQUE(categorie, code)
);

INSERT INTO referentiel_valeurs(categorie, code, libelle, ordre) VALUES
('type_maintenance','preventif','Préventive',10),
('type_maintenance','correctif','Corrective',20),
('type_maintenance','amelioratif','Améliorative',30),
('type_maintenance','conditionnel','Conditionnelle',40),
('type_maintenance','predictif','Prédictive',50),
('periodicite','chaque_intervention','À chaque intervention',10),
('periodicite','journaliere','Journalière',20),
('periodicite','hebdomadaire','Hebdomadaire',30),
('periodicite','mensuelle','Mensuelle',40),
('periodicite','trimestrielle','Trimestrielle',50),
('periodicite','semestrielle','Semestrielle',60),
('periodicite','annuelle','Annuelle',70),
('periodicite','2_ans','2 ans',80),
('periodicite','3_ans','3 ans',90),
('periodicite','compteur','Selon compteur',100),
('periodicite','conditionnelle','Conditionnelle',110),
('type_arret','aucun','Aucun arrêt',10),
('type_arret','equipement','Arrêt équipement',20),
('type_arret','partiel','Arrêt partiel',30),
('type_arret','ligne','Arrêt ligne',40),
('type_arret','total','Arrêt total',50)
ON CONFLICT(categorie, code) DO UPDATE
SET libelle = EXCLUDED.libelle, ordre = EXCLUDED.ordre, actif = true;

INSERT INTO epcs(nom, description) VALUES
('Balisage de zone','Délimitation et signalisation de la zone de travail'),
('Barrière de protection','Protection collective contre l’accès à une zone dangereuse'),
('Consignation / condamnation','Dispositif collectif de consignation des énergies'),
('Aspiration / ventilation','Protection collective contre poussières, fumées ou vapeurs')
ON CONFLICT(nom) DO NOTHING;
