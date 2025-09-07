import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { llmService } from './llmService';
import { ocrService } from './ocrService';
import { getConnection } from '../config/database';
import { KnowledgeSource, FileProcessingResult } from '../types';

interface IngestionRequest {
  title: string;
  source_type: 'url' | 'document' | 'audio' | 'video' | 'text';
  source_url?: string;
  file_path?: string;
  content_text?: string;
  user_id: number;
}

interface ProcessedContent {
  raw_content: string;
  cleaned_content: string;
  metadata: Record<string, any>;
  cultural_analysis?: any;
}

class DataIngestionService {
  private uploadPath: string;

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  async ingestData(request: IngestionRequest): Promise<KnowledgeSource> {
    try {
      logger.info('Starting data ingestion', { 
        title: request.title, 
        type: request.source_type 
      });

      // Process content based on source type
      const processed = await this.processContent(request);
      
      // Perform cultural analysis
      const culturalAnalysis = await llmService.analyzeCulturalContent(
        processed.cleaned_content,
        request.source_type
      );

      // Store in database
      const connection = getConnection();
      const [result] = await connection.execute(`
        INSERT INTO knowledge_sources 
        (title, source_type, source_url, file_path, content, metadata, user_id, processing_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
      `, [
        request.title,
        request.source_type,
        request.source_url,
        request.file_path,
        processed.cleaned_content,
        JSON.stringify({
          ...processed.metadata,
          cultural_analysis: culturalAnalysis,
          processing_stats: {
            raw_length: processed.raw_content.length,
            cleaned_length: processed.cleaned_content.length,
            processing_time: Date.now()
          }
        }),
        request.user_id
      ]) as any[];

      const sourceId = result.insertId;

      // Extract and store wisdom entries
      await this.extractWisdomEntries(sourceId, culturalAnalysis, processed.cleaned_content);

      // Fetch the complete source record
      const [sources] = await connection.execute(
        'SELECT * FROM knowledge_sources WHERE id = ?',
        [sourceId]
      ) as any[];

      logger.info('Data ingestion completed', { 
        sourceId, 
        title: request.title,
        wisdomEntries: culturalAnalysis.cultural_elements?.length || 0
      });

      return sources[0];
    } catch (error) {
      logger.error('Data ingestion failed', { error, request });
      throw error;
    }
  }

  private async processContent(request: IngestionRequest): Promise<ProcessedContent> {
    switch (request.source_type) {
      case 'url':
        return await this.processUrl(request.source_url!);
      case 'document':
        return await this.processDocument(request.file_path!);
      case 'text':
        return await this.processText(request.content_text!);
      case 'audio':
        return await this.processAudio(request.file_path!);
      case 'video':
        return await this.processVideo(request.file_path!);
      default:
        throw createError(`Unsupported source type: ${request.source_type}`, 400);
    }
  }

