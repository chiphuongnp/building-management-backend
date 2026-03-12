import {
  firebaseHelperMock,
  loggerMock,
  responseSuccessMock,
  responseErrorMock,
  getThisMonthMock,
} from './helpers/utilMock';

jest.mock('../utils', () => ({
  firebaseHelper: firebaseHelperMock,
  logger: loggerMock,
  responseSuccess: responseSuccessMock,
  responseError: responseErrorMock,
  getThisMonth: getThisMonthMock,
}));

beforeEach(() => {
  jest.clearAllMocks();
});
