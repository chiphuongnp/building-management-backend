import { Response } from 'express';
jest.mock('../../utils/deleteFile', () => ({
  deleteImages: jest.fn(),
}));
import { deleteImages } from '../../utils/deleteFile';

export const loggerMock = {
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
};

export const responseSuccessMock = jest
  .fn()
  .mockImplementation((_res: any, _message: string, data?: any) => ({
    success: true,
    data,
  }));

export const responseErrorMock = jest
  .fn()
  .mockImplementation((_res: any, statusCode: number, message: string) => ({
    success: false,
    status: statusCode,
    message,
  }));

export const getThisMonthMock = jest.fn(() => new Date('2026-03-01'));
export const capitalizeNameMock = jest.fn((name: string) => name);
export const deleteImagesMock = deleteImages as jest.Mock;
