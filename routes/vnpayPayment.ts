import express from 'express';
import { createVnpayUrl, vnpayIpnHandler, vnpayReturnHandler } from '../services/vnpayPayment';
import { authenticate } from '../middlewares/auth';
import { validateCreatePaymentUrl } from './../validations/payment';

const vnpayRouter = express.Router();

vnpayRouter.post('/create', authenticate, validateCreatePaymentUrl, createVnpayUrl);

vnpayRouter.get('/return', vnpayReturnHandler);

vnpayRouter.get('/ipn', vnpayIpnHandler);

export default vnpayRouter;
