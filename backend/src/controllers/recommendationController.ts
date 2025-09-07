import { Request, Response, NextFunction } from 'express';
import { recommendationService } from '../services/recommendationService';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { getConnection } from '../config/database';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

class RecommendationController {
  async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projectData = req.body;
      const userId = req.user!.id;

      // Validation
      if (!projectData.title || !projectData.description) {
        throw createError('Title and description are required', 400);
      }

      const project = await recommendationService.createProject(projectData, userId);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  async generateRecommendation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestData = req.body;
      const userId = req.user!.id;

      // Validation
      if (!requestData.project_id) {
        throw createError('project_id is required', 400);
      }

      if (!requestData.analysis_type || !['quick', 'enhanced'].includes(requestData.analysis_type)) {
        throw createError('analysis_type must be either "quick" or "enhanced"', 400);
      }

      const recommendation = await recommendationService.generateRecommendation(requestData, userId);

      res.status(201).json({
        success: true,
        message: `${requestData.analysis_type === 'quick' ? 'Quick' : 'Enhanced'} analysis completed successfully`,
        data: recommendation
      });
    } catch (error) {
      next(error);
    }
  }

  async getPromptTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const { DEFAULT_SYSTEM_INSTRUCTION, DEFAULT_USER_PROMPT } = await import('../config/promptTemplates');
      
      res.json({
        success: true,
        message: 'Prompt templates retrieved',
        data: {
          system_instruction: DEFAULT_SYSTEM_INSTRUCTION,
          user_prompt: DEFAULT_USER_PROMPT,
          recommended_usage: {
            system_instruction: "Defines the AI's role, expertise, and cultural context. Edit to customize the AI's knowledge focus or add specific expertise areas.",
            user_prompt: "Structures the analysis request and output format. Edit to change what aspects are analyzed or how results are presented.",
            placeholders: {
              "{{PROJECT_DETAILS}}": "Automatically replaced with your project information"
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const recommendationId = Number(req.params.id);
      const userId = req.user!.id;

      if (!recommendationId) {
        throw createError('Valid recommendation ID is required', 400);
      }

      const recommendation = await recommendationService.getRecommendation(recommendationId, userId);

      if (!recommendation) {
        throw createError('Recommendation not found', 404);
      }

      res.json({
        success: true,
        message: 'Recommendation retrieved successfully',
        data: recommendation
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10, status } = req.query;

      const projects = await recommendationService.getUserProjects(userId, {
        page: Number(page),
        limit: Math.min(Number(limit), 50), // Cap at 50
        status
      });

      res.json({
        success: true,
        message: 'Projects retrieved successfully',
        data: projects,
        meta: {
          page: Number(page),
          limit: Math.min(Number(limit), 50),
          count: projects.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.id);
      const userId = req.user!.id;

      if (!projectId) {
        throw createError('Valid project ID is required', 400);
      }

      const connection = getConnection();
      
      // Get project details with recommendations count
      const [projectResults] = await connection.execute(`
        SELECT p.*, COUNT(r.id) as recommendations_count,
               AVG(r.confidence_score) as avg_confidence_score
        FROM projects p
        LEFT JOIN recommendations r ON p.id = r.project_id
        WHERE p.id = ? AND p.user_id = ?
        GROUP BY p.id
      `, [projectId, userId]) as any[];

      if (projectResults.length === 0) {
        throw createError('Project not found', 404);
      }

      const project = projectResults[0];

      // Get recent recommendations for this project
      const [recentRecommendations] = await connection.execute(`
        SELECT id, title, confidence_score, created_at
        FROM recommendations
        WHERE project_id = ?
        ORDER BY created_at DESC
        LIMIT 5
      `, [projectId]) as any[];

      project.recent_recommendations = recentRecommendations;
      project.avg_confidence_score = project.avg_confidence_score ? Number(project.avg_confidence_score.toFixed(2)) : 0;

      res.json({
        success: true,
        message: 'Project retrieved successfully',
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.id);
      const userId = req.user!.id;
      const updateData = req.body;

      if (!projectId) {
        throw createError('Valid project ID is required', 400);
      }

      // Validate required fields if provided
      if (updateData.title && !updateData.title.trim()) {
        throw createError('Title cannot be empty', 400);
      }

      if (updateData.description && !updateData.description.trim()) {
        throw createError('Description cannot be empty', 400);
      }

      const connection = getConnection();

      // Verify project ownership
      const [existingProject] = await connection.execute(
        'SELECT id FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
      ) as any[];

      if (existingProject.length === 0) {
        throw createError('Project not found or access denied', 404);
      }

      // Build dynamic update query
      const allowedFields = ['title', 'description', 'project_type', 'location_details', 'stakeholders', 'status'];
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw createError('No valid fields to update', 400);
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(projectId, userId);

      await connection.execute(`
        UPDATE projects 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND user_id = ?
      `, updateValues);

      // Get updated project
      const [updatedProject] = await connection.execute(
        'SELECT * FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
      ) as any[];

      logger.info('Project updated', { projectId, userId, updatedFields: Object.keys(updateData) });

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject[0]
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.id);
      const userId = req.user!.id;

      if (!projectId) {
        throw createError('Valid project ID is required', 400);
      }

      const connection = getConnection();

      // Verify project ownership and check for recommendations
      const [projectCheck] = await connection.execute(`
        SELECT p.id, COUNT(r.id) as recommendations_count
        FROM projects p
        LEFT JOIN recommendations r ON p.id = r.project_id
        WHERE p.id = ? AND p.user_id = ?
        GROUP BY p.id
      `, [projectId, userId]) as any[];

      if (projectCheck.length === 0) {
        throw createError('Project not found or access denied', 404);
      }

      const project = projectCheck[0];

      // Warning if project has recommendations (they will be cascade deleted)
      if (project.recommendations_count > 0) {
        logger.warn('Deleting project with recommendations', {
          projectId,
          userId,
          recommendationsCount: project.recommendations_count
        });
      }

      // Delete project (recommendations will be cascade deleted due to foreign key constraints)
      await connection.execute(
        'DELETE FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
      );

      logger.info('Project deleted', { 
        projectId, 
        userId, 
        recommendationsDeleted: project.recommendations_count 
      });

      res.json({
        success: true,
        message: `Project deleted successfully${project.recommendations_count > 0 ? ` (${project.recommendations_count} recommendations also deleted)` : ''}`,
        data: {
          deleted_project_id: projectId,
          deleted_recommendations_count: project.recommendations_count
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10, project_id } = req.query;

      const recommendations = await recommendationService.getUserRecommendations(userId, {
        page: Number(page),
        limit: Math.min(Number(limit), 50), // Cap at 50
        project_id: project_id ? Number(project_id) : undefined
      });

      res.json({
        success: true,
        message: 'Recommendations retrieved successfully',
        data: recommendations,
        meta: {
          page: Number(page),
          limit: Math.min(Number(limit), 50),
          count: recommendations.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async submitFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const recommendationId = Number(req.params.id);
      const userId = req.user!.id;
      const { 
        rating, 
        feedback_text, 
        implementation_success, 
        outcome_details, 
        lessons_learned 
      } = req.body;

      // Validation
      if (!recommendationId) {
        throw createError('Valid recommendation ID is required', 400);
      }

      if (!rating || rating < 1 || rating > 5) {
        throw createError('Rating must be between 1 and 5', 400);
      }

      // Verify user owns the recommendation
      const recommendation = await recommendationService.getRecommendation(recommendationId, userId);
      if (!recommendation) {
        throw createError('Recommendation not found or access denied', 404);
      }

      const connection = getConnection();

      // Check if feedback already exists
      const [existingFeedback] = await connection.execute(
        'SELECT id FROM feedback WHERE recommendation_id = ? AND user_id = ?',
        [recommendationId, userId]
      ) as any[];

      if (existingFeedback.length > 0) {
        // Update existing feedback
        await connection.execute(`
          UPDATE feedback 
          SET rating = ?, feedback_text = ?, implementation_success = ?, 
              outcome_details = ?, lessons_learned = ?
          WHERE recommendation_id = ? AND user_id = ?
        `, [
          rating,
          feedback_text || null,
          implementation_success || null,
          outcome_details || null,
          lessons_learned || null,
          recommendationId,
          userId
        ]);

        logger.info('Feedback updated', { recommendationId, userId, rating });
      } else {
        // Create new feedback
        await connection.execute(`
          INSERT INTO feedback 
          (recommendation_id, user_id, rating, feedback_text, implementation_success, 
           outcome_details, lessons_learned)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          recommendationId,
          userId,
          rating,
          feedback_text || null,
          implementation_success || null,
          outcome_details || null,
          lessons_learned || null
        ]);

        logger.info('Feedback submitted', { recommendationId, userId, rating });
      }

      // Process feedback for learning
      const { feedbackService } = await import('../services/feedbackService');
      await feedbackService.processFeedback({
        recommendation_id: recommendationId,
        user_id: userId,
        rating,
        feedback_text,
        implementation_success,
        outcome_details,
        lessons_learned
      });

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const connection = getConnection();

      // Get project statistics
      const [projectStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_projects,
          COUNT(CASE WHEN status = 'analyzing' THEN 1 END) as analyzing_projects
        FROM projects 
        WHERE user_id = ?
      `, [userId]) as any[];

      // Get recommendation statistics
      const [recommendationStats] = await connection.execute(`
        SELECT 
          COUNT(r.id) as total_recommendations,
          COALESCE(AVG(r.confidence_score), 0) as avg_confidence_score,
          COUNT(f.id) as feedback_count,
          COALESCE(AVG(f.rating), 0) as avg_rating
        FROM recommendations r
        JOIN projects p ON r.project_id = p.id
        LEFT JOIN feedback f ON r.id = f.recommendation_id
        WHERE p.user_id = ?
      `, [userId]) as any[];

      // Get recent activity
      const [recentActivity] = await connection.execute(`
        SELECT 
          p.title as project_title,
          CONCAT('Recommendation #', r.id) as recommendation_title,
          r.confidence_score,
          r.created_at,
          f.rating as feedback_rating
        FROM recommendations r
        JOIN projects p ON r.project_id = p.id
        LEFT JOIN feedback f ON r.id = f.recommendation_id
        WHERE p.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
      `, [userId]) as any[];

      // Handle empty results safely
      const projectData = projectStats[0] || {
        total_projects: 0,
        completed_projects: 0,
        planning_projects: 0,
        analyzing_projects: 0
      };

      const recommendationData = recommendationStats[0] || {
        total_recommendations: 0,
        avg_confidence_score: 0,
        feedback_count: 0,
        avg_rating: 0
      };

      res.json({
        success: true,
        message: 'Analytics retrieved successfully',
        data: {
          projects: projectData,
          recommendations: recommendationData,
          recent_activity: recentActivity || []
        }
      });
    } catch (error) {
      logger.error('Analytics error:', error);
      next(error);
    }
  }

  async getAnalyticsDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { range = '30' } = req.query;
      const connection = getConnection();

      const daysBack = parseInt(range as string) || 30;

      // Overview statistics
      const [overviewStats] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT p.id) as total_projects,
          COUNT(DISTINCT r.id) as total_recommendations,
          COALESCE(AVG(f.rating), 0) as avg_rating,
          COUNT(DISTINCT f.id) as total_feedback
        FROM projects p
        LEFT JOIN recommendations r ON p.id = r.project_id
        LEFT JOIN feedback f ON r.id = f.recommendation_id
        WHERE p.user_id = ? AND p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [userId, daysBack]) as any[];

      // Project statistics by type
      const [projectStats] = await connection.execute(`
        SELECT 
          project_type,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM projects
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY project_type
      `, [userId, daysBack]) as any[];

      // Recommendation performance over time
      const [performanceData] = await connection.execute(`
        SELECT 
          DATE(r.created_at) as date,
          COUNT(r.id) as recommendations_count,
          AVG(r.confidence_score) as avg_confidence,
          COUNT(f.id) as feedback_count,
          AVG(f.rating) as avg_rating
        FROM recommendations r
        JOIN projects p ON r.project_id = p.id
        LEFT JOIN feedback f ON r.id = f.recommendation_id
        WHERE p.user_id = ? AND r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(r.created_at)
        ORDER BY date DESC
      `, [userId, daysBack]) as any[];

      // Cultural insights distribution
      const [culturalInsights] = await connection.execute(`
        SELECT 
          JSON_EXTRACT(r.cultural_context, '$.primary_culture') as culture,
          COUNT(*) as count,
          AVG(r.confidence_score) as avg_confidence
        FROM recommendations r
        JOIN projects p ON r.project_id = p.id
        WHERE p.user_id = ? AND r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND JSON_EXTRACT(r.cultural_context, '$.primary_culture') IS NOT NULL
        GROUP BY culture
        ORDER BY count DESC
        LIMIT 10
      `, [userId, daysBack]) as any[];

      // Top performing recommendations
      const [topRecommendations] = await connection.execute(`
        SELECT 
          r.id,
          CONCAT('Recommendation #', r.id) as title,
          p.title as project_title,
          r.confidence_score,
          AVG(f.rating) as avg_rating,
          COUNT(f.id) as feedback_count,
          r.created_at
        FROM recommendations r
        JOIN projects p ON r.project_id = p.id
        LEFT JOIN feedback f ON r.id = f.recommendation_id
        WHERE p.user_id = ? AND r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY r.id
        HAVING avg_rating >= 4 OR r.confidence_score >= 0.8
        ORDER BY avg_rating DESC, r.confidence_score DESC
        LIMIT 10
      `, [userId, daysBack]) as any[];

      // Feedback trends
      const [feedbackTrends] = await connection.execute(`
        SELECT 
          DATE(f.created_at) as date,
          COUNT(f.id) as feedback_count,
          AVG(f.rating) as avg_rating,
          COUNT(CASE WHEN f.implementation_success = 'successful' THEN 1 END) as successful_implementations,
          COUNT(CASE WHEN f.implementation_success IS NOT NULL THEN 1 END) as total_implementations
        FROM feedback f
        JOIN recommendations r ON f.recommendation_id = r.id
        JOIN projects p ON r.project_id = p.id
        WHERE p.user_id = ? AND f.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(f.created_at)
        ORDER BY date DESC
      `, [userId, daysBack]) as any[];

      const overview = overviewStats[0] || {};
      
      res.json({
        success: true,
        message: 'Analytics dashboard data retrieved successfully',
        data: {
          overview: {
            total_projects: overview.total_projects || 0,
            total_recommendations: overview.total_recommendations || 0,
            avg_rating: Number((overview.avg_rating || 0).toFixed ? (overview.avg_rating || 0).toFixed(2) : overview.avg_rating || 0),
            total_feedback: overview.total_feedback || 0,
            time_period: `${daysBack} days`
          },
          project_stats: projectStats.map((stat: any) => ({
            type: stat.project_type,
            total: stat.count,
            completed: stat.completed,
            completion_rate: stat.count > 0 ? Number((stat.completed / stat.count).toFixed(2)) : 0
          })),
          performance_trends: performanceData.map((data: any) => ({
            date: data.date,
            recommendations_count: data.recommendations_count || 0,
            avg_confidence: Number((data.avg_confidence || 0).toFixed ? (data.avg_confidence || 0).toFixed(2) : data.avg_confidence || 0),
            feedback_count: data.feedback_count || 0,
            avg_rating: Number((data.avg_rating || 0).toFixed ? (data.avg_rating || 0).toFixed(2) : data.avg_rating || 0)
          })),
          cultural_insights: culturalInsights.map((insight: any) => ({
            culture: insight.culture ? JSON.parse(insight.culture) : 'Unknown',
            count: insight.count,
            avg_confidence: Number((insight.avg_confidence || 0).toFixed ? (insight.avg_confidence || 0).toFixed(2) : insight.avg_confidence || 0)
          })),
          top_recommendations: topRecommendations.map((rec: any) => ({
            id: rec.id,
            title: rec.title,
            project_title: rec.project_title,
            confidence_score: rec.confidence_score,
            avg_rating: Number((rec.avg_rating || 0).toFixed ? (rec.avg_rating || 0).toFixed(2) : rec.avg_rating || 0),
            feedback_count: rec.feedback_count || 0,
            created_at: rec.created_at
          })),
          feedback_trends: feedbackTrends.map((trend: any) => ({
            date: trend.date,
            feedback_count: trend.feedback_count || 0,
            avg_rating: Number((trend.avg_rating || 0).toFixed ? (trend.avg_rating || 0).toFixed(2) : trend.avg_rating || 0),
            successful_implementations: trend.successful_implementations || 0,
            total_implementations: trend.total_implementations || 0,
            success_rate: trend.total_implementations > 0 
              ? Number((trend.successful_implementations / trend.total_implementations).toFixed(2))
              : 0
          }))
        }
      });
    } catch (error) {
      logger.error('Analytics dashboard error:', error);
      next(error);
    }
  }

  async generateDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const recommendationId = Number(req.params.id);
      const userId = req.user!.id;
      const { format, template_type, include_sections, custom_branding } = req.body;

      if (!recommendationId) {
        throw createError('Valid recommendation ID is required', 400);
      }

      if (!format || !['docx', 'xlsx', 'pptx'].includes(format)) {
        throw createError('Format must be one of: docx, xlsx, pptx', 400);
      }

      // Verify recommendation ownership
      const recommendation = await recommendationService.getRecommendation(recommendationId, userId);
      if (!recommendation) {
        throw createError('Recommendation not found or access denied', 404);
      }

      // Import document generation service
      const { documentGenerationService } = await import('../services/documentGenerationService');

      let document;
      const options = {
        recommendation_id: recommendationId,
        template_type,
        include_sections,
        custom_branding
      };

      switch (format) {
        case 'docx':
          document = await documentGenerationService.generateDocx(recommendationId, userId, options);
          break;
        case 'xlsx':
          document = await documentGenerationService.generateXlsx(recommendationId, userId, options);
          break;
        case 'pptx':
          document = await documentGenerationService.generatePptx(recommendationId, userId, options);
          break;
      }

      res.status(201).json({
        success: true,
        message: `${format.toUpperCase()} document generated successfully`,
        data: {
          document_id: document?.id,
          filename: document?.filename,
          download_url: `/api/documents/download/${document?.filename}`,
          file_size: document?.file_size,
          created_at: document?.created_at
        }
      });

      logger.info('Document generated via recommendation endpoint', {
        documentId: document?.id,
        recommendationId,
        userId,
        format,
        filename: document?.filename
      });
    } catch (error) {
      next(error);
    }
  }
}

export const recommendationController = new RecommendationController();