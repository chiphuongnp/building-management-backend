import express from 'express';
import { requirePermission, requireRole } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { Permission, UserRole } from '../constants/enum';
import {
  validateCreateEventBooking,
  validateIdParamEventBooking,
  validateUpdateEventBooking,
  validateUpdateStatusEventBooking,
} from '../validations/eventBooking';
import {
  createEventBooking,
  getEventBookingById,
  getEventBookings,
  updateEventBookingInfo,
  updateEventBookingStatus,
} from '../services/eventBooking';
import { upload } from '../middlewares/multer';

const eventBookingRouter = express.Router({ mergeParams: true });

eventBookingRouter.get('/', authenticate, getEventBookings);

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
  upload.single('event-images'),
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
  requirePermission(Permission.UPDATE_EVENT_BOOKING_STATUS),
  updateEventBookingStatus,
);

export default eventBookingRouter;
