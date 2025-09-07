-- Exeloka v1 Database Schema
-- Cultural Wisdom Recommendation System for Sampang, East Java
-- Created: 2024

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `exeloka` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `exeloka`;

-- ================================================
-- CORE TABLES
-- ================================================

-- Users table with enhanced security fields
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_active` (`is_active`),
  KEY `idx_users_locked` (`locked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knowledge Categories table
CREATE TABLE `knowledge_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `color` varchar(7) DEFAULT '#059669',
  `icon` varchar(50) DEFAULT '📚',
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_knowledge_categories_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knowledge Sources table (enhanced with document support)
CREATE TABLE `knowledge_sources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `document_id` int(11) DEFAULT NULL,
  `title` varchar(500) NOT NULL,
  `description` text,
  `content` longtext,
  `extracted_content` longtext,
  `source_type` enum('text','url','file','document','audio','video','manual') DEFAULT 'text',
  `source_url` varchar(1000) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `importance_score` int(11) DEFAULT 5,
  `is_public` tinyint(1) DEFAULT 0,
  `is_verified` tinyint(1) DEFAULT 0,
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `processing_status` enum('pending','processing','completed','failed') DEFAULT 'completed',
  `processing_error` text,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_knowledge_sources_user` (`user_id`),
  KEY `fk_knowledge_sources_category` (`category_id`),
  KEY `fk_knowledge_sources_document` (`document_id`),
  KEY `fk_knowledge_sources_verified` (`verified_by`),
  KEY `idx_knowledge_sources_type` (`source_type`),
  KEY `idx_knowledge_sources_importance` (`importance_score`),
  KEY `idx_knowledge_sources_public` (`is_public`),
  KEY `idx_knowledge_sources_verified_status` (`is_verified`),
  KEY `idx_knowledge_sources_processing` (`processing_status`),
  FULLTEXT KEY `idx_knowledge_sources_search` (`title`,`description`,`content`,`extracted_content`,`tags`),
  CONSTRAINT `fk_knowledge_sources_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_knowledge_sources_category` FOREIGN KEY (`category_id`) REFERENCES `knowledge_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_knowledge_sources_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_knowledge_sources_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- DOCUMENT MANAGEMENT TABLES
-- ================================================

-- Documents table for secure file management
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `extracted_text` longtext,
  `ocr_text` longtext,
  `metadata` json DEFAULT NULL,
  `access_level` enum('private','shared','public') DEFAULT 'private',
  `download_count` int(11) DEFAULT 0,
  `last_accessed` timestamp NULL DEFAULT NULL,
  `virus_scan_status` enum('pending','clean','infected','failed') DEFAULT 'pending',
  `virus_scan_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_file_hash` (`file_hash`),
  KEY `idx_documents_user` (`user_id`),
  KEY `idx_documents_type` (`mime_type`),
  KEY `idx_documents_storage` (`storage_type`),
  KEY `idx_documents_processed` (`is_processed`),
  KEY `idx_documents_access` (`access_level`),
  KEY `idx_documents_virus` (`virus_scan_status`),
  FULLTEXT KEY `idx_documents_search` (`original_name`,`extracted_text`,`ocr_text`),
  CONSTRAINT `fk_documents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project Files table (links projects to documents)
CREATE TABLE `project_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `document_id` int(11) NOT NULL,
  `file_type` enum('input','reference','output','analysis') DEFAULT 'reference',
  `description` text,
  `uploaded_by` int(11) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_project_document` (`project_id`, `document_id`),
  KEY `idx_project_files_project` (`project_id`),
  KEY `idx_project_files_document` (`document_id`),
  KEY `idx_project_files_type` (`file_type`),
  KEY `idx_project_files_uploaded` (`uploaded_by`),
  CONSTRAINT `fk_project_files_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_files_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_files_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL,
  `project_type` varchar(100) DEFAULT NULL,
  `cultural_context` varchar(100) DEFAULT NULL,
  `objectives` json DEFAULT NULL,
  `stakeholders` json DEFAULT NULL,
  `priority_areas` json DEFAULT NULL,
  `status` enum('draft','planning','active','paused','completed','cancelled') DEFAULT 'planning',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `risk_level` enum('low','medium','high') DEFAULT 'medium',
  `success_metrics` json DEFAULT NULL,
  `lessons_learned` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_projects_user` (`user_id`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_type` (`project_type`),
  KEY `idx_projects_context` (`cultural_context`),
  CONSTRAINT `fk_projects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendations table
CREATE TABLE `recommendations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `analysis_type` enum('quick','enhanced') DEFAULT 'quick',
  `key_insights` json DEFAULT NULL,
  `recommendations` json DEFAULT NULL,
  `potential_risks` json DEFAULT NULL,
  `cultural_context` json DEFAULT NULL,
  `success_metrics` json DEFAULT NULL,
  `confidence_score` decimal(5,2) DEFAULT 75.00,
  `processing_time_ms` int(11) DEFAULT NULL,
  `llm_model_used` varchar(100) DEFAULT NULL,
  `cost_estimate` decimal(10,4) DEFAULT NULL,
  `additional_context` text DEFAULT NULL,
  `priority_areas` json DEFAULT NULL,
  `specific_concerns` json DEFAULT NULL,
  `status` enum('draft','processing','completed','failed') DEFAULT 'completed',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_recommendations_project` (`project_id`),
  KEY `idx_recommendations_type` (`analysis_type`),
  KEY `idx_recommendations_status` (`status`),
  KEY `idx_recommendations_confidence` (`confidence_score`),
  CONSTRAINT `fk_recommendations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- FEEDBACK & ANALYTICS TABLES
