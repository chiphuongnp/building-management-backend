jest.mock('../../utils', () => {
  const { utilMock } = require('../helpers/utilMock');
  return utilMock({
    sendEmail: jest.fn(),
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    signActivationToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    verifyActivationToken: jest.fn(),
  })();
});
import { register, login, refreshToken, logout, activateAccount } from '../../services/auth';
import { ErrorMessage, StatusCode } from '../../constants/message';
import { ActiveStatus } from '../../constants/enum';
import {
  firebaseHelper,
  sendEmail,
  signAccessToken,
  signRefreshToken,
  signActivationToken,
  verifyRefreshToken,
  verifyActivationToken,
} from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import { createUserMock, verifyIdTokenMock } from '../helpers/utilMock';
import {
  mockUser,
  mockInactiveUser,
  mockDecodedToken,
  mockAccessToken,
  mockRefreshToken,
  mockNewAccessToken,
  mockActivationToken,
  mockTokenDoc,
  mockRegisterInput,
  mockLoginInput,
  mockRefreshTokenInput,
  mockLogoutInput,
  mockActivateInput,
} from '../data/auth.mock';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedSignAccessToken = jest.mocked(signAccessToken);
const mockedSignRefreshToken = jest.mocked(signRefreshToken);
const mockedSignActivationToken = jest.mocked(signActivationToken);
const mockedVerifyRefreshToken = jest.mocked(verifyRefreshToken);
const mockedVerifyActivationToken = jest.mocked(verifyActivationToken);
const mockedSendEmail = jest.mocked(sendEmail);

beforeEach(() => {
  jest.clearAllMocks();

  mockedSignAccessToken.mockReturnValue(mockAccessToken);
  mockedSignRefreshToken.mockReturnValue(mockRefreshToken);
  mockedSignActivationToken.mockReturnValue(mockActivationToken);
  mockedSendEmail.mockResolvedValue(undefined as never);
});

