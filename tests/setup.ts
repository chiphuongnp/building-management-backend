import {
  firebaseHelperMock,
  loggerMock,
  getThisMonthMock,
  capitalizeName,
  responseSuccess,
  responseError,
} from './helpers/utilMock';

jest.mock('../utils', () => ({
  firebaseHelper: firebaseHelperMock,
  logger: loggerMock,
  responseSuccess: responseSuccess,
  responseError: responseError,
  getThisMonth: getThisMonthMock,
  capitalizeName: capitalizeName,
}));

beforeEach(() => {
  jest.clearAllMocks();
});
