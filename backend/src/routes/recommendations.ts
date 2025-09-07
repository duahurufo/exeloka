import express from 'express';
import { recommendationController } from '../controllers/recommendationController';
import { authMiddleware } from '../middleware/auth';
import { analysisAuditMiddleware, setAuditContext } from '../middleware/auditMiddleware';

const router = express.Router();

router.use(authMiddleware);

// Project management
router.post('/projects', setAuditContext('projects', 'INSERT'), recommendationController.createProject);
router.get('/projects', recommendationController.getUserProjects);
router.get('/projects/:id', recommendationController.getProject);
router.put('/projects/:id', setAuditContext('projects', 'UPDATE'), recommendationController.updateProject);
router.delete('/projects/:id', setAuditContext('projects', 'DELETE'), recommendationController.deleteProject);
router.get('/analytics', recommendationController.getProjectAnalytics);
router.get('/analytics/dashboard', recommendationController.getAnalyticsDashboard);

// Recommendation generation and management
router.get('/prompt-templates', recommendationController.getPromptTemplates);
router.post('/generate', analysisAuditMiddleware, recommendationController.generateRecommendation);
router.get('/:id', recommendationController.getRecommendation);
router.get('/', recommendationController.getUserRecommendations);

// Feedback system
router.post('/:id/feedback', setAuditContext('feedback', 'INSERT'), recommendationController.submitFeedback);

// Document generation
router.post('/:id/generate-document', setAuditContext('generated_documents', 'INSERT'), recommendationController.generateDocument);

// Learning and insights
router.get('/learning/insights', async (req, res, next) => {
  try {
    const { feedbackService } = await import('../services/feedbackService');
    const { insight_type, limit = 20, min_confidence = 0.5 } = req.query;
    
    const insights = await feedbackService.getLearningInsights({
      insight_type: insight_type as string,
      limit: Number(limit),
      min_confidence: Number(min_confidence)
    });

    res.json({
      success: true,
      message: 'Learning insights retrieved',
      data: insights
    });
  } catch (error) {
    next(error);
  }
});

router.get('/learning/stats', async (req, res, next) => {
  try {
    const { feedbackService } = await import('../services/feedbackService');
    const stats = await feedbackService.getSystemLearningStats();

    res.json({
      success: true,
      message: 'Learning statistics retrieved',
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/feedback-summary', async (req, res, next) => {
  try {
    const recommendationId = Number(req.params.id);
    const { feedbackService } = await import('../services/feedbackService');
    
    const summary = await feedbackService.getRecommendationFeedbackSummary(recommendationId);

    res.json({
      success: true,
      message: 'Feedback summary retrieved',
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

export default router;