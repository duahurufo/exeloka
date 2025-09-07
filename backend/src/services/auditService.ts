import { getConnection } from '../config/database';
import { logger } from '../utils/logger';

interface AuditLogEntry {
  table_name: string;
  record_id: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ANALYSIS' | 'DOWNLOAD' | 'UPLOAD';
  user_id?: number;
  old_values?: any;
  new_values?: any;
  changed_fields?: string[];
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_path?: string;
  request_method?: string;
  response_status?: number;
  processing_time_ms?: number;
  metadata?: any;
}

interface AnalysisAuditEntry {
  project_id: number;
  recommendation_id?: number;
  analysis_type: 'quick' | 'enhanced';
  user_id: number;
  request_data: any;
  response_data?: any;
  processing_time_ms?: number;
  tokens_used?: number;
  cost_estimate?: number;
  error_message?: string;
  ip_address?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
}

interface KnowledgeAccessEntry {
  source_id?: number;
  wisdom_entry_id?: number;
  user_id: number;
  access_type: 'view' | 'search' | 'download' | 'reference';
  search_query?: string;
  context_info?: any;
  ip_address?: string;
}

class AuditService {
  // General audit trail logging
  async logAuditTrail(entry: AuditLogEntry): Promise<void> {
    try {
      const connection = getConnection();
      
      await connection.execute(`
        INSERT INTO audit_trail 
        (table_name, record_id, action, user_id, old_values, new_values, changed_fields,
         ip_address, user_agent, session_id, request_path, request_method, 
         response_status, processing_time_ms, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        entry.table_name,
        entry.record_id,
        entry.action,
        entry.user_id || null,
        entry.old_values ? JSON.stringify(entry.old_values) : null,
        entry.new_values ? JSON.stringify(entry.new_values) : null,
        entry.changed_fields ? JSON.stringify(entry.changed_fields) : null,
        entry.ip_address || null,
        entry.user_agent || null,
        entry.session_id || null,
        entry.request_path || null,
        entry.request_method || null,
        entry.response_status || null,
        entry.processing_time_ms || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null
      ]);

      logger.info('Audit trail logged', {
        table: entry.table_name,
        action: entry.action,
        recordId: entry.record_id,
        userId: entry.user_id
      });
    } catch (error) {
      logger.error('Failed to log audit trail', { error, entry });
      // Don't throw - audit logging shouldn't break main functionality
    }
  }

  // Analysis-specific audit logging
  async logAnalysisStart(entry: Omit<AnalysisAuditEntry, 'status'>): Promise<number> {
    try {
      const connection = getConnection();
      
      const [result] = await connection.execute(`
        INSERT INTO analysis_history 
        (project_id, recommendation_id, analysis_type, user_id, request_data, 
         processing_time_ms, tokens_used, cost_estimate, error_message, ip_address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        entry.project_id,
        entry.recommendation_id || null,
        entry.analysis_type,
        entry.user_id,
        JSON.stringify(entry.request_data),
        entry.processing_time_ms || null,
        entry.tokens_used || null,
        entry.cost_estimate || null,
        entry.error_message || null,
        entry.ip_address || null
      ]) as any[];

      const auditId = result.insertId;

      logger.info('Analysis audit started', {
        auditId,
        projectId: entry.project_id,
        analysisType: entry.analysis_type,
        userId: entry.user_id
      });

      return auditId;
    } catch (error) {
      logger.error('Failed to log analysis start', { error, entry });
      return 0; // Return 0 if logging fails
    }
  }

  async logAnalysisComplete(
    auditId: number,
    response_data?: any,
    processing_time_ms?: number,
    tokens_used?: number,
    cost_estimate?: number
  ): Promise<void> {
    try {
      const connection = getConnection();
      
      await connection.execute(`
        UPDATE analysis_history 
        SET status = 'completed', response_data = ?, processing_time_ms = ?, 
            tokens_used = ?, cost_estimate = ?, completed_at = NOW()
        WHERE id = ?
      `, [
        response_data ? JSON.stringify(response_data) : null,
        processing_time_ms || null,
        tokens_used || null,
        cost_estimate || null,
        auditId
      ]);

      logger.info('Analysis audit completed', { auditId, processing_time_ms });
    } catch (error) {
      logger.error('Failed to log analysis completion', { error, auditId });
    }
  }

