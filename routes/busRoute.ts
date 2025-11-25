import express from 'express';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
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
  requirePermission(Permission.CREATE_BUS_ROUTE),
  validateBusRoute,
  createBusRoute,
);

busRouteRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  requirePermission(Permission.GET_ALL_BUS_ROUTES),
  getAllBusRoutes,
);

busRouteRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  requirePermission(Permission.GET_BUS_ROUTE_DETAIL),
  getBusRouteDetail,
);

busRouteRouter.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_BUS_ROUTE),
  validateBusRoute,
  updateBusRoute,
);

busRouteRouter.patch(
  '/:id/active',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_BUS_ROUTE_STATUS),
  activeBusRoute,
);

busRouteRouter.patch(
  '/:id/inactive',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_BUS_ROUTE_STATUS),
  inactiveBusRoute,
);

export default busRouteRouter;
