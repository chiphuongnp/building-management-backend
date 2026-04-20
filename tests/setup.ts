import { MOCK_MOMENT, MOCK_NOW } from './data/payment';
import {
  loggerMock,
  getThisMonthMock,
  responseSuccessMock,
  responseErrorMock,
  deleteImagesMock,
  generateSignatureMock,
  mockGetTomorrowMock,
  createUserMock,
  revokeRefreshTokensMock,
  updateUserMock,
} from './helpers/utilMock';

jest.mock('moment', () => {
  return () => ({
    format: () => MOCK_MOMENT,
  });
});

jest.mock('../utils/firebaseHelper');
jest.mock('../utils', () => {
  const actual = jest.requireActual('../utils');

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
  };
});

beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW);
});
