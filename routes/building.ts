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

const buildingRouter = express.Router({ mergeParams: true });

buildingRouter.get('/', authenticate, requireRole('user', 'manager'), getBuildings);

buildingRouter.get(
  '/:id',
  authenticate,
  requireRole('user', 'manager'),
  validateIdParam,
  getBuildingById,
);

buildingRouter.post(
  '/create',
  authenticate,
  requireRole('manager'),
  requirePermission('create_building'),
  validateCreateBuilding,
  createBuilding,
);

buildingRouter.patch(
  '/update/:id',
  authenticate,
  requireRole('manager'),
  requirePermission('update_building'),
  validateIdParam,
  validateUpdateBuilding,
  updateBuilding,
);

export default buildingRouter;
