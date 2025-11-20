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
  updateStatus,
} from '../services/order';
import { requirePermission, requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';

const orderRouter = express.Router({ mergeParams: true });

orderRouter.post('/create', authenticate, validateOrderIdParams, validateCreateOrder, createOrder);

orderRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('view_order_list'),
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
  requirePermission('update_order_status'),
  validateOrderIdParams,
  validateUpdateOrderStatus,
  updateStatus,
);

export default orderRouter;
