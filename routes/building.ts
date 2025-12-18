import express from 'express';
import {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  updateBuildingStatus,
  getBuildingsStats,
} from '../services/building';
import {
  validateCreateBuilding,
  validateUpdateBuilding,
  validateIdParam,
  validateUpdateBuildingStatus,
} from '../validations/building';
import { requireRole, requirePermission } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { Permission, UserRole } from '../constants/enum';
import { parsePagination } from '../middlewares/pagination';

const buildingRouter = express.Router({ mergeParams: true });

buildingRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  parsePagination,
  getBuildings,
);

buildingRouter.get(
  '/stats',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.VIEW_BUILDING_STATS),
  getBuildingsStats,
);

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

buildingRouter.patch(
  '/update-status/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_BUILDING),
  validateIdParam,
  validateUpdateBuildingStatus,
  updateBuildingStatus,
);

export default buildingRouter;
