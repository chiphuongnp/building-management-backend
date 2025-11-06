import express from 'express';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';
import { validateCreateMenuSchedule } from '../validations/menu';
import { createMenuSchedule } from '../services/menu';

const menuRouter = express.Router({ mergeParams: true });

menuRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('create_menu'),
  validateCreateMenuSchedule,
  createMenuSchedule,
);

export default menuRouter;
