import { MOCK_MOMENT, MOCK_NOW } from './data/payment';
import {
  loggerMock,
  getThisMonthMock,
  capitalizeNameMock,
  responseSuccessMock,
  responseErrorMock,
  deleteImagesMock,
  generateSignatureMock,
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
    capitalizeName: capitalizeNameMock,
    deleteImages: deleteImagesMock,
    generateSignature: generateSignatureMock,
  };
});

beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW);
});
