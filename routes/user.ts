import express from 'express';
import { validateUser } from '../validations/user';
import { register } from '../services/auth';
import { getAllUser, getProfile, getUserDetail } from '../services/user';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';

const usersRouter = express.Router();

usersRouter.post('/', validateUser, register);

usersRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('get_all_user'),
  getAllUser,
);

usersRouter.get(
  '/:userId/detail',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('get_user_detail'),
  getUserDetail,
);

usersRouter.get('/profile', authenticate, requireRole(UserRole.MANAGER, UserRole.USER), getProfile);

export default usersRouter;
