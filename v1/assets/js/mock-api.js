/**
 * Mock API for Development
 * Provides fake data when PHP server is not available
 */

// Mock data store
const mockData = {
    projects: [
        {
            id: 1,
            title: "Cultural Heritage Preservation",
            description: "Preserving traditional crafts and cultural practices in rural communities",
            project_type: "Cultural Preservation",
            cultural_context: "Indonesian traditional arts",
            status: "active",
            objectives: ["Preserve traditional knowledge", "Train young artisans", "Document practices"],
            stakeholders: ["Local artisans", "Community elders", "Cultural department"],
            priority_areas: ["Traditional crafts", "Oral traditions", "Cultural documentation"],
            recommendation_count: 5,
            avg_confidence: 0.85,
            created_at: "2024-01-15T10:30:00Z"
        },
        {
            id: 2,
            title: "Community Engagement Initiative",
            description: "Building bridges between different cultural groups in urban areas",
            project_type: "Community Engagement",
            cultural_context: "Multi-ethnic urban community",
            status: "planning",
            objectives: ["Foster intercultural dialogue", "Create shared spaces", "Reduce tensions"],
            stakeholders: ["Community leaders", "Local government", "Residents"],
            priority_areas: ["Dialogue facilitation", "Cultural exchange", "Community building"],
            recommendation_count: 3,
            avg_confidence: 0.72,
            created_at: "2024-01-20T14:15:00Z"
        }
    ],
    
    recommendations: [
        {
            id: 1,
            project_id: 1,
            title: "Traditional Craft Workshop Program",
            description: "Establish regular workshops to teach traditional crafts to younger generations",
            project_title: "Cultural Heritage Preservation",
            project_type: "Cultural Preservation",
            analysis_type: "enhanced",
            confidence_score: 0.88,
            key_insights: ["High interest from youth", "Available skilled artisans", "Strong cultural significance"],
            recommendations: ["Weekly workshop sessions", "Master-apprentice program", "Documentation project"],
            potential_risks: ["Funding sustainability", "Artisan availability", "Interest maintenance"],
            cultural_context: ["Respects traditional methods", "Involves community elders", "Preserves authenticity"],
            success_metrics: ["Number of participants", "Skills acquired", "Cultural knowledge retention"],
            status: "pending",
            created_at: "2024-01-16T09:00:00Z"
        },
        {
            id: 2,
            project_id: 2,
            title: "Community Dialogue Facilitation",
            description: "Create structured dialogue sessions to bridge cultural gaps between different community groups",
            project_title: "Community Engagement Initiative",
            project_type: "Community Engagement",
            analysis_type: "quick",
            confidence_score: 0.75,
            key_insights: ["Existing trust deficits between groups", "Neutral venues increase participation", "Shared activities build connections"],
            recommendations: ["Monthly dialogue circles", "Cultural exchange events", "Shared community projects"],
            potential_risks: ["Initial reluctance to participate", "Historical tensions surfacing", "Facilitator bias"],
            cultural_context: ["Respects all cultural perspectives", "Uses culturally appropriate communication styles", "Involves respected community leaders"],
            success_metrics: ["Participation rates", "Trust survey scores", "Joint project outcomes"],
            status: "active",
            created_at: "2024-01-20T16:30:00Z"
        }
    ],
    
    knowledge: [
        {
            id: 1,
            title: "Cultural Sensitivity Guidelines",
            type: "document",
            source: "Internal research",
            content: "Comprehensive guide for cultural sensitivity in community projects",
            tags: ["guidelines", "cultural-sensitivity", "best-practices"],
            created_at: "2024-01-10T08:00:00Z"
        },
        {
            id: 2,
            title: "Indonesian Cultural Practices",
            type: "research",
            source: "Academic paper",
            content: "Research on traditional Indonesian cultural practices and their modern relevance",
            tags: ["indonesia", "traditions", "research"],
            created_at: "2024-01-12T16:30:00Z"
        }
    ],
    
    user: {
        id: 1,
        full_name: "Demo User",
        email: "demo@exeloka.com"
    }
};

