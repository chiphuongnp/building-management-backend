import jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_EXPIRES,
  ACTIVATE_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
} from '../constants/jwt';
import * as ENV from '../configs/envConfig';

const ACCESS_TOKEN_SECRET = ENV.JWT_ACCESS_SECRET as string;
const REFRESH_TOKEN_SECRET = ENV.JWT_REFRESH_SECRET as string;
const ACTIVATION_TOKEN_SECRET = ENV.JWT_ACTIVATE_SECRET as string;

export const signAccessToken = (payload: any) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

export const signRefreshToken = (payload: any) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

export const signActivationToken = (payload: any) => {
  return jwt.sign(payload, ACTIVATION_TOKEN_SECRET, { expiresIn: ACTIVATE_TOKEN_EXPIRES });
};

export const verifyActivationToken = (token: string) => {
  return jwt.verify(token, ACTIVATION_TOKEN_SECRET);
};
