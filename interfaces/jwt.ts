import { Request } from 'express';

interface JwtPayload {
  uid: string;
  email: string;
  site: string;
  roles: string;
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
