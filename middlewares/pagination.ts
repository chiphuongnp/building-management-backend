import { NextFunction, Response } from 'express';
import { AuthRequest } from '../interfaces/jwt';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../constants/constant';

export const parsePagination = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const { page, page_size: pageSize } = req.query;
  req.pagination = {
    ...(page ? { page: Math.max(DEFAULT_PAGE, Number(page) || DEFAULT_PAGE) } : {}),
    ...(pageSize ? { page_size: Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE) } : {}),
  };

  next();
};
