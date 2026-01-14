import express from 'express';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
import { validateBookingBus } from '../validations/busSubscription';
import {
  createBusSubscription,
  getAllBusSubscriptions,
  getBusSubscriptionDetail,
} from '../services/busSubscription';

const busSubscriptionRouter = express.Router();

busSubscriptionRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateBookingBus,
  createBusSubscription,
);

busSubscriptionRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.GET_ALL_BOOKING_BUS),
  getAllBusSubscriptions,
);

busSubscriptionRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  requirePermission(Permission.GET_BOOKING_BUS_DETAIL),
  getBusSubscriptionDetail,
);

export default busSubscriptionRouter;
