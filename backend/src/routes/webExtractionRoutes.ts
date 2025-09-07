import { Router } from 'express';
import { webExtractionController } from '../controllers/webExtractionController';
import { authMiddleware } from '../middleware/auth';
import { apiAuditMiddleware } from '../middleware/auditMiddleware';

const router = Router();

// Apply authentication and audit middleware to all web extraction routes
router.use(authMiddleware);
router.use(apiAuditMiddleware);

// Web content extraction routes
router.post('/extract', webExtractionController.extractFromUrl);
router.post('/validate', webExtractionController.validateUrl);
router.post('/batch', webExtractionController.batchExtract);

// Get supported methods and configuration
router.get('/methods', webExtractionController.getSupportedMethods);

export default router;