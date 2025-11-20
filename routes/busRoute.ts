import express from 'express';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';
import { validateBusRoute } from '../validations/busRoute';
import {
  createBusRoute,
  getBusRouteDetail,
  getAllBusRoutes,
  updateBusRoute,
  activeBusRoute,
  inactiveBusRoute,
} from '../services/busRoute';

const busRouteRouter = express.Router();

busRouteRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('create_bus_route'),
  validateBusRoute,
  createBusRoute,
);

busRouteRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  requirePermission('get_all_bus_routes'),
  getAllBusRoutes,
);

busRouteRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  requirePermission('get_bus_route_detail'),
  getBusRouteDetail,
);

busRouteRouter.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_bus_route'),
  validateBusRoute,
  updateBusRoute,
);

busRouteRouter.patch(
  '/:id/active',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_bus_route_status'),
  activeBusRoute,
);

busRouteRouter.patch(
  '/:id/inactive',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_bus_route_status'),
  inactiveBusRoute,
);

export default busRouteRouter;
