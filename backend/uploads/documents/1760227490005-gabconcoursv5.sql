-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  jeu. 09 oct. 2025 à 20:43
-- Version du serveur :  10.4.10-MariaDB
-- Version de PHP :  7.3.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `gabconcoursv5`
--

DELIMITER $$
--
-- Fonctions
--
DROP FUNCTION IF EXISTS `has_role`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `has_role` (`_user_id` INT, `_role` VARCHAR(50)) RETURNS TINYINT(1) READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE role_exists BOOLEAN;

    SELECT EXISTS(
        SELECT 1
        FROM user_roles
        WHERE user_id = _user_id
        AND role = _role
    ) INTO role_exists;

    RETURN role_exists;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `administrateurs`
--

DROP TABLE IF EXISTS `administrateurs`;
CREATE TABLE IF NOT EXISTS `administrateurs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin_etablissement') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin_etablissement',
  `etablissement_id` int(11) DEFAULT NULL,
  `statut` enum('actif','inactif','suspendu') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'actif',
  `derniere_connexion` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `etablissement_id` (`etablissement_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_statut` (`statut`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `administrateurs`
--

INSERT INTO `administrateurs` (`id`, `nom`, `prenom`, `email`, `password`, `role`, `etablissement_id`, `statut`, `derniere_connexion`, `password_reset_token`, `password_reset_expires`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 'Super', 'Admin', 'supadmin@gabconcours.ga', '$2b$12$y0nT59Z4MZ1Nnwmi1jAi7OAtBOuc/IMbZuktvjNQZthQ1MkovU79O', 'super_admin', NULL, 'actif', '2025-10-09 16:44:16', NULL, NULL, NULL, '2025-10-05 06:32:27', '2025-10-09 16:44:16'),
(19, 'BOUKA MAKOSSO', 'PIERRE DANIEL', 'mb.daniel241@gmail.com', '$2b$12$yUrwHc.vJQKyxHUgaoKQUOC/3ZUd8w2rfQ0gmdMMYKfw9KBcXT43q', 'admin_etablissement', 1, 'actif', '2025-10-09 16:45:08', NULL, NULL, 2, '2025-10-09 12:02:53', '2025-10-09 16:45:08');

-- --------------------------------------------------------

--
-- Structure de la table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `candidats`
--

DROP TABLE IF EXISTS `candidats`;
CREATE TABLE IF NOT EXISTS `candidats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `niveau_id` int(11) DEFAULT NULL,
  `concours_id` int(11) DEFAULT NULL,
  `filiere_id` int(11) DEFAULT NULL,
  `nipcan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nupcan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomcan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prncan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `maican` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dtncan` date DEFAULT NULL,
  `telcan` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ldncan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phtcan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proorg` int(11) DEFAULT NULL,
  `proact` int(11) DEFAULT NULL,
  `proaff` int(11) DEFAULT NULL,
  `statut` enum('en_attente','valide','rejete') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nupcan` (`nupcan`),
  KEY `niveau_id` (`niveau_id`),
  KEY `filiere_id` (`filiere_id`),
  KEY `idx_nipcan` (`nipcan`),
  KEY `idx_nupcan` (`nupcan`),
  KEY `idx_concours` (`concours_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_candidats_concours_statut` (`concours_id`,`statut`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `candidats`
--

INSERT INTO `candidats` (`id`, `niveau_id`, `concours_id`, `filiere_id`, `nipcan`, `nupcan`, `nomcan`, `prncan`, `maican`, `dtncan`, `telcan`, `ldncan`, `phtcan`, `proorg`, `proact`, `proaff`, `statut`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '1', '20251005-1', 'Mb', 'PIERRE DANIEL', 'Dapierre25@gmail.com', '2000-01-24', '+24174604327', 'port-gentil', 'photo-1759645666076-776929782.png', 2, 2, 2, 'en_attente', '2025-10-05 06:27:46', '2025-10-05 06:27:46'),
(2, 1, 1, NULL, '1', '20251009-1', 'Mb', 'PIERRE DANIEL', 'Dapierre25@gmail.com', '2000-01-24', '+24174604327', 'port-gentil', 'photo-1760016588142-232384285.png', 2, 2, 2, 'en_attente', '2025-10-09 13:29:48', '2025-10-09 13:29:48'),
(3, 4, 2, 1, '1', '20251009-2', 'Mb', 'PIERRE DANIEL', 'Dapierre25@gmail.com', '2000-01-24', '+24174604327', 'port-gentil', 'photo-1760017669628-649969812.png', 2, 2, 2, 'en_attente', '2025-10-09 13:47:49', '2025-10-09 13:47:49'),
(4, 1, 1, 1, '1', '20251009-3', 'Mb', 'PIERRE DANIEL', 'Dapierre25@gmail.com', '2000-01-24', '+24174604327', 'port-gentil', 'photo-1760018323536-50145780.png', 2, 2, 2, 'en_attente', '2025-10-09 13:58:43', '2025-10-09 13:58:43'),
(5, 1, 1, 4, '1', '20251009-4', 'Mb', 'PIERRE DANIEL', 'Dapierre25@gmail.com', '2000-01-24', '+24174604327', 'port-gentil', 'photo-1760018931619-330425829.png', 2, 2, 2, 'en_attente', '2025-10-09 14:08:51', '2025-10-09 14:13:25');

-- --------------------------------------------------------

--
-- Structure de la table `concours`
--

DROP TABLE IF EXISTS `concours`;
CREATE TABLE IF NOT EXISTS `concours` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `etablissement_id` int(11) DEFAULT NULL,
  `niveau_id` int(11) DEFAULT NULL,
  `libcnc` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fracnc` decimal(10,2) DEFAULT 0.00,
  `agecnc` int(11) DEFAULT NULL,
  `sescnc` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `debcnc` date DEFAULT NULL,
  `fincnc` date DEFAULT NULL,
  `stacnc` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT '1',
  `etddos` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_etablissement` (`etablissement_id`),
  KEY `idx_niveau` (`niveau_id`),
  KEY `idx_statut` (`stacnc`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `concours`
--

INSERT INTO `concours` (`id`, `etablissement_id`, `niveau_id`, `libcnc`, `fracnc`, `agecnc`, `sescnc`, `debcnc`, `fincnc`, `stacnc`, `etddos`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Concours d\'entrée en Licence 1 - Sciences', '50000.00', 25, '2024-2025', '2024-01-01', '2024-12-31', '1', '0', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(2, 1, 4, 'Concours d\'entrée en Master - Informatique', '75000.00', 30, '2024-2025', '2024-01-01', '2024-12-31', '1', '0', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(3, 2, 1, 'Concours USTM - Formation Technique', '60000.00', 28, '2024-2025', '2024-01-01', '2024-12-31', '1', '0', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(4, 3, 1, 'Concours École Normale Supérieure', '45000.00', 26, '2024-2025', '2024-01-01', '2024-12-31', '1', '0', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(5, 4, 10, 'Concours BTS - Institut Technologique', '40000.00', 22, '2024-2025', '2024-01-01', '2024-12-31', '1', '0', '2025-10-05 06:14:48', '2025-10-05 06:14:48');

-- --------------------------------------------------------

--
-- Structure de la table `concours_filieres`
--

DROP TABLE IF EXISTS `concours_filieres`;
CREATE TABLE IF NOT EXISTS `concours_filieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `concours_id` int(11) NOT NULL,
  `filiere_id` int(11) NOT NULL,
  `places_disponibles` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_concours_filiere` (`concours_id`,`filiere_id`),
  KEY `filiere_id` (`filiere_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `concours_filieres`
--

INSERT INTO `concours_filieres` (`id`, `concours_id`, `filiere_id`, `places_disponibles`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 50, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(2, 1, 2, 30, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(3, 1, 3, 40, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(4, 1, 4, 35, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(5, 2, 1, 25, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(6, 3, 1, 20, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(7, 3, 5, 25, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(8, 3, 9, 15, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(9, 4, 7, 30, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(10, 4, 8, 25, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(11, 4, 6, 20, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(12, 5, 1, 30, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(13, 5, 5, 25, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(14, 5, 6, 20, '2025-10-05 06:14:48', '2025-10-05 06:14:48');

-- --------------------------------------------------------

--
-- Structure de la table `documents`
--

DROP TABLE IF EXISTS `documents`;
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidat_id` int(11) DEFAULT NULL,
  `concours_id` int(11) DEFAULT NULL,
  `nomdoc` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chemin_fichier` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('en_attente','valide','rejete') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `commentaire` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validated_by` int(11) DEFAULT NULL,
  `validated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `concours_id` (`concours_id`),
  KEY `idx_candidat` (`candidat_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_documents_candidat_statut` (`candidat_id`,`statut`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `documents`
--

INSERT INTO `documents` (`id`, `candidat_id`, `concours_id`, `nomdoc`, `type`, `nom_fichier`, `chemin_fichier`, `statut`, `commentaire`, `validated_by`, `validated_at`, `created_at`, `updated_at`) VALUES
(2, NULL, NULL, 'DocScanner+2+oct.+2025+15-37+(1)-avec compression ok.pdf', 'pdf', 'documents-1759645817177-901889243.pdf', NULL, 'valide', NULL, NULL, NULL, '2025-10-05 06:30:17', '2025-10-05 06:34:36'),
(3, NULL, NULL, 'DocScanner 2 oct 2025 15-23 (3)-compressÃ©-compressÃ©-compressÃ©_compressed (1)_compressed_compressed_compressed_compressed.pdf', 'pdf', 'documents-1759645817161-380389505.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-05 06:30:17', '2025-10-05 06:30:17'),
(4, NULL, NULL, 'DocScanner 2 oct. 2025 15-23 (3)-compressÃ©-compressÃ©-compressÃ©_compressed (1)_compressed.pdf', 'pdf', 'documents-1759645817198-963635617.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-05 06:30:17', '2025-10-05 06:30:17'),
(5, NULL, NULL, 'rapport                                                                      Union.pdf', 'pdf', 'documents-1760016632095-436859180.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 13:30:32', '2025-10-09 13:30:32'),
(6, NULL, NULL, 'analyse du projet.pdf', 'pdf', 'documents-1760016632104-957193211.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 13:30:32', '2025-10-09 13:30:32'),
(7, NULL, NULL, 'Cahier de charge.pdf', 'pdf', 'documents-1760016632105-272718653.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 13:30:32', '2025-10-09 13:30:32'),
(8, NULL, NULL, 'Cahier de charge.pdf', 'pdf', 'documents-1760016632154-87064225.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 13:30:32', '2025-10-09 13:30:32'),
(9, NULL, NULL, 'rapport                                                                      Union.pdf', 'pdf', 'documents-1760017705485-978085076.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 13:48:25', '2025-10-09 13:48:25'),
(10, NULL, NULL, 'rapport                                                                      Union.pdf', 'pdf', 'documents-1760017705494-364124179.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 13:48:25', '2025-10-09 13:48:25'),
(11, NULL, NULL, 'Visily-Export_08-10-2025_12-28.pdf', 'pdf', 'documents-1760017705499-33063374.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 13:48:25', '2025-10-09 13:48:25'),
(12, NULL, NULL, 'Cahier de chargeJeu.pdf', 'pdf', 'documents-1760017705524-617430186.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 13:48:25', '2025-10-09 13:48:25'),
(13, NULL, NULL, 'Visily-Export_08-10-2025_12-28.pdf', 'pdf', 'documents-1760018991845-930142256.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 14:09:51', '2025-10-09 14:09:51'),
(14, NULL, NULL, 'Rapport_Statistique_Jeu_Telerealite_Virtuelle.pdf', 'pdf', 'documents-1760018991892-123681087.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 14:09:51', '2025-10-09 14:09:51'),
(15, NULL, NULL, 'rapport                                                                      Union.pdf', 'pdf', 'documents-1760018991879-838124683.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 14:09:51', '2025-10-09 14:09:51'),
(16, NULL, NULL, 'Rapport_Statistique_Jeu_Telerealite_Virtuelle.pdf', 'pdf', 'documents-1760018991897-946293382.pdf', NULL, 'en_attente', NULL, NULL, NULL, '2025-10-09 14:09:51', '2025-10-09 14:09:51');

-- --------------------------------------------------------

--
-- Structure de la table `document_validations`
--

DROP TABLE IF EXISTS `document_validations`;
CREATE TABLE IF NOT EXISTS `document_validations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `statut` enum('valide','rejete') COLLATE utf8mb4_unicode_ci NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `candidat_nupcan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_document` (`document_id`),
  KEY `idx_candidat` (`candidat_nupcan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `dossiers`
--

DROP TABLE IF EXISTS `dossiers`;
CREATE TABLE IF NOT EXISTS `dossiers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidat_id` int(11) DEFAULT NULL,
  `concours_id` int(11) DEFAULT NULL,
  `document_id` int(11) DEFAULT NULL,
  `nipcan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `docdsr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `concours_id` (`concours_id`),
  KEY `document_id` (`document_id`),
  KEY `idx_candidat_id` (`candidat_id`),
  KEY `idx_nipcan` (`nipcan`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `dossiers`
--

INSERT INTO `dossiers` (`id`, `candidat_id`, `concours_id`, `document_id`, `nipcan`, `docdsr`, `created_at`, `updated_at`) VALUES
(2, 1, 1, 2, '20251005-1', 'uploads\\documents\\documents-1759645817177-901889243.pdf', '2025-10-05 06:30:17', '2025-10-05 06:30:17'),
(3, 1, 1, 3, '20251005-1', 'uploads\\documents\\documents-1759645817161-380389505.pdf', '2025-10-05 06:30:17', '2025-10-05 06:30:17'),
(4, 1, 1, 4, '20251005-1', 'uploads\\documents\\documents-1759645817198-963635617.pdf', '2025-10-05 06:30:17', '2025-10-05 06:30:17'),
(5, 2, 1, 5, '20251009-1', 'uploads\\documents\\documents-1760016632095-436859180.pdf', '2025-10-09 13:30:32', '2025-10-09 13:30:32'),
(6, 2, 1, 7, '20251009-1', 'uploads\\documents\\documents-1760016632105-272718653.pdf', '2025-10-09 13:30:32', '2025-10-09 13:30:32'),
(7, 2, 1, 6, '20251009-1', 'uploads\\documents\\documents-1760016632104-957193211.pdf', '2025-10-09 13:30:32', '2025-10-09 13:30:32'),
(8, 2, 1, 8, '20251009-1', 'uploads\\documents\\documents-1760016632154-87064225.pdf', '2025-10-09 13:30:32', '2025-10-09 13:30:32'),
(9, 3, 2, 9, '20251009-2', 'uploads\\documents\\documents-1760017705485-978085076.pdf', '2025-10-09 13:48:25', '2025-10-09 13:48:25'),
(10, 3, 2, 10, '20251009-2', 'uploads\\documents\\documents-1760017705494-364124179.pdf', '2025-10-09 13:48:25', '2025-10-09 13:48:25'),
(11, 3, 2, 11, '20251009-2', 'uploads\\documents\\documents-1760017705499-33063374.pdf', '2025-10-09 13:48:25', '2025-10-09 13:48:25'),
(12, 3, 2, 12, '20251009-2', 'uploads\\documents\\documents-1760017705524-617430186.pdf', '2025-10-09 13:48:25', '2025-10-09 13:48:25'),
(13, 5, 1, 13, '20251009-4', 'uploads\\documents\\documents-1760018991845-930142256.pdf', '2025-10-09 14:09:51', '2025-10-09 14:09:51'),
(14, 5, 1, 14, '20251009-4', 'uploads\\documents\\documents-1760018991892-123681087.pdf', '2025-10-09 14:09:51', '2025-10-09 14:09:51'),
(15, 5, 1, 15, '20251009-4', 'uploads\\documents\\documents-1760018991879-838124683.pdf', '2025-10-09 14:09:51', '2025-10-09 14:09:51'),
(16, 5, 1, 16, '20251009-4', 'uploads\\documents\\documents-1760018991897-946293382.pdf', '2025-10-09 14:09:51', '2025-10-09 14:09:51');

-- --------------------------------------------------------

--
-- Structure de la table `etablissements`
--

DROP TABLE IF EXISTS `etablissements`;
CREATE TABLE IF NOT EXISTS `etablissements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nomets` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_province` (`province_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `etablissements`
--

INSERT INTO `etablissements` (`id`, `nomets`, `adresse`, `telephone`, `email`, `photo`, `province_id`, `created_at`, `updated_at`) VALUES
(1, 'Université Omar Bongo', 'Libreville, Gabon', '+241 01 23 45 67', 'contact@uob.ga', NULL, 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(2, 'Université des Sciences et Techniques de Masuku', 'Franceville, Gabon', '+241 01 23 45 68', 'contact@ustm.ga', NULL, 2, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(3, 'École Normale Supérieure', 'Libreville, Gabon', '+241 01 23 45 69', 'contact@ens.ga', NULL, 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(4, 'Institut Supérieur de Technologie', 'Port-Gentil, Gabon', '+241 01 23 45 70', 'contact@ist.ga', NULL, 3, '2025-10-05 06:14:48', '2025-10-05 06:14:48');

-- --------------------------------------------------------

--
-- Structure de la table `filieres`
--

DROP TABLE IF EXISTS `filieres`;
CREATE TABLE IF NOT EXISTS `filieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nomfil` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `niveau_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_niveau` (`niveau_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `filieres`
--

INSERT INTO `filieres` (`id`, `nomfil`, `description`, `niveau_id`, `created_at`, `updated_at`) VALUES
(1, 'Informatique', 'Sciences de l\'informatique et du numérique', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(2, 'Mathématiques', 'Mathématiques pures et appliquées', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(3, 'Physique', 'Sciences physiques et applications', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(4, 'Biologie', 'Sciences de la vie et de la terre', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(5, 'Génie Civil', 'Ingénierie civile et construction', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(6, 'Économie', 'Sciences économiques et gestion', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(7, 'Lettres Modernes', 'Littérature et langues modernes', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(8, 'Histoire-Géographie', 'Sciences humaines et sociales', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(9, 'Médecine', 'Sciences médicales', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(10, 'Droit', 'Sciences juridiques', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48');

-- --------------------------------------------------------

--
-- Structure de la table `filiere_matieres`
--

DROP TABLE IF EXISTS `filiere_matieres`;
CREATE TABLE IF NOT EXISTS `filiere_matieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filiere_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `coefficient` decimal(3,1) NOT NULL DEFAULT 1.0,
  `obligatoire` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_filiere_matiere` (`filiere_id`,`matiere_id`),
  KEY `matiere_id` (`matiere_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `filiere_matieres`
--

INSERT INTO `filiere_matieres` (`id`, `filiere_id`, `matiere_id`, `coefficient`, `obligatoire`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '4.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(2, 1, 2, '3.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(3, 1, 9, '4.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(4, 1, 4, '2.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(5, 1, 5, '2.0', 0, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(6, 2, 1, '5.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(7, 2, 2, '4.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(8, 2, 3, '2.0', 0, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(9, 2, 4, '2.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(10, 3, 1, '4.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(11, 3, 2, '5.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(12, 3, 3, '3.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(13, 3, 4, '2.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(14, 4, 1, '3.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(15, 4, 3, '3.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(16, 4, 8, '4.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(17, 4, 12, '3.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(18, 4, 4, '2.0', 1, '2025-10-05 06:14:48', '2025-10-05 06:14:48');

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

DROP TABLE IF EXISTS `matieres`;
CREATE TABLE IF NOT EXISTS `matieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom_matiere` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coefficient` decimal(3,1) DEFAULT NULL,
  `duree` int(11) DEFAULT NULL COMMENT 'Durée en heures',
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `matieres`
--

INSERT INTO `matieres` (`id`, `nom_matiere`, `coefficient`, `duree`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Mathématiques', '4.0', 4, 'Mathématiques générales', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(2, 'Physique', '3.0', 3, 'Physique générale', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(3, 'Chimie', '2.0', 2, 'Chimie générale', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(4, 'Français', '3.0', 3, 'Expression française', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(5, 'Anglais', '2.0', 2, 'Langue anglaise', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(6, 'Histoire', '2.0', 2, 'Histoire générale', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(7, 'Géographie', '2.0', 2, 'Géographie générale', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(8, 'Biologie', '3.0', 3, 'Sciences de la vie', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(9, 'Informatique', '3.0', 3, 'Sciences informatiques', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(10, 'Économie', '3.0', 3, 'Sciences économiques', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(11, 'Philosophie', '2.0', 2, 'Philosophie générale', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(12, 'Sciences Naturelles', '3.0', 3, 'Sciences de la nature', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(13, 'Mathématiques', '3.0', 3, 'Épreuve de mathématiques', '2025-10-06 20:16:27', '2025-10-06 20:16:27'),
(14, 'Français', '2.0', 2, 'Épreuve de français', '2025-10-06 20:16:27', '2025-10-06 20:16:27'),
(15, 'Anglais', '2.0', 2, 'Épreuve d\'anglais', '2025-10-06 20:16:27', '2025-10-06 20:16:27'),
(16, 'Sciences', '2.0', 2, 'Épreuve de sciences', '2025-10-06 20:16:27', '2025-10-06 20:16:27'),
(17, 'Culture Générale', '1.0', 1, 'Épreuve de culture générale', '2025-10-06 20:16:27', '2025-10-06 20:16:27');

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidat_nupcan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `sujet` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `expediteur` enum('candidat','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('non_lu','lu') COLLATE utf8mb4_unicode_ci DEFAULT 'non_lu',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_candidat_messages` (`candidat_nupcan`),
  KEY `idx_admin_messages` (`admin_id`),
  KEY `idx_statut` (`statut`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`id`, `candidat_nupcan`, `admin_id`, `sujet`, `message`, `expediteur`, `statut`, `created_at`, `updated_at`) VALUES
(1, '20251005-1', NULL, 'vvvvv', 'vvvvvvv', 'candidat', 'non_lu', '2025-10-06 20:25:19', '2025-10-06 20:25:19'),
(2, '20251009-4', 19, 'hhhhh', 'gggg', 'candidat', 'non_lu', '2025-10-09 14:17:34', '2025-10-09 14:18:07');

-- --------------------------------------------------------

--
-- Structure de la table `niveaux`
--

DROP TABLE IF EXISTS `niveaux`;
CREATE TABLE IF NOT EXISTS `niveaux` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nomniv` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `niveaux`
--

INSERT INTO `niveaux` (`id`, `nomniv`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Licence 1', 'Première année de licence', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(2, 'Licence 2', 'Deuxième année de licence', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(3, 'Licence 3', 'Troisième année de licence', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(4, 'Master 1', 'Première année de master', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(5, 'Master 2', 'Deuxième année de master', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(6, 'Doctorat', 'Études doctorales', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(7, 'Terminale C', 'Terminale série C (Mathématiques et Sciences Physiques)', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(8, 'Terminale D', 'Terminale série D (Mathématiques et Sciences de la Nature)', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(9, 'Terminale A', 'Terminale série A (Littéraire)', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(10, 'BTS', 'Brevet de Technicien Supérieur', '2025-10-05 06:14:48', '2025-10-05 06:14:48');

-- --------------------------------------------------------

--
-- Structure de la table `notes`
--

DROP TABLE IF EXISTS `notes`;
CREATE TABLE IF NOT EXISTS `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidat_id` int(11) NOT NULL,
  `concours_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `note` decimal(5,2) NOT NULL CHECK (`note` >= 0 and `note` <= 20),
  `coefficient` decimal(3,1) DEFAULT 1.0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_note` (`candidat_id`,`concours_id`,`matiere_id`),
  KEY `idx_candidat` (`candidat_id`),
  KEY `idx_concours` (`concours_id`),
  KEY `idx_matiere` (`matiere_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notes`
--

INSERT INTO `notes` (`id`, `candidat_id`, `concours_id`, `matiere_id`, `note`, `coefficient`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 5, '10.00', '2.0', '2025-10-09 12:14:39', '2025-10-09 12:15:54'),
(2, 5, 1, 5, '10.00', '1.0', '2025-10-09 14:14:45', '2025-10-09 14:14:45');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidat_nupcan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `candidat_id` int(11) DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('lu','non_lu') COLLATE utf8mb4_unicode_ci DEFAULT 'non_lu',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_nupcan` (`candidat_nupcan`),
  KEY `idx_statut` (`statut`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_notifications_date` (`candidat_nupcan`,`created_at`),
  KEY `idx_candidat` (`candidat_id`),
  KEY `idx_reference` (`reference_type`,`reference_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `candidat_nupcan`, `candidat_id`, `type`, `titre`, `message`, `reference_id`, `reference_type`, `statut`, `created_at`, `updated_at`) VALUES
(1, '20251005-1', NULL, 'document_validation', 'Document rejeté', 'Votre document \"DocScanner 2 oct. 2025 15-23 (3)-compressÃ©-compressÃ©-compressÃ©_compressed (1)_compressed_compressed.pdf\" a été rejeté. Motif: nnnn', NULL, NULL, 'non_lu', '2025-10-05 06:34:33', '2025-10-05 06:34:33'),
(2, '20251005-1', NULL, 'document_validation', 'Document validé', 'Votre document \"DocScanner+2+oct.+2025+15-37+(1)-avec compression ok.pdf\" a été validé avec succès.', NULL, NULL, 'non_lu', '2025-10-05 06:34:36', '2025-10-05 06:34:36');

-- --------------------------------------------------------

--
-- Structure de la table `nupcan_counters`
--

DROP TABLE IF EXISTS `nupcan_counters`;
CREATE TABLE IF NOT EXISTS `nupcan_counters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date_key` varchar(10) NOT NULL,
  `counter` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `date_key` (`date_key`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

--
-- Déchargement des données de la table `nupcan_counters`
--

INSERT INTO `nupcan_counters` (`id`, `date_key`, `counter`, `created_at`, `updated_at`) VALUES
(1, '20251005', 1, '2025-10-05 06:27:46', '2025-10-05 06:27:46'),
(2, '20251009', 4, '2025-10-09 13:29:48', '2025-10-09 14:08:51');

-- --------------------------------------------------------

--
-- Structure de la table `paiements`
--

DROP TABLE IF EXISTS `paiements`;
CREATE TABLE IF NOT EXISTS `paiements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidat_id` int(11) DEFAULT NULL,
  `concours_id` int(11) DEFAULT NULL,
  `nupcan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `montant` decimal(10,2) NOT NULL,
  `methode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('en_attente','valide','rejete') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `reference_paiement` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recu_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_nipcan` (`nupcan`),
  KEY `idx_statut` (`statut`),
  KEY `idx_paiements_candidat_statut` (`candidat_id`,`statut`),
  KEY `idx_nupcan` (`nupcan`),
  KEY `idx_candidat_id` (`candidat_id`),
  KEY `idx_concours_id` (`concours_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `paiements`
--

INSERT INTO `paiements` (`id`, `candidat_id`, `concours_id`, `nupcan`, `montant`, `methode`, `statut`, `reference_paiement`, `numero_telephone`, `recu_path`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '20251005-1', '50000.00', 'airtel_money', 'valide', 'PAY-1759775376112', '074604327', '/uploads/recus/recu_20251005-1_1759775376222.pdf', '2025-10-06 18:29:36', '2025-10-06 18:29:36'),
(2, 2, 1, '20251009-1', '50000.00', 'moov', 'valide', 'PAY-1760016662588', '060604327', '/uploads/recus/recu_20251009-1_1760016662704.pdf', '2025-10-09 13:31:02', '2025-10-09 13:31:02'),
(3, 3, 2, '20251009-2', '75000.00', 'moov', 'valide', 'PAY-1760017723583', '060604327', '/uploads/recus/recu_20251009-2_1760017723603.pdf', '2025-10-09 13:48:43', '2025-10-09 13:48:43'),
(4, 5, 1, '20251009-4', '50000.00', 'moov', 'valide', 'PAY-1760019037616', '066604327', '/uploads/recus/recu_20251009-4_1760019037656.pdf', '2025-10-09 14:10:37', '2025-10-09 14:10:37');

-- --------------------------------------------------------

--
-- Structure de la table `participations`
--

DROP TABLE IF EXISTS `participations`;
CREATE TABLE IF NOT EXISTS `participations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidat_id` int(11) DEFAULT NULL,
  `concours_id` int(11) DEFAULT NULL,
  `filiere_id` int(11) DEFAULT NULL,
  `nipcan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('en_cours','complete','abandonne') COLLATE utf8mb4_unicode_ci DEFAULT 'en_cours',
  `numero_candidature` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `filiere_id` (`filiere_id`),
  KEY `idx_candidat_id` (`candidat_id`),
  KEY `idx_concours_id` (`concours_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `participations`
--

INSERT INTO `participations` (`id`, `candidat_id`, `concours_id`, `filiere_id`, `nipcan`, `statut`, `numero_candidature`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 1, NULL, 'en_cours', NULL, '2025-10-09 13:58:43', '2025-10-09 13:58:43'),
(2, 5, 1, NULL, NULL, 'en_cours', NULL, '2025-10-09 14:08:51', '2025-10-09 14:08:51');

-- --------------------------------------------------------

--
-- Structure de la table `provinces`
--

DROP TABLE IF EXISTS `provinces`;
CREATE TABLE IF NOT EXISTS `provinces` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nompro` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cdepro` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `provinces`
--

INSERT INTO `provinces` (`id`, `nompro`, `cdepro`, `created_at`, `updated_at`) VALUES
(1, 'Estuaire', 'EST', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(2, 'Haut-Ogooué', 'HO', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(3, 'Moyen-Ogooué', 'MO', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(4, 'Ngounié', 'NGO', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(5, 'Nyanga', 'NYA', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(6, 'Ogooué-Ivindo', 'OI', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(7, 'Ogooué-Lolo', 'OL', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(8, 'Ogooué-Maritime', 'OM', '2025-10-05 06:14:48', '2025-10-05 06:14:48'),
(9, 'Woleu-Ntem', 'WN', '2025-10-05 06:14:48', '2025-10-05 06:14:48');

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidat_id` int(11) NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `candidat_id` (`candidat_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `sessions`
--

INSERT INTO `sessions` (`id`, `candidat_id`, `token`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 1, '1c9e17e4-52ff-4c56-91f4-9870f5250cff', '2025-10-06 05:27:46', '2025-10-05 06:27:46', '2025-10-05 06:27:46'),
(2, 2, '8e7cf5ba-5fba-418c-9cfb-375cf2394279', '2025-10-10 12:29:48', '2025-10-09 13:29:48', '2025-10-09 13:29:48'),
(3, 3, 'a0709596-c2b9-4ad2-a7a0-02b732f44a93', '2025-10-10 12:47:49', '2025-10-09 13:47:49', '2025-10-09 13:47:49'),
(4, 4, 'b4ba74d6-8897-45d1-a271-f9b6157c504a', '2025-10-10 12:58:43', '2025-10-09 13:58:43', '2025-10-09 13:58:43'),
(5, 5, 'd7bc1701-ccf4-4f2b-a3e1-99d2b680012e', '2025-10-10 13:08:51', '2025-10-09 14:08:51', '2025-10-09 14:08:51');

-- --------------------------------------------------------

--
-- Structure de la table `support_requests`
--

DROP TABLE IF EXISTS `support_requests`;
CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_createdAt` (`createdAt`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

--
-- Déchargement des données de la table `support_requests`
--

INSERT INTO `support_requests` (`id`, `name`, `email`, `message`, `createdAt`) VALUES
(1, 'zzfzfzf', 'da@gmail.com', 'fffffffffffffff', '2025-10-06 00:00:00'),
(2, 'Devgroup', 'devgroupentreprise@gmail.com', 'dddddddddddd', '2025-10-06 19:09:42');

-- --------------------------------------------------------

--
-- Structure de la table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role` enum('super_admin','admin_etablissement','admin_concours','validateur_documents') COLLATE utf8mb4_unicode_ci NOT NULL,
  `etablissement_id` int(11) DEFAULT NULL,
  `concours_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_role` (`user_id`,`role`,`etablissement_id`,`concours_id`),
  KEY `concours_id` (`concours_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_role` (`role`),
  KEY `idx_etablissement` (`etablissement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_candidatures_completes`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_candidatures_completes`;
CREATE TABLE IF NOT EXISTS `vue_candidatures_completes` (
`id` int(11)
,`nupcan` varchar(100)
,`nomcan` varchar(255)
,`prncan` varchar(255)
,`maican` varchar(255)
,`telcan` varchar(20)
,`dtncan` date
,`ldncan` varchar(255)
,`phtcan` varchar(255)
,`statut` enum('en_attente','valide','rejete')
,`created_at` timestamp
,`concours_nom` varchar(255)
,`concours_frais` decimal(10,2)
,`filiere_nom` varchar(255)
,`etablissement_nom` varchar(255)
,`niveau_nom` varchar(255)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_stats_etablissements`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_stats_etablissements`;
CREATE TABLE IF NOT EXISTS `vue_stats_etablissements` (
`id` int(11)
,`nomets` varchar(255)
,`nb_concours` bigint(21)
,`nb_candidatures` bigint(21)
,`nb_validees` bigint(21)
,`nb_en_attente` bigint(21)
,`nb_rejetees` bigint(21)
);

-- --------------------------------------------------------

--
-- Structure de la vue `vue_candidatures_completes`
--
DROP TABLE IF EXISTS `vue_candidatures_completes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_candidatures_completes`  AS  select `c`.`id` AS `id`,`c`.`nupcan` AS `nupcan`,`c`.`nomcan` AS `nomcan`,`c`.`prncan` AS `prncan`,`c`.`maican` AS `maican`,`c`.`telcan` AS `telcan`,`c`.`dtncan` AS `dtncan`,`c`.`ldncan` AS `ldncan`,`c`.`phtcan` AS `phtcan`,`c`.`statut` AS `statut`,`c`.`created_at` AS `created_at`,`co`.`libcnc` AS `concours_nom`,`co`.`fracnc` AS `concours_frais`,`f`.`nomfil` AS `filiere_nom`,`e`.`nomets` AS `etablissement_nom`,`n`.`nomniv` AS `niveau_nom` from ((((`candidats` `c` left join `concours` `co` on(`c`.`concours_id` = `co`.`id`)) left join `filieres` `f` on(`c`.`filiere_id` = `f`.`id`)) left join `etablissements` `e` on(`co`.`etablissement_id` = `e`.`id`)) left join `niveaux` `n` on(`c`.`niveau_id` = `n`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_stats_etablissements`
--
DROP TABLE IF EXISTS `vue_stats_etablissements`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_stats_etablissements`  AS  select `e`.`id` AS `id`,`e`.`nomets` AS `nomets`,count(distinct `co`.`id`) AS `nb_concours`,count(distinct `c`.`id`) AS `nb_candidatures`,count(case when `c`.`statut` = 'valide' then 1 end) AS `nb_validees`,count(case when `c`.`statut` = 'en_attente' then 1 end) AS `nb_en_attente`,count(case when `c`.`statut` = 'rejete' then 1 end) AS `nb_rejetees` from ((`etablissements` `e` left join `concours` `co` on(`e`.`id` = `co`.`etablissement_id`)) left join `candidats` `c` on(`co`.`id` = `c`.`concours_id`)) group by `e`.`id`,`e`.`nomets` ;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `administrateurs`
--
ALTER TABLE `administrateurs`
  ADD CONSTRAINT `administrateurs_ibfk_1` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `administrateurs_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `administrateurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `administrateurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `candidats`
--
ALTER TABLE `candidats`
  ADD CONSTRAINT `candidats_ibfk_1` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `candidats_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `candidats_ibfk_3` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `concours`
--
ALTER TABLE `concours`
  ADD CONSTRAINT `concours_ibfk_1` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `concours_ibfk_2` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `concours_filieres`
--
ALTER TABLE `concours_filieres`
  ADD CONSTRAINT `concours_filieres_ibfk_1` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `concours_filieres_ibfk_2` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `document_validations`
--
ALTER TABLE `document_validations`
  ADD CONSTRAINT `document_validations_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_validations_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `administrateurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `dossiers`
--
ALTER TABLE `dossiers`
  ADD CONSTRAINT `dossiers_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dossiers_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dossiers_ibfk_3` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `etablissements`
--
ALTER TABLE `etablissements`
  ADD CONSTRAINT `etablissements_ibfk_1` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `filieres`
--
ALTER TABLE `filieres`
  ADD CONSTRAINT `filieres_ibfk_1` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `filiere_matieres`
--
ALTER TABLE `filiere_matieres`
  ADD CONSTRAINT `filiere_matieres_ibfk_1` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `filiere_matieres_ibfk_2` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`candidat_nupcan`) REFERENCES `candidats` (`nupcan`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `administrateurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notes_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notes_ibfk_3` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `paiements`
--
ALTER TABLE `paiements`
  ADD CONSTRAINT `paiements_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `paiements_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `participations`
--
ALTER TABLE `participations`
  ADD CONSTRAINT `participations_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `participations_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `participations_ibfk_3` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `administrateurs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_3` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
