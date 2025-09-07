import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
// Using OCR.space API for lightweight OCR without account requirement
import pdf2pic from 'pdf2pic';

interface OCRResult {
  text: string;
  confidence: number;
  metadata: Record<string, any>;
}

interface OCROptions {
  language?: string;
  method?: 'ocrspace' | 'tesseract'; // OCR.space API or fallback to tesseract
  enhanceImage?: boolean;
  pdfPage?: number; // Specific page for PDF (default: all pages)
}

class OCRService {
  private defaultOptions: OCROptions = {
    language: 'eng+ind', // English + Indonesian
    method: 'ocrspace',
    enhanceImage: true
  };

  async extractTextFromFile(filePath: string, options: OCROptions = {}): Promise<OCRResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      logger.info('Starting OCR extraction', { filePath, options: opts });

      const fileExtension = path.extname(filePath).toLowerCase();
      
      // Check if file is supported (images or PDF)
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp'];
      const supportedExtensions = [...imageExtensions, '.pdf'];
      
      if (!supportedExtensions.includes(fileExtension)) {
        throw createError(`OCR not supported for file type: ${fileExtension}. Supported: ${supportedExtensions.join(', ')}`, 400);
      }

      // Check if file exists
      await fs.access(filePath);

      if (opts.method === 'ocrspace') {
        // Handle PDF files by converting to images first
        if (fileExtension === '.pdf') {
          return await this.extractFromPDF(filePath, opts);
        } else {
          return await this.extractWithOCRSpace(filePath, opts);
        }
      } else if (opts.method === 'tesseract') {
        // Fallback to tesseract if needed (requires tesseract.js installation)
        throw createError('Tesseract method not available - using OCR.space API', 400);
      } else {
        throw createError(`OCR method '${opts.method}' not implemented`, 400);
      }

    } catch (error: any) {
      logger.error('OCR extraction failed', { filePath, error: error.message });
      throw error;
    }
  }

  private async extractWithOCRSpace(filePath: string, options: OCROptions): Promise<OCRResult> {
    try {
      logger.info('Using OCR.space API for OCR', { filePath });
      
      // Read the image file as base64
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(path.extname(filePath));
      
      // Prepare form data for OCR.space API
      const formData = new FormData();
      formData.append('base64Image', `data:${mimeType};base64,${base64Image}`);
      formData.append('language', this.mapLanguageToOCRSpace(options.language || 'eng'));
      formData.append('isOverlayRequired', 'false');
      formData.append('iscreatesearchablepdf', 'false');
      formData.append('issearchablepdfhidetextlayer', 'false');
      
      // Use free OCR.space API (no API key needed for basic usage)
      const response = await axios.post('https://api.ocr.space/parse/image', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.data || response.data.IsErroredOnProcessing) {
        const errorMessage = response.data?.ErrorMessage?.[0] || 'OCR processing failed';
        throw new Error(errorMessage);
      }
      
      const parsedResults = response.data.ParsedResults;
      if (!parsedResults || parsedResults.length === 0) {
        return {
          text: '',
          confidence: 0,
          metadata: {
            method: 'ocrspace',
            language: options.language,
            processing_time: Date.now(),
            word_count: 0,
            pages_processed: 0
          }
        };
      }
      
      // Get text from first page (most common case)
      const firstResult = parsedResults[0];
      const extractedText = firstResult.ParsedText || '';
      
      // OCR.space doesn't provide confidence scores, so we estimate based on result quality
      let estimatedConfidence = 0;
      if (extractedText.length > 0) {
        // Simple heuristic: longer text with fewer special characters = higher confidence
        const alphanumericRatio = (extractedText.match(/[a-zA-Z0-9\s]/g) || []).length / extractedText.length;
        estimatedConfidence = Math.min(95, Math.max(60, alphanumericRatio * 100));
      }
      
      const ocrResult: OCRResult = {
        text: extractedText.trim(),
        confidence: Math.round(estimatedConfidence),
        metadata: {
          method: 'ocrspace',
          language: options.language,
          processing_time: Date.now(),
          word_count: extractedText.split(/\s+/).filter((word: string) => word.length > 0).length,
          pages_processed: parsedResults.length,
          file_parse_exit_code: firstResult.FileParseExitCode,
          text_overlay: firstResult.TextOverlay || null
        }
      };
      
      logger.info('OCR.space OCR completed', {
        confidence: ocrResult.confidence,
        textLength: ocrResult.text.length,
        pagesProcessed: ocrResult.metadata.pages_processed
      });
      
      return ocrResult;
    } catch (error: any) {
      logger.error('OCR.space OCR failed', { error: error.message });
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw createError('OCR.space API is currently unavailable. Please try again later.', 503);
      } else if (error.response?.status === 429) {
        throw createError('OCR.space API rate limit exceeded. Please try again later.', 429);
      } else {
        throw createError(`OCR.space API failed: ${error.message}`, 500);
      }
    }
  }
  
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      '.webp': 'image/webp'
    };
    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
  }
  
  private mapLanguageToOCRSpace(language: string): string {
    // OCR.space language codes
    const languageMap: Record<string, string> = {
      'eng': 'eng',
      'ind': 'eng', // OCR.space doesn't have Indonesian, use English
      'eng+ind': 'eng'
    };
    return languageMap[language] || 'eng';
  }

  private async extractFromPDF(filePath: string, options: OCROptions): Promise<OCRResult> {
    const tempDir = process.env.TEMP_DIR || './temp';
    const tempPdfDir = path.join(tempDir, `pdf_${Date.now()}`);
    
    try {
      logger.info('Converting PDF to images for OCR', { filePath });
      
      // Ensure temp directory exists
      await fs.mkdir(tempPdfDir, { recursive: true });
      
      // Configure pdf2pic
      const convert = pdf2pic.fromPath(filePath, {
        density: 200, // DPI - higher = better quality but larger files
        saveFilename: 'page',
        savePath: tempPdfDir,
        format: 'png',
        width: 2048, // Max width for good OCR results
        height: 2048 // Max height for good OCR results
      });
      
      // Convert PDF to images
      const results = await convert.bulk(-1); // -1 = all pages
      
      if (!results || results.length === 0) {
        throw new Error('Failed to convert PDF pages to images');
      }
      
      // Process each page and combine results
      const allPageResults: OCRResult[] = [];
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.path) {
          try {
            const pageResult = await this.extractWithOCRSpace(result.path, options);
            pageResult.metadata.pdf_page = i + 1;
            allPageResults.push(pageResult);
          } catch (pageError: any) {
            logger.warn(`Failed to OCR PDF page ${i + 1}`, { error: pageError.message });
            // Continue with other pages even if one fails
          }
        }
      }
      
      if (allPageResults.length === 0) {
        return {
          text: '',
          confidence: 0,
          metadata: {
            method: 'ocrspace',
            source: 'pdf',
            language: options.language,
            processing_time: Date.now(),
            word_count: 0,
            pages_processed: 0,
            pages_total: results.length,
            error: 'No pages could be processed'
          }
        };
      }
      
      // Combine all page results
      const combinedText = allPageResults.map((result, index) => {
        return `--- Page ${index + 1} ---\n${result.text}`;
      }).join('\n\n');
      
      // Calculate average confidence
      const avgConfidence = allPageResults.reduce((sum, result) => sum + result.confidence, 0) / allPageResults.length;
      
      // Calculate total word count
      const totalWords = allPageResults.reduce((sum, result) => sum + (result.metadata.word_count || 0), 0);
      
      const combinedResult: OCRResult = {
        text: combinedText.trim(),
        confidence: Math.round(avgConfidence),
        metadata: {
          method: 'ocrspace',
          source: 'pdf',
          language: options.language,
          processing_time: Date.now(),
          word_count: totalWords,
          pages_processed: allPageResults.length,
          pages_total: results.length,
          page_results: allPageResults.map((result, index) => ({
            page: index + 1,
            confidence: result.confidence,
            word_count: result.metadata.word_count,
            text_length: result.text.length
          }))
        }
      };
      
      logger.info('PDF OCR completed', {
        totalPages: results.length,
        processedPages: allPageResults.length,
        avgConfidence: combinedResult.confidence,
        totalTextLength: combinedResult.text.length
      });
      
      return combinedResult;
      
    } catch (error: any) {
      logger.error('PDF OCR failed', { error: error.message, filePath });
      
      if (error.message.includes('pdf2pic')) {
        throw createError('PDF conversion failed. Please ensure the PDF is not corrupted and contains scannable content.', 500);
      } else {
        throw createError(`PDF OCR failed: ${error.message}`, 500);
      }
    } finally {
      // Clean up temporary PDF images
      try {
        await fs.rm(tempPdfDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp PDF directory', { tempPdfDir, error: cleanupError });
      }
    }
  }

  async extractTextFromBuffer(buffer: Buffer, filename: string, options: OCROptions = {}): Promise<OCRResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Create a temporary file
      const tempDir = process.env.TEMP_DIR || './temp';
      await fs.mkdir(tempDir, { recursive: true });
      
      const tempPath = path.join(tempDir, `ocr_${Date.now()}_${filename}`);
      await fs.writeFile(tempPath, buffer);

      try {
        const result = await this.extractTextFromFile(tempPath, opts);
        return result;
      } finally {
        // Clean up temporary file
        try {
          await fs.unlink(tempPath);
        } catch (cleanupError) {
          logger.warn('Failed to cleanup temp OCR file', { tempPath, error: cleanupError });
        }
      }
    } catch (error: any) {
      logger.error('OCR from buffer failed', { filename, error: error.message });
      throw error;
    }
  }

  // Future: Implement cloud OCR providers
  private async extractWithCloudProvider(filePath: string, provider: string): Promise<OCRResult> {
    // TODO: Implement cloud OCR providers like:
    // - Google Cloud Vision API
    // - Azure Computer Vision
    // - AWS Textract
    // - OpenAI Vision API
    
    throw createError(`Cloud OCR provider '${provider}' not implemented yet`, 501);
  }

  async isOCRCapable(filePath: string): Promise<boolean> {
    const fileExtension = path.extname(filePath).toLowerCase();
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp', '.pdf'];
    return supportedExtensions.includes(fileExtension);
  }

  async preprocessImage(filePath: string): Promise<string> {
    // TODO: Implement image preprocessing for better OCR results
    // - Noise reduction
    // - Contrast enhancement
    // - Deskewing
    // - Binarization
    
    logger.info('Image preprocessing not implemented yet', { filePath });
    return filePath; // Return original path for now
  }

  // Validate OCR result quality
  validateOCRResult(result: OCRResult): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (result.confidence < 30) {
      issues.push('Very low OCR confidence (< 30%)');
    }
    
    if (result.text.length < 10) {
      issues.push('Extracted text too short (< 10 characters)');
    }
    
    if (result.text.trim() === '') {
      issues.push('No text extracted');
    }
    
    // Check for garbled text patterns
    const garbageRatio = (result.text.match(/[^\w\s.,!?;:()-]/g) || []).length / result.text.length;
    if (garbageRatio > 0.3) {
      issues.push('High ratio of unrecognizable characters');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

export const ocrService = new OCRService();