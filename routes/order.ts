import express from 'express';
import { authenticate } from '../middlewares/auth';
import { validateCreateOrder, validateOrderIdParams } from '../validations/order';
import { createOrder, getOrderDetailsById } from '../services/order';

const orderRouter = express.Router({ mergeParams: true });

orderRouter.post('/create', authenticate, validateOrderIdParams, validateCreateOrder, createOrder);

orderRouter.get(
  '/:id',
  authenticate,
  validateOrderIdParams,
  validateCreateOrder,
  getOrderDetailsById,
);

export default orderRouter;
