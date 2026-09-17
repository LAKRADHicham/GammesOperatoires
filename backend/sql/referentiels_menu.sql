CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS referentiel_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    libelle VARCHAR(255) NOT NULL,
    type_source VARCHAR(30) NOT NULL DEFAULT 'generic',
    table_source VARCHAR(100),
    ordre INTEGER NOT NULL DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referentiel_valeurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    ordre INTEGER NOT NULL DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_referentiel_valeur UNIQUE (categorie, code)
);

CREATE INDEX IF NOT EXISTS idx_referentiel_valeurs_categorie
ON referentiel_valeurs(categorie);

CREATE INDEX IF NOT EXISTS idx_referentiel_valeurs_actif
ON referentiel_valeurs(actif);

INSERT INTO referentiel_categories
(code, libelle, type_source, table_source, ordre, actif)
VALUES
('corps_metier', 'Corps de Métier', 'generic', NULL, 1, TRUE),
('type_maintenance', 'Type de Maintenance', 'generic', NULL, 2, TRUE),
('periodicite', 'Périodicité', 'generic', NULL, 3, TRUE),
('epi', 'EPI', 'table', 'epis', 4, TRUE),
('epc', 'EPC', 'table', 'epcs', 5, TRUE),
('outils', 'Outils', 'table', 'outillages', 6, TRUE),
('risques', 'Risques', 'table', 'risques', 7, TRUE),
('type_arret', 'Type d''arrêt', 'generic', NULL, 8, TRUE),
('profil', 'Profil', 'generic', NULL, 9, TRUE),
('statut_gamme', 'Statut de la Gamme', 'generic', NULL, 10, TRUE),
('type_redaction', 'Type de rédaction', 'generic', NULL, 11, TRUE)
ON CONFLICT (code)
DO UPDATE SET
    libelle = EXCLUDED.libelle,
    type_source = EXCLUDED.type_source,
    table_source = EXCLUDED.table_source,
    ordre = EXCLUDED.ordre,
    actif = EXCLUDED.actif,
    updated_at = NOW();

INSERT INTO referentiel_valeurs
(categorie, code, libelle, ordre, actif)
VALUES
('corps_metier', 'electrique', 'Electrique', 1, TRUE),
('corps_metier', 'mecanique', 'Mecanique', 2, TRUE),
('corps_metier', 'plombier', 'Plombier', 3, TRUE),
('corps_metier', 'hvac', 'HVAC', 4, TRUE),
('type_redaction', 'redaction_complete', 'Rédaction Complète', 1, TRUE),
('type_redaction', 'revision', 'Révision', 2, TRUE),
('type_maintenance', 'preventif', 'Préventive', 1, TRUE),
('type_maintenance', 'correctif', 'Corrective', 2, TRUE),
('type_maintenance', 'amelioratif', 'Améliorative', 3, TRUE),
('type_maintenance', 'conditionnel', 'Conditionnelle', 4, TRUE),
('type_maintenance', 'predictif', 'Prédictive', 5, TRUE),
('periodicite', 'chaque_intervention', 'À chaque intervention', 1, TRUE),
('periodicite', 'journaliere', 'Journalière', 2, TRUE),
('periodicite', 'hebdomadaire', 'Hebdomadaire', 3, TRUE),
('periodicite', 'mensuelle', 'Mensuelle', 4, TRUE),
('periodicite', 'trimestrielle', 'Trimestrielle', 5, TRUE),
('periodicite', 'semestrielle', 'Semestrielle', 6, TRUE),
('periodicite', 'annuelle', 'Annuelle', 7, TRUE),
('periodicite', '2_ans', '2 ans', 8, TRUE),
('periodicite', '3_ans', '3 ans', 9, TRUE),
('periodicite', 'compteur', 'Selon compteur', 10, TRUE),
('periodicite', 'conditionnelle', 'Conditionnelle', 11, TRUE),
('type_arret', 'aucun', 'Aucun arrêt', 1, TRUE),
('type_arret', 'equipement', 'Arrêt équipement', 2, TRUE),
('type_arret', 'partiel', 'Arrêt partiel', 3, TRUE),
('type_arret', 'ligne', 'Arrêt ligne', 4, TRUE),
('type_arret', 'total', 'Arrêt total', 5, TRUE),
('profil', 'admin', 'Administrateur', 1, TRUE),
('profil', 'redacteur', 'Rédacteur', 2, TRUE),
('profil', 'valideur', 'Valideur', 3, TRUE),
('profil', 'technicien', 'Technicien', 4, TRUE),
('statut_gamme', 'brouillon', 'Brouillon', 1, TRUE),
('statut_gamme', 'en_validation', 'En validation', 2, TRUE),
('statut_gamme', 'validee', 'Validée', 3, TRUE),
('statut_gamme', 'archivee', 'Archivée', 4, TRUE)
ON CONFLICT (categorie, code)
DO UPDATE SET
    libelle = EXCLUDED.libelle,
    ordre = EXCLUDED.ordre,
    actif = EXCLUDED.actif,
    updated_at = NOW();

CREATE TABLE IF NOT EXISTS epcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS version_epcs (
    version_id UUID NOT NULL REFERENCES gamme_versions(id) ON DELETE CASCADE,
    epc_id UUID NOT NULL REFERENCES epcs(id) ON DELETE RESTRICT,
    PRIMARY KEY (version_id, epc_id)
);

ALTER TABLE gammes_operatoires
ADD COLUMN IF NOT EXISTS corps_metier VARCHAR(100);

ALTER TABLE gammes_operatoires
ADD COLUMN IF NOT EXISTS type_redaction VARCHAR(100);

ALTER TABLE gammes_operatoires
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE gamme_versions
ADD COLUMN IF NOT EXISTS type_arret VARCHAR(50);

UPDATE gamme_versions
SET type_arret = CASE
    WHEN COALESCE(arret, FALSE) = FALSE THEN 'aucun'
    ELSE 'equipement'
END
WHERE type_arret IS NULL;

COMMENT ON COLUMN gammes_operatoires.image_url
IS 'Image principale de la gamme. Peut temporairement contenir une data URL base64.';
