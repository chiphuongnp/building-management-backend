import express from 'express';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
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
  requirePermission(Permission.GET_ALL_PERMISSIONS),
  getPermissions,
);

permissionRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.GET_PERMISSION),
  getPermissionById,
);

permissionRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.CREATE_PERMISSION),
  validatePermission,
  createPermission,
);

permissionRouter.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_PERMISSION),
  validatePermission,
  updatePermission,
);

export default permissionRouter;
