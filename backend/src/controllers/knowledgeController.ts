import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { dataIngestionService } from '../services/dataIngestionService';
import { getConnection } from '../config/database';
import { logger } from '../utils/logger';
import { auditService } from '../services/auditService';

// Import AuditService class for static methods
import { AuditService } from '../services/auditService';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

class KnowledgeController {
  async ingestData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, source_type, source_url, content_text, file_path } = req.body;
      const userId = req.user!.id;

      // Validation
      if (!title || !source_type) {
        throw createError('Title and source_type are required', 400);
      }

      // Validate source type specific requirements
      switch (source_type) {
        case 'url':
          if (!source_url) {
            throw createError('source_url is required for URL sources', 400);
          }
          break;
        case 'text':
          if (!content_text) {
            throw createError('content_text is required for text sources', 400);
          }
          break;
        case 'document':
        case 'audio':
        case 'video':
          if (!file_path) {
            throw createError('file_path is required for file sources', 400);
          }
          break;
      }

      const source = await dataIngestionService.ingestData({
        title,
        source_type,
        source_url,
        content_text,
        file_path,
        user_id: userId
      });

      logger.info('Data ingested successfully', { sourceId: source.id, userId, title });

      res.status(201).json({
        success: true,
        message: 'Data ingested and processed successfully',
        data: source
      });
    } catch (error) {
      next(error);
    }
  }

  async searchKnowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        query, 
        category, 
        source_type, 
        importance_level, 
        limit = 20, 
        offset = 0 
      } = req.query;

      if (!query) {
        throw createError('Query parameter is required', 400);
      }

      const filters = {
        category,
        source_type,
        importance_level,
        limit: Math.min(Number(limit), 100), // Cap at 100 results
        offset: Number(offset)
      };

      const results = await dataIngestionService.searchKnowledge(
        String(query), 
        filters
      );

      res.json({
        success: true,
        message: 'Knowledge search completed',
        data: results,
        meta: {
          query: String(query),
          filters,
          count: results.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getSources(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, source_type, created_by } = req.query;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      const connection = getConnection();
      
      let sql = `
        SELECT ws.*, u.full_name as creator_name,
               COUNT(we.id) as wisdom_count
        FROM knowledge_sources ws
        LEFT JOIN users u ON ws.user_id = u.id
        LEFT JOIN wisdom_entries we ON ws.id = we.source_id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      // Non-admin users can only see their own sources
      if (!isAdmin) {
        sql += ` AND ws.user_id = ?`;
        params.push(userId);
      } else if (created_by) {
        sql += ` AND ws.user_id = ?`;
        params.push(Number(created_by));
      }

      if (source_type) {
        sql += ` AND ws.source_type = ?`;
        params.push(source_type);
      }

      sql += ` GROUP BY ws.id ORDER BY ws.created_at DESC`;

      // Pagination
      const offset = (Number(page) - 1) * Number(limit);
      sql += ` LIMIT ? OFFSET ?`;
      params.push(Number(limit), offset);

      const [sources] = await connection.execute(sql, params) as any[];

      // Get total count for pagination
      let countSql = `SELECT COUNT(DISTINCT ws.id) as total FROM knowledge_sources ws WHERE 1=1`;
      const countParams: any[] = [];

      if (!isAdmin) {
        countSql += ` AND ws.user_id = ?`;
        countParams.push(userId);
      } else if (created_by) {
        countSql += ` AND ws.user_id = ?`;
        countParams.push(Number(created_by));
      }

      if (source_type) {
        countSql += ` AND ws.source_type = ?`;
        countParams.push(source_type);
      }

      const [countResult] = await connection.execute(countSql, countParams) as any[];
      const total = countResult[0].total;

      res.json({
        success: true,
        message: 'Knowledge sources retrieved',
        data: sources,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sourceId = Number(req.params.id);
      const userId = req.user!.id;

      if (!sourceId) {
        throw createError('Valid source ID is required', 400);
      }

      await dataIngestionService.deleteSource(sourceId, userId);

      res.json({
        success: true,
        message: 'Knowledge source deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async addDirectEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    try {
      const {
        title,
        source_type,
        source_url,
        content_text,
        category_id,
        tags,
        cultural_context,
        importance_score
      } = req.body;

      const userId = req.user!.id;
      const connection = getConnection();

      // Validate required fields
      if (!title || !source_type) {
        throw createError('Title and source type are required', 400);
      }

      if (source_type === 'text' && !content_text) {
        throw createError('Content text is required for text entries', 400);
      }

      if (source_type === 'url' && !source_url) {
        throw createError('URL is required for URL entries', 400);
      }

      // Insert knowledge source
      const [result] = await connection.execute(`
        INSERT INTO knowledge_sources 
        (title, source_type, source_url, content, metadata, 
         user_id, processing_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        title,
        source_type,
        source_url || null,
        content_text || null,
        JSON.stringify({
          tags: tags || [],
          importance_score: importance_score || 0.5
        }),
        userId,
        source_type === 'text' ? 'completed' : 'pending'
      ]) as any[];

      const sourceId = result.insertId;

      // Create wisdom entry if it's a text entry
      let wisdomId: number | undefined;
      if (source_type === 'text' && content_text) {
        const [wisdomResult] = await connection.execute(`
          INSERT INTO wisdom_entries 
          (source_id, category_id, title, content, cultural_context, 
           importance_score, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          sourceId,
          category_id || null,
          title,
          content_text,
          cultural_context || null,
          importance_score || 0.5,
          tags ? JSON.stringify(tags) : null
        ]) as any[];

        wisdomId = wisdomResult.insertId;

        // Log knowledge access for creation
        await auditService.logKnowledgeAccess({
          source_id: sourceId,
          wisdom_entry_id: wisdomId,
          user_id: userId,
          access_type: 'view',
          context_info: { action: 'created', method: 'direct_entry' },
          ip_address: AuditService.extractClientIP(req)
        });
      }

      const processingTime = Date.now() - startTime;

      // Log audit trail
      await auditService.logAuditTrail({
        table_name: 'knowledge_sources',
        record_id: sourceId,
        action: 'INSERT',
        user_id: userId,
        new_values: {
          title,
          source_type,
          source_url,
          content_text,
          category_id,
          tags,
          cultural_context,
          importance_score
        },
        ip_address: AuditService.extractClientIP(req),
        user_agent: req.headers['user-agent'],
        request_path: req.path,
        request_method: req.method,
        response_status: 201,
        processing_time_ms: processingTime,
        metadata: { wisdom_entry_id: wisdomId }
      });

      res.status(201).json({
        success: true,
        message: 'Knowledge entry added successfully',
        data: {
          id: sourceId,
          wisdom_entry_id: wisdomId,
          processing_status: source_type === 'text' ? 'completed' : 'pending'
        }
      });

      logger.info('Direct knowledge entry added', {
        sourceId,
        wisdomId,
        userId,
        sourceType: source_type,
        processingTime
      });

    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const connection = getConnection();
      const [categories] = await connection.execute(`
        SELECT wc.*, COUNT(we.id) as entry_count
        FROM wisdom_categories wc
        LEFT JOIN wisdom_entries we ON wc.id = we.category_id
        GROUP BY wc.id
        ORDER BY wc.name
      `) as any[];

      res.json({ 
        success: true,
        message: 'Categories retrieved successfully',
        data: categories 
      });
    } catch (error) {
      next(error);
    }
  }

  async getSource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sourceId = parseInt(req.params.id);
      const connection = getConnection();

      const [sources] = await connection.execute(`
        SELECT ks.*, we.id as wisdom_entry_id, we.category_id, we.importance_score,
               we.tags, we.cultural_context, wc.name as category_name,
               u.full_name as created_by_name, u.email as created_by_email
        FROM knowledge_sources ks
        LEFT JOIN wisdom_entries we ON ks.id = we.source_id
        LEFT JOIN wisdom_categories wc ON we.category_id = wc.id
        LEFT JOIN users u ON ks.user_id = u.id
        WHERE ks.id = ?
      `, [sourceId]) as any[];

      if (sources.length === 0) {
        throw createError('Knowledge source not found', 404);
      }

      // Log knowledge access
      await auditService.logKnowledgeAccess({
        source_id: sourceId,
        wisdom_entry_id: sources[0].wisdom_entry_id,
        user_id: req.user!.id,
        access_type: 'view',
        context_info: { action: 'view_details' },
        ip_address: AuditService.extractClientIP(req)
      });

      res.json({ 
        success: true,
        message: 'Knowledge source retrieved successfully',
        data: sources[0] 
      });
    } catch (error) {
      next(error);
    }
  }
}

export const knowledgeController = new KnowledgeController();