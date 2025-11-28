import express from 'express';
import { createMomoPayment, handleMomoCallback, handleMomoIpn } from '../services/momoPayment';

const momoRouter = express.Router();

momoRouter.post('/create', createMomoPayment);

momoRouter.get('/callback', handleMomoCallback);

momoRouter.post('/ipn', handleMomoIpn);

export default momoRouter;
