import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh token
          const refreshToken = localStorage.getItem('exeloka_refresh_token');
          if (refreshToken) {
            try {
              const response = await this.client.post('/auth/refresh', {
                refreshToken
              });

              if (response.data.success) {
                const { token, refreshToken: newRefreshToken } = response.data.data;
                
                localStorage.setItem('exeloka_token', token);
                localStorage.setItem('exeloka_refresh_token', newRefreshToken);
                
                this.setAuthToken(token);
                originalRequest.headers.Authorization = `Bearer ${token}`;
                
                return this.client(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed, redirect to login
              this.handleAuthFailure();
            }
          } else {
            this.handleAuthFailure();
          }
        }

        // Handle other errors
        if (error.response?.data?.message) {
          // Don't show toast for auth errors as they're handled elsewhere
          if (error.response.status !== 401) {
            toast.error(error.response.data.message);
          }
        } else if (error.message === 'Network Error') {
          toast.error('Network error. Please check your connection.');
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Request timeout. Please try again.');
        }

        return Promise.reject(error);
      }
    );
  }

  private handleAuthFailure() {
    localStorage.removeItem('exeloka_token');
    localStorage.removeItem('exeloka_refresh_token');
    this.setAuthToken(null);
    
    // Only redirect if we're not already on auth pages
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Generic request methods
  async get(url: string, params?: any): Promise<AxiosResponse> {
    return this.client.get(url, { params });
  }

  async post(url: string, data?: any, config?: any): Promise<AxiosResponse> {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: any): Promise<AxiosResponse> {
    return this.client.put(url, data);
  }

  async delete(url: string): Promise<AxiosResponse> {
    return this.client.delete(url);
  }

  // File upload with progress
  async uploadFile(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<AxiosResponse> {
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  // File download
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      });

      // Create blob link to download
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
      throw error;
    }
  }
}

// Export singleton instance
export const api = new ApiClient();

// Specific API functions for different modules
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; company_name: string; full_name: string }) =>
    api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

export const knowledgeAPI = {
  ingestData: (data: any) => api.post('/knowledge/ingest', data),
  
  addDirectEntry: (data: any) => {
    if (data instanceof FormData) {
      return api.uploadFile('/knowledge/direct', data);
    } else {
      return api.post('/knowledge/direct', data);
    }
  },
  
  search: (query: string, filters?: any) =>
    api.get('/knowledge/search', { query, ...filters }),
  
  getSources: (params?: any) => api.get('/knowledge/sources', params),
  
  getCategories: () => api.get('/knowledge/categories'),
  
  getSource: (id: number) => api.get(`/knowledge/${id}`),
  
  deleteSource: (id: number) => api.delete(`/knowledge/sources/${id}`),
};

export const projectAPI = {
  create: (data: any) => api.post('/recommendations/projects', data),
  
  getAll: (params?: any) => api.get('/recommendations/projects', params),
  
  getById: (id: number) => api.get(`/recommendations/projects/${id}`),
  
  update: (id: number, data: any) => api.put(`/recommendations/projects/${id}`, data),
  
  delete: (id: number) => api.delete(`/recommendations/projects/${id}`),
  
  getPromptTemplates: () => api.get('/recommendations/prompt-templates'),
  
  generateRecommendation: (data: { 
    project_id: number; 
    analysis_type: 'quick' | 'enhanced';
    additional_context?: string; 
    priority_areas?: string[]; 
    specific_concerns?: string[];
    custom_system_instruction?: string;
    custom_user_prompt?: string;
  }) => api.post('/recommendations/generate', data),
  
  getRecommendations: (params?: any) => api.get('/recommendations', params),
  
  getRecommendation: (id: number) => api.get(`/recommendations/${id}`),
  
  submitFeedback: (id: number, feedback: any) =>
    api.post(`/recommendations/${id}/feedback`, feedback),
  
  getAnalytics: () => api.get('/recommendations/analytics'),
  
  getAnalyticsDashboard: (dateRange: string) => api.get(`/recommendations/analytics/dashboard?range=${dateRange}`),
};

export const recommendationAPI = {
  getAll: (params?: any) => api.get('/recommendations', params),
  
  getById: (id: number) => api.get(`/recommendations/${id}`),
  
  getByProject: (projectId: number) => api.get(`/recommendations?project=${projectId}`),
  
  submitFeedback: (id: number, feedback: { rating: number; comments?: string }) =>
    api.post(`/recommendations/${id}/feedback`, feedback),
    
  generateDocument: (id: number, format: 'docx' | 'xlsx' | 'pptx') =>
    api.post(`/recommendations/${id}/generate-document`, { format }, { responseType: 'blob' }),
    
  delete: (id: number) => api.delete(`/recommendations/${id}`),
};

export const documentAPI = {
  generateDocx: (data: any) => api.post('/documents/generate/docx', data),
  
  generateXlsx: (data: any) => api.post('/documents/generate/xlsx', data),
  
  generatePptx: (data: any) => api.post('/documents/generate/pptx', data),
  
  getDocuments: (params?: any) => api.get('/documents', params),
  
  downloadDocument: (filename: string) => api.downloadFile(`/documents/download/${filename}`, filename),
  
  getStats: () => api.get('/documents/stats'),
};

export const learningAPI = {
  getInsights: (params?: any) => api.get('/recommendations/learning/insights', params),
  
  getStats: () => api.get('/recommendations/learning/stats'),
  
  getFeedbackSummary: (recommendationId: number) =>
    api.get(`/recommendations/${recommendationId}/feedback-summary`),
};