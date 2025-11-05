import express from 'express';
import {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
} from '../controllers/building';
import {
  validateCreateBuilding,
  validateUpdateBuilding,
  validateIdParam,
} from '../validations/building';
import { requireRole, requirePermission } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { UserRole } from '../constants/enum';

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
  requirePermission('create_building'),
  validateCreateBuilding,
  createBuilding,
);

buildingRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_building'),
  validateIdParam,
  validateUpdateBuilding,
  updateBuilding,
);

export default buildingRouter;
