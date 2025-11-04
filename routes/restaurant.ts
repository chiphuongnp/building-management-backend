import express from 'express';
import {
  validateCreateRestaurant,
  validateIdParam,
  validateUpdateRestaurant,
} from '../validations/restaurant';
import {
  createRestaurant,
  getRestaurant,
  getRestaurants,
  updateRestaurant,
} from '../controllers/restaurant';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';

const restaurantRouter = express.Router();

restaurantRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('create_restaurant'),
  validateCreateRestaurant,
  createRestaurant,
);

restaurantRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  getRestaurants,
);

restaurantRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParam,
  getRestaurant,
);

restaurantRouter.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_restaurant'),
  validateIdParam,
  validateUpdateRestaurant,
  updateRestaurant,
);

export default restaurantRouter;
