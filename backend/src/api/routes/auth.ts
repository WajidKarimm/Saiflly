import express from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { RegisterSchema, LoginSchema } from '../validators/auth.validator';

const router = express.Router();

router.post('/register', validateBody(RegisterSchema), authController.register);
router.post('/login', validateBody(LoginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
