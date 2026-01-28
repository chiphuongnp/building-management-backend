import express from 'express';
import { authenticate } from '../middlewares/auth';
import {
  validateCreateOrder,
  validateOrderIdParams,
  validateUpdateOrder,
  validateUpdateOrderStatus,
} from '../validations/order';
import {
  createOrder,
  getOrderDetailsByOrderId,
  getOrderHistory,
  getOrders,
  getOrdersByUserId,
  updateOrderInfo,
  updateOrderStatus,
} from '../services/order';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
import { parsePagination } from '../middlewares/pagination';

const orderRouter = express.Router({ mergeParams: true });

orderRouter.post('/create', authenticate, validateOrderIdParams, validateCreateOrder, createOrder);

orderRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.VIEW_ORDER_LIST),
  parsePagination,
  validateOrderIdParams,
  getOrders,
);

orderRouter.get('/me', authenticate, validateOrderIdParams, getOrdersByUserId);

orderRouter.get('/history', authenticate, validateOrderIdParams, getOrderHistory);

orderRouter.get('/:id', authenticate, validateOrderIdParams, getOrderDetailsByOrderId);

orderRouter.patch(
  '/update/:id',
  authenticate,
  validateOrderIdParams,
  validateUpdateOrder,
  updateOrderInfo,
);

orderRouter.patch(
  '/update-status/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_ORDER_STATUS),
  validateOrderIdParams,
  validateUpdateOrderStatus,
  updateOrderStatus,
);

export default orderRouter;
