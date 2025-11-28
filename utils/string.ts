import crypto from 'crypto';
import { momoConfig } from '../configs/momo';

export const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

export const generateSignature = (rawSignature: string) => {
  return crypto.createHmac('sha256', momoConfig.secretKey!).update(rawSignature).digest('hex');
};
