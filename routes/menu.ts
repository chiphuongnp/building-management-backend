import express from 'express';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
import {
  validateAddMenuItem,
  validateCreateMenuSchedule,
  validateMenuIdParams,
  validateUpdateMenuItem,
} from '../validations/menu';
import {
  addMenuItem,
  createMenuSchedule,
  getMenuScheduleById,
  getMenuSchedules,
  updateMenuItem,
} from '../services/menu';
import { upload, uploadHandler } from '../middlewares/multer';
import { MAX_IMAGE_COUNT, MAX_MENU_IMAGE_COUNT } from '../constants/constant';

const menuRouter = express.Router({ mergeParams: true });

menuRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.VIEW_MENU),
  validateMenuIdParams,
  getMenuSchedules,
);

menuRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.VIEW_MENU),
  validateMenuIdParams,
  getMenuScheduleById,
);

menuRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.CREATE_MENU),
  uploadHandler('menu-images', MAX_MENU_IMAGE_COUNT, 'schedules'),
  validateMenuIdParams,
  validateCreateMenuSchedule,
  createMenuSchedule,
);

menuRouter.post(
  '/:id/items',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_MENU),
  upload.array('menu-images', MAX_IMAGE_COUNT),
  validateMenuIdParams,
  validateAddMenuItem,
  addMenuItem,
);

menuRouter.patch(
  '/:id/items/:itemId',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_MENU),
  upload.array('menu-images', MAX_IMAGE_COUNT),
  validateMenuIdParams,
  validateUpdateMenuItem,
  updateMenuItem,
);

export default menuRouter;