  async logAnalysisError(auditId: number, error_message: string): Promise<void> {
    try {
      const connection = getConnection();
      
      await connection.execute(`
        UPDATE analysis_history 
        SET status = 'failed', error_message = ?, completed_at = NOW()
        WHERE id = ?
      `, [error_message, auditId]);

      logger.info('Analysis audit error logged', { auditId, error_message });
    } catch (error) {
      logger.error('Failed to log analysis error', { error, auditId });
    }
  }

  // Knowledge base access logging
  async logKnowledgeAccess(entry: KnowledgeAccessEntry): Promise<void> {
    try {
      const connection = getConnection();
      
      await connection.execute(`
        INSERT INTO knowledge_access_log 
        (source_id, wisdom_entry_id, user_id, access_type, search_query, context_info, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        entry.source_id || null,
        entry.wisdom_entry_id || null,
        entry.user_id,
        entry.access_type,
        entry.search_query || null,
        entry.context_info ? JSON.stringify(entry.context_info) : null,
        entry.ip_address || null
      ]);

      logger.info('Knowledge access logged', {
        userId: entry.user_id,
        accessType: entry.access_type,
        sourceId: entry.source_id,
        wisdomEntryId: entry.wisdom_entry_id
      });
    } catch (error) {
      logger.error('Failed to log knowledge access', { error, entry });
    }
  }

  // Document generation logging
  async logDocumentGenerationStart(
    recommendation_id: number,
    user_id: number,
    document_type: 'docx' | 'xlsx' | 'pptx',
    template_type?: string,
    generation_options?: any,
    ip_address?: string
  ): Promise<number> {
    try {
      const connection = getConnection();
      
      const [result] = await connection.execute(`
        INSERT INTO document_generation_log 
        (recommendation_id, user_id, document_type, template_type, generation_options, ip_address, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `, [
        recommendation_id,
        user_id,
        document_type,
        template_type || null,
        generation_options ? JSON.stringify(generation_options) : null,
        ip_address || null
      ]) as any[];

      const logId = result.insertId;

      logger.info('Document generation audit started', {
        logId,
        recommendationId: recommendation_id,
        userId: user_id,
        documentType: document_type
      });

      return logId;
    } catch (error) {
      logger.error('Failed to log document generation start', { error });
      return 0;
    }
  }

  async logDocumentGenerationComplete(
    logId: number,
    document_id?: number,
    file_size?: number,
    processing_time_ms?: number
  ): Promise<void> {
    try {
      const connection = getConnection();
      
      await connection.execute(`
        UPDATE document_generation_log 
        SET status = 'completed', document_id = ?, file_size = ?, 
            processing_time_ms = ?, completed_at = NOW()
        WHERE id = ?
      `, [
        document_id || null,
        file_size || null,
        processing_time_ms || null,
        logId
      ]);

      logger.info('Document generation audit completed', { logId, document_id });
    } catch (error) {
      logger.error('Failed to log document generation completion', { error, logId });
    }
  }

  async logDocumentGenerationError(logId: number, error_message: string): Promise<void> {
    try {
      const connection = getConnection();
      
      await connection.execute(`
        UPDATE document_generation_log 
        SET status = 'failed', error_message = ?, completed_at = NOW()
        WHERE id = ?
      `, [error_message, logId]);

      logger.info('Document generation error logged', { logId, error_message });
    } catch (error) {
      logger.error('Failed to log document generation error', { error, logId });
    }
  }

  // File upload logging
  async logFileUpload(
    user_id: number,
    original_filename: string,
    stored_filename: string,
    file_path: string,
    file_size: number,
    mime_type?: string,
    file_hash?: string,
    upload_purpose: 'knowledge_source' | 'project_document' | 'user_avatar' | 'other' = 'other',
    related_table?: string,
    related_id?: number,
    ip_address?: string
  ): Promise<number> {
    try {
      const connection = getConnection();
      
      const [result] = await connection.execute(`
        INSERT INTO file_uploads 
        (user_id, original_filename, stored_filename, file_path, file_size, mime_type, 
         file_hash, upload_purpose, related_table, related_id, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user_id,
        original_filename,
        stored_filename,
        file_path,
        file_size,
        mime_type || null,
        file_hash || null,
        upload_purpose,
        related_table || null,
        related_id || null,
        ip_address || null
      ]) as any[];

      const uploadId = result.insertId;

      logger.info('File upload logged', {
        uploadId,
        userId: user_id,
        filename: original_filename,
        fileSize: file_size,
        purpose: upload_purpose
      });

      return uploadId;
    } catch (error) {
      logger.error('Failed to log file upload', { error });
      return 0;
    }
  }

  // User session logging
  async logUserSession(
    user_id: number,
    session_token: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<number> {
    try {
      const connection = getConnection();
      
      const [result] = await connection.execute(`
        INSERT INTO user_sessions 
        (user_id, session_token, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
      `, [
        user_id,
        session_token,
        ip_address || null,
        user_agent || null
      ]) as any[];

      const sessionId = result.insertId;

      logger.info('User session logged', {
        sessionId,
        userId: user_id,
        ipAddress: ip_address
      });

      return sessionId;
    } catch (error) {
      logger.error('Failed to log user session', { error });
      return 0;
    }
  }

  async logUserLogout(
    session_token: string,
    logout_reason: 'manual' | 'timeout' | 'security' | 'admin' = 'manual'
  ): Promise<void> {
    try {
      const connection = getConnection();
      
      await connection.execute(`
        UPDATE user_sessions 
        SET logout_at = NOW(), is_active = FALSE, logout_reason = ?
        WHERE session_token = ? AND is_active = TRUE
      `, [logout_reason, session_token]);

      logger.info('User logout logged', { session_token, logout_reason });
    } catch (error) {
      logger.error('Failed to log user logout', { error });
    }
  }

  // API usage logging
  async logAPIUsage(
    user_id: number | null,
    ip_address: string,
    endpoint: string,
    method: string,
    status_code: number,
    response_time_ms?: number,
    request_size_bytes?: number,
    response_size_bytes?: number,
    user_agent?: string,
    rate_limit_hit: boolean = false
  ): Promise<void> {
    try {
      const connection = getConnection();
      
      await connection.execute(`
        INSERT INTO api_usage_log 
        (user_id, ip_address, endpoint, method, status_code, response_time_ms, 
         request_size_bytes, response_size_bytes, user_agent, rate_limit_hit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user_id,
        ip_address,
        endpoint,
        method,
        status_code,
        response_time_ms || null,
        request_size_bytes || null,
        response_size_bytes || null,
        user_agent || null,
        rate_limit_hit
      ]);

      // Only log successful requests in detail to avoid spam
      if (status_code < 400) {
        logger.info('API usage logged', {
          userId: user_id,
          endpoint,
          method,
          statusCode: status_code,
          responseTime: response_time_ms
        });
      }
    } catch (error) {
      logger.error('Failed to log API usage', { error });
    }
  }

  // Utility method to extract client IP from request
  static extractClientIP(req: any): string {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }

  // Utility method to compare objects for audit logging
  static getChangedFields(oldObject: any, newObject: any): string[] {
    const changed: string[] = [];
    
    if (!oldObject || !newObject) return changed;

    // Check all fields in new object
    for (const key in newObject) {
      if (newObject[key] !== oldObject[key]) {
        changed.push(key);
      }
    }

    // Check for removed fields
    for (const key in oldObject) {
      if (!(key in newObject)) {
        changed.push(key);
      }
    }

    return changed;
  }

  // Get audit trail for a specific record
  async getAuditTrailForRecord(tableName: string, recordId: number, limit: number = 50): Promise<any[]> {
    try {
      const connection = getConnection();
      
      const [results] = await connection.execute(`
        SELECT at.*, u.full_name as user_name, u.email as user_email
        FROM audit_trail at
        LEFT JOIN users u ON at.user_id = u.id
        WHERE at.table_name = ? AND at.record_id = ?
        ORDER BY at.created_at DESC
        LIMIT ?
      `, [tableName, recordId, limit]) as any[];

      return results;
    } catch (error) {
      logger.error('Failed to get audit trail', { error, tableName, recordId });
      return [];
    }
  }

  // Get analysis history for a project
  async getAnalysisHistory(projectId: number, limit: number = 20): Promise<any[]> {
    try {
      const connection = getConnection();
      
      const [results] = await connection.execute(`
        SELECT ah.*, u.full_name as user_name, u.email as user_email
        FROM analysis_history ah
        LEFT JOIN users u ON ah.user_id = u.id
        WHERE ah.project_id = ?
        ORDER BY ah.started_at DESC
        LIMIT ?
      `, [projectId, limit]) as any[];

      return results;
    } catch (error) {
      logger.error('Failed to get analysis history', { error, projectId });
      return [];
    }
  }
}

export { AuditService };
export const auditService = new AuditService();