import express from 'express';
import { requirePermission, requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';
import {
  createPermission,
  getPermissionById,
  getPermissions,
  updatePermission,
} from '../services/permission';
import { authenticate } from '../middlewares/auth';
import { validatePermission } from '../validations/permission';

const permissionRouter = express.Router();

permissionRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('get_all_permission'),
  getPermissions,
);

permissionRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('get_permission'),
  getPermissionById,
);

permissionRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('create_permission'),
  validatePermission,
  createPermission,
);

permissionRouter.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_permission'),
  validatePermission,
  updatePermission,
);

export default permissionRouter;
