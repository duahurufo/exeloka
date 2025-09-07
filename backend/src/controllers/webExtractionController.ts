import { Request, Response } from 'express';
import { webExtractionService, WebExtractionOptions } from '../services/webExtractionService';
import { logger } from '../utils/logger';

export class WebExtractionController {

  // Extract content from a URL
  extractFromUrl = async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL is required'
        });
      }

      // Parse options from request body
      const options: WebExtractionOptions = {
        method: req.body.method || 'auto',
        includeImages: req.body.includeImages === true,
        includeLinks: req.body.includeLinks === true,
        includeHeadings: req.body.includeHeadings !== false, // Default true
        maxContentLength: req.body.maxContentLength ? 
          Math.min(parseInt(req.body.maxContentLength), 100000) : // Max 100KB
          undefined,
        timeout: req.body.timeout ? 
          Math.min(parseInt(req.body.timeout), 60000) : // Max 60 seconds
          30000 // Default 30 seconds
      };

      logger.info('Web extraction requested', { 
        url,
        options,
        userId: (req as any).user?.id
      });

      const result = await webExtractionService.extractFromUrl(url, options);

      res.json({
        success: true,
        data: {
          url: result.url,
          title: result.title,
          content: result.content,
          metadata: result.metadata
        }
      });

    } catch (error: any) {
      logger.error('Web extraction failed', { 
        url: req.body.url, 
        error: error.message,
        userId: (req as any).user?.id
      });

      // Handle specific error types
      let statusCode = 500;
      let message = error.message || 'Web extraction failed';

      if (error.message.includes('Invalid URL')) {
        statusCode = 400;
      } else if (error.message.includes('not allowed') || error.message.includes('forbidden')) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('timeout') || error.message.includes('too long')) {
        statusCode = 408;
      } else if (error.message.includes('unavailable')) {
        statusCode = 503;
      }

      res.status(statusCode).json({
        success: false,
        message
      });
    }
  };

  // Validate a URL without extracting content
  validateUrl = async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL is required'
        });
      }

      const isValid = await webExtractionService.validateUrl(url);

      res.json({
        success: true,
        data: {
          url,
          isValid,
          message: isValid ? 'URL is valid and accessible' : 'URL is invalid or not accessible'
        }
      });

    } catch (error: any) {
      logger.error('URL validation failed', { 
        url: req.body.url, 
        error: error.message 
      });

      res.status(400).json({
        success: false,
        message: error.message || 'URL validation failed'
      });
    }
  };

  // Get supported extraction methods and options
  getSupportedMethods = async (req: Request, res: Response) => {
    try {
      const supportedMethods = webExtractionService.getSupportedMethods();
      
      res.json({
        success: true,
        data: {
          methods: supportedMethods,
          methodDescriptions: {
            'auto': 'Automatically selects the best extraction method based on URL',
            'jina': 'Fast AI-powered extraction using Jina AI Reader (recommended for articles)',
            'cheerio': 'Server-side HTML parsing (good for static content)',
            // 'puppeteer': 'Browser-based extraction (best for dynamic/JavaScript content)' // Disabled for lighter build
          },
          options: {
            includeImages: {
              type: 'boolean',
              default: false,
              description: 'Include image URLs in metadata'
            },
            includeLinks: {
              type: 'boolean', 
              default: false,
              description: 'Include link URLs in metadata'
            },
            includeHeadings: {
              type: 'boolean',
              default: true,
              description: 'Include page headings in metadata'
            },
            maxContentLength: {
              type: 'number',
              default: 50000,
              max: 100000,
              description: 'Maximum content length in characters'
            },
            timeout: {
              type: 'number',
              default: 30000,
              max: 60000,
              description: 'Timeout in milliseconds'
            }
          },
          limits: {
            maxContentLength: 100000,
            maxTimeout: 60000,
            supportedProtocols: ['http', 'https'],
            blockedHosts: ['localhost', '127.0.0.1', '192.168.*', '10.*', '172.*']
          }
        }
      });

    } catch (error: any) {
      logger.error('Get supported methods failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get supported methods'
      });
    }
  };

  // Batch extract from multiple URLs
  batchExtract = async (req: Request, res: Response) => {
    try {
      const { urls, options: globalOptions } = req.body;

      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'URLs array is required and must not be empty'
        });
      }

      // Limit batch size to prevent abuse
      if (urls.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 URLs allowed per batch request'
        });
      }

      logger.info('Batch web extraction requested', { 
        urlCount: urls.length,
        userId: (req as any).user?.id
      });

      const results = [];
      const errors = [];

      // Process URLs sequentially to avoid overwhelming target servers
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          const result = await webExtractionService.extractFromUrl(url, globalOptions);
          results.push({
            index: i,
            success: true,
            data: result
          });
        } catch (error: any) {
          errors.push({
            index: i,
            url,
            success: false,
            error: error.message
          });
        }

        // Add delay between requests to be respectful
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      }

      res.json({
        success: true,
        data: {
          total: urls.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors: errors.length > 0 ? errors : undefined
        }
      });

    } catch (error: any) {
      logger.error('Batch web extraction failed', { 
        error: error.message,
        userId: (req as any).user?.id
      });

      res.status(500).json({
        success: false,
        message: error.message || 'Batch extraction failed'
      });
    }
  };
}

export const webExtractionController = new WebExtractionController();