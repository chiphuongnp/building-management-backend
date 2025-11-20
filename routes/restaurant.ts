import express from 'express';
import {
  validateCreateRestaurant,
  validateIdParam,
  validateUpdateRestaurant,
} from '../validations/restaurant';
import {
  createRestaurant,
  getRestaurant,
  getRestaurantDailySale,
  getRestaurantMenu,
  getRestaurants,
  updateRestaurant,
} from '../services/restaurant';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';

const restaurantRouter = express.Router();

restaurantRouter.post(
  '/create',
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

restaurantRouter.get(
  '/:id/menu',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParam,
  getRestaurantMenu,
);

restaurantRouter.get(
  '/:id/daily-sale',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('view_daily_sales'),
  validateIdParam,
  getRestaurantDailySale,
);

restaurantRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_restaurant'),
  validateIdParam,
  validateUpdateRestaurant,
  updateRestaurant,
);

export default restaurantRouter;
