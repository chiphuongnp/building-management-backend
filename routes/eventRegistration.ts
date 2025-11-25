import express from 'express';
import { requirePermission, requireRole } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { Permission, UserRole } from '../constants/enum';
import {
  cancelEventRegistration,
  createEventRegistration,
  getEventRegistrationsByEventBooking,
  getEventRegistrationsByUser,
  getEventRegistrationsHistory,
} from '../services/eventRegistration';
import {
  validateCreateEventRegistration,
  validateIdParamEventRegistration,
} from '../validations/eventRegistration';

const eventRegistrationRouter = express.Router({ mergeParams: true });

eventRegistrationRouter.get(
  '/user',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getEventRegistrationsByUser,
);

eventRegistrationRouter.get(
  '/user/history',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getEventRegistrationsHistory,
);

eventRegistrationRouter.get(
  '/event',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.GET_EVENT_PARTICIPANTS),
  getEventRegistrationsByEventBooking,
);

eventRegistrationRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateCreateEventRegistration,
  createEventRegistration,
);

eventRegistrationRouter.patch(
  '/:id/cancel',
  authenticate,
  validateIdParamEventRegistration,
  requireRole(UserRole.MANAGER, UserRole.USER),
  cancelEventRegistration,
);

export default eventRegistrationRouter;
