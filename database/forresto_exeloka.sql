-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 07, 2025 at 07:22 AM
-- Server version: 10.6.23-MariaDB
-- PHP Version: 8.4.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `forresto_exeloka`
--

-- --------------------------------------------------------

--
-- Table structure for table `analysis_history`
--

CREATE TABLE `analysis_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `analysis_type` enum('quick','enhanced') NOT NULL,
  `input_parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`input_parameters`)),
  `processing_time_ms` int(11) DEFAULT NULL,
  `tokens_used` int(11) DEFAULT NULL,
  `cost_usd` decimal(10,4) DEFAULT NULL,
  `model_used` varchar(100) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 1,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_usage_log`
--

CREATE TABLE `api_usage_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(10) NOT NULL,
  `status_code` int(11) NOT NULL,
  `response_time_ms` int(11) DEFAULT NULL,
  `request_size` int(11) DEFAULT NULL,
  `response_size` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_trail`
--

CREATE TABLE `audit_trail` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `action` enum('create','update','delete','view','export','analyze') NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `data_export_log`
--

CREATE TABLE `data_export_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `export_type` enum('projects','recommendations','knowledge','analytics','full_backup') NOT NULL,
  `export_format` enum('json','csv','xlsx','zip') NOT NULL,
  `file_path` varchar(1000) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `record_count` int(11) DEFAULT NULL,
  `date_range_start` date DEFAULT NULL,
  `date_range_end` date DEFAULT NULL,
  `filters_applied` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`filters_applied`)),
  `processing_time_ms` int(11) DEFAULT NULL,
  `status` enum('processing','completed','failed','expired') DEFAULT 'processing',
  `error_message` text DEFAULT NULL,
  `download_count` int(11) DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_hash` varchar(64) NOT NULL,
  `storage_type` enum('local','cloud','temp') DEFAULT 'local',
  `is_processed` tinyint(1) DEFAULT 0,
  `processed_at` timestamp NULL DEFAULT NULL,
  `extracted_text` longtext DEFAULT NULL,
  `ocr_text` longtext DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `access_level` enum('private','shared','public') DEFAULT 'private',
  `download_count` int(11) DEFAULT 0,
  `last_accessed` timestamp NULL DEFAULT NULL,
  `virus_scan_status` enum('pending','clean','infected','failed') DEFAULT 'pending',
  `virus_scan_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_generation_log`
--

CREATE TABLE `document_generation_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `recommendation_id` int(11) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `document_type` enum('docx','xlsx','pptx','pdf') NOT NULL,
  `file_name` varchar(500) NOT NULL,
  `file_path` varchar(1000) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `generation_time_ms` int(11) DEFAULT NULL,
  `template_used` varchar(255) DEFAULT NULL,
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parameters`)),
  `status` enum('processing','completed','failed') DEFAULT 'completed',
  `error_message` text DEFAULT NULL,
  `download_count` int(11) DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `recommendation_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `feedback_text` text DEFAULT NULL,
  `implementation_success` enum('not_implemented','partial','successful','exceeded','failed') DEFAULT 'not_implemented',
  `outcome_details` text DEFAULT NULL,
  `lessons_learned` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedback`
--

INSERT INTO `feedback` (`id`, `recommendation_id`, `user_id`, `rating`, `feedback_text`, `implementation_success`, `outcome_details`, `lessons_learned`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 4, 'The recommendation was very helpful and culturally appropriate', 'successful', 'We successfully implemented the pilot program and saw immediate positive results from the community.', 'Community engagement from the start was crucial for success', '2025-09-06 01:58:27', '2025-09-06 01:58:27');

-- --------------------------------------------------------

--
-- Table structure for table `file_uploads`
--

CREATE TABLE `file_uploads` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `original_filename` varchar(500) NOT NULL,
  `stored_filename` varchar(500) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` int(11) NOT NULL,
  `upload_type` enum('knowledge','project','user_avatar','document') DEFAULT 'knowledge',
  `processing_status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `is_temporary` tinyint(1) DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `generated_documents`
--

CREATE TABLE `generated_documents` (
  `id` int(11) NOT NULL,
  `recommendation_id` int(11) NOT NULL,
  `document_type` enum('docx','xlsx','pptx') NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT 0,
  `download_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_categories`
--

CREATE TABLE `knowledge_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#059669',
  `icon` varchar(50) DEFAULT '?',
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `knowledge_categories`
--

