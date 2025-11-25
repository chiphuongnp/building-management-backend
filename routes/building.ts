import express from 'express';
import {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
} from '../services/building';
import {
  validateCreateBuilding,
  validateUpdateBuilding,
  validateIdParam,
} from '../validations/building';
import { requireRole, requirePermission } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { Permission, UserRole } from '../constants/enum';

const buildingRouter = express.Router({ mergeParams: true });

buildingRouter.get('/', authenticate, requireRole(UserRole.MANAGER, UserRole.USER), getBuildings);

buildingRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParam,
  getBuildingById,
);

buildingRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.CREATE_BUILDING),
  validateCreateBuilding,
  createBuilding,
);

buildingRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_BUILDING),
  validateIdParam,
  validateUpdateBuilding,
  updateBuilding,
);

export default buildingRouter;
