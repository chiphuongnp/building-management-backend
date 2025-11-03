import express from 'express';
import { validateUser } from '../validations/user';
import { register } from '../controllers/auth';

const usersRouter = express.Router();

usersRouter.post('/', validateUser, register);

export default usersRouter;
