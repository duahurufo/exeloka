import { Request, Response, NextFunction } from 'express';
import { auditService, AuditService } from '../services/auditService';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    userId: number;
    email: string;
    role: string;
  };
  startTime?: number;
  auditContext?: {
    table_name?: string;
    record_id?: number;
    action?: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ANALYSIS' | 'DOWNLOAD' | 'UPLOAD';
    old_values?: any;
    new_values?: any;
    metadata?: any;
  };
}

// Middleware to track API usage and general requests
export const apiAuditMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  
  // Store original res.json to capture response data
  const originalJson = res.json;
  let responseData: any;
  
  res.json = function(data: any) {
    responseData = data;
    return originalJson.call(this, data);
  };

  // Store original res.send to capture response data
  const originalSend = res.send;
  res.send = function(data: any) {
    if (!responseData) {
      try {
        responseData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        responseData = data;
      }
    }
    return originalSend.call(this, data);
  };

  res.on('finish', async () => {
    try {
      const processingTime = Date.now() - (req.startTime || Date.now());
      const userId = req.user?.userId || req.user?.id || null;
      
      // Skip audit logging for now to avoid blocking requests
      // TODO: Re-enable after fixing audit service issues
      /*
      // Log API usage for all requests
      await auditService.logAPIUsage(
        userId,
        AuditService.extractClientIP(req),
        req.path,
        req.method,
        res.statusCode,
        processingTime,
        req.get('Content-Length') ? parseInt(req.get('Content-Length')!) : undefined,
        res.get('Content-Length') ? parseInt(res.get('Content-Length')!) : undefined,
        req.get('User-Agent'),
        false // rate_limit_hit - would be set by rate limiting middleware
      );
      */

      // Skip detailed audit trail for now
      /*
      // Log detailed audit trail for specific operations if context is set
      if (req.auditContext) {
        await auditService.logAuditTrail({
          table_name: req.auditContext.table_name || 'unknown',
          record_id: req.auditContext.record_id || 0,
          action: req.auditContext.action || 'UPDATE',
          user_id: userId,
          old_values: req.auditContext.old_values,
          new_values: req.auditContext.new_values,
          ip_address: AuditService.extractClientIP(req),
          user_agent: req.get('User-Agent'),
          request_path: req.path,
          request_method: req.method,
          response_status: res.statusCode,
          processing_time_ms: processingTime,
          metadata: req.auditContext.metadata
        });
      }
      */

      // Skip authentication event logging for now
      /*
      // Log authentication events
      if (req.path.includes('/auth/login') && res.statusCode === 200) {
        await auditService.logAuditTrail({
          table_name: 'users',
          record_id: responseData?.data?.user?.id || 0,
          action: 'LOGIN',
          user_id: responseData?.data?.user?.id,
          ip_address: AuditService.extractClientIP(req),
          user_agent: req.get('User-Agent'),
          request_path: req.path,
          request_method: req.method,
          response_status: res.statusCode,
          processing_time_ms: processingTime,
          metadata: { login_method: 'credentials' }
        });
      }

      if (req.path.includes('/auth/logout') && res.statusCode === 200) {
        await auditService.logAuditTrail({
          table_name: 'users',
          record_id: userId || 0,
          action: 'LOGOUT',
          user_id: userId,
          ip_address: AuditService.extractClientIP(req),
          user_agent: req.get('User-Agent'),
          request_path: req.path,
          request_method: req.method,
          response_status: res.statusCode,
          processing_time_ms: processingTime,
          metadata: { logout_method: 'manual' }
        });
      }
      */

    } catch (error) {
      logger.error('Audit middleware error', { error, path: req.path, method: req.method });
    }
  });

  next();
};

// Middleware to set audit context for specific operations
export const setAuditContext = (
  tableName: string, 
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ANALYSIS' | 'DOWNLOAD' | 'UPLOAD',
  metadata?: any
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.auditContext = {
      table_name: tableName,
      action,
      metadata
    };
    next();
  };
};

