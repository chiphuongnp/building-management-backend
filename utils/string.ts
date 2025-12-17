import crypto from 'crypto';
import { HmacAlgorithm } from '../constants/enum';

export const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

export const capitalizeName = (name: string) =>
  normalizeName(name).replace(/\b\w/g, (char) => char.toUpperCase());

export const generateSignature = (
  rawSignature: string,
  secret: string,
  algorithm = HmacAlgorithm.SHA512,
) => {
  return crypto.createHmac(algorithm, secret).update(rawSignature).digest('hex');
};
