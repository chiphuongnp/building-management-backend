import express from 'express';
import { validateUser } from '../middlewares/userValidation';
import { register } from '../controllers/auth';

const usersRouter = express.Router();

usersRouter.post('/', validateUser, register);

export default usersRouter;
