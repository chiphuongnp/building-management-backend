import express from 'express';
import { login, logout, refreshToken } from '../controllers/auth';
import { validateLogin } from '../validations/login';
import { authenticate } from '../middlewares/auth';

const authRouter = express.Router();

authRouter.post('/login', validateLogin, login);

authRouter.post('/refresh-token', refreshToken);

authRouter.post('/logout', authenticate, logout);

export default authRouter;
