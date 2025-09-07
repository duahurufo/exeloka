// API Client for Exeloka v1
class ApiClient {
    constructor() {
        // Detect the correct API base URL
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/exeloka/v1/') || window.location.href.includes('localhost/exeloka')) {
            // XAMPP environment
            this.baseUrl = window.location.origin + '/exeloka/v1/api';
        } else if (currentPath.includes('/v1/')) {
            // Direct v1 path
            this.baseUrl = window.location.origin + '/v1/api';
        } else {
            // Default fallback
            this.baseUrl = window.location.origin + '/api';
        }
        
        console.log('API Base URL:', this.baseUrl);
    }

    async request(endpoint, options = {}) {
        // Check if we should use mock API
        if (window.MockAPI && MockAPI.shouldUseMock()) {
            console.log(`🔧 Using mock API for: ${endpoint}`);
            return this.handleMockRequest(endpoint, options);
        }
        
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            credentials: 'include', // Include cookies for session management
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Don't set Content-Type for FormData - let browser handle it
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            // Fallback to mock API if real API fails and mock is available
            if (window.MockAPI) {
                console.log('🔧 API failed, falling back to mock data');
                return this.handleMockRequest(endpoint, options);
            }
            
            throw error;
        }
    }
    
    async handleMockRequest(endpoint, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
        
        switch (endpoint) {
            case '/auth.php':
                if (method === 'POST') {
                    if (body.action === 'login') {
                        return await MockAPI.login(body.email, body.password);
                    } else if (body.action === 'register') {
                        return await MockAPI.register(body);
                    } else if (body.action === 'logout') {
                        return await MockAPI.logout();
                    }
                }
                break;
            case '/projects.php':
                if (method === 'GET') return await MockAPI.getProjects();
                break;
            case '/recommendations.php':
                if (method === 'GET') return await MockAPI.getRecommendations();
                break;
            case '/knowledge.php':
                if (method === 'GET') {
                    const params = new URLSearchParams(endpoint.split('?')[1] || '');
                    const page = parseInt(params.get('page')) || 1;
                    const filters = {};
                    if (params.get('type')) filters.type = params.get('type');
                    if (params.get('search')) filters.search = params.get('search');
                    return await MockAPI.getKnowledge(page, filters);
                } else if (method === 'POST') {
                    if (body.action === 'extract') {
                        return await MockAPI.extractContent(body.source, body.type);
                    } else if (options.body instanceof FormData) {
                        // Handle file upload
                        const file = options.body.get('file');
                        const metadata = JSON.parse(options.body.get('metadata') || '{}');
                        return await MockAPI.uploadDocument(file, metadata);
                    } else {
                        return await MockAPI.addKnowledge(body);
                    }
                } else if (method === 'PUT') {
                    const id = endpoint.split('id=')[1];
                    return await MockAPI.updateKnowledge(id, body);
                } else if (method === 'DELETE') {
                    const id = endpoint.split('id=')[1];
                    return await MockAPI.deleteKnowledge(id);
                }
                break;
            default:
                if (endpoint.startsWith('/projects.php?id=')) {
                    const id = endpoint.split('id=')[1];
                    return await MockAPI.getProject(id);
                } else if (endpoint.startsWith('/recommendations.php?id=')) {
                    const id = endpoint.split('id=')[1];
                    return await MockAPI.getRecommendation(id);
                } else if (endpoint.startsWith('/knowledge.php?id=')) {
                    const id = endpoint.split('id=')[1];
                    return await MockAPI.getKnowledgeItem(id);
                }
                break;
        }
        
        throw new Error(`Mock endpoint not implemented: ${endpoint} ${method}`);
    }

    // Auth methods
    async login(email, password) {
        return this.request('/auth.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'login',
                email,
                password
            })
        });
    }

    async register(userData) {
        return this.request('/auth.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'register',
                ...userData
            })
        });
    }

    async logout() {
        return this.request('/auth.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'logout'
            })
        });
    }

    // Project methods
    async getProjects() {
        return this.request('/projects.php');
    }

    async getProject(id) {
        return this.request(`/projects.php?id=${id}`);
    }

    async createProject(projectData) {
        return this.request('/projects.php', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProject(id, projectData) {
        return this.request(`/projects.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(id) {
        return this.request(`/projects.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    // Knowledge methods
    async getKnowledgeSources() {
        return this.request('/knowledge.php');
    }

    async addKnowledgeSource(data) {
        return this.request('/knowledge.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async deleteKnowledgeSource(id) {
        return this.request(`/knowledge.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    // Recommendation methods
    async getRecommendations(projectId = null) {
        const query = projectId ? `?project=${projectId}` : '';
        return this.request(`/recommendations.php${query}`);
    }

    async getRecommendation(id) {
        return this.request(`/recommendations.php?id=${id}`);
    }

    async generateRecommendation(data) {
        return this.request('/recommendations.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'generate',
                ...data
            })
        });
    }

    async submitFeedback(recommendationId, feedback) {
        return this.request('/recommendations.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'feedback',
                recommendation_id: recommendationId,
                ...feedback
            })
        });
    }

    // Knowledge Management API
    async getKnowledge(page = 1, filters = {}) {
        const query = new URLSearchParams({
            page,
            ...filters
        }).toString();
        return this.request(`/knowledge.php?${query}`);
    }

    async getKnowledgeItem(id) {
        return this.request(`/knowledge.php?id=${id}`);
    }

    async addKnowledge(data) {
        return this.request('/knowledge.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateKnowledge(id, data) {
        return this.request(`/knowledge.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteKnowledge(id) {
        return this.request(`/knowledge.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    async uploadDocument(file, metadata = {}) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify(metadata));

        return this.request('/knowledge.php', {
            method: 'POST',
            body: formData,
            headers: {}  // Don't set Content-Type, let browser set it for FormData
        });
    }

    async extractContent(source, type = 'auto') {
        return this.request('/knowledge.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'extract',
                source,
                type
            })
        });
    }
}

// Global API instance
const api = new ApiClient();

// Utility functions
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Find container to show alert in
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadge(status) {
    const badges = {
        'planning': 'badge-planning',
        'active': 'badge-active', 
        'completed': 'badge-completed'
    };
    
    return `<span class="badge ${badges[status] || 'badge-planning'}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

function showLoading(element) {
    element.innerHTML = '<div class="loading"></div>';
}

function hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
}

// Session management
function checkAuth() {
    // Simple client-side auth check
    // In a real app, you'd verify with the server
    return true; // For now, always assume authenticated for testing
}

function requireAuth() {
    if (!checkAuth()) {
        window.location.href = '/v1/login.html';
        return false;
    }
    return true;
}

// Form handling utilities
function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Handle multiple values (like checkboxes)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    return data;
}

function validateRequired(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Add CSS for invalid fields
const style = document.createElement('style');
style.textContent = `
    .form-control.is-invalid {
        border-color: var(--danger);
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }
`;
document.head.appendChild(style);