// Helper function to update audit context with record details
export const updateAuditContext = (
  req: AuthenticatedRequest, 
  recordId: number, 
  oldValues?: any, 
  newValues?: any
) => {
  if (req.auditContext) {
    req.auditContext.record_id = recordId;
    req.auditContext.old_values = oldValues;
    req.auditContext.new_values = newValues;
  }
};

// Middleware specifically for file uploads
export const fileUploadAuditMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Log file upload completion if successful
    if (res.statusCode < 400 && req.file && req.user) {
      setTimeout(async () => {
        try {
          await auditService.logAuditTrail({
            table_name: 'file_uploads',
            record_id: data?.data?.upload_id || 0,
            action: 'UPLOAD',
            user_id: req.user!.userId || req.user!.id,
            new_values: {
              filename: req.file!.originalname,
              size: req.file!.size,
              mimetype: req.file!.mimetype,
              destination: req.file!.path
            },
            ip_address: AuditService.extractClientIP(req),
            user_agent: req.get('User-Agent'),
            request_path: req.path,
            request_method: req.method,
            response_status: res.statusCode,
            processing_time_ms: Date.now() - (req.startTime || Date.now()),
            metadata: { 
              file_purpose: req.body.upload_purpose || 'unknown',
              related_table: req.body.related_table,
              related_id: req.body.related_id
            }
          });
        } catch (error) {
          logger.error('File upload audit error', { error });
        }
      }, 100);
    }
    
    return originalJson.call(this, data);
  };

  next();
};

// Middleware for document generation tracking
export const documentGenerationAuditMiddleware = (documentType: 'docx' | 'xlsx' | 'pptx') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    let auditId: number | undefined;
    
    // Log generation start
    if (req.user && req.body.recommendation_id) {
      try {
        auditId = await auditService.logDocumentGenerationStart(
          req.body.recommendation_id,
          req.user.userId || req.user.id,
          documentType,
          req.body.template_type,
          req.body.generation_options,
          AuditService.extractClientIP(req)
        );
      } catch (error) {
        logger.error('Document generation audit start error', { error });
      }
    }
    
    res.json = function(data: any) {
      // Log completion or failure
      setTimeout(async () => {
        if (auditId) {
          try {
            if (res.statusCode < 400) {
              await auditService.logDocumentGenerationComplete(
                auditId,
                data?.data?.document_id,
                data?.data?.file_size,
                Date.now() - (req.startTime || Date.now())
              );
            } else {
              await auditService.logDocumentGenerationError(
                auditId,
                data?.error || 'Document generation failed'
              );
            }
          } catch (error) {
            logger.error('Document generation audit completion error', { error });
          }
        }
      }, 100);
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Middleware for analysis operations
export const analysisAuditMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  let auditId: number | undefined;
  
  // Log analysis start
  if (req.user && req.body.project_id) {
    try {
      auditId = await auditService.logAnalysisStart({
        project_id: req.body.project_id,
        recommendation_id: req.body.recommendation_id,
        analysis_type: req.body.analysis_type || 'quick',
        user_id: req.user.userId || req.user.id,
        request_data: {
          additional_context: req.body.additional_context,
          priority_areas: req.body.priority_areas,
          specific_concerns: req.body.specific_concerns,
          custom_system_instruction: req.body.custom_system_instruction,
          custom_user_prompt: req.body.custom_user_prompt
        },
        ip_address: AuditService.extractClientIP(req)
      });
      
      // Store audit ID for completion logging
      (req as any).analysisAuditId = auditId;
    } catch (error) {
      logger.error('Analysis audit start error', { error });
    }
  }
  
  res.json = function(data: any) {
    // Log completion or failure
    setTimeout(async () => {
      const auditId = (req as any).analysisAuditId;
      if (auditId) {
        try {
          if (res.statusCode < 400) {
            await auditService.logAnalysisComplete(
              auditId,
              data?.data,
              Date.now() - (req.startTime || Date.now()),
              data?.data?.tokens_used,
              data?.data?.cost_estimate
            );
          } else {
            await auditService.logAnalysisError(
              auditId,
              data?.error || 'Analysis failed'
            );
          }
        } catch (error) {
          logger.error('Analysis audit completion error', { error });
        }
      }
    }, 100);
    
    return originalJson.call(this, data);
  };

  next();
};