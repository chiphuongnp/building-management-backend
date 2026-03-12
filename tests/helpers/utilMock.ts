export const firebaseHelperMock = {
  getDocsByFields: jest.fn(),
  getDocById: jest.fn(),
  runTransaction: jest.fn(),
  getTransaction: jest.fn(),
  setTransaction: jest.fn(),
  updateTransaction: jest.fn(),
};

export const loggerMock = {
  warn: jest.fn(),
  info: jest.fn(),
};

export const responseSuccessMock = jest.fn();
export const responseErrorMock = jest.fn();

export const getThisMonthMock = jest.fn(() => new Date('2026-03-01'));
