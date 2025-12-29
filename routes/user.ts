import express from 'express';
import {
  validateUpdatePassword,
  validateUpdateUser,
  validateUpdateUserPermissions,
  validateUser,
} from '../validations/user';
import {
  createSuperManager,
  createUser,
  getAllUser,
  getProfile,
  getUserDetail,
  getUsersStats,
  updatePassword,
  updateUser,
  updateUserPermissions,
} from '../services/user';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
import { upload } from '../middlewares/multer';
import { parsePagination } from '../middlewares/pagination';

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
  parsePagination,
  getAllUser,
);

usersRouter.get(
  '/stats',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.GET_USER_STATS),
  getUsersStats,
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
  '/profile',
  authenticate,
  upload.single('user-images'),
  validateUpdateUser,
  updateUser,
);

usersRouter.patch('/update-password', authenticate, validateUpdatePassword, updatePassword);

usersRouter.patch(
  '/:userId/permissions',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_PERMISSION),
  validateUpdateUserPermissions,
  updateUserPermissions,
);

export default usersRouter;
