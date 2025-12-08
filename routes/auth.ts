import express from 'express';
import { activateAccount, login, logout, refreshToken, register } from '../services/auth';
import { authenticate } from '../middlewares/auth';
import { validateRegister } from '../validations/user';

const authRouter = express.Router();

authRouter.post('/register', validateRegister, register);

authRouter.post('/login', login);

authRouter.post('/refresh-token', refreshToken);

authRouter.post('/logout', authenticate, logout);

authRouter.get('/activate', activateAccount);

export default authRouter;
