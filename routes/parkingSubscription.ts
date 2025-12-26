import express from 'express';
import { requireRole, requirePermission } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { UserRole } from '../constants/enum';
import {
  getSubscriptions,
  getSubscriptionById,
  createParkingSubscription,
  cancelParkingSubscription,
  updateParkingSubscriptionStatus,
  getCurrentSubscription,
} from '../services/parkingSubscription';
import {
  validateIdParamSubscription,
  validateCreateSubscription,
  validateStatusSubscription,
} from '../validations/parkingSubscription';

const parkingSubscriptionRouter = express.Router({ mergeParams: true });

parkingSubscriptionRouter.get('/', authenticate, getSubscriptions);

parkingSubscriptionRouter.get('/current', authenticate, getCurrentSubscription);

parkingSubscriptionRouter.get(
  '/:id',
  authenticate,
  validateIdParamSubscription,
  getSubscriptionById,
);

parkingSubscriptionRouter.post(
  '/create',
  authenticate,
  validateCreateSubscription,
  createParkingSubscription,
);

parkingSubscriptionRouter.patch(
  '/update-status/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  validateIdParamSubscription,
  validateStatusSubscription,
  updateParkingSubscriptionStatus,
);

parkingSubscriptionRouter.patch(
  '/cancel/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParamSubscription,
  cancelParkingSubscription,
);

export default parkingSubscriptionRouter;
