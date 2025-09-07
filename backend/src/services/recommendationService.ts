import { getConnection } from '../config/database';
import { llmService } from './llmService';
import { quickAnalysisService } from './quickAnalysisService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { 
  DEFAULT_SYSTEM_INSTRUCTION,
  DEFAULT_USER_PROMPT,
  buildSystemInstruction,
  buildUserPrompt,
  formatProjectDetails,
  validatePromptTemplate
} from '../config/promptTemplates';
import { 
  Project, 
  Recommendation, 
  CreateProjectRequest, 
  GenerateRecommendationRequest 
} from '../types';

interface RelevantWisdom {
  id: number;
  title: string;
  content: string;
  cultural_context: string;
  importance_score: number;
  source_type: string;
  tags: string[];
}

interface ProjectAnalysis {
  project: Project;
  relevant_wisdom: RelevantWisdom[];
  risk_factors: string[];
  cultural_context: string;
  stakeholder_analysis: any;
}

class RecommendationService {
  async createProject(projectData: CreateProjectRequest, userId: number): Promise<Project> {
    try {
      const connection = getConnection();
      
      const [result] = await connection.execute(`
        INSERT INTO projects 
        (user_id, title, description, project_type, location, 
         start_date, end_date, budget, stakeholders, objectives, priority_areas, cultural_context, risk_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        projectData.title,
        projectData.description,
        projectData.project_type || null,
        typeof projectData.location_details === 'string' ? projectData.location_details : JSON.stringify(projectData.location_details || ''),
        projectData.timeline_start || null,
        projectData.timeline_end || null,
        projectData.budget_range || null,
        JSON.stringify(projectData.stakeholders || {}),
        JSON.stringify(projectData.objectives || []),
        JSON.stringify(projectData.priority_areas || []),
        projectData.cultural_context || null,
        projectData.risk_level || 'medium'
      ]) as any[];

      const projectId = result.insertId;

      // Fetch the created project
      const [projects] = await connection.execute(
        'SELECT * FROM projects WHERE id = ?',
        [projectId]
      ) as any[];

      logger.info('Project created', { projectId, userId, title: projectData.title });
      
      return projects[0];
    } catch (error) {
      logger.error('Failed to create project', { error, projectData, userId });
      throw createError('Failed to create project', 500);
    }
  }

  async generateRecommendation(
    requestData: GenerateRecommendationRequest, 
    userId: number
  ): Promise<Recommendation> {
    try {
      logger.info('Starting recommendation generation', {
        projectId: requestData.project_id,
        analysisType: requestData.analysis_type,
        userId
      });

      // Validate custom prompts if provided
      if (requestData.custom_system_instruction) {
        const validation = validatePromptTemplate(requestData.custom_system_instruction);
        if (!validation.valid) {
          throw createError(`Invalid system instruction: ${validation.errors.join(', ')}`, 400);
        }
      }

      if (requestData.custom_user_prompt) {
        const validation = validatePromptTemplate(requestData.custom_user_prompt);
        if (!validation.valid) {
          throw createError(`Invalid user prompt: ${validation.errors.join(', ')}`, 400);
        }
      }

      // 1. Get project details and validate ownership
      const project = await this.getProjectWithValidation(requestData.project_id, userId);

      // 2. Choose analysis method based on user selection
      let recommendations: any;
      let confidenceScore: number;
      let analysisMetadata: any;

      if (requestData.analysis_type === 'quick') {
        // Quick Analysis using neural network
        const quickResult = await this.performQuickAnalysis(project, requestData);
        recommendations = this.formatQuickAnalysisResult(quickResult);
        confidenceScore = quickResult.confidence_score;
        analysisMetadata = {
          analysis_type: 'quick',
          processing_time: quickResult.processing_time,
          neural_network_output: quickResult
        };
      } else {
        // Enhanced Analysis using LLM
        const analysis = await this.analyzeProject(project, requestData);
        const llmRecommendations = await this.generateLLMRecommendations(analysis, requestData);
        
        recommendations = llmRecommendations;
        confidenceScore = this.calculateConfidenceScore(
          analysis.relevant_wisdom.length,
          llmRecommendations,
          project
        );
        analysisMetadata = {
          analysis_type: 'enhanced',
          wisdom_sources_count: analysis.relevant_wisdom.length,
          llm_analysis: llmRecommendations
        };
      }

      // 3. Store recommendation in database
      const recommendation = await this.storeRecommendation(
        project.id,
        recommendations,
        confidenceScore,
        analysisMetadata
      );

      // 4. Update project status
      await this.updateProjectStatus(project.id, 'analyzing');

      logger.info('Recommendation generated successfully', {
        recommendationId: recommendation.id,
        projectId: project.id,
        analysisType: requestData.analysis_type,
        confidenceScore
      });

      return recommendation;
    } catch (error) {
      logger.error('Recommendation generation failed', { error, requestData, userId });
      throw error;
    }
  }

  private async getProjectWithValidation(projectId: number, userId: number): Promise<Project> {
    const connection = getConnection();
    
    const [projects] = await connection.execute(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [projectId, userId]
    ) as any[];

    if (!projects.length) {
      throw createError('Project not found or access denied', 404);
    }

    return projects[0];
  }

  private async analyzeProject(
    project: Project, 
    requestData: GenerateRecommendationRequest
  ): Promise<ProjectAnalysis> {
    // 1. Find relevant cultural wisdom based on project context
    const relevant_wisdom = await this.findRelevantWisdom(project, requestData);

    // 2. Analyze risk factors
    const risk_factors = [
      ...project.risk_factors,
      ...(requestData.specific_concerns || [])
    ];

    // 3. Build cultural context
    const cultural_context = this.buildCulturalContext(project, relevant_wisdom);

    // 4. Analyze stakeholders
    const stakeholder_analysis = await this.analyzeStakeholders(project);

    return {
      project,
      relevant_wisdom,
      risk_factors,
      cultural_context,
      stakeholder_analysis
    };
  }

  private async findRelevantWisdom(
    project: Project, 
    requestData: GenerateRecommendationRequest
  ): Promise<RelevantWisdom[]> {
    const connection = getConnection();
    
    // Build search terms from project description, type, and location
    const searchTerms = [
      project.description,
      project.project_type || '',
      JSON.stringify(project.location_details),
      ...(requestData.priority_areas || []),
      ...(requestData.specific_concerns || [])
    ].filter(term => term).join(' ');

    // Search for relevant wisdom entries
    const [wisdomEntries] = await connection.execute(`
      SELECT we.*, ws.source_type
      FROM wisdom_entries we
      JOIN knowledge_sources ws ON we.source_id = ws.id
      WHERE MATCH(we.title, we.content, we.cultural_context) 
            AGAINST(? IN NATURAL LANGUAGE MODE)
         OR we.importance_score >= 0.7
      ORDER BY we.importance_score DESC, 
               MATCH(we.title, we.content) AGAINST(? IN NATURAL LANGUAGE MODE) DESC
      LIMIT 20
    `, [searchTerms, searchTerms]) as any[];

    // Also get high-importance general wisdom
    const [generalWisdom] = await connection.execute(`
      SELECT we.*, ws.source_type
      FROM wisdom_entries we
      JOIN knowledge_sources ws ON we.source_id = ws.id
      WHERE we.importance_score >= 0.8
      ORDER BY we.importance_score DESC
      LIMIT 10
    `, []) as any[];

    // Combine and deduplicate
    const allWisdom = [...wisdomEntries, ...generalWisdom];
    const uniqueWisdom = allWisdom.reduce((acc, current) => {
      // @ts-ignore
      if (!acc.find(item => item.id === current.id)) {
        acc.push(current);
      }
      return acc;
    }, [] as any[]);

    logger.info('Relevant wisdom found', {
      projectId: project.id,
      wisdomCount: uniqueWisdom.length,
      // @ts-ignore
      highImportanceCount: uniqueWisdom.filter(w => w.importance_score >= 0.8).length
    });

    return uniqueWisdom;
  }

  private buildCulturalContext(project: Project, wisdomEntries: RelevantWisdom[]): string {
    const locationInfo = project.location_details;
    const wisdomContext = wisdomEntries
      .slice(0, 5) // Top 5 most relevant
      .map(w => w.cultural_context)
      .filter(ctx => ctx && ctx.trim())
      .join('\n\n');

    return `
Project Location Context:
${JSON.stringify(locationInfo, null, 2)}

Relevant Cultural Context from Knowledge Base:
${wisdomContext}

Project Type: ${project.project_type || 'General business initiative'}
Stakeholders: ${project.stakeholders.join(', ')}
    `.trim();
  }

  private async analyzeStakeholders(project: Project): Promise<any> {
    // Simple stakeholder categorization
    const stakeholders = project.stakeholders;
    
    return {
      local_community: stakeholders.filter(s => 
        s.toLowerCase().includes('community') || 
        s.toLowerCase().includes('resident') ||
        s.toLowerCase().includes('local')
      ),
      government: stakeholders.filter(s => 
        s.toLowerCase().includes('government') || 
        s.toLowerCase().includes('official') ||
        s.toLowerCase().includes('authority')
      ),
      religious_leaders: stakeholders.filter(s => 
        s.toLowerCase().includes('kyai') || 
        s.toLowerCase().includes('religious') ||
        s.toLowerCase().includes('islamic')
      ),
      business: stakeholders.filter(s => 
        s.toLowerCase().includes('business') || 
        s.toLowerCase().includes('company') ||
        s.toLowerCase().includes('commercial')
      ),
      other: stakeholders.filter(s => 
        !s.toLowerCase().match(/(community|resident|local|government|official|authority|kyai|religious|islamic|business|company|commercial)/)
      )
    };
  }

  private async generateLLMRecommendations(
    analysis: ProjectAnalysis, 
    requestData: GenerateRecommendationRequest
  ): Promise<any> {
    // Build comprehensive project details
    const projectDetails = formatProjectDetails({
      title: analysis.project.title,
      company_name: analysis.project.company_name || 'Not specified',
      project_type: analysis.project.project_type,
      description: analysis.project.description,
      location_details: analysis.project.location_details,
      stakeholders: analysis.project.stakeholders,
      timeline_start: analysis.project.timeline_start,
      timeline_end: analysis.project.timeline_end,
      budget_range: analysis.project.budget_range,
      risk_factors: analysis.risk_factors
    });

    // Add additional context
    let enhancedProjectDetails = projectDetails;
    
    if (requestData.additional_context) {
      enhancedProjectDetails += `\n\n**Additional Context**: ${requestData.additional_context}`;
    }
    
    if (requestData.priority_areas && requestData.priority_areas.length > 0) {
      enhancedProjectDetails += `\n\n**Priority Areas**: ${requestData.priority_areas.join(', ')}`;
    }
    
    if (requestData.specific_concerns && requestData.specific_concerns.length > 0) {
      enhancedProjectDetails += `\n\n**Specific Concerns**: ${requestData.specific_concerns.join(', ')}`;
    }

    // Add relevant cultural wisdom context
    if (analysis.relevant_wisdom.length > 0) {
      const wisdomSummary = analysis.relevant_wisdom
        .slice(0, 10) // Top 10 most relevant
        .map((w, index) => `${index + 1}. ${w.title}: ${w.content.substring(0, 200)}...`)
        .join('\n');
      
      enhancedProjectDetails += `\n\n**Relevant Cultural Wisdom from Knowledge Base**:\n${wisdomSummary}`;
    }

    // Build prompts using templates
    const systemInstruction = buildSystemInstruction(requestData.custom_system_instruction);
    const userPrompt = buildUserPrompt(
      enhancedProjectDetails, 
      requestData.custom_user_prompt,
      'enhanced'
    );

    // Use LLM service with structured prompts
    const recommendations = await llmService.generateRecommendationsFromPrompts(
      systemInstruction,
      userPrompt
    );

    return recommendations;
  }

  private calculateConfidenceScore(
    wisdomCount: number,
    recommendations: any,
    project: Project
  ): number {
    let score = 0.5; // Base score

    // Adjust based on available wisdom
    if (wisdomCount >= 10) score += 0.2;
    else if (wisdomCount >= 5) score += 0.1;
    else if (wisdomCount >= 2) score += 0.05;

    // Adjust based on project completeness
    if (project.project_type) score += 0.1;
    if (project.stakeholders.length > 0) score += 0.1;
    if (project.location_details && Object.keys(project.location_details).length > 1) score += 0.1;

    // Adjust based on recommendation quality
    if (recommendations.confidence_score) {
      score = (score + recommendations.confidence_score) / 2;
    }

    return Math.min(1.0, Math.max(0.1, score));
  }

  private async performQuickAnalysis(project: Project, requestData: GenerateRecommendationRequest): Promise<any> {
    // Parse JSON fields that come as strings from database
    const stakeholders = typeof project.stakeholders === 'string' 
      ? JSON.parse(project.stakeholders) 
      : project.stakeholders;
    
    const quickInput = {
      project_type: project.project_type || 'general',
      description: project.description,
      location_details: typeof project.location_details === 'string'
        ? JSON.parse(project.location_details)
        : (project.location_details || {}),
      stakeholders: Array.isArray(stakeholders) ? stakeholders : 
        (stakeholders && typeof stakeholders === 'object' ? 
          [...(stakeholders.internal || []), ...(stakeholders.external || [])] : []),
      risk_factors: [] as string[], // Default to empty array
      budget_range: project.budget_range || 'medium',
      timeline_start: project.timeline_start?.toString(),
      timeline_end: project.timeline_end?.toString()
    };

    // Add additional context if provided
    if (requestData.additional_context) {
      quickInput.description += '\n\nAdditional Context: ' + requestData.additional_context;
    }

    if (requestData.priority_areas && requestData.priority_areas.length > 0) {
      quickInput.description += '\n\nPriority Areas: ' + requestData.priority_areas.join(', ');
    }

    if (requestData.specific_concerns && requestData.specific_concerns.length > 0) {
      quickInput.risk_factors = [...quickInput.risk_factors, ...requestData.specific_concerns] as string[];
    }

    return await quickAnalysisService.performQuickAnalysis(quickInput);
  }

  private formatQuickAnalysisResult(quickResult: any): any {
    return {
      executive_summary: `Quick analysis indicates ${quickResult.risk_level} risk level with ${Math.round(quickResult.estimated_success_rate * 100)}% estimated success rate. Cultural compatibility score: ${Math.round(quickResult.cultural_compatibility * 100)}%.`,
      strategic_approach: quickResult.recommended_approaches,
      detailed_methods: quickResult.recommended_approaches, // Same as strategic for quick analysis
      risk_mitigation: [`Risk Level: ${quickResult.risk_level.toUpperCase()}`, ...quickResult.key_considerations],
      timeline_recommendations: 'Timeline based on quick analysis patterns. Consider enhanced analysis for detailed timeline planning.',
      success_metrics: [
        `Target Success Rate: ${Math.round(quickResult.estimated_success_rate * 100)}%`,
        'Community acceptance indicators',
        'Cultural compliance measures',
        'Stakeholder satisfaction metrics'
      ],
      cultural_considerations: quickResult.key_considerations,
      confidence_score: quickResult.confidence_score
    };
  }

  private async storeRecommendation(
    projectId: number,
    recommendations: any,
    confidenceScore: number,
    analysisMetadata: any
  ): Promise<Recommendation> {
    const connection = getConnection();

    const [projectResult] = await connection.execute(
      'SELECT title FROM projects WHERE id = ?',
      [projectId]
    ) as any[];

    const title = `Recommendations for ${projectResult[0]?.title || 'Project'}`;
    
    const [result] = await connection.execute(`
      INSERT INTO recommendations 
      (project_id, title, executive_summary, strategic_approach, detailed_methods,
       risk_mitigation, timeline_recommendations, success_metrics, cultural_considerations,
       confidence_score, llm_analysis)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      projectId,
      title,
      recommendations.executive_summary || '',
      JSON.stringify(recommendations.strategic_approach || []),
      JSON.stringify(recommendations.detailed_methods || []),
      JSON.stringify(recommendations.risk_mitigation || []),
      recommendations.timeline_recommendations || '',
      JSON.stringify(recommendations.success_metrics || []),
      JSON.stringify(recommendations.cultural_considerations || []),
      confidenceScore,
      JSON.stringify({
        ...analysisMetadata,
        generated_at: new Date().toISOString()
      })
    ]) as any[];

    const recommendationId = result.insertId;

    // Fetch the complete recommendation
    const [recommendationsResult] = await connection.execute(
      'SELECT * FROM recommendations WHERE id = ?',
      [recommendationId]
    ) as any[];

    return recommendationsResult[0];
  }

