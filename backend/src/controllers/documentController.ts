import { Request, Response, NextFunction } from 'express';
import { documentGenerationService } from '../services/documentGenerationService';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

interface DocumentGenerationRequestBody {
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

class DocumentController {
  async generateDocx(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { recommendation_id, template_type, include_sections, custom_branding } = req.body as DocumentGenerationRequestBody;
      const userId = req.user!.id;

      // Validation
      if (!recommendation_id) {
        throw createError('recommendation_id is required', 400);
      }

      const document = await documentGenerationService.generateDocx(
        recommendation_id,
        userId,
        {
          recommendation_id,
          template_type,
          include_sections,
          custom_branding
        }
      );

      res.status(201).json({
        success: true,
        message: 'DOCX document generated successfully',
        data: {
          document_id: document.id,
          filename: document.filename,
          download_url: `/api/documents/download/${document.filename}`,
          file_size: document.file_size,
          created_at: document.created_at
        }
      });

      logger.info('DOCX document generated', {
        documentId: document.id,
        recommendationId: recommendation_id,
        userId,
        filename: document.filename
      });
    } catch (error) {
      next(error);
    }
  }

  async generateXlsx(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { recommendation_id, template_type, include_sections, custom_branding } = req.body as DocumentGenerationRequestBody;
      const userId = req.user!.id;

      // Validation
      if (!recommendation_id) {
        throw createError('recommendation_id is required', 400);
      }

      const document = await documentGenerationService.generateXlsx(
        recommendation_id,
        userId,
        {
          recommendation_id,
          template_type,
          include_sections,
          custom_branding
        }
      );

      res.status(201).json({
        success: true,
        message: 'XLSX document generated successfully',
        data: {
          document_id: document.id,
          filename: document.filename,
          download_url: `/api/documents/download/${document.filename}`,
          file_size: document.file_size,
          created_at: document.created_at
        }
      });

      logger.info('XLSX document generated', {
        documentId: document.id,
        recommendationId: recommendation_id,
        userId,
        filename: document.filename
      });
    } catch (error) {
      next(error);
    }
  }

  async generatePptx(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { recommendation_id, template_type, include_sections, custom_branding } = req.body as DocumentGenerationRequestBody;
      const userId = req.user!.id;

      // Validation
      if (!recommendation_id) {
        throw createError('recommendation_id is required', 400);
      }

      const document = await documentGenerationService.generatePptx(
        recommendation_id,
        userId,
        {
          recommendation_id,
          template_type,
          include_sections,
          custom_branding
        }
      );

      res.status(201).json({
        success: true,
        message: 'PPTX document generated successfully',
        data: {
          document_id: document.id,
          filename: document.filename,
          download_url: `/api/documents/download/${document.filename}`,
          file_size: document.file_size,
          created_at: document.created_at
        }
      });

      logger.info('PPTX document generated', {
        documentId: document.id,
        recommendationId: recommendation_id,
        userId,
        filename: document.filename
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filename = req.params.filename;
      const userId = req.user!.id;

      if (!filename) {
        throw createError('Filename is required', 400);
      }

      // Get document info and verify access
      const { filePath, mimeType } = await documentGenerationService.getDocumentDownloadInfo(
        filename,
        userId
      );

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw createError('File not found on server', 404);
      }

      // Set appropriate headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Stream the file
      const fileStream = require('fs').createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error: Error) => {
        logger.error('File streaming error', { filename, userId, error });
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file'
          });
        }
      });

      logger.info('Document downloaded', { filename, userId });
    } catch (error) {
      next(error);
    }
  }

  async getUserDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, document_type, recommendation_id } = req.query;

      // Build query to get user's documents
      const connection = require('../config/database').getConnection();
      
      let sql = `
        SELECT gd.*, r.title as recommendation_title, p.title as project_title
        FROM generated_documents gd
        JOIN recommendations r ON gd.recommendation_id = r.id
        JOIN projects p ON r.project_id = p.id
        WHERE p.user_id = ?
      `;
      const params: any[] = [userId];

      if (document_type) {
        sql += ` AND gd.document_type = ?`;
        params.push(document_type);
      }

      if (recommendation_id) {
        sql += ` AND gd.recommendation_id = ?`;
        params.push(Number(recommendation_id));
      }

      sql += ` ORDER BY gd.created_at DESC`;
      
      // Pagination
      const offset = (Number(page) - 1) * Number(limit);
      sql += ` LIMIT ? OFFSET ?`;
      params.push(Number(limit), offset);

      const [documents] = await connection.execute(sql, params);

      // Get total count
      let countSql = `
        SELECT COUNT(gd.id) as total
        FROM generated_documents gd
        JOIN recommendations r ON gd.recommendation_id = r.id
        JOIN projects p ON r.project_id = p.id
        WHERE p.user_id = ?
      `;
      const countParams: any[] = [userId];

      if (document_type) {
        countSql += ` AND gd.document_type = ?`;
        countParams.push(document_type);
      }

      if (recommendation_id) {
        countSql += ` AND gd.recommendation_id = ?`;
        countParams.push(Number(recommendation_id));
      }

      const [countResult] = await connection.execute(countSql, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        message: 'Documents retrieved successfully',
        data: documents.map((doc: any) => ({
          ...doc,
          download_url: `/api/documents/download/${doc.filename}`
        })),
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

  async getDocumentStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const connection = require('../config/database').getConnection();

      // Get document statistics
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_documents,
          COUNT(CASE WHEN gd.document_type = 'docx' THEN 1 END) as docx_count,
          COUNT(CASE WHEN gd.document_type = 'xlsx' THEN 1 END) as xlsx_count,
          COUNT(CASE WHEN gd.document_type = 'pptx' THEN 1 END) as pptx_count,
          SUM(gd.file_size) as total_file_size,
          SUM(gd.download_count) as total_downloads,
          AVG(gd.download_count) as avg_downloads_per_document
        FROM generated_documents gd
        JOIN recommendations r ON gd.recommendation_id = r.id
        JOIN projects p ON r.project_id = p.id
        WHERE p.user_id = ?
      `, [userId]);

      res.json({
        success: true,
        message: 'Document statistics retrieved',
        data: stats[0]
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();