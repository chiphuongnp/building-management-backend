import { MOCK_SIGNATURE } from '../data/payment';

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
export const deleteImagesMock = jest.fn();
export const generateSignatureMock = jest.fn(() => MOCK_SIGNATURE);
export const calculatePaymentMock = jest.fn();
export const mockGetTomorrowMock = jest.fn(() => new Date('2026-04-01'));
