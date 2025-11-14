import express from 'express';
import {
  getFacilities,
  getFacilityById,
  getAvailableFacility,
  createFacility,
} from '../services/facility';
import { validateCreateFacility, validateIdParamFacility } from '../validations/facility';
import { requireRole, requirePermission } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { UserRole } from '../constants/enum';

const facilityRouter = express.Router({ mergeParams: true });

facilityRouter.get('/', authenticate, requireRole(UserRole.MANAGER, UserRole.USER), getFacilities);

facilityRouter.get(
  '/available',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getAvailableFacility,
);

facilityRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParamFacility,
  getFacilityById,
);

facilityRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('create_building'),
  validateCreateFacility,
  createFacility,
);

export default facilityRouter;