-- ================================================

-- Recommendation Feedback table
CREATE TABLE `recommendation_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recommendation_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `comments` text DEFAULT NULL,
  `usefulness_score` int(11) DEFAULT NULL CHECK (`usefulness_score` >= 1 AND `usefulness_score` <= 10),
  `implementation_status` enum('not_started','in_progress','completed','abandoned') DEFAULT 'not_started',
  `implementation_notes` text DEFAULT NULL,
  `would_recommend` tinyint(1) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_recommendation_feedback_recommendation` (`recommendation_id`),
  KEY `fk_recommendation_feedback_user` (`user_id`),
  KEY `idx_recommendation_feedback_rating` (`rating`),
  CONSTRAINT `fk_recommendation_feedback_recommendation` FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recommendation_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knowledge Source Usage table
CREATE TABLE `knowledge_source_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `knowledge_source_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `access_type` enum('view','search','reference','export') DEFAULT 'view',
  `context` varchar(255) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_knowledge_source_usage_source` (`knowledge_source_id`),
  KEY `fk_knowledge_source_usage_user` (`user_id`),
  KEY `idx_knowledge_source_usage_type` (`access_type`),
  KEY `idx_knowledge_source_usage_date` (`created_at`),
  CONSTRAINT `fk_knowledge_source_usage_source` FOREIGN KEY (`knowledge_source_id`) REFERENCES `knowledge_sources` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_knowledge_source_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- AUDIT & TRACKING TABLES
-- ================================================

-- Audit Trail table
CREATE TABLE `audit_trail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `action` enum('create','update','delete','view','export','analyze') NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_trail_user` (`user_id`),
  KEY `idx_audit_trail_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_trail_action` (`action`),
  KEY `idx_audit_trail_date` (`created_at`),
  CONSTRAINT `fk_audit_trail_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analysis History table
CREATE TABLE `analysis_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `analysis_type` enum('quick','enhanced') NOT NULL,
  `input_parameters` json DEFAULT NULL,
  `processing_time_ms` int(11) DEFAULT NULL,
  `tokens_used` int(11) DEFAULT NULL,
  `cost_usd` decimal(10,4) DEFAULT NULL,
  `model_used` varchar(100) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 1,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_analysis_history_user` (`user_id`),
  KEY `fk_analysis_history_project` (`project_id`),
  KEY `idx_analysis_history_type` (`analysis_type`),
  KEY `idx_analysis_history_date` (`created_at`),
  CONSTRAINT `fk_analysis_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_analysis_history_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Sessions table
CREATE TABLE `user_sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_user_sessions_user` (`user_id`),
  KEY `idx_user_sessions_last_activity` (`last_activity`),
  CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Usage Log table
CREATE TABLE `api_usage_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_api_usage_log_user` (`user_id`),
  KEY `idx_api_usage_log_endpoint` (`endpoint`),
  KEY `idx_api_usage_log_status` (`status_code`),
  KEY `idx_api_usage_log_date` (`created_at`),
  CONSTRAINT `fk_api_usage_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- DOCUMENT & EXPORT TABLES
