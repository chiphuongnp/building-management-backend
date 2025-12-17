import express from 'express';
import { requireRole } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { UserRole } from '../constants/enum';
import {
  cancelFacilityReservation,
  createFacilityReservation,
  getFacilityReservationById,
  getFacilityReservations,
  getFacilityReservationsByUser,
} from '../services/facilityReservation';
import {
  validateCreateFacilityReservation,
  validateIdParamFacilityReservation,
} from '../validations/facilityReservation';
import { parsePagination } from '../middlewares/pagination';

const facilityReservationRouter = express.Router({ mergeParams: true });

facilityReservationRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  parsePagination,
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

facilityReservationRouter.patch(
  '/:id/cancel',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  cancelFacilityReservation,
);

export default facilityReservationRouter;
