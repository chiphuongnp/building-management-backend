import { Response } from 'express';

export interface ApiResponse<T = any> {
  status: number;
  success: boolean;
  message: string;
  data?: T;
}

export const responseSuccess = <T>(res: Response, message: string, data?: T): Response => {
  const response: ApiResponse<T> = {
    status: 200,
    success: true,
    message,
    data,
  };

  return res.json(response);
};

export const responseError = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): Response => {
  const response: ApiResponse<T> = {
    status: statusCode,
    success: true,
    message,
    data,
  };

  return res.status(400).json(response);
};
