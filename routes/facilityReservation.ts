import express from 'express';
import { requireRole } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { UserRole } from '../constants/enum';
import {
  createFacilityReservation,
  getFacilityReservationById,
  getFacilityReservations,
  getFacilityReservationsByUser,
} from '../services/facilityReservation';
import {
  validateCreateFacilityReservation,
  validateIdParamFacilityReservation,
} from '../validations/facilityReservation';

const facilityReservationRouter = express.Router({ mergeParams: true });

facilityReservationRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  getFacilityReservations,
);

facilityReservationRouter.get(
  '/user',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getFacilityReservationsByUser,
);

facilityReservationRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParamFacilityReservation,
  getFacilityReservationById,
);

facilityReservationRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateCreateFacilityReservation,
  createFacilityReservation,
);

export default facilityReservationRouter;
