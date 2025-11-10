import express from 'express';
import { requireRole, requirePermission } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { UserRole } from '../constants/enum';
import {
  getSubscriptions,
  getSubscriptionById,
  createParkingSubscription,
  updateParkingSubscription,
  updateParkingSubscriptionStatus,
} from '../services/parkingSubscription';
import {
  validateIdParamSubscription,
  validateCreateSubscription,
  validateUpdateSubscription,
  validateStatusSubscription,
} from '../validations/parkingSubscription';

const parkingSubscriptionRouter = express.Router({ mergeParams: true });

parkingSubscriptionRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getSubscriptions,
);

parkingSubscriptionRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParamSubscription,
  getSubscriptionById,
);

parkingSubscriptionRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateCreateSubscription,
  createParkingSubscription,
);

parkingSubscriptionRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParamSubscription,
  validateUpdateSubscription,
  updateParkingSubscription,
);

parkingSubscriptionRouter.patch(
  '/update-status/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParamSubscription,
  validateStatusSubscription,
  updateParkingSubscriptionStatus,
);

export default parkingSubscriptionRouter;
