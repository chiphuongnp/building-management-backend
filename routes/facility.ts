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
  requirePermission('create_facility'),
  validateCreateFacility,
  createFacility,
);

facilityRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_facility'),
  validateIdParamFacility,
  validateUpdateFacility,
  updateFacility,
);

facilityRouter.patch(
  '/update-status/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_facility'),
  validateIdParamFacility,
  validateFacilityStatus,
  updateFacilityStatus,
);

export default facilityRouter;
