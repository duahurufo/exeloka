import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { authMiddleware } from '../middleware/auth';
import { setAuditContext } from '../middleware/auditMiddleware';

const router = Router();

// Create new project
router.post('/', 
  authMiddleware,
  setAuditContext('projects', 'INSERT'),
  projectController.createProject
);

// Get all user projects
router.get('/',
  authMiddleware,
  projectController.getUserProjects
);

// Get project statistics
router.get('/stats',
  authMiddleware,
  projectController.getProjectStats
);

// Get specific project
router.get('/:id',
  authMiddleware,
  projectController.getProject
);

// Update project
router.put('/:id',
  authMiddleware,
  setAuditContext('projects', 'UPDATE'),
  projectController.updateProject
);

// Delete project
router.delete('/:id',
  authMiddleware,
  setAuditContext('projects', 'DELETE'),
  projectController.deleteProject
);

export default router;