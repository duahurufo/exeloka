import { Request, Response, NextFunction } from 'express';
import { getConnection } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    userId: number;
    email: string;
    role: string;
  };
}

interface CreateProjectRequest extends AuthenticatedRequest {
  body: {
    title: string;
    description: string;
    project_type: string;
    location: string;
    stakeholders?: any;
    cultural_context?: string;
    objectives?: string[];
    priority_areas?: string[];
    budget?: number;
    start_date?: string;
    end_date?: string;
    risk_level?: 'low' | 'medium' | 'high';
    success_metrics?: string[];
  };
}

interface UpdateProjectRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
  body: {
    title?: string;
    description?: string;
    project_type?: string;
    location?: string;
    stakeholders?: any;
    cultural_context?: string;
    objectives?: string[];
    priority_areas?: string[];
    budget?: number;
    start_date?: string;
    end_date?: string;
    risk_level?: 'low' | 'medium' | 'high';
    success_metrics?: string[];
    status?: 'draft' | 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  };
}

class ProjectController {
  // Create a new project
  createProject = async (req: CreateProjectRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const {
        title,
        description,
        project_type,
        location,
        stakeholders,
        cultural_context,
        objectives,
        priority_areas,
        budget,
        start_date,
        end_date,
        risk_level,
        success_metrics
      } = req.body;

      // Validation
      if (!title || !description || !project_type || !location) {
        throw createError('Title, description, project type, and location are required', 400);
      }

      const connection = getConnection();

      // Create project
      const [result] = await connection.execute(
        `INSERT INTO projects (
          user_id, title, description, project_type, location, 
          stakeholders, cultural_context, objectives, priority_areas, 
          budget, start_date, end_date, risk_level, success_metrics, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planning')`,
        [
          userId,
          title,
          description,
          project_type,
          location,
          JSON.stringify(stakeholders || {}),
          cultural_context || null,
          JSON.stringify(objectives || []),
          JSON.stringify(priority_areas || []),
          budget || null,
          start_date || null,
          end_date || null,
          risk_level || 'medium',
          JSON.stringify(success_metrics || [])
        ]
      ) as any[];

      const projectId = result.insertId;

      logger.info(`New project created: ${title} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
          project: {
            id: projectId,
            user_id: userId,
            title,
            description,
            project_type,
            location,
            stakeholders,
            cultural_context,
            objectives,
            priority_areas,
            budget,
            start_date,
            end_date,
            risk_level,
            success_metrics,
            status: 'planning'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all projects for a user
  getUserProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const connection = getConnection();

      const [projects] = await connection.execute(
        `SELECT id, title, description, project_type, location, 
         stakeholders, cultural_context, objectives, priority_areas, 
         budget, start_date, end_date, risk_level, success_metrics,
         status, created_at, updated_at
         FROM projects 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [userId]
      ) as any[];

      // Parse JSON fields
      const parsedProjects = projects.map((project: any) => ({
        ...project,
        stakeholders: project.stakeholders ? JSON.parse(project.stakeholders) : {},
        objectives: project.objectives ? JSON.parse(project.objectives) : [],
        priority_areas: project.priority_areas ? JSON.parse(project.priority_areas) : [],
        success_metrics: project.success_metrics ? JSON.parse(project.success_metrics) : []
      }));

      res.json({
        success: true,
        message: 'Projects retrieved successfully',
        data: {
          projects: parsedProjects
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a specific project
  getProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const projectId = req.params.id;
      
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const connection = getConnection();

      const [projects] = await connection.execute(
        `SELECT id, title, description, project_type, location, 
         stakeholders, cultural_context, objectives, priority_areas, 
         budget, start_date, end_date, risk_level, success_metrics,
         status, created_at, updated_at
         FROM projects 
         WHERE id = ? AND user_id = ?`,
        [projectId, userId]
      ) as any[];

      if (!projects.length) {
        throw createError('Project not found', 404);
      }

      const project = projects[0];

      // Parse JSON fields
      const parsedProject = {
        ...project,
        stakeholders: project.stakeholders ? JSON.parse(project.stakeholders) : {},
        objectives: project.objectives ? JSON.parse(project.objectives) : [],
        priority_areas: project.priority_areas ? JSON.parse(project.priority_areas) : [],
        success_metrics: project.success_metrics ? JSON.parse(project.success_metrics) : []
      };

      res.json({
        success: true,
        message: 'Project retrieved successfully',
        data: {
          project: parsedProject
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a project
  updateProject = async (req: UpdateProjectRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const projectId = req.params.id;
      
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const connection = getConnection();

      // Check if project exists and belongs to user
      const [existingProjects] = await connection.execute(
        'SELECT id FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
      ) as any[];

      if (!existingProjects.length) {
        throw createError('Project not found', 404);
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      // Build dynamic update query
      const {
        title,
        description,
        project_type,
        location,
        stakeholders,
        cultural_context,
        objectives,
        priority_areas,
        budget,
        start_date,
        end_date,
        risk_level,
        success_metrics,
        status
      } = req.body;

      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (project_type !== undefined) {
        updateFields.push('project_type = ?');
        updateValues.push(project_type);
      }
      if (location !== undefined) {
        updateFields.push('location = ?');
        updateValues.push(location);
      }
      if (stakeholders !== undefined) {
        updateFields.push('stakeholders = ?');
        updateValues.push(JSON.stringify(stakeholders));
      }
      if (cultural_context !== undefined) {
        updateFields.push('cultural_context = ?');
        updateValues.push(cultural_context);
      }
      if (objectives !== undefined) {
        updateFields.push('objectives = ?');
        updateValues.push(JSON.stringify(objectives));
      }
      if (priority_areas !== undefined) {
        updateFields.push('priority_areas = ?');
        updateValues.push(JSON.stringify(priority_areas));
      }
      if (budget !== undefined) {
        updateFields.push('budget = ?');
        updateValues.push(budget);
      }
      if (start_date !== undefined) {
        updateFields.push('start_date = ?');
        updateValues.push(start_date);
      }
      if (end_date !== undefined) {
        updateFields.push('end_date = ?');
        updateValues.push(end_date);
      }
      if (risk_level !== undefined) {
        updateFields.push('risk_level = ?');
        updateValues.push(risk_level);
      }
      if (success_metrics !== undefined) {
        updateFields.push('success_metrics = ?');
        updateValues.push(JSON.stringify(success_metrics));
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (updateFields.length === 0) {
        throw createError('No fields to update', 400);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(projectId);

      const query = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;

      await connection.execute(query, updateValues);

      logger.info(`Project updated: ${projectId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Project updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a project
  deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const projectId = req.params.id;
      
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const connection = getConnection();

      // Check if project exists and belongs to user
      const [existingProjects] = await connection.execute(
        'SELECT id FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
      ) as any[];

      if (!existingProjects.length) {
        throw createError('Project not found', 404);
      }

      // Delete project (this will cascade delete related records)
      await connection.execute(
        'DELETE FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
      );

      logger.info(`Project deleted: ${projectId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get project statistics
  getProjectStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const connection = getConnection();

      // Get project counts by status
      const [statusCounts] = await connection.execute(
        `SELECT status, COUNT(*) as count 
         FROM projects 
         WHERE user_id = ? 
         GROUP BY status`,
        [userId]
      ) as any[];

      // Get total projects
      const [totalResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM projects WHERE user_id = ?',
        [userId]
      ) as any[];

      const total = totalResult[0].total;

      res.json({
        success: true,
        message: 'Project statistics retrieved successfully',
        data: {
          stats: {
            total,
            by_status: statusCounts.reduce((acc: any, item: any) => {
              acc[item.status] = item.count;
              return acc;
            }, {})
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();