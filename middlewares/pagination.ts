import { NextFunction, Response } from 'express';
import { AuthRequest } from '../interfaces/jwt';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../constants/constant';

export const parsePagination = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const page = Math.max(DEFAULT_PAGE, Number(req.query.page) || DEFAULT_PAGE);
  const pageSize = Math.max(1, Number(req.query.page_size) || DEFAULT_PAGE_SIZE);
  req.pagination = {
    page,
    page_size: pageSize,
  };

  next();
};