INSERT INTO `knowledge_categories` (`id`, `name`, `description`, `color`, `icon`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Religious Leadership', 'Information about Kyai, Islamic authorities, and religious influence in Sampang', '#059669', '🕌', 1, 1, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(2, 'Traditional Governance', 'Village leadership, traditional decision-making, and local government structures', '#0369a1', '🏛️', 1, 2, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(3, 'Cultural Traditions', 'Kerapan Sapi, local customs, festivals, and traditional practices', '#dc2626', '🎭', 1, 3, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(4, 'Family Networks', 'Clan relationships, genealogical structures, and family influence patterns', '#7c3aed', '👨‍👩‍👧‍👦', 1, 4, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(5, 'Economic Patterns', 'Traditional trade, business customs, and economic structures', '#059669', '💰', 1, 5, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(6, 'Youth & Education', 'Modern youth perspectives, educational systems, and generational changes', '#0891b2', '🎓', 1, 6, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(7, 'Language & Communication', 'Madurese language usage, communication patterns, and media preferences', '#ea580c', '💬', 1, 7, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(8, 'Historical Context', 'Historical events, colonial impacts, and cultural evolution', '#6b7280', '📚', 1, 8, '2025-09-05 08:00:44', '2025-09-05 08:00:44');

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_sources`
--

CREATE TABLE `knowledge_sources` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `document_id` int(11) DEFAULT NULL,
  `title` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `extracted_content` longtext DEFAULT NULL,
  `tags_text` text DEFAULT NULL,
  `source_type` enum('text','url','file','document','audio','video','manual') DEFAULT 'text',
  `source_url` varchar(1000) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `importance_score` int(11) DEFAULT 5,
  `is_public` tinyint(1) DEFAULT 0,
  `is_verified` tinyint(1) DEFAULT 0,
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `processing_status` enum('pending','processing','completed','failed') DEFAULT 'completed',
  `processing_error` text DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `knowledge_sources`
--

INSERT INTO `knowledge_sources` (`id`, `user_id`, `category_id`, `document_id`, `title`, `description`, `content`, `extracted_content`, `tags_text`, `source_type`, `source_url`, `file_path`, `file_size`, `mime_type`, `tags`, `metadata`, `importance_score`, `is_public`, `is_verified`, `verified_by`, `verified_at`, `processing_status`, `processing_error`, `processed_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, 'Peran Kyai dalam Masyarakat Sampang', NULL, 'Kyai memiliki peran sentral dalam kehidupan masyarakat Sampang. Mereka tidak hanya pemimpin spiritual, tetapi juga penasihat dalam berbagai aspek kehidupan termasuk ekonomi, sosial, dan politik. Keputusan penting dalam komunitas seringkali memerlukan persetujuan atau nasihat dari Kyai setempat.', NULL, 'kyai leadership spiritual community', 'text', NULL, NULL, NULL, NULL, '[\"kyai\", \"leadership\", \"spiritual\", \"community\"]', NULL, 9, 1, 0, NULL, NULL, 'completed', NULL, NULL, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(2, 1, 3, NULL, 'Tradisi Kerapan Sapi di Sampang', NULL, 'Kerapan Sapi bukan sekadar perlombaan, tetapi representasi status sosial, kebanggaan komunitas, dan identitas budaya Madura. Setiap pasangan sapi memiliki nilai ekonomi dan simbolis tinggi. Pemilik sapi yang menang mendapat prestise sosial yang signifikan.', NULL, 'kerapan_sapi tradition culture social_status', 'text', NULL, NULL, NULL, NULL, '[\"kerapan_sapi\", \"tradition\", \"culture\", \"social_status\"]', NULL, 10, 1, 0, NULL, NULL, 'completed', NULL, NULL, '2025-09-05 08:00:44', '2025-09-05 08:00:44');

-- --------------------------------------------------------

--
-- Stand-in structure for view `knowledge_source_stats`
-- (See below for the actual view)
--
CREATE TABLE `knowledge_source_stats` (
`id` int(11)
,`user_id` int(11)
,`category_id` int(11)
,`document_id` int(11)
,`title` varchar(500)
,`description` text
,`content` longtext
,`extracted_content` longtext
,`tags_text` text
,`source_type` enum('text','url','file','document','audio','video','manual')
,`source_url` varchar(1000)
,`file_path` varchar(500)
,`file_size` int(11)
,`mime_type` varchar(100)
,`tags` longtext
,`metadata` longtext
,`importance_score` int(11)
,`is_public` tinyint(1)
,`is_verified` tinyint(1)
,`verified_by` int(11)
,`verified_at` timestamp
,`processing_status` enum('pending','processing','completed','failed')
,`processing_error` text
,`processed_at` timestamp
,`created_at` timestamp
,`updated_at` timestamp
,`category_name` varchar(255)
,`category_color` varchar(7)
,`creator_name` varchar(255)
,`usage_count` bigint(21)
,`last_accessed` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_source_usage`
--

CREATE TABLE `knowledge_source_usage` (
  `id` int(11) NOT NULL,
  `knowledge_source_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `access_type` enum('view','search','reference','export') DEFAULT 'view',
  `context` varchar(255) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `learning_insights`
--

CREATE TABLE `learning_insights` (
  `id` int(11) NOT NULL,
  `insight_type` enum('pattern','trend','recommendation','risk','success_factor') NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL,
  `data_source` enum('user_feedback','usage_patterns','success_metrics','external_research') NOT NULL,
  `confidence_level` decimal(5,2) DEFAULT 75.00,
  `supporting_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`supporting_data`)),
  `affected_categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`affected_categories`)),
  `actionable_steps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`actionable_steps`)),
  `is_active` tinyint(1) DEFAULT 1,
  `priority_score` int(11) DEFAULT 5,
  `created_by_system` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `learning_insights`
--

INSERT INTO `learning_insights` (`id`, `insight_type`, `title`, `description`, `data_source`, `confidence_level`, `supporting_data`, `affected_categories`, `actionable_steps`, `is_active`, `priority_score`, `created_by_system`, `created_at`, `updated_at`) VALUES
(1, 'success_factor', 'Religious Leader Engagement Critical for Healthcare Projects', 'Projects with early Kyai engagement show 78% higher community acceptance rates in healthcare initiatives.', 'user_feedback', 85.50, '{\"sample_size\": 12, \"success_rate\": 78.3, \"time_to_acceptance\": \"reduced by 40%\"}', '[\"Religious Leadership\", \"Healthcare\"]', NULL, 1, 9, 1, '2025-09-05 08:00:44', '2025-09-05 08:00:44');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL,
  `project_type` varchar(100) DEFAULT NULL,
  `cultural_context` varchar(100) DEFAULT NULL,
  `objectives` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`objectives`)),
  `stakeholders` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`stakeholders`)),
  `priority_areas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`priority_areas`)),
  `status` enum('draft','planning','active','paused','completed','cancelled') DEFAULT 'planning',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `risk_level` enum('low','medium','high') DEFAULT 'medium',
  `success_metrics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`success_metrics`)),
  `lessons_learned` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `user_id`, `title`, `description`, `project_type`, `cultural_context`, `objectives`, `stakeholders`, `priority_areas`, `status`, `start_date`, `end_date`, `budget`, `location`, `risk_level`, `success_metrics`, `lessons_learned`, `created_at`, `updated_at`) VALUES
(1, 2, 'Community Health Center Initiative', 'Establishing a modern healthcare facility in collaboration with local community leaders, ensuring cultural sensitivity and traditional medicine integration.', 'Healthcare', 'sampang_rural', '[\"Improve healthcare access\", \"Integrate traditional medicine\", \"Train local staff\", \"Build community trust\"]', '[\"Local Kyai and Religious Leaders\", \"Village Head (Lurah)\", \"Traditional Healers (Dukun)\", \"Community Health Workers\", \"Local Government Health Office\"]', '[\"Religious Leadership\", \"Traditional Governance\", \"Community Health\"]', 'active', NULL, NULL, NULL, NULL, 'medium', NULL, NULL, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(2, 2, 'Kerapan Sapi Cultural Tourism Development', 'Developing sustainable cultural tourism around the traditional bull racing (Kerapan Sapi) while preserving authenticity and supporting local communities.', 'Cultural', 'sampang_traditional', '[\"Preserve traditions\", \"Generate tourism revenue\", \"Support local economy\", \"Create employment opportunities\"]', '[\"Kerapan Sapi Organizers\", \"Bull Owners and Trainers\", \"Local Tourism Office\", \"Cultural Preservation Society\", \"Hotel and Restaurant Owners\"]', '[\"Cultural Traditions\", \"Economic Patterns\", \"Traditional Governance\"]', 'planning', NULL, NULL, NULL, NULL, 'medium', NULL, NULL, '2025-09-05 08:00:44', '2025-09-05 08:00:44');

-- --------------------------------------------------------

--
-- Table structure for table `project_files`
--

CREATE TABLE `project_files` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `document_id` int(11) NOT NULL,
  `file_type` enum('input','reference','output','analysis') DEFAULT 'reference',
  `description` text DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `project_summary`
-- (See below for the actual view)
--
CREATE TABLE `project_summary` (
`id` int(11)
,`user_id` int(11)
,`title` varchar(500)
,`description` text
,`project_type` varchar(100)
,`cultural_context` varchar(100)
,`objectives` longtext
,`stakeholders` longtext
,`priority_areas` longtext
,`status` enum('draft','planning','active','paused','completed','cancelled')
,`start_date` date
,`end_date` date
,`budget` decimal(15,2)
,`location` varchar(255)
,`risk_level` enum('low','medium','high')
,`success_metrics` longtext
,`lessons_learned` text
,`created_at` timestamp
,`updated_at` timestamp
,`user_name` varchar(255)
,`company_name` varchar(255)
,`recommendation_count` bigint(21)
,`avg_confidence_score` decimal(9,6)
,`last_recommendation_date` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `recommendations`
--

CREATE TABLE `recommendations` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `analysis_type` enum('quick','enhanced') DEFAULT 'quick',
  `key_insights` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`key_insights`)),
  `recommendations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`recommendations`)),
  `potential_risks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`potential_risks`)),
  `cultural_context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cultural_context`)),
  `success_metrics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`success_metrics`)),
  `confidence_score` decimal(5,2) DEFAULT 75.00,
  `processing_time_ms` int(11) DEFAULT NULL,
  `llm_model_used` varchar(100) DEFAULT NULL,
  `cost_estimate` decimal(10,4) DEFAULT NULL,
  `additional_context` text DEFAULT NULL,
  `priority_areas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`priority_areas`)),
  `specific_concerns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`specific_concerns`)),
  `status` enum('draft','processing','completed','failed') DEFAULT 'completed',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `recommendations`