describe('register()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should register successfully and send activation email',
        input: mockRegisterInput,
      },
      {
        name: 'should use default fullName "User" when fullName is not provided',
        input: {
          ...mockRegisterInput,
          body: {
            ...mockRegisterInput.body,
            full_name: undefined,
          },
        },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      createUserMock.mockResolvedValue({ uid: mockUser.id });
      mockedFirebase.createDoc.mockResolvedValue({ id: mockUser.id } as any);

      const response = await register(req, res);
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          email: mockUser.email,
          username: mockUser.username,
        }),
      });

      expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return ACCOUNT_EMAIL_EXISTS when email is already registered',
        input: mockRegisterInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([mockUser] as any);
        },
        error: {
          statusCode: StatusCode.ACCOUNT_EMAIL_EXISTS,
          errorMessage: ErrorMessage.ACCOUNT_EMAIL_EXISTS,
        },
      },
      {
        name: 'should return CANNOT_CREATE_USER when createDoc fails',
        input: mockRegisterInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          createUserMock.mockResolvedValue({ uid: mockUser.id });
          mockedFirebase.createDoc.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_USER,
          errorMessage: ErrorMessage.CANNOT_CREATE_USER,
        },
      },
      {
        name: 'should return FIREBASE_AUTH_FAILED when firebase auth throws auth/* error',
        input: mockRegisterInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          createUserMock.mockRejectedValue({
            code: 'auth/email-already-exists',
            message: 'Email already exists',
          });
        },
        error: {
          statusCode: StatusCode.FIREBASE_AUTH_FAILED,
          errorMessage: expect.stringContaining(ErrorMessage.FIREBASE_AUTH_FAILED),
        },
      },
      {
        name: 'should return REGISTER_FAILED when sendEmail fails',
        input: mockRegisterInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          createUserMock.mockResolvedValue({ uid: mockUser.id });
          mockedFirebase.createDoc.mockResolvedValue({ id: mockUser.id } as any);
          mockedSendEmail.mockRejectedValue(new Error('SMTP error') as any);
        },
        error: {
          statusCode: StatusCode.REGISTER_FAILED,
          errorMessage: ErrorMessage.REGISTER_FAILED,
        },
      },
      {
        name: 'should return REGISTER_FAILED on unknown error',
        input: mockRegisterInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockRejectedValue(new Error('unknown') as any);
        },
        error: {
          statusCode: StatusCode.REGISTER_FAILED,
          errorMessage: ErrorMessage.REGISTER_FAILED,
        },
      },
      {
        name: 'should return REGISTER_FAILED when email is missing in sendActivationEmail',
        input: {
          ...mockRegisterInput,
          body: {
            ...mockRegisterInput.body,
            email: undefined,
          },
        },
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          createUserMock.mockResolvedValue({ uid: mockUser.id });
          mockedFirebase.createDoc.mockResolvedValue({ id: mockUser.id } as any);
        },
        error: {
          statusCode: StatusCode.REGISTER_FAILED,
          errorMessage: ErrorMessage.REGISTER_FAILED,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await register(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('login()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should login successfully and return tokens',
        input: mockLoginInput,
        mockFire: () => {
          verifyIdTokenMock.mockResolvedValue(mockDecodedToken);
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);
          mockedFirebase.createDoc.mockResolvedValue({ id: 'token_001' } as any);
        },
        expected: {
          success: true,
          data: expect.objectContaining({
            accessToken: mockAccessToken,
            refreshToken: mockRefreshToken,
            expiresIn: expect.any(String),
          }),
        },
      },
      {
        name: 'should return empty permissions when user.permissions is undefined',
        input: mockLoginInput,
        mockFire: () => {
          verifyIdTokenMock.mockResolvedValue(mockDecodedToken);
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockUser,
            permissions: undefined,
          } as any);
          mockedFirebase.createDoc.mockResolvedValue({ id: 'token_001' } as any);
        },
        expected: {
          success: true,
          data: expect.objectContaining({
            accessToken: mockAccessToken,
          }),
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await login(req, res);
      expect(response).toEqual(expected);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return INVALID_TOKEN when authorization header is missing',
        input: { headers: {} },
        mockFire: () => {},
        error: {
          statusCode: StatusCode.INVALID_TOKEN,
          errorMessage: ErrorMessage.INVALID_TOKEN,
        },
      },
      {
        name: 'should return USER_NOT_FOUND when user does not exist in firestore',
        input: mockLoginInput,
        mockFire: () => {
          verifyIdTokenMock.mockResolvedValue(mockDecodedToken);
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.USER_NOT_FOUND,
          errorMessage: ErrorMessage.USER_NOT_FOUND,
        },
      },
      {
        name: 'should return ACCOUNT_INACTIVE when user account is not active',
        input: mockLoginInput,
        mockFire: () => {
          verifyIdTokenMock.mockResolvedValue(mockDecodedToken);
          mockedFirebase.getDocById.mockResolvedValue(mockInactiveUser as any);
        },
        error: {
          statusCode: StatusCode.ACCOUNT_INACTIVE,
          errorMessage: ErrorMessage.ACCOUNT_INACTIVE,
        },
      },
      {
        name: 'should return USER_NOT_FOUND when firebase throws auth/user-not-found',
        input: mockLoginInput,
        mockFire: () => {
          verifyIdTokenMock.mockRejectedValue({ code: 'auth/user-not-found' });
        },
        error: {
          statusCode: StatusCode.USER_NOT_FOUND,
          errorMessage: ErrorMessage.USER_NOT_FOUND,
        },
      },
      {
        name: 'should return FIREBASE_AUTH_FAILED when firebase throws other auth/* error',
        input: mockLoginInput,
        mockFire: () => {
          verifyIdTokenMock.mockRejectedValue({
            code: 'auth/invalid-id-token',
            message: 'Invalid token',
          });
        },
        error: {
          statusCode: StatusCode.FIREBASE_AUTH_FAILED,
          errorMessage: expect.stringContaining(ErrorMessage.FIREBASE_AUTH_FAILED),
        },
      },
      {
        name: 'should return LOGIN_FAILED on unknown error',
        input: mockLoginInput,
        mockFire: () => {
          verifyIdTokenMock.mockRejectedValue(new Error('unknown'));
        },
        error: {
          statusCode: StatusCode.LOGIN_FAILED,
          errorMessage: ErrorMessage.LOGIN_FAILED,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await login(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('refreshToken()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return new access token when refresh token is valid',
        input: mockRefreshTokenInput,
        mockFire: () => {
          mockedVerifyRefreshToken.mockReturnValue({ uid: mockUser.id, siteId: 'tokyo' } as any);
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockTokenDoc] as any);
          mockedSignAccessToken.mockReturnValue(mockNewAccessToken);
        },
        expected: {
          success: true,
          data: expect.objectContaining({
            accessToken: mockNewAccessToken,
            expiresIn: expect.any(String),
          }),
        },
      },
      {
        name: 'should return empty permissions when user.permissions is undefined in refreshToken',
        input: mockRefreshTokenInput,
        mockFire: () => {
          mockedVerifyRefreshToken.mockReturnValue({ uid: mockUser.id } as any);

          mockedFirebase.getDocById.mockResolvedValue({
            ...mockUser,
            permissions: undefined,
          } as any);

          mockedFirebase.getDocsByFields.mockResolvedValue([mockTokenDoc] as any);

          mockedSignAccessToken.mockReturnValue(mockNewAccessToken);
        },
        expected: {
          success: true,
          data: expect.objectContaining({
            accessToken: mockNewAccessToken,
          }),
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await refreshToken(req, res);
      expect(response).toEqual(expected);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return REFRESH_TOKEN_REQUIRED when refresh token is missing',
        input: { body: {} },
        mockFire: () => {},
        error: {
          statusCode: StatusCode.REFRESH_TOKEN_REQUIRED,
          errorMessage: ErrorMessage.REFRESH_TOKEN_REQUIRED,
        },
      },
      {
        name: 'should return USER_NOT_FOUND when user does not exist',
        input: mockRefreshTokenInput,
        mockFire: () => {
          mockedVerifyRefreshToken.mockReturnValue({ uid: mockUser.id } as any);
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.USER_NOT_FOUND,
          errorMessage: ErrorMessage.USER_NOT_FOUND,
        },
      },
      {
        name: 'should return USER_NOT_FOUND when user is inactive',
        input: mockRefreshTokenInput,
        mockFire: () => {
          mockedVerifyRefreshToken.mockReturnValue({ uid: mockUser.id } as any);
          mockedFirebase.getDocById.mockResolvedValue(mockInactiveUser as any);
        },
        error: {
          statusCode: StatusCode.USER_NOT_FOUND,
          errorMessage: ErrorMessage.USER_NOT_FOUND,
        },
      },
      {
        name: 'should return INVALID_TOKEN when token doc is not found in firestore',
        input: mockRefreshTokenInput,
        mockFire: () => {
          mockedVerifyRefreshToken.mockReturnValue({ uid: mockUser.id } as any);
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
        },
        error: {
          statusCode: StatusCode.INVALID_TOKEN,
          errorMessage: ErrorMessage.INVALID_TOKEN,
        },
      },
      {
        name: 'should return INVALID_TOKEN when verifyRefreshToken throws',
        input: mockRefreshTokenInput,
        mockFire: () => {
          mockedVerifyRefreshToken.mockImplementation(() => {
            throw new Error('invalid token');
          });
        },
        error: {
          statusCode: StatusCode.INVALID_TOKEN,
          errorMessage: ErrorMessage.INVALID_TOKEN,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await refreshToken(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('logout()', () => {
  describe('valid cases', () => {
    test('should logout successfully and revoke refresh token', async () => {
      const req = mockReq(mockLogoutInput);
      const res = mockRes();

      mockedFirebase.getDocsByFields.mockResolvedValue([mockTokenDoc] as any);
      mockedFirebase.updateBatchDocs.mockResolvedValue(undefined as any);

      const response = await logout(req, res);

      expect(response).toEqual({
        success: true,
        data: undefined,
      });
      expect(mockedFirebase.updateBatchDocs).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.objectContaining({ revoked: true })]),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return REFRESH_TOKEN_REQUIRED when refresh token is missing',
        input: { ...mockLogoutInput, body: {} },
        mockFire: () => {},
        error: {
          statusCode: StatusCode.REFRESH_TOKEN_REQUIRED,
          errorMessage: ErrorMessage.REFRESH_TOKEN_REQUIRED,
        },
      },
      {
        name: 'should return INVALID_TOKEN when token doc is not found',
        input: mockLogoutInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
        },
        error: {
          statusCode: StatusCode.INVALID_TOKEN,
          errorMessage: ErrorMessage.INVALID_TOKEN,
        },
      },
      {
        name: 'should return LOGOUT_FAILED on firestore error',
        input: mockLogoutInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockRejectedValue(new Error('firestore error') as any);
        },
        error: {
          statusCode: StatusCode.LOGOUT_FAILED,
          errorMessage: ErrorMessage.LOGOUT_FAILED,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await logout(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('activateAccount()', () => {
  describe('valid cases', () => {
    test('should activate account successfully', async () => {
      const req = mockReq(mockActivateInput);
      const res = mockRes();

      mockedVerifyActivationToken.mockReturnValue({ uid: mockUser.id } as any);
      mockedFirebase.getDocById.mockResolvedValue({
        ...mockUser,
        status: ActiveStatus.INACTIVE,
      } as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      await activateAccount(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(expect.any(String), mockUser.id, {
        status: ActiveStatus.ACTIVE,
      });

      expect(res.send).toHaveBeenCalledWith(expect.stringContaining('activated successfully'));
    });

    test('should return already activated message when account is already active', async () => {
      const req = mockReq(mockActivateInput);
      const res = mockRes();

      mockedVerifyActivationToken.mockReturnValue({ uid: mockUser.id } as any);
      mockedFirebase.getDocById.mockResolvedValue(mockUser as any);

      await activateAccount(req, res);

      expect(mockedFirebase.updateDoc).not.toHaveBeenCalled();

      expect(res.send).toHaveBeenCalledWith(expect.stringContaining('already activated'));
    });
  });

  describe('error cases', () => {
    const errors = [
      {
        name: 'should return 400 when token is missing',
        input: { query: {} },
        mockFire: () => {},
        error: {
          message: '<h1>Activation token missing</h1>',
        },
      },
      {
        name: 'should return 404 when user is not found',
        input: mockActivateInput,
        mockFire: () => {
          mockedVerifyActivationToken.mockReturnValue({ uid: mockUser.id } as any);
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          message: '<h1>User not found</h1>',
        },
      },
      {
        name: 'should return 400 when token is invalid or expired',
        input: mockActivateInput,
        mockFire: () => {
          mockedVerifyActivationToken.mockImplementation(() => {
            throw new Error('jwt expired');
          });
        },
        error: {
          message: '<h1>Invalid or expired activation link</h1>',
        },
      },
    ];

    test.each(errors)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await activateAccount(req, res);
      expect(res.send).toHaveBeenCalledWith(expect.stringContaining(error.message));
    });
  });
});
