import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { ocrService } from '../services/ocrService';
import { logger } from '../utils/logger';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `ocr-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp', '.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${fileExtension}. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

export class OCRController {
  
  // Extract text from uploaded file
  extractText = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const filePath = req.file.path;
      const options = {
        language: req.body.language || 'eng+ind',
        method: req.body.method || 'ocrspace',
        pdfPage: req.body.pdfPage ? parseInt(req.body.pdfPage) : undefined
      };

      logger.info('OCR extraction requested', { 
        filename: req.file.originalname,
        size: req.file.size,
        options 
      });

      const result = await ocrService.extractTextFromFile(filePath, options);
      const validation = ocrService.validateOCRResult(result);

      res.json({
        success: true,
        data: {
          text: result.text,
          confidence: result.confidence,
          metadata: result.metadata,
          validation: validation,
          filename: req.file.originalname
        }
      });

    } catch (error: any) {
      logger.error('OCR extraction failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'OCR extraction failed'
      });
    }
  };

  // Extract text from URL image
  extractFromUrl = async (req: Request, res: Response) => {
    try {
      const { url, language = 'eng+ind' } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL is required'
        });
      }

      // TODO: Implement URL image downloading and OCR
      // This would involve:
      // 1. Download image from URL
      // 2. Validate it's an image
      // 3. Process with OCR
      // 4. Cleanup downloaded file

      res.status(501).json({
        success: false,
        message: 'URL OCR extraction not implemented yet'
      });

    } catch (error: any) {
      logger.error('URL OCR extraction failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'URL OCR extraction failed'
      });
    }
  };

  // Check if file is OCR capable
  checkCapability = async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const isCapable = await ocrService.isOCRCapable(filename);

      res.json({
        success: true,
        data: {
          filename,
          ocrCapable: isCapable
        }
      });

    } catch (error: any) {
      logger.error('OCR capability check failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Capability check failed'
      });
    }
  };

  // Get supported file types
  getSupportedTypes = async (req: Request, res: Response) => {
    try {
      const supportedTypes = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp', '.pdf'];
      
      res.json({
        success: true,
        data: {
          supportedTypes,
          maxFileSize: '10MB',
          languages: ['eng', 'ind', 'eng+ind'],
          methods: ['ocrspace', 'tesseract'],
          pdfSupport: {
            enabled: true,
            description: 'PDF files are converted to images before OCR processing',
            maxPages: 'Unlimited (all pages processed)'
          }
        }
      });

    } catch (error: any) {
      logger.error('Get supported types failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get supported types'
      });
    }
  };
}

// Create multer middleware for single file upload
export const uploadMiddleware = upload.single('file');

export const ocrController = new OCRController();