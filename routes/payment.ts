import express from 'express';
import { authenticate } from '../middlewares/auth';
import { validateCreatePayment } from '../validations/payment';
import { createPayment, getPayment, getUserPayments } from '../services/payment';

const paymentRouter = express.Router();

paymentRouter.post('/create', authenticate, validateCreatePayment, createPayment);

paymentRouter.get('/:id', authenticate, getPayment);

paymentRouter.get('/', authenticate, getUserPayments);

export default paymentRouter;
