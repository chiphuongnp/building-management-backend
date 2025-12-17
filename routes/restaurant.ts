import express from 'express';
import {
  validateCreateRestaurant,
  validateRestaurantIdParam,
  validateUpdateRestaurant,
} from '../validations/restaurant';
import {
  createRestaurant,
  getRestaurant,
  getRestaurantDailySale,
  getRestaurantDishSales,
  getRestaurantMenu,
  getRestaurants,
  getRestaurantsStats,
  updateRestaurant,
  updateRestaurantStatus,
} from '../services/restaurant';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
import { parsePagination } from '../middlewares/pagination';

const restaurantRouter = express.Router();

restaurantRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.CREATE_RESTAURANT),
  validateCreateRestaurant,
  createRestaurant,
);

restaurantRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  parsePagination,
  getRestaurants,
);

restaurantRouter.get(
  '/stats',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.VIEW_RESTAURANT_STATS),
  getRestaurantsStats,
);

restaurantRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateRestaurantIdParam,
  getRestaurant,
);

restaurantRouter.get(
  '/:id/menu',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateRestaurantIdParam,
  getRestaurantMenu,
);

restaurantRouter.get(
  '/:id/daily-sale',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.VIEW_SALES),
  validateRestaurantIdParam,
  getRestaurantDailySale,
);

restaurantRouter.get(
  '/:id/dish-sale',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.VIEW_SALES),
  validateRestaurantIdParam,
  getRestaurantDishSales,
);

restaurantRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_RESTAURANT),
  validateRestaurantIdParam,
  validateUpdateRestaurant,
  updateRestaurant,
);

restaurantRouter.patch(
  '/update-status/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_RESTAURANT),
  validateRestaurantIdParam,
  updateRestaurantStatus,
);

export default restaurantRouter;
