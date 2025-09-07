import express from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { setAuditContext } from '../middleware/auditMiddleware';

const router = express.Router();

router.post('/register', setAuditContext('users', 'INSERT'), authController.register);
router.post('/login', authController.login); // LOGIN audit is handled by middleware
router.post('/refresh', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout); // LOGOUT audit is handled by middleware
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;