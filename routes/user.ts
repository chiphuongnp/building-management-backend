import express from 'express';
import { validateUpdateUser, validateUser } from '../validations/user';
import {
  createSuperManager,
  createUser,
  getAllUser,
  getProfile,
  getUserDetail,
  updateUser,
} from '../services/user';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
import { upload } from '../middlewares/multer';

const usersRouter = express.Router();

usersRouter.post('/init-manager', validateUser, createSuperManager);

usersRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.CREATE_USER),
  validateUser,
  createUser,
);

usersRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.GET_ALL_USERS),
  getAllUser,
);

usersRouter.get(
  '/:userId/detail',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.GET_USER_DETAIL),
  getUserDetail,
);

usersRouter.get('/profile', authenticate, requireRole(UserRole.MANAGER, UserRole.USER), getProfile);

usersRouter.patch(
  '/:userId',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_USER),
  upload.single('user-images'),
  validateUpdateUser,
  updateUser,
);

export default usersRouter;
