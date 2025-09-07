import express from 'express';
import { knowledgeController } from '../controllers/knowledgeController';
import { authMiddleware } from '../middleware/auth';
import { setAuditContext, fileUploadAuditMiddleware } from '../middleware/auditMiddleware';

const router = express.Router();

router.use(authMiddleware);

router.post('/ingest', setAuditContext('knowledge_sources', 'INSERT'), knowledgeController.ingestData);
router.post('/direct', fileUploadAuditMiddleware, setAuditContext('knowledge_sources', 'INSERT'), knowledgeController.addDirectEntry);
router.get('/search', knowledgeController.searchKnowledge);
router.get('/sources', knowledgeController.getSources);
router.get('/categories', knowledgeController.getCategories);
router.get('/:id', knowledgeController.getSource);
router.delete('/sources/:id', setAuditContext('knowledge_sources', 'DELETE'), knowledgeController.deleteSource);

export default router;