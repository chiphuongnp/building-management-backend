import express from 'express';
import { requireRole, requirePermission } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import {
  getParkingSpaces,
  getParkingSpaceAvailable,
  getBuildingById,
  createParkingSpace,
  updateParkingSpace,
} from '../controllers/parkingSpace';
import {
  validateCreateParkingSpace,
  validateUpdateParkingSpace,
  validateIdParam,
} from '../validations/parkingSpace';
import { UserRole } from '../constants/enum';

const parkingSpaceRouter = express.Router({ mergeParams: true });

parkingSpaceRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getParkingSpaces,
);

parkingSpaceRouter.get(
  '/available',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getParkingSpaceAvailable,
);

parkingSpaceRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParam,
  getBuildingById,
);

parkingSpaceRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('create_parking_space'),
  validateCreateParkingSpace,
  createParkingSpace,
);

parkingSpaceRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_parking_space'),
  validateIdParam,
  validateUpdateParkingSpace,
  updateParkingSpace,
);

export default parkingSpaceRouter;