  private async processUrl(url: string): Promise<ProcessedContent> {
    try {
      logger.info('Processing URL', { url });
      
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Exeloka Cultural Wisdom System'
        }
      });

      const contentType = response.headers['content-type'] || '';
      let raw_content = '';
      let metadata = {
        url,
        status: response.status,
        content_type: contentType,
        content_length: response.data.length,
        retrieved_at: new Date().toISOString()
      };

      if (contentType.includes('text/html')) {
        // Extract text from HTML
        raw_content = this.extractTextFromHtml(response.data);
      } else if (contentType.includes('application/json')) {
        raw_content = JSON.stringify(response.data, null, 2);
      } else {
        raw_content = String(response.data);
      }

      // Clean and extract meaningful content using LLM
      const cleaned_content = await llmService.extractTextContent(raw_content, 'webpage');

      return {
        raw_content,
        cleaned_content,
        metadata
      };
    } catch (error: any) {
      logger.error('URL processing failed', { url, error: error.message });
      throw createError(`Failed to process URL: ${error.message}`, 400);
    }
  }

  private async processDocument(filePath: string): Promise<ProcessedContent> {
    try {
      logger.info('Processing document', { filePath });
      
      const fullPath = path.resolve(filePath);
      const fileExtension = path.extname(fullPath).toLowerCase();
      const fileStats = await fs.stat(fullPath);
      
      let raw_content = '';
      let metadata = {
        file_path: filePath,
        file_size: fileStats.size,
        file_extension: fileExtension,
        processed_at: new Date().toISOString()
      };

      switch (fileExtension) {
        case '.pdf':
          const pdfBuffer = await fs.readFile(fullPath);
          const pdfData = await pdfParse(pdfBuffer);
          raw_content = pdfData.text;
          (metadata as any).pdf_info = pdfData.info;
          (metadata as any).page_count = pdfData.numpages;
          break;

        case '.docx':
          const docxBuffer = await fs.readFile(fullPath);
          const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
          raw_content = docxResult.value;
          (metadata as any).docx_messages = docxResult.messages;
          break;

        case '.txt':
          raw_content = await fs.readFile(fullPath, 'utf-8');
          break;

        case '.md':
          raw_content = await fs.readFile(fullPath, 'utf-8');
          (metadata as any).format = 'markdown';
          break;

        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.tiff':
        case '.bmp':
        case '.webp':
          // Use OCR for image files
          const ocrResult = await ocrService.extractTextFromFile(fullPath);
          raw_content = ocrResult.text;
          (metadata as any).format = 'image_ocr';
          (metadata as any).ocr_confidence = ocrResult.confidence;
          (metadata as any).ocr_metadata = ocrResult.metadata;
          break;

        default:
          throw createError(`Unsupported document format: ${fileExtension}`, 400);
      }

      // Clean and extract meaningful content using LLM
      const cleaned_content = await llmService.extractTextContent(raw_content, `document (${fileExtension})`);

      return {
        raw_content,
        cleaned_content,
        metadata
      };
    } catch (error: any) {
      logger.error('Document processing failed', { filePath, error: error.message });
      throw createError(`Failed to process document: ${error.message}`, 400);
    }
  }

  private async processText(content: string): Promise<ProcessedContent> {
    logger.info('Processing text content', { length: content.length });
    
    const metadata = {
      content_length: content.length,
      processed_at: new Date().toISOString()
    };

    // Clean and extract meaningful content using LLM
    const cleaned_content = await llmService.extractTextContent(content, 'text input');

    return {
      raw_content: content,
      cleaned_content,
      metadata
    };
  }

  private async processAudio(filePath: string): Promise<ProcessedContent> {
    // TODO: Implement audio processing
    // This would typically involve:
    // 1. Audio format validation
    // 2. Speech-to-text conversion (using services like Google Speech-to-Text, Azure Speech, etc.)
    // 3. Content cleanup and extraction
    
    logger.warn('Audio processing not yet implemented', { filePath });
    
    const metadata = {
      file_path: filePath,
      processing_status: 'not_implemented',
      processed_at: new Date().toISOString()
    };

    return {
      raw_content: '[Audio file - processing not yet implemented]',
      cleaned_content: 'Audio processing feature is coming soon. Please convert to text for now.',
      metadata
    };
  }

  private async processVideo(filePath: string): Promise<ProcessedContent> {
    // TODO: Implement video processing
    // This would typically involve:
    // 1. Video format validation
    // 2. Audio extraction using ffmpeg
    // 3. Speech-to-text conversion
    // 4. Optionally, frame extraction and OCR for text overlays
    // 5. Content cleanup and extraction
    
    logger.warn('Video processing not yet implemented', { filePath });
    
    const metadata = {
      file_path: filePath,
      processing_status: 'not_implemented',
      processed_at: new Date().toISOString()
    };

    return {
      raw_content: '[Video file - processing not yet implemented]',
      cleaned_content: 'Video processing feature is coming soon. Please extract audio or convert to text for now.',
      metadata
    };
  }

  private async extractWisdomEntries(
    sourceId: number,
    culturalAnalysis: any,
    content: string
  ): Promise<void> {
    try {
      const connection = getConnection();

      // Extract wisdom entries from cultural elements
      if (culturalAnalysis.cultural_elements && Array.isArray(culturalAnalysis.cultural_elements)) {
        for (const element of culturalAnalysis.cultural_elements) {
          const importanceScore = this.calculateImportanceScore(
            culturalAnalysis.importance_level,
            element
          );

          await connection.execute(`
            INSERT INTO wisdom_entries 
            (source_id, title, content, cultural_context, importance_score, tags)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            sourceId,
            element.substring(0, 500), // Truncate title if too long
            element,
            culturalAnalysis.cultural_context || '',
            importanceScore,
            JSON.stringify(culturalAnalysis.potential_risks || [])
          ]);
        }
      }

      // Add traditional practices as separate wisdom entries
      if (culturalAnalysis.traditional_practices && Array.isArray(culturalAnalysis.traditional_practices)) {
        for (const practice of culturalAnalysis.traditional_practices) {
          const importanceScore = this.calculateImportanceScore(
            culturalAnalysis.importance_level,
            practice
          );

          await connection.execute(`
            INSERT INTO wisdom_entries 
            (source_id, title, content, cultural_context, importance_score, tags)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            sourceId,
            `Traditional Practice: ${practice.substring(0, 450)}`,
            practice,
            culturalAnalysis.cultural_context || '',
            importanceScore,
            JSON.stringify(['traditional_practice', ...(culturalAnalysis.potential_risks || [])])
          ]);
        }
      }

      logger.info('Wisdom entries extracted', { 
        sourceId,
        elements: culturalAnalysis.cultural_elements?.length || 0,
        practices: culturalAnalysis.traditional_practices?.length || 0
      });
    } catch (error) {
      logger.error('Failed to extract wisdom entries', { sourceId, error });
      // Don't throw - this is a non-critical step
    }
  }

  private calculateImportanceScore(importanceLevel: string, content: string): number {
    let baseScore = 0;
    
    switch (importanceLevel) {
      case 'high':
        baseScore = 0.8;
        break;
      case 'medium':
        baseScore = 0.6;
        break;
      case 'low':
        baseScore = 0.4;
        break;
      default:
        baseScore = 0.5;
    }

    // Adjust based on content characteristics
    if (content.toLowerCase().includes('traditional') || 
        content.toLowerCase().includes('cultural') ||
        content.toLowerCase().includes('sacred')) {
      baseScore += 0.1;
    }

    if (content.toLowerCase().includes('sampang') ||
        content.toLowerCase().includes('madura') ||
        content.toLowerCase().includes('java')) {
      baseScore += 0.1;
    }

    return Math.min(1.0, Math.max(0.0, baseScore));
  }

  private extractTextFromHtml(html: string): string {
    // Simple HTML text extraction (in production, use a proper HTML parser)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
      .replace(/<[^>]*>/g, ' ')    // Remove HTML tags
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();
  }

  async searchKnowledge(query: string, filters: any = {}): Promise<any[]> {
    try {
      const connection = getConnection();
      
      let sql = `
        SELECT ws.*, we.title as wisdom_title, we.content as wisdom_content,
               we.importance_score, we.tags
        FROM knowledge_sources ws
        LEFT JOIN wisdom_entries we ON ws.id = we.source_id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      // Full-text search on content
      if (query && query.trim()) {
        sql += ` AND (
          ws.title LIKE ? OR ws.content LIKE ?
          OR we.title LIKE ? OR we.content LIKE ?
        )`;
        const likeQuery = `%${query}%`;
        params.push(likeQuery, likeQuery, likeQuery, likeQuery);
      }

      // Apply filters
      if (filters.source_type) {
        sql += ` AND ws.source_type = ?`;
        params.push(filters.source_type);
      }

      if (filters.importance_level) {
        const importanceMap = { high: 0.7, medium: 0.5, low: 0.3 };
        const minScore = importanceMap[filters.importance_level as keyof typeof importanceMap] || 0;
        sql += ` AND we.importance_score >= ?`;
        params.push(minScore);
      }

      sql += ` ORDER BY we.importance_score DESC, ws.created_at DESC`;
      
      if (filters.limit) {
        sql += ` LIMIT ?`;
        params.push(filters.limit);
      }

      const [results] = await connection.execute(sql, params) as any[];
      
      logger.info('Knowledge search completed', { 
        query, 
        filters, 
        resultCount: results.length 
      });

      return results;
    } catch (error) {
      logger.error('Knowledge search failed', { query, filters, error });
      throw createError('Search failed', 500);
    }
  }

  async deleteSource(sourceId: number, userId: number): Promise<void> {
    try {
      const connection = getConnection();
      
      // Check if source exists and user has permission
      const [sources] = await connection.execute(
        'SELECT user_id FROM knowledge_sources WHERE id = ?',
        [sourceId]
      ) as any[];

      if (!sources.length) {
        throw createError('Knowledge source not found', 404);
      }

      // Only admin or creator can delete
      // TODO: Add admin check when user roles are properly implemented
      if (sources[0].user_id !== userId) {
        throw createError('Permission denied', 403);
      }

      // Delete source (wisdom entries will be cascaded)
      await connection.execute(
        'DELETE FROM knowledge_sources WHERE id = ?',
        [sourceId]
      );

      logger.info('Knowledge source deleted', { sourceId, userId });
    } catch (error) {
      logger.error('Failed to delete knowledge source', { sourceId, userId, error });
      throw error;
    }
  }
}

export const dataIngestionService = new DataIngestionService();