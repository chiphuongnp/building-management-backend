import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    site: string;
    roles: string;
    permissions: string[];
  };
}
