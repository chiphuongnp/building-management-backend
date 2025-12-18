import { Request } from 'express';

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    site: string;
    role: string;
    permissions: string[];
  };
  pagination?: PaginationParams;
}
