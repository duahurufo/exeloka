// Common types used across the application

export interface User {
  id: number;
  email: string;
  company_name: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface KnowledgeSource {
  id: number;
  title: string;
  source_type: 'url' | 'document' | 'audio' | 'video' | 'text';
  source_url?: string;
  file_path?: string;
  content_text?: string;
  metadata: Record<string, any>;
  processed_at?: Date;
  user_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface WisdomEntry {
  id: number;
  source_id: number;
  category_id?: number;
  title: string;
  content: string;
  cultural_context?: string;
  importance_score: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: number;
  user_id: number;
  title: string;
  description: string;
  project_type?: string;
  company_name?: string;
  objectives?: string[];
  priority_areas?: string[];
  cultural_context?: string;
  risk_level?: 'low' | 'medium' | 'high';
  location_details: Record<string, any>;
  timeline_start?: Date;
  timeline_end?: Date;
  budget_range?: string;
  stakeholders: string[];
  risk_factors: string[];
  status: 'planning' | 'analyzing' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface Recommendation {
  id: number;
  project_id: number;
  title: string;
  executive_summary?: string;
  strategic_approach?: string;
  detailed_methods?: string;
  risk_mitigation?: string;
  timeline_recommendations?: string;
  success_metrics?: string;
  cultural_considerations?: string;
  confidence_score: number;
  llm_analysis: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface GeneratedDocument {
  id: number;
  recommendation_id: number;
  document_type: 'docx' | 'xlsx' | 'pptx';
  filename: string;
  file_path: string;
  file_size?: number;
  download_count: number;
  created_at: Date;
}

export interface Feedback {
  id: number;
  recommendation_id: number;
  user_id: number;
  rating: number; // 1-5
  feedback_text?: string;
  implementation_success?: 'not_implemented' | 'failed' | 'partial' | 'successful' | 'exceeded';
  outcome_details?: string;
  lessons_learned?: string;
  created_at: Date;
}

export interface WisdomCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_at: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// File processing types
export interface FileProcessingResult {
  content: string;
  metadata: Record<string, any>;
  processing_time: number;
  success: boolean;
  error?: string;
}

// Cultural analysis types
export interface CulturalElement {
  type: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  source_reference: string;
}

export interface RiskAssessment {
  risk_type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  mitigation_strategy: string;
}

// Project creation request types
export interface CreateProjectRequest {
  title: string;
  description: string;
  project_type?: string;
  objectives?: string[];
  priority_areas?: string[];
  cultural_context?: string;
  risk_level?: 'low' | 'medium' | 'high';
  location_details: {
    region?: string;
    specific_location?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    affected_communities?: string[];
  };
  timeline_start?: string;
  timeline_end?: string;
  budget_range?: string;
  stakeholders?: string[];
  risk_factors?: string[];
}

// Recommendation request types
export interface GenerateRecommendationRequest {
  project_id: number;
  analysis_type: 'quick' | 'enhanced';
  additional_context?: string;
  priority_areas?: string[];
  specific_concerns?: string[];
  custom_system_instruction?: string;
  custom_user_prompt?: string;
}

// Search types
export interface SearchQuery {
  query: string;
  category?: string;
  source_type?: string;
  importance_level?: 'high' | 'medium' | 'low';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: number;
  title: string;
  content: string;
  source_type: string;
  relevance_score: number;
  cultural_context?: string;
  tags: string[];
}

// Document generation types
export interface DocumentGenerationRequest {
  recommendation_id: number;
  template_type?: string;
  include_sections?: string[];
  custom_branding?: {
    company_name: string;
    logo_url?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export interface DocumentGenerationResult {
  document_id: number;
  filename: string;
  download_url: string;
  file_size: number;
  generation_time: number;
}