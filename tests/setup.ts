import {
  loggerMock,
  getThisMonthMock,
  capitalizeNameMock,
  responseSuccessMock,
  responseErrorMock,
} from './helpers/utilMock';

jest.mock('../utils/firebaseHelper');
jest.mock('../utils', () => {
  const actual = jest.requireActual('../utils');

  return {
    ...actual,
    logger: loggerMock,
    responseSuccess: responseSuccessMock,
    responseError: responseErrorMock,
    getThisMonth: getThisMonthMock,
    capitalizeName: capitalizeNameMock,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});