-- ================================================

-- Document Generation Log table
CREATE TABLE `document_generation_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `recommendation_id` int(11) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `document_type` enum('docx','xlsx','pptx','pdf') NOT NULL,
  `file_name` varchar(500) NOT NULL,
  `file_path` varchar(1000) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `generation_time_ms` int(11) DEFAULT NULL,
  `template_used` varchar(255) DEFAULT NULL,
  `parameters` json DEFAULT NULL,
  `status` enum('processing','completed','failed') DEFAULT 'completed',
  `error_message` text DEFAULT NULL,
  `download_count` int(11) DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_document_generation_log_user` (`user_id`),
  KEY `fk_document_generation_log_recommendation` (`recommendation_id`),
  KEY `fk_document_generation_log_project` (`project_id`),
  KEY `idx_document_generation_log_type` (`document_type`),
  KEY `idx_document_generation_log_status` (`status`),
  CONSTRAINT `fk_document_generation_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_document_generation_log_recommendation` FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_document_generation_log_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- File Uploads table
CREATE TABLE `file_uploads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `original_filename` varchar(500) NOT NULL,
  `stored_filename` varchar(500) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` int(11) NOT NULL,
  `upload_type` enum('knowledge','project','user_avatar','document') DEFAULT 'knowledge',
  `processing_status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `metadata` json DEFAULT NULL,
  `is_temporary` tinyint(1) DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_file_uploads_user` (`user_id`),
  KEY `idx_file_uploads_type` (`upload_type`),
  KEY `idx_file_uploads_status` (`processing_status`),
  KEY `idx_file_uploads_temporary` (`is_temporary`),
  CONSTRAINT `fk_file_uploads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- LEARNING & INSIGHTS TABLES
-- ================================================

-- Learning Insights table
CREATE TABLE `learning_insights` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `insight_type` enum('pattern','trend','recommendation','risk','success_factor') NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL,
  `data_source` enum('user_feedback','usage_patterns','success_metrics','external_research') NOT NULL,
  `confidence_level` decimal(5,2) DEFAULT 75.00,
  `supporting_data` json DEFAULT NULL,
  `affected_categories` json DEFAULT NULL,
  `actionable_steps` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `priority_score` int(11) DEFAULT 5,
  `created_by_system` tinyint(1) DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_learning_insights_type` (`insight_type`),
  KEY `idx_learning_insights_active` (`is_active`),
  KEY `idx_learning_insights_priority` (`priority_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data Export Log table
CREATE TABLE `data_export_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `export_type` enum('projects','recommendations','knowledge','analytics','full_backup') NOT NULL,
  `export_format` enum('json','csv','xlsx','zip') NOT NULL,
  `file_path` varchar(1000) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `record_count` int(11) DEFAULT NULL,
  `date_range_start` date DEFAULT NULL,
  `date_range_end` date DEFAULT NULL,
  `filters_applied` json DEFAULT NULL,
  `processing_time_ms` int(11) DEFAULT NULL,
  `status` enum('processing','completed','failed','expired') DEFAULT 'processing',
  `error_message` text DEFAULT NULL,
  `download_count` int(11) DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_data_export_log_user` (`user_id`),
  KEY `idx_data_export_log_type` (`export_type`),
  KEY `idx_data_export_log_status` (`status`),
  CONSTRAINT `fk_data_export_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- SAMPLE DATA INSERTION
-- ================================================

-- Insert Knowledge Categories
INSERT INTO `knowledge_categories` (`id`, `name`, `description`, `color`, `icon`, `sort_order`) VALUES
(1, 'Religious Leadership', 'Information about Kyai, Islamic authorities, and religious influence in Sampang', '#059669', '🕌', 1),
(2, 'Traditional Governance', 'Village leadership, traditional decision-making, and local government structures', '#0369a1', '🏛️', 2),
(3, 'Cultural Traditions', 'Kerapan Sapi, local customs, festivals, and traditional practices', '#dc2626', '🎭', 3),
(4, 'Family Networks', 'Clan relationships, genealogical structures, and family influence patterns', '#7c3aed', '👨‍👩‍👧‍👦', 4),
(5, 'Economic Patterns', 'Traditional trade, business customs, and economic structures', '#059669', '💰', 5),
(6, 'Youth & Education', 'Modern youth perspectives, educational systems, and generational changes', '#0891b2', '🎓', 6),
(7, 'Language & Communication', 'Madurese language usage, communication patterns, and media preferences', '#ea580c', '💬', 7),
(8, 'Historical Context', 'Historical events, colonial impacts, and cultural evolution', '#6b7280', '📚', 8);

-- Insert Sample Users
INSERT INTO `users` (`id`, `email`, `password`, `full_name`, `company_name`, `role`) VALUES
(1, 'admin@sampang.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmad Sutrisno', 'Sampang Cultural Institute', 'admin'),
(2, 'user@company.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sari Wijayanti', 'PT Nusantara Development', 'user'),
(3, 'cultural@expert.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Moh Kholil', 'Cultural Research Center', 'user');

-- Insert Sample Knowledge Sources
INSERT INTO `knowledge_sources` (`user_id`, `category_id`, `title`, `content`, `source_type`, `tags`, `importance_score`, `is_public`) VALUES
(1, 1, 'Peran Kyai dalam Masyarakat Sampang', 'Kyai memiliki peran sentral dalam kehidupan masyarakat Sampang. Mereka tidak hanya pemimpin spiritual, tetapi juga penasihat dalam berbagai aspek kehidupan termasuk ekonomi, sosial, dan politik. Keputusan penting dalam komunitas seringkali memerlukan persetujuan atau nasihat dari Kyai setempat.', 'text', '["kyai", "leadership", "spiritual", "community"]', 9, 1),
(1, 3, 'Tradisi Kerapan Sapi di Sampang', 'Kerapan Sapi bukan sekadar perlombaan, tetapi representasi status sosial, kebanggaan komunitas, dan identitas budaya Madura. Setiap pasangan sapi memiliki nilai ekonomi dan simbolis tinggi. Pemilik sapi yang menang mendapat prestise sosial yang signifikan.', 'text', '["kerapan_sapi", "tradition", "culture", "social_status"]', 10, 1),
(1, 2, 'Sistem Pengambilan Keputusan Tradisional', 'Pengambilan keputusan di Sampang mengikuti pola musyawarah mufakat yang melibatkan tokoh masyarakat, kepala desa, dan perwakilan keluarga besar. Proses ini membutuhkan waktu tetapi menghasilkan konsensus yang kuat dan dukungan komunitas yang solid.', 'text', '["decision_making", "consensus", "traditional_governance"]', 8, 1),
(2, 4, 'Jaringan Keluarga dalam Bisnis', 'Hubungan keluarga dan klan sangat mempengaruhi aktivitas bisnis di Sampang. Kepercayaan bisnis dibangun melalui koneksi genealogis dan reputasi keluarga. Proyek yang melibatkan atau mendapat dukungan jaringan keluarga yang tepat memiliki peluang sukses lebih tinggi.', 'text', '["family", "business", "networks", "genealogy"]', 7, 1),
(1, 5, 'Pola Ekonomi Tradisional Sampang', 'Ekonomi Sampang didominasi oleh pertanian, peternakan, dan perdagangan. Pola ekonomi masih sangat terikat dengan siklus musim dan tradisi. Inovasi ekonomi harus mempertimbangkan pola tradisional ini untuk mendapat penerimaan masyarakat.', 'text', '["economy", "agriculture", "trade", "tradition"]', 8, 1);

-- Insert Sample Projects
INSERT INTO `projects` (`user_id`, `title`, `description`, `project_type`, `cultural_context`, `objectives`, `stakeholders`, `priority_areas`, `status`) VALUES
(2, 'Community Health Center Initiative', 'Establishing a modern healthcare facility in collaboration with local community leaders, ensuring cultural sensitivity and traditional medicine integration.', 'Healthcare', 'sampang_rural', '["Improve healthcare access", "Integrate traditional medicine", "Train local staff", "Build community trust"]', '["Local Kyai and Religious Leaders", "Village Head (Lurah)", "Traditional Healers (Dukun)", "Community Health Workers", "Local Government Health Office"]', '["Religious Leadership", "Traditional Governance", "Community Health"]', 'active'),
(2, 'Kerapan Sapi Cultural Tourism Development', 'Developing sustainable cultural tourism around the traditional bull racing (Kerapan Sapi) while preserving authenticity and supporting local communities.', 'Cultural', 'sampang_traditional', '["Preserve traditions", "Generate tourism revenue", "Support local economy", "Create employment opportunities"]', '["Kerapan Sapi Organizers", "Bull Owners and Trainers", "Local Tourism Office", "Cultural Preservation Society", "Hotel and Restaurant Owners"]', '["Cultural Traditions", "Economic Patterns", "Traditional Governance"]', 'planning'),
(3, 'Islamic Education Center Partnership', 'Creating modern educational facilities that complement traditional Islamic education, working closely with local Kyai and religious authorities.', 'Education', 'sampang_religious', '["Modern education access", "Religious harmony", "Youth development", "Teacher training programs"]', '["Islamic Boarding Schools (Pesantren)", "Local Kyai Council", "Education Department", "Parent Organizations", "Youth Groups"]', '["Religious Leadership", "Youth & Education", "Community Development"]', 'completed');

-- Insert Sample Recommendations
INSERT INTO `recommendations` (`project_id`, `analysis_type`, `key_insights`, `recommendations`, `potential_risks`, `cultural_context`, `success_metrics`, `confidence_score`) VALUES
(1, 'enhanced', '["Religious leaders (Kyai) have significant influence over community health decisions", "Traditional healing practices coexist with modern healthcare approaches", "Community trust is built through religious endorsement", "Healthcare decisions often involve family consultation patterns"]', '["Engage with local Kyai early in the planning process", "Create integration pathways between traditional and modern practices", "Establish a Cultural Advisory Board including religious leaders", "Provide cultural sensitivity training for medical staff", "Respect prayer times and religious observances in facility operations"]', '["Bypassing religious leadership can lead to community resistance", "Conflicts between traditional and modern approaches if not managed properly", "Potential resistance from traditional healers if not included", "Religious objections to certain medical practices"]', '["Islamic values deeply influence health decisions", "Community trust is built through religious endorsement", "Traditional healing has cultural legitimacy", "Family involvement in health decisions is expected"]', '["Number of religious leaders engaged", "Community acceptance rate through religious channels", "Integration of traditional practices", "Patient satisfaction with cultural sensitivity"]', 92.5),
(2, 'quick', '["Kerapan Sapi traditions represent community identity and social status", "Tourism must respect and preserve authentic cultural elements", "Local community should benefit directly from tourism revenue", "Seasonal nature of events requires strategic planning"]', '["Develop tourism in partnership with traditional Kerapan Sapi organizers", "Ensure authentic presentation without commercialization", "Create direct economic benefits for bull owners and trainers", "Establish visitor education programs about cultural significance", "Plan around traditional calendar and seasonal patterns"]', '["Over-commercialization may diminish cultural authenticity", "Seasonal nature of Kerapan Sapi may limit tourism potential", "Competition with other cultural tourism destinations", "Environmental impact on traditional grazing areas"]', '["Kerapan Sapi is deeply tied to social status and identity", "Community pride is associated with bull racing success", "Traditional knowledge of bull breeding and training is valuable", "Events follow traditional calendar and customs"]', '["Tourist visitor numbers and satisfaction", "Economic benefit distribution to local community", "Preservation of traditional practices", "Community support and participation levels"]', 87.0);

-- Insert Sample Feedback
INSERT INTO `recommendation_feedback` (`recommendation_id`, `user_id`, `rating`, `comments`, `usefulness_score`, `implementation_status`) VALUES
(1, 2, 5, 'Sangat membantu! Pendekatan melalui Kyai lokal memang kunci sukses proyek kesehatan kami. Rekomendasi ini sangat praktis dan applicable.', 9, 'in_progress'),
(2, 2, 4, 'Good insights about Kerapan Sapi tourism. The recommendations are solid, but need more detail on implementation timeline.', 8, 'not_started');

-- Insert Sample Learning Insights
INSERT INTO `learning_insights` (`insight_type`, `title`, `description`, `data_source`, `confidence_level`, `supporting_data`, `affected_categories`, `priority_score`) VALUES
('success_factor', 'Religious Leader Engagement Critical for Healthcare Projects', 'Projects with early Kyai engagement show 78% higher community acceptance rates in healthcare initiatives.', 'user_feedback', 85.5, '{"sample_size": 12, "success_rate": 78.3, "time_to_acceptance": "reduced by 40%"}', '["Religious Leadership", "Healthcare"]', 9),
('pattern', 'Seasonal Planning Essential for Cultural Projects', 'Cultural projects aligned with traditional calendar show significantly better participation and community support.', 'usage_patterns', 82.0, '{"projects_analyzed": 8, "participation_increase": "65%", "seasonal_alignment_benefit": "high"}', '["Cultural Traditions", "Project Planning"]', 8),
('risk', 'Bypassing Traditional Hierarchy Leads to Project Delays', 'Projects that skip traditional consultation processes experience average delays of 3-6 months and require additional relationship-building phases.', 'success_metrics', 88.2, '{"affected_projects": 5, "average_delay": "4.2 months", "additional_costs": "15-25%"}', '["Traditional Governance", "Project Management"]', 7);

COMMIT;

-- ================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_recommendations_project_type ON recommendations(project_id, analysis_type);
CREATE INDEX idx_knowledge_sources_user_category ON knowledge_sources(user_id, category_id);
CREATE INDEX idx_knowledge_sources_public_importance ON knowledge_sources(is_public, importance_score DESC);
CREATE INDEX idx_audit_trail_user_date ON audit_trail(user_id, created_at DESC);
CREATE INDEX idx_recommendation_feedback_recommendation_rating ON recommendation_feedback(recommendation_id, rating);

-- ================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================

-- Project Summary View
CREATE VIEW project_summary AS
SELECT 
    p.*,
    u.full_name as user_name,
    u.company_name,
    COUNT(DISTINCT r.id) as recommendation_count,
    AVG(r.confidence_score) as avg_confidence_score,
    MAX(r.created_at) as last_recommendation_date
FROM projects p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN recommendations r ON p.id = r.project_id
GROUP BY p.id;

-- Knowledge Source Stats View
CREATE VIEW knowledge_source_stats AS
SELECT 
    ks.*,
    kc.name as category_name,
    kc.color as category_color,
    u.full_name as creator_name,
    COUNT(DISTINCT ksu.id) as usage_count,
    MAX(ksu.created_at) as last_accessed
FROM knowledge_sources ks
LEFT JOIN knowledge_categories kc ON ks.category_id = kc.id
LEFT JOIN users u ON ks.user_id = u.id
LEFT JOIN knowledge_source_usage ksu ON ks.id = ksu.knowledge_source_id
GROUP BY ks.id;

-- User Analytics View
CREATE VIEW user_analytics AS
SELECT 
    u.*,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT r.id) as total_recommendations,
    COUNT(DISTINCT ks.id) as total_knowledge_sources,
    AVG(rf.rating) as avg_recommendation_rating,
    MAX(p.created_at) as last_project_date,
    MAX(u.last_login_at) as last_login
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN recommendations r ON p.id = r.project_id
LEFT JOIN knowledge_sources ks ON u.id = ks.user_id
LEFT JOIN recommendation_feedback rf ON u.id = rf.user_id
GROUP BY u.id;

-- End of Schema