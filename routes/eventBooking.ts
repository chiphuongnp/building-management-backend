import express from 'express';
import { requireRole } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { UserRole } from '../constants/enum';
import {
  validateCreateEventBooking,
  validateIdParamEventBooking,
} from '../validations/eventBooking';
import {
  createEventBooking,
  getAvailableEventBooking,
  getEventBookingById,
  getEventBookings,
} from '../services/eventBooing';

const eventBookingRouter = express.Router({ mergeParams: true });

eventBookingRouter.get('/', authenticate, requireRole(UserRole.MANAGER), getEventBookings);

eventBookingRouter.get(
  '/available',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getAvailableEventBooking,
);

eventBookingRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParamEventBooking,
  getEventBookingById,
);

eventBookingRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateCreateEventBooking,
  createEventBooking,
);

export default eventBookingRouter;
