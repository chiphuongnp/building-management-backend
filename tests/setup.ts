import {
  loggerMock,
  getThisMonthMock,
  capitalizeNameMock,
  responseSuccessMock,
  responseErrorMock,
  deleteImagesMock,
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
    deleteImages: deleteImagesMock,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});
