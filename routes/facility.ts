import express from 'express';
import {
  getFacilities,
  getFacilityById,
  getAvailableFacility,
  createFacility,
  updateFacility,
  updateFacilityStatus,
} from '../services/facility';
import {
  validateCreateFacility,
  validateFacilityStatus,
  validateIdParamFacility,
  validateUpdateFacility,
} from '../validations/facility';
import { requireRole, requirePermission } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { Permission, UserRole } from '../constants/enum';

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
  requirePermission(Permission.CREATE_FACILITY),
  validateCreateFacility,
  createFacility,
);

facilityRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_FACILITY),
  validateIdParamFacility,
  validateUpdateFacility,
  updateFacility,
);

facilityRouter.patch(
  '/update-status/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_FACILITY),
  validateIdParamFacility,
  validateFacilityStatus,
  updateFacilityStatus,
);

export default facilityRouter;