// Mock API functions
window.MockAPI = {
    // Check if we should use mock data
    shouldUseMock: () => {
        // Always use mock in these cases
        if (window.location.protocol === 'file:' || window.location.port === '5500') {
            return true;
        }
        
        // For XAMPP, try to detect if PHP APIs are available
        if (window.location.href.includes('localhost/exeloka') || window.location.href.includes('localhost:')) {
            // Check if we can reach the API (this is checked later in the request method)
            return false; // Let the API client try first, then fallback
        }
        
        return true; // Default to mock for other environments
    },
    
    // Projects API
    getProjects: async () => {
        await MockAPI.delay(300); // Simulate network delay
        return mockData.projects;
    },
    
    getProject: async (id) => {
        await MockAPI.delay(200);
        const project = mockData.projects.find(p => p.id === parseInt(id));
        if (!project) throw new Error('Project not found');
        
        // Add recommendations to project
        const recommendations = mockData.recommendations.filter(r => r.project_id === parseInt(id));
        return { ...project, recommendations };
    },
    
    // Recommendations API
    getRecommendations: async () => {
        await MockAPI.delay(250);
        return mockData.recommendations;
    },
    
    getRecommendation: async (id) => {
        await MockAPI.delay(200);
        const recommendation = mockData.recommendations.find(r => r.id === parseInt(id));
        if (!recommendation) {
            // Generate sample recommendation if ID doesn't exist
            return {
                id: parseInt(id),
                project_id: 1,
                title: "Enhanced Cultural Workshop Program",
                description: "Develop a comprehensive cultural workshop program that combines traditional knowledge transfer with modern engagement techniques to preserve cultural heritage while making it accessible to younger generations.",
                project_title: "Cultural Heritage Preservation",
                project_type: "Cultural Preservation",
                analysis_type: "enhanced",
                confidence_score: 0.92,
                key_insights: [
                    "Strong community support for cultural preservation initiatives",
                    "High youth interest when approached through modern engagement methods",
                    "Available network of skilled traditional practitioners",
                    "Successful similar programs in neighboring regions provide proven framework"
                ],
                recommendations: [
                    "Establish weekly hands-on workshops with master craftspeople",
                    "Create digital documentation of traditional techniques",
                    "Develop mentorship program pairing elders with youth",
                    "Organize community showcases to celebrate achievements",
                    "Partner with local schools for curriculum integration"
                ],
                potential_risks: [
                    "Participant dropout due to competing modern activities",
                    "Difficulty finding adequate venue space for workshops",
                    "Seasonal availability of traditional materials",
                    "Generational communication barriers between mentors and participants"
                ],
                cultural_context: [
                    "Respects traditional master-apprentice learning systems",
                    "Incorporates culturally appropriate teaching methods",
                    "Maintains authenticity while allowing for adaptation",
                    "Engages community elders as wisdom keepers"
                ],
                success_metrics: [
                    "Number of active participants retained after 3 months",
                    "Traditional skills successfully demonstrated by participants",
                    "Community engagement levels at showcase events",
                    "Documentation quality and completeness",
                    "Integration success with educational institutions"
                ],
                status: "pending",
                created_at: new Date().toISOString()
            };
        }
        return recommendation;
    },
    
    // Knowledge API
    getKnowledge: async (page = 1, filters = {}) => {
        await MockAPI.delay(200);
        let knowledge = [...mockData.knowledge];
        
        // Apply filters if provided
        if (filters.type) {
            knowledge = knowledge.filter(item => item.type === filters.type);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            knowledge = knowledge.filter(item => 
                item.title.toLowerCase().includes(search) ||
                item.content.toLowerCase().includes(search) ||
                item.tags.some(tag => tag.toLowerCase().includes(search))
            );
        }
        
        // Pagination
        const itemsPerPage = 10;
        const start = (page - 1) * itemsPerPage;
        const paginatedKnowledge = knowledge.slice(start, start + itemsPerPage);
        
        return {
            data: paginatedKnowledge,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(knowledge.length / itemsPerPage),
                total_items: knowledge.length,
                items_per_page: itemsPerPage
            }
        };
    },

    getKnowledgeItem: async (id) => {
        await MockAPI.delay(150);
        const item = mockData.knowledge.find(k => k.id === parseInt(id));
        if (!item) throw new Error('Knowledge item not found');
        return item;
    },

    addKnowledge: async (data) => {
        await MockAPI.delay(300);
        const newKnowledge = {
            id: Math.max(...mockData.knowledge.map(k => k.id)) + 1,
            title: data.title,
            type: data.type || 'document',
            source: data.source || 'manual',
            content: data.content || '',
            tags: data.tags || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        mockData.knowledge.unshift(newKnowledge);
        return {
            success: true,
            message: 'Knowledge added successfully',
            data: newKnowledge
        };
    },

    updateKnowledge: async (id, data) => {
        await MockAPI.delay(250);
        const index = mockData.knowledge.findIndex(k => k.id === parseInt(id));
        if (index === -1) throw new Error('Knowledge item not found');
        
        mockData.knowledge[index] = {
            ...mockData.knowledge[index],
            ...data,
            updated_at: new Date().toISOString()
        };
        
        return {
            success: true,
            message: 'Knowledge updated successfully',
            data: mockData.knowledge[index]
        };
    },

    deleteKnowledge: async (id) => {
        await MockAPI.delay(200);
        const index = mockData.knowledge.findIndex(k => k.id === parseInt(id));
        if (index === -1) throw new Error('Knowledge item not found');
        
        mockData.knowledge.splice(index, 1);
        return {
            success: true,
            message: 'Knowledge deleted successfully'
        };
    },

    uploadDocument: async (file, metadata) => {
        await MockAPI.delay(1000); // Simulate file upload
        
        const newKnowledge = {
            id: Math.max(...mockData.knowledge.map(k => k.id)) + 1,
            title: file.name,
            type: 'document',
            source: 'upload',
            content: `Extracted content from ${file.name}. This would contain the actual document content after processing.`,
            tags: metadata.tags || ['uploaded', 'document'],
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        mockData.knowledge.unshift(newKnowledge);
        return {
            success: true,
            message: 'Document uploaded and processed successfully',
            data: newKnowledge
        };
    },

    extractContent: async (source, type) => {
        await MockAPI.delay(800); // Simulate content extraction
        
        const extractedContent = {
            source,
            type,
            content: 'This is extracted content from the provided source. In a real implementation, this would contain the actual extracted text from PDFs, images (OCR), or web pages.',
            metadata: {
                extraction_method: type === 'pdf' ? 'PyMuPDF' : type === 'image' ? 'Tesseract OCR' : type === 'url' ? 'BeautifulSoup' : 'Auto-detected',
                confidence: 0.95,
                language: 'Indonesian/English',
                extracted_at: new Date().toISOString()
            }
        };
        
        return {
            success: true,
            data: extractedContent
        };
    },
    
    // Authentication API
    login: async (email, password) => {
        await MockAPI.delay(500);
        
        // Simple mock authentication
        if (email && password.length >= 6) {
            const user = {
                id: 1,
                email: email,
                full_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
                organization: "Demo Organization",
                role: "user",
                created_at: new Date().toISOString()
            };
            
            // Store user in session
            sessionStorage.setItem('user', JSON.stringify(user));
            
            return {
                success: true,
                message: 'Login successful',
                user: user,
                token: 'mock-jwt-token-' + Date.now()
            };
        } else {
            throw new Error('Invalid email or password');
        }
    },

    register: async (userData) => {
        await MockAPI.delay(800);
        
        // Validate required fields
        if (!userData.email || !userData.password || !userData.full_name) {
            throw new Error('Email, password, and full name are required');
        }
        
        if (userData.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        
        // Check if email already exists (mock check)
        if (userData.email === 'test@example.com') {
            throw new Error('Email already registered');
        }
        
        const newUser = {
            id: Date.now(),
            email: userData.email,
            full_name: userData.full_name,
            organization: userData.organization || '',
            role: 'user',
            created_at: new Date().toISOString(),
            verified: false
        };
        
        // Store user in session
        sessionStorage.setItem('user', JSON.stringify(newUser));
        
        return {
            success: true,
            message: 'Registration successful! Welcome to Exeloka.',
            user: newUser,
            token: 'mock-jwt-token-' + Date.now()
        };
    },

    logout: async () => {
        await MockAPI.delay(200);
        sessionStorage.removeItem('user');
        return {
            success: true,
            message: 'Logged out successfully'
        };
    },

    // User data
    getUser: () => {
        return mockData.user;
    },
    
    // Utility functions
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Add sample data
    addSampleProject: (project) => {
        project.id = Math.max(...mockData.projects.map(p => p.id)) + 1;
        project.created_at = new Date().toISOString();
        project.recommendation_count = 0;
        project.avg_confidence = null;
        mockData.projects.unshift(project);
        return project;
    }
};

// Override console logs in mock mode
if (MockAPI.shouldUseMock()) {
    console.log('🔧 Mock API active - using sample data for development');
    
    // Set sample user in sessionStorage if not exists
    if (!sessionStorage.getItem('user')) {
        sessionStorage.setItem('user', JSON.stringify(mockData.user));
    }
}