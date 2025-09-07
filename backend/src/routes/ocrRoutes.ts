import express from 'express';
import { ocrController, uploadMiddleware } from '../controllers/ocrController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All OCR routes require authentication
router.use(authMiddleware);

// Extract text from uploaded image file
router.post('/extract', uploadMiddleware, ocrController.extractText);

// Extract text from image URL
router.post('/extract-url', ocrController.extractFromUrl);

// Check if file is OCR capable
router.get('/capability/:filename', ocrController.checkCapability);

// Get supported file types and options
router.get('/supported', ocrController.getSupportedTypes);

export { router as ocrRoutes };