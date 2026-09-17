-- ============================================================
-- STATUTS DES FICHES - RÉFÉRENTIEL AFFICHÉ DANS L'APPLICATION
-- ============================================================
-- Valeurs demandées :
-- 1. En cours de création
-- 2. En cours de modification
-- 3. En cours de validation
-- 4. Archivé
--
-- Ce script met à jour le référentiel de listes déroulantes.
-- Il ne modifie pas encore la logique métier interne de versioning
-- (brouillon / validee / archivee) qui sera traitée séparément.

DELETE FROM referentiel_valeurs
WHERE categorie = 'statut_gamme';

INSERT INTO referentiel_valeurs (
    categorie,
    code,
    libelle,
    ordre,
    actif,
    created_at,
    updated_at
)
VALUES
    ('statut_gamme', 'en_creation', 'En cours de création', 1, TRUE, NOW(), NOW()),
    ('statut_gamme', 'en_modification', 'En cours de modification', 2, TRUE, NOW(), NOW()),
    ('statut_gamme', 'en_validation', 'En cours de validation', 3, TRUE, NOW(), NOW()),
    ('statut_gamme', 'archivee', 'Archivé', 4, TRUE, NOW(), NOW());

SELECT categorie, code, libelle, ordre
FROM referentiel_valeurs
WHERE categorie = 'statut_gamme'
ORDER BY ordre;