--

INSERT INTO `recommendations` (`id`, `project_id`, `analysis_type`, `key_insights`, `recommendations`, `potential_risks`, `cultural_context`, `success_metrics`, `confidence_score`, `processing_time_ms`, `llm_model_used`, `cost_estimate`, `additional_context`, `priority_areas`, `specific_concerns`, `status`, `error_message`, `created_at`, `updated_at`) VALUES
(1, 1, 'enhanced', '[\"Religious leaders (Kyai) have significant influence over community health decisions\", \"Traditional healing practices coexist with modern healthcare approaches\", \"Community trust is built through religious endorsement\", \"Healthcare decisions often involve family consultation patterns\"]', '[\"Engage with local Kyai early in the planning process\", \"Create integration pathways between traditional and modern practices\", \"Establish a Cultural Advisory Board including religious leaders\", \"Provide cultural sensitivity training for medical staff\", \"Respect prayer times and religious observances in facility operations\"]', '[\"Bypassing religious leadership can lead to community resistance\", \"Conflicts between traditional and modern approaches if not managed properly\", \"Potential resistance from traditional healers if not included\", \"Religious objections to certain medical practices\"]', '[\"Islamic values deeply influence health decisions\", \"Community trust is built through religious endorsement\", \"Traditional healing has cultural legitimacy\", \"Family involvement in health decisions is expected\"]', '[\"Number of religious leaders engaged\", \"Community acceptance rate through religious channels\", \"Integration of traditional practices\", \"Patient satisfaction with cultural sensitivity\"]', 92.50, NULL, NULL, NULL, NULL, NULL, NULL, 'completed', NULL, '2025-09-05 08:00:44', '2025-09-05 08:00:44');

