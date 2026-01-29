import express from 'express';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
import { validateCreateBusRoute, validateUpdateBusRoute } from '../validations/busRoute';
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
  validateCreateBusRoute,
  createBusRoute,
);

busRouteRouter.get('/', authenticate, getAllBusRoutes);

busRouteRouter.get('/:id', authenticate, getBusRouteDetail);

busRouteRouter.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_BUS_ROUTE),
  validateUpdateBusRoute,
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