  private async updateProjectStatus(projectId: number, status: string): Promise<void> {
    const connection = getConnection();
    await connection.execute(
      'UPDATE projects SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, projectId]
    );
  }

  async getRecommendation(recommendationId: number, userId: number): Promise<Recommendation | null> {
    const connection = getConnection();
    
    const [recommendations] = await connection.execute(`
      SELECT r.*, p.title as project_title, p.user_id
      FROM recommendations r
      JOIN projects p ON r.project_id = p.id
      WHERE r.id = ? AND p.user_id = ?
    `, [recommendationId, userId]) as any[];

    return recommendations.length > 0 ? recommendations[0] : null;
  }

  async getUserRecommendations(userId: number, options: any = {}): Promise<any[]> {
    const connection = getConnection();
    const { page = 1, limit = 10, project_id } = options;
    
    let sql = `
      SELECT r.*, p.title as project_title, p.description as project_description
      FROM recommendations r
      JOIN projects p ON r.project_id = p.id
      WHERE p.user_id = ?
    `;
    const params: any[] = [userId];

    if (project_id) {
      sql += ` AND r.project_id = ?`;
      params.push(project_id);
    }

    sql += ` ORDER BY r.created_at DESC`;
    
    // Pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [recommendations] = await connection.execute(sql, params) as any[];

    return recommendations;
  }

  async getUserProjects(userId: number, options: any = {}): Promise<any[]> {
    const connection = getConnection();
    const { page = 1, limit = 10, status } = options;
    
    let sql = `
      SELECT p.*, COUNT(r.id) as recommendation_count
      FROM projects p
      LEFT JOIN recommendations r ON p.id = r.project_id
      WHERE p.user_id = ?
    `;
    const params: any[] = [userId];

    if (status) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }

    sql += ` GROUP BY p.id ORDER BY p.updated_at DESC`;
    
    // Pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [projects] = await connection.execute(sql, params) as any[];

    return projects;
  }
}

export const recommendationService = new RecommendationService();