import express from 'express';
import { createMomoPayment, handleMomoCallback, handleMomoIpn } from '../services/momoPayment';
import { authenticate } from '../middlewares/auth';
import { validateCreatePaymentUrl } from '../validations/payment';

const momoRouter = express.Router();

momoRouter.post('/create', authenticate, validateCreatePaymentUrl, createMomoPayment);

momoRouter.get('/callback', handleMomoCallback);

momoRouter.post('/ipn', handleMomoIpn);

export default momoRouter;
