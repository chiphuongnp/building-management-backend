import express from 'express';
import { requirePermission, requireRole } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { UserRole } from '../constants/enum';
import {
  validateCreateEventBooking,
  validateIdParamEventBooking,
  validateUpdateEventBooking,
  validateUpdateStatusEventBooking,
} from '../validations/eventBooking';
import {
  createEventBooking,
  getAvailableEventBooking,
  getEventBookingById,
  getEventBookings,
  updateEventBookingInfo,
  updateEventBookingStatus,
} from '../services/eventBooking';

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

eventBookingRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateUpdateEventBooking,
  updateEventBookingInfo,
);

eventBookingRouter.patch(
  '/update-status/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  validateUpdateStatusEventBooking,
  requirePermission('update_event_booking_status'),
  updateEventBookingStatus,
);

export default eventBookingRouter;
