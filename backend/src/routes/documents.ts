import express from 'express';
import { documentController } from '../controllers/documentController';
import { authMiddleware } from '../middleware/auth';
import { documentGenerationAuditMiddleware, setAuditContext } from '../middleware/auditMiddleware';

const router = express.Router();

router.use(authMiddleware);

// Document generation
router.post('/generate/docx', documentGenerationAuditMiddleware('docx'), documentController.generateDocx);
router.post('/generate/xlsx', documentGenerationAuditMiddleware('xlsx'), documentController.generateXlsx);
router.post('/generate/pptx', documentGenerationAuditMiddleware('pptx'), documentController.generatePptx);

// Document management
router.get('/', documentController.getUserDocuments);
router.get('/stats', documentController.getDocumentStats);
router.get('/download/:filename', setAuditContext('generated_documents', 'DOWNLOAD'), documentController.downloadDocument);

export default router;