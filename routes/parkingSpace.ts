import express from 'express';
import { requireRole, requirePermission } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import {
  getParkingSpaces,
  getParkingSpaceAvailable,
  getParkingSpaceById,
  createParkingSpace,
  updateParkingSpace,
  getParkingSpaceStats,
} from '../services/parkingSpace';
import {
  validateCreateParkingSpace,
  validateUpdateParkingSpace,
  validateIdParam,
  validateStatusParkingSpace,
} from '../validations/parkingSpace';
import { Permission, UserRole } from '../constants/enum';

const parkingSpaceRouter = express.Router({ mergeParams: true });

parkingSpaceRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getParkingSpaces,
);

parkingSpaceRouter.get('/stats', authenticate, requireRole(UserRole.MANAGER), getParkingSpaceStats);

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
  getParkingSpaceById,
);

parkingSpaceRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.CREATE_PARKING_SPACE),
  validateCreateParkingSpace,
  createParkingSpace,
);

parkingSpaceRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_PARKING_SPACE),
  validateIdParam,
  validateUpdateParkingSpace,
  updateParkingSpace,
);

parkingSpaceRouter.patch(
  '/update-status/:id',
  authenticate,
  requireRole(UserRole.USER, UserRole.MANAGER),
  validateIdParam,
  validateStatusParkingSpace,
  updateParkingSpace,
);

export default parkingSpaceRouter;
