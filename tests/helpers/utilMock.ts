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
export const deleteImagesMock = jest.fn();
export const generateSignatureMock = jest.fn(() => MOCK_SIGNATURE);
export const mockGetTomorrowMock = jest.fn(() => new Date('2026-04-01'));
export const createUserMock = jest.fn();
export const updateUserMock = jest.fn();
export const revokeRefreshTokensMock = jest.fn();
export const utilMock =
  (overrides = {}) =>
  () => {
    const actual = jest.requireActual('../../utils');
    return {
      ...actual,
      logger: loggerMock,
      responseSuccess: responseSuccessMock,
      responseError: responseErrorMock,
      getThisMonth: getThisMonthMock,
      deleteImages: deleteImagesMock,
      generateSignature: generateSignatureMock,
      getTomorrow: mockGetTomorrowMock,
      admin: {
        auth: () => ({
          createUser: createUserMock,
          updateUser: updateUserMock,
          revokeRefreshTokens: revokeRefreshTokensMock,
        }),
      },
      ...overrides,
    };
  };
