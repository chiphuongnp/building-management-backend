import express from 'express';
import { validateUpdateUser, validateUser } from '../validations/user';
import { register } from '../services/auth';
import { getAllUser, getProfile, getUserDetail, updateUser } from '../services/user';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';
import { upload } from '../middlewares/multer';
import { MAX_IMAGE_COUNT } from '../constants/constant';

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

usersRouter.patch(
  '/:userId',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_user'),
  upload.array('user-images', MAX_IMAGE_COUNT),
  validateUpdateUser,
  updateUser,
);

export default usersRouter;
