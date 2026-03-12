import { Response } from 'express';

export const firebaseHelperMock = {
  getDocsByFields: jest.fn(),
  getDocById: jest.fn(),
  runTransaction: jest.fn(),
  getTransaction: jest.fn(),
  setTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  countAllDocs: jest.fn(),
  countDocsByFields: jest.fn(),
  updateDoc: jest.fn(),
  getDocByField: jest.fn(),
  getAllDocs: jest.fn(),
  createDoc: jest.fn(),
  getDocsWithFields: jest.fn(),
};

export const loggerMock = {
  warn: jest.fn(),
  info: jest.fn(),
};

export const responseSuccess = jest
  .fn()
  .mockImplementation((res: Response, message: string, data?: any) => {
    return res.json({ success: true, data });
  });
export const responseError = jest
  .fn()
  .mockImplementation((_res: any, statusCode: number, message: string) => ({
    success: false,
    status: statusCode,
    message,
  }));
export const getThisMonthMock = jest.fn(() => new Date('2026-03-01'));
export const capitalizeName = jest.fn((name: string) => name);
