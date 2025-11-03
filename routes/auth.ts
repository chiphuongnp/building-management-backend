import express from 'express';
import { login, refreshToken } from '../controllers/auth';
import { validateLogin } from '../validations/login';

const authRouter = express.Router();

authRouter.post('/login', validateLogin, login);

authRouter.post('/refresh-token', refreshToken);

export default authRouter;