-- --------------------------------------------------------

--
-- Table structure for table `recommendation_feedback`
--

CREATE TABLE `recommendation_feedback` (
  `id` int(11) NOT NULL,
  `recommendation_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comments` text DEFAULT NULL,
  `usefulness_score` int(11) DEFAULT NULL CHECK (`usefulness_score` >= 1 and `usefulness_score` <= 10),
  `implementation_status` enum('not_started','in_progress','completed','abandoned') DEFAULT 'not_started',
  `implementation_notes` text DEFAULT NULL,
  `would_recommend` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT 1,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `password_changed_at` timestamp NULL DEFAULT NULL,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `remember_token` varchar(255) DEFAULT NULL,
  `login_ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `full_name`, `company_name`, `role`, `is_active`, `email_verified_at`, `last_login_at`, `failed_login_attempts`, `locked_until`, `password_changed_at`, `two_factor_secret`, `two_factor_enabled`, `remember_token`, `login_ip`, `created_at`, `updated_at`) VALUES
(1, 'admin@sampang.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmad Sutrisno', 'Sampang Cultural Institute', 'admin', 1, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, NULL, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(2, 'user@company.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sari Wijayanti', 'PT Nusantara Development', 'user', 1, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, NULL, '2025-09-05 08:00:44', '2025-09-05 08:00:44'),
(3, 'cultural@expert.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Moh Kholil', 'Cultural Research Center', 'user', 1, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, NULL, '2025-09-05 08:00:44', '2025-09-05 08:00:44');

-- --------------------------------------------------------

--
-- Stand-in structure for view `user_analytics`
-- (See below for the actual view)
--
CREATE TABLE `user_analytics` (
`id` int(11)
,`email` varchar(255)
,`full_name` varchar(255)
,`company_name` varchar(255)
,`role` enum('admin','user')
,`is_active` tinyint(1)
,`created_at` timestamp
,`updated_at` timestamp
,`total_projects` bigint(21)
,`total_recommendations` bigint(21)
,`total_knowledge_sources` bigint(21)
,`avg_recommendation_rating` decimal(14,4)
,`last_project_date` timestamp
,`last_login` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wisdom_entries`
--

CREATE TABLE `wisdom_entries` (
  `id` int(11) NOT NULL,
  `source_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(500) NOT NULL,
  `content` longtext NOT NULL,
  `cultural_context` text DEFAULT NULL,
  `importance_score` decimal(3,2) DEFAULT 0.00,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `analysis_history`
--
ALTER TABLE `analysis_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_analysis_history_user` (`user_id`),
  ADD KEY `fk_analysis_history_project` (`project_id`),
  ADD KEY `idx_analysis_history_type` (`analysis_type`),
  ADD KEY `idx_analysis_history_date` (`created_at`);

--
-- Indexes for table `api_usage_log`
--
ALTER TABLE `api_usage_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_api_usage_log_user` (`user_id`),
  ADD KEY `idx_api_usage_log_endpoint` (`endpoint`),
  ADD KEY `idx_api_usage_log_status` (`status_code`),
  ADD KEY `idx_api_usage_log_date` (`created_at`);

--
-- Indexes for table `audit_trail`
--
ALTER TABLE `audit_trail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_audit_trail_user` (`user_id`),
  ADD KEY `idx_audit_trail_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_trail_action` (`action`),
  ADD KEY `idx_audit_trail_date` (`created_at`),
  ADD KEY `idx_audit_trail_user_date` (`user_id`,`created_at`);

--
-- Indexes for table `data_export_log`
--
ALTER TABLE `data_export_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_data_export_log_user` (`user_id`),
  ADD KEY `idx_data_export_log_type` (`export_type`),
  ADD KEY `idx_data_export_log_status` (`status`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_file_hash` (`file_hash`),
  ADD KEY `idx_documents_user` (`user_id`),
  ADD KEY `idx_documents_type` (`mime_type`),
  ADD KEY `idx_documents_storage` (`storage_type`),
  ADD KEY `idx_documents_processed` (`is_processed`),
  ADD KEY `idx_documents_access` (`access_level`),
  ADD KEY `idx_documents_virus` (`virus_scan_status`);
ALTER TABLE `documents` ADD FULLTEXT KEY `idx_documents_search` (`original_name`,`extracted_text`,`ocr_text`);

--
-- Indexes for table `document_generation_log`
--
ALTER TABLE `document_generation_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_document_generation_log_user` (`user_id`),
  ADD KEY `fk_document_generation_log_recommendation` (`recommendation_id`),
  ADD KEY `fk_document_generation_log_project` (`project_id`),
  ADD KEY `idx_document_generation_log_type` (`document_type`),
  ADD KEY `idx_document_generation_log_status` (`status`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_recommendation_id` (`recommendation_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_implementation_success` (`implementation_success`);

--
-- Indexes for table `file_uploads`
--
ALTER TABLE `file_uploads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_file_uploads_user` (`user_id`),
  ADD KEY `idx_file_uploads_type` (`upload_type`),
  ADD KEY `idx_file_uploads_status` (`processing_status`),
  ADD KEY `idx_file_uploads_temporary` (`is_temporary`);

--
-- Indexes for table `generated_documents`
--
ALTER TABLE `generated_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `filename` (`filename`),
  ADD KEY `idx_recommendation_id` (`recommendation_id`),
  ADD KEY `idx_document_type` (`document_type`);

--
-- Indexes for table `knowledge_categories`
--
ALTER TABLE `knowledge_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_knowledge_categories_active` (`is_active`);

--
-- Indexes for table `knowledge_sources`
--
ALTER TABLE `knowledge_sources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_knowledge_sources_user` (`user_id`),
  ADD KEY `fk_knowledge_sources_category` (`category_id`),
  ADD KEY `fk_knowledge_sources_document` (`document_id`),
  ADD KEY `fk_knowledge_sources_verified` (`verified_by`),
  ADD KEY `idx_knowledge_sources_type` (`source_type`),
  ADD KEY `idx_knowledge_sources_importance` (`importance_score`),
  ADD KEY `idx_knowledge_sources_public` (`is_public`),
  ADD KEY `idx_knowledge_sources_verified_status` (`is_verified`),
  ADD KEY `idx_knowledge_sources_processing` (`processing_status`),
  ADD KEY `idx_knowledge_sources_user_category` (`user_id`,`category_id`),
  ADD KEY `idx_knowledge_sources_public_importance` (`is_public`,`importance_score`);
ALTER TABLE `knowledge_sources` ADD FULLTEXT KEY `idx_knowledge_sources_search` (`title`,`description`,`content`,`extracted_content`,`tags_text`);

--
-- Indexes for table `knowledge_source_usage`
--
ALTER TABLE `knowledge_source_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_knowledge_source_usage_source` (`knowledge_source_id`),
  ADD KEY `fk_knowledge_source_usage_user` (`user_id`),
  ADD KEY `idx_knowledge_source_usage_type` (`access_type`),
  ADD KEY `idx_knowledge_source_usage_date` (`created_at`);

--
-- Indexes for table `learning_insights`
--
ALTER TABLE `learning_insights`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_learning_insights_type` (`insight_type`),
  ADD KEY `idx_learning_insights_active` (`is_active`),
  ADD KEY `idx_learning_insights_priority` (`priority_score`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_projects_user` (`user_id`),
  ADD KEY `idx_projects_status` (`status`),
  ADD KEY `idx_projects_type` (`project_type`),
  ADD KEY `idx_projects_context` (`cultural_context`),
  ADD KEY `idx_projects_user_status` (`user_id`,`status`);

--
-- Indexes for table `project_files`
--
ALTER TABLE `project_files`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_project_document` (`project_id`,`document_id`),
  ADD KEY `idx_project_files_project` (`project_id`),
  ADD KEY `idx_project_files_document` (`document_id`),
  ADD KEY `idx_project_files_type` (`file_type`),
  ADD KEY `idx_project_files_uploaded` (`uploaded_by`);

--
-- Indexes for table `recommendations`
--
ALTER TABLE `recommendations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_recommendations_project` (`project_id`),
  ADD KEY `idx_recommendations_type` (`analysis_type`),
  ADD KEY `idx_recommendations_status` (`status`),
  ADD KEY `idx_recommendations_confidence` (`confidence_score`),
  ADD KEY `idx_recommendations_project_type` (`project_id`,`analysis_type`);

--
-- Indexes for table `recommendation_feedback`
--
ALTER TABLE `recommendation_feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_recommendation_feedback_recommendation` (`recommendation_id`),
  ADD KEY `fk_recommendation_feedback_user` (`user_id`),
  ADD KEY `idx_recommendation_feedback_rating` (`rating`),
  ADD KEY `idx_recommendation_feedback_recommendation_rating` (`recommendation_id`,`rating`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_active` (`is_active`),
  ADD KEY `idx_users_locked` (`locked_until`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_sessions_user` (`user_id`),
  ADD KEY `idx_user_sessions_last_activity` (`last_activity`);

--
-- Indexes for table `wisdom_entries`
--
ALTER TABLE `wisdom_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `source_id` (`source_id`),
  ADD KEY `category_id` (`category_id`);
ALTER TABLE `wisdom_entries` ADD FULLTEXT KEY `title` (`title`,`content`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `analysis_history`
--
ALTER TABLE `analysis_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_usage_log`
--
ALTER TABLE `api_usage_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_trail`
--
ALTER TABLE `audit_trail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `data_export_log`
--
ALTER TABLE `data_export_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_generation_log`
--
ALTER TABLE `document_generation_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `file_uploads`
--
ALTER TABLE `file_uploads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `generated_documents`
--
ALTER TABLE `generated_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `knowledge_categories`
--
ALTER TABLE `knowledge_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `knowledge_sources`
--
ALTER TABLE `knowledge_sources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `knowledge_source_usage`
--
ALTER TABLE `knowledge_source_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `learning_insights`
--
ALTER TABLE `learning_insights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `project_files`
--
ALTER TABLE `project_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `recommendations`
--
ALTER TABLE `recommendations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `recommendation_feedback`
--
ALTER TABLE `recommendation_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `wisdom_entries`
--
ALTER TABLE `wisdom_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `knowledge_source_stats`
--
DROP TABLE IF EXISTS `knowledge_source_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cpses_fo38ap747m`@`localhost` SQL SECURITY DEFINER VIEW `knowledge_source_stats`  AS SELECT `ks`.`id` AS `id`, `ks`.`user_id` AS `user_id`, `ks`.`category_id` AS `category_id`, `ks`.`document_id` AS `document_id`, `ks`.`title` AS `title`, `ks`.`description` AS `description`, `ks`.`content` AS `content`, `ks`.`extracted_content` AS `extracted_content`, `ks`.`tags_text` AS `tags_text`, `ks`.`source_type` AS `source_type`, `ks`.`source_url` AS `source_url`, `ks`.`file_path` AS `file_path`, `ks`.`file_size` AS `file_size`, `ks`.`mime_type` AS `mime_type`, `ks`.`tags` AS `tags`, `ks`.`metadata` AS `metadata`, `ks`.`importance_score` AS `importance_score`, `ks`.`is_public` AS `is_public`, `ks`.`is_verified` AS `is_verified`, `ks`.`verified_by` AS `verified_by`, `ks`.`verified_at` AS `verified_at`, `ks`.`processing_status` AS `processing_status`, `ks`.`processing_error` AS `processing_error`, `ks`.`processed_at` AS `processed_at`, `ks`.`created_at` AS `created_at`, `ks`.`updated_at` AS `updated_at`, `kc`.`name` AS `category_name`, `kc`.`color` AS `category_color`, `u`.`full_name` AS `creator_name`, count(distinct `ksu`.`id`) AS `usage_count`, max(`ksu`.`created_at`) AS `last_accessed` FROM (((`knowledge_sources` `ks` left join `knowledge_categories` `kc` on(`ks`.`category_id` = `kc`.`id`)) left join `users` `u` on(`ks`.`user_id` = `u`.`id`)) left join `knowledge_source_usage` `ksu` on(`ks`.`id` = `ksu`.`knowledge_source_id`)) GROUP BY `ks`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `project_summary`
--
DROP TABLE IF EXISTS `project_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cpses_fo38ap747m`@`localhost` SQL SECURITY DEFINER VIEW `project_summary`  AS SELECT `p`.`id` AS `id`, `p`.`user_id` AS `user_id`, `p`.`title` AS `title`, `p`.`description` AS `description`, `p`.`project_type` AS `project_type`, `p`.`cultural_context` AS `cultural_context`, `p`.`objectives` AS `objectives`, `p`.`stakeholders` AS `stakeholders`, `p`.`priority_areas` AS `priority_areas`, `p`.`status` AS `status`, `p`.`start_date` AS `start_date`, `p`.`end_date` AS `end_date`, `p`.`budget` AS `budget`, `p`.`location` AS `location`, `p`.`risk_level` AS `risk_level`, `p`.`success_metrics` AS `success_metrics`, `p`.`lessons_learned` AS `lessons_learned`, `p`.`created_at` AS `created_at`, `p`.`updated_at` AS `updated_at`, `u`.`full_name` AS `user_name`, `u`.`company_name` AS `company_name`, count(distinct `r`.`id`) AS `recommendation_count`, avg(`r`.`confidence_score`) AS `avg_confidence_score`, max(`r`.`created_at`) AS `last_recommendation_date` FROM ((`projects` `p` left join `users` `u` on(`p`.`user_id` = `u`.`id`)) left join `recommendations` `r` on(`p`.`id` = `r`.`project_id`)) GROUP BY `p`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `user_analytics`
--
DROP TABLE IF EXISTS `user_analytics`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cpses_fo38ap747m`@`localhost` SQL SECURITY DEFINER VIEW `user_analytics`  AS SELECT `u`.`id` AS `id`, `u`.`email` AS `email`, `u`.`full_name` AS `full_name`, `u`.`company_name` AS `company_name`, `u`.`role` AS `role`, `u`.`is_active` AS `is_active`, `u`.`created_at` AS `created_at`, `u`.`updated_at` AS `updated_at`, count(distinct `p`.`id`) AS `total_projects`, count(distinct `r`.`id`) AS `total_recommendations`, count(distinct `ks`.`id`) AS `total_knowledge_sources`, avg(`rf`.`rating`) AS `avg_recommendation_rating`, max(`p`.`created_at`) AS `last_project_date`, max(`u`.`last_login_at`) AS `last_login` FROM ((((`users` `u` left join `projects` `p` on(`u`.`id` = `p`.`user_id`)) left join `recommendations` `r` on(`p`.`id` = `r`.`project_id`)) left join `knowledge_sources` `ks` on(`u`.`id` = `ks`.`user_id`)) left join `recommendation_feedback` `rf` on(`u`.`id` = `rf`.`user_id`)) GROUP BY `u`.`id` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `analysis_history`
--
ALTER TABLE `analysis_history`
  ADD CONSTRAINT `fk_analysis_history_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_analysis_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `api_usage_log`
--
ALTER TABLE `api_usage_log`
  ADD CONSTRAINT `fk_api_usage_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_trail`
--
ALTER TABLE `audit_trail`
  ADD CONSTRAINT `fk_audit_trail_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `data_export_log`
--
ALTER TABLE `data_export_log`
  ADD CONSTRAINT `fk_data_export_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `fk_documents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `document_generation_log`
--
ALTER TABLE `document_generation_log`
  ADD CONSTRAINT `fk_document_generation_log_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_document_generation_log_recommendation` FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_document_generation_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `file_uploads`
--
ALTER TABLE `file_uploads`
  ADD CONSTRAINT `fk_file_uploads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `generated_documents`
--
ALTER TABLE `generated_documents`
  ADD CONSTRAINT `generated_documents_ibfk_1` FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `knowledge_sources`
--
ALTER TABLE `knowledge_sources`
  ADD CONSTRAINT `fk_knowledge_sources_category` FOREIGN KEY (`category_id`) REFERENCES `knowledge_categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_knowledge_sources_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_knowledge_sources_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_knowledge_sources_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `knowledge_source_usage`
--
ALTER TABLE `knowledge_source_usage`
  ADD CONSTRAINT `fk_knowledge_source_usage_source` FOREIGN KEY (`knowledge_source_id`) REFERENCES `knowledge_sources` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_knowledge_source_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `fk_projects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_files`
--
ALTER TABLE `project_files`
  ADD CONSTRAINT `fk_project_files_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_project_files_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_project_files_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `recommendations`
--
ALTER TABLE `recommendations`
  ADD CONSTRAINT `fk_recommendations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `recommendation_feedback`
--
ALTER TABLE `recommendation_feedback`
  ADD CONSTRAINT `fk_recommendation_feedback_recommendation` FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_recommendation_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wisdom_entries`
--
ALTER TABLE `wisdom_entries`
  ADD CONSTRAINT `wisdom_entries_ibfk_1` FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wisdom_entries_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `knowledge_categories` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
