import express from 'express';
import { authenticate } from '../middlewares/auth';
import { validateCreatePayment } from '../validations/payment';
import { createPayment } from '../services/payment';

const paymentRouter = express.Router();

paymentRouter.post('/create', authenticate, validateCreatePayment, createPayment);

export default paymentRouter;
