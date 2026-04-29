import {
  getEventRegistrationsByUser,
  getEventRegistrationsHistory,
  getEventRegistrationsByEventBooking,
  createEventRegistration,
  cancelEventRegistration,
} from '../../services/eventRegistration';
import { ErrorMessage, StatusCode } from '../../constants/message';
import { EventRegistrationsStatus } from '../../constants/enum';
import { firebaseHelper } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import { Transaction } from 'firebase-admin/firestore';
import {
  mockUserId,
  mockEventBookingId,
  mockEventRegistrationId,
  mockEventBooking,
  mockEventRegistration,
  mockEventRegistrations,
  mockCancelledRegistration,
  mockClosedRegistration,
  mockGetByUserInput,
  mockGetHistoryInput,
  mockGetByEventBookingInput,
  mockCreateEventRegistrationInput,
  mockCancelEventRegistrationInput,
} from '../data/eventRegistration.mock';

const mockedFirebase = jest.mocked(firebaseHelper);

beforeEach(() => {
  jest.clearAllMocks();

  mockedFirebase.runTransaction.mockImplementation(async (cb) => cb({} as Transaction));
});

describe('getEventRegistrationsByUser()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return event registrations when user has registrations',
        mockData: mockEventRegistrations,
        expected: {
          success: true,
          data: mockEventRegistrations,
        },
      },
      {
        name: 'should return empty list when user has no registrations',
        mockData: [],
        expected: {
          success: true,
          data: [],
        },
      },
    ];

    test.each(validCases)('$name', async ({ mockData, expected }) => {
      const req = mockReq(mockGetByUserInput);
      const res = mockRes();

      mockedFirebase.getDocsByFields.mockResolvedValue(mockData as any);

      const response = await getEventRegistrationsByUser(req, res);
      expect(response).toEqual(expected);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return ACCOUNT_NOT_FOUND when uid is missing',
        input: { user: {} },
        mockFire: () => {},
        error: {
          statusCode: StatusCode.ACCOUNT_NOT_FOUND,
          errorMessage: ErrorMessage.ACCOUNT_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockGetByUserInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_GET_USER_EVENT_REGISTRATIONS,
          errorMessage: ErrorMessage.CANNOT_GET_USER_EVENT_REGISTRATIONS,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getEventRegistrationsByUser(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('getEventRegistrationsHistory()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return cancelled and closed registrations',
        mockData: [mockCancelledRegistration, mockClosedRegistration],
        expected: {
          success: true,
          data: [mockCancelledRegistration, mockClosedRegistration],
        },
      },
      {
        name: 'should return empty list when no history',
        mockData: [],
        expected: {
          success: true,
          data: [],
        },
      },
    ];

    test.each(validCases)('$name', async ({ mockData, expected }) => {
      const req = mockReq(mockGetHistoryInput);
      const res = mockRes();

      mockedFirebase.getDocsByFields.mockResolvedValue(mockData as any);

      const response = await getEventRegistrationsHistory(req, res);
      expect(response).toEqual(expected);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return ACCOUNT_NOT_FOUND when uid is missing',
        input: { user: {} },
        mockFire: () => {},
        error: {
          statusCode: StatusCode.ACCOUNT_NOT_FOUND,
          errorMessage: ErrorMessage.ACCOUNT_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockGetHistoryInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_GET_USER_EVENT_REGISTRATION_HISTORY,
          errorMessage: ErrorMessage.CANNOT_GET_USER_EVENT_REGISTRATION_HISTORY,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getEventRegistrationsHistory(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('getEventRegistrationsByEventBooking()', () => {
  describe('valid cases', () => {
    test('should return registered event registrations for an event booking', async () => {
      const req = mockReq(mockGetByEventBookingInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockEventBooking as any);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockEventRegistrations as any);

      const response = await getEventRegistrationsByEventBooking(req, res);
      expect(response).toEqual({
        success: true,
        data: mockEventRegistrations,
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return EVENT_BOOKING_NOT_FOUND when event booking does not exist',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.EVENT_BOOKING_NOT_FOUND,
          errorMessage: ErrorMessage.EVENT_BOOKING_NOT_FOUND,
        },
      },
      {
        name: 'should return CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT when no registrations found',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockEventBooking as any);
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
        },
        error: {
          statusCode: StatusCode.CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT,
          errorMessage: ErrorMessage.CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT,
        },
      },
      {
        name: 'should handle firestore error',
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT,
          errorMessage: ErrorMessage.CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq(mockGetByEventBookingInput);
      const res = mockRes();

      mockFire();

      const response = await getEventRegistrationsByEventBooking(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('createEventRegistration()', () => {
  const defaultMockFire = () => {
    mockedFirebase.getDocById.mockResolvedValue(mockEventBooking as any);
    mockedFirebase.setTransaction.mockResolvedValue({ id: mockEventRegistrationId } as any);
    mockedFirebase.updateTransaction.mockResolvedValue(undefined as any);
  };

  describe('valid cases', () => {
    test('should create event registration successfully', async () => {
      const req = mockReq(mockCreateEventRegistrationInput);
      const res = mockRes();

      defaultMockFire();

      const response = await createEventRegistration(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockEventRegistrationId },
      });
    });

    test('should increment current_participants by 1 in transaction', async () => {
      const req = mockReq(mockCreateEventRegistrationInput);
      const res = mockRes();

      defaultMockFire();

      await createEventRegistration(req, res);

      expect(mockedFirebase.updateTransaction).toHaveBeenCalledWith(
        expect.any(String),
        mockEventBookingId,
        { current_participants: mockEventBooking.current_participants + 1 },
        expect.anything(),
      );
    });

    test('should set status to REGISTERED in setTransaction', async () => {
      const req = mockReq(mockCreateEventRegistrationInput);
      const res = mockRes();

      defaultMockFire();

      await createEventRegistration(req, res);

      expect(mockedFirebase.setTransaction).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          user_id: mockUserId,
          status: EventRegistrationsStatus.REGISTERED,
        }),
        expect.anything(),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return ACCOUNT_NOT_FOUND when uid is missing',
        input: { ...mockCreateEventRegistrationInput, user: {} },
        mockFire: () => {},
        error: {
          statusCode: StatusCode.ACCOUNT_NOT_FOUND,
          errorMessage: ErrorMessage.ACCOUNT_NOT_FOUND,
        },
      },
      {
        name: 'should return EVENT_BOOKING_NOT_FOUND when event booking does not exist',
        input: mockCreateEventRegistrationInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.EVENT_BOOKING_NOT_FOUND,
          errorMessage: ErrorMessage.EVENT_BOOKING_NOT_FOUND,
        },
      },
      {
        name: 'should return default error when transaction fails',
        input: mockCreateEventRegistrationInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockEventBooking as any);
          mockedFirebase.runTransaction.mockImplementation(async () => {
            throw new Error('UNKNOWN_ERROR');
          });
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_EVENT_REGISTRATION,
          errorMessage: ErrorMessage.CANNOT_CREATE_EVENT_REGISTRATION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createEventRegistration(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('cancelEventRegistration()', () => {
  const defaultMockFire = () => {
    mockedFirebase.getDocById
      .mockResolvedValueOnce(mockEventRegistration as any)
      .mockResolvedValueOnce(mockEventBooking as any);
    mockedFirebase.updateTransaction.mockResolvedValue(undefined as any);
  };

  describe('valid cases', () => {
    test('should cancel event registration successfully', async () => {
      const req = mockReq(mockCancelEventRegistrationInput);
      const res = mockRes();

      defaultMockFire();

      const response = await cancelEventRegistration(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockEventRegistrationId },
      });
    });

    test('should set status to CANCELLED and decrement current_participants in transaction', async () => {
      const req = mockReq(mockCancelEventRegistrationInput);
      const res = mockRes();

      defaultMockFire();

      await cancelEventRegistration(req, res);

      expect(mockedFirebase.updateTransaction).toHaveBeenCalledWith(
        expect.stringContaining('event_registrations'),
        mockEventRegistrationId,
        { status: EventRegistrationsStatus.CANCELLED },
        expect.anything(),
      );
      expect(mockedFirebase.updateTransaction).toHaveBeenCalledWith(
        expect.stringContaining('event_bookings'),
        mockEventBookingId,
        { current_participants: mockEventBooking.current_participants - 1 },
        expect.anything(),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return ACCOUNT_NOT_FOUND when uid is missing',
        input: { ...mockCancelEventRegistrationInput, user: {} },
        mockFire: () => {},
        error: {
          statusCode: StatusCode.ACCOUNT_NOT_FOUND,
          errorMessage: ErrorMessage.ACCOUNT_NOT_FOUND,
        },
      },
      {
        name: 'should return UPDATE_EVENT_REGISTRATION_FORBIDDEN when user is not the owner',
        input: { ...mockCancelEventRegistrationInput, user: { uid: 'other_user_id' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(mockEventRegistration as any);
        },
        error: {
          statusCode: StatusCode.UPDATE_EVENT_REGISTRATION_FORBIDDEN,
          errorMessage: ErrorMessage.UPDATE_EVENT_REGISTRATION_FORBIDDEN,
        },
      },
      {
        name: 'should return EVENT_BOOKING_NOT_FOUND when event booking does not exist',
        input: mockCancelEventRegistrationInput,
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockEventRegistration as any)
            .mockResolvedValueOnce(null as any);
        },
        error: {
          statusCode: StatusCode.EVENT_BOOKING_NOT_FOUND,
          errorMessage: ErrorMessage.EVENT_BOOKING_NOT_FOUND,
        },
      },
      {
        name: 'should return default error when transaction fails',
        input: mockCancelEventRegistrationInput,
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockEventRegistration as any)
            .mockResolvedValueOnce(mockEventBooking as any);
          mockedFirebase.runTransaction.mockImplementation(async () => {
            throw new Error('UNKNOWN_ERROR');
          });
        },
        error: {
          statusCode: StatusCode.CANNOT_CANCEL_EVENT_REGISTRATION,
          errorMessage: ErrorMessage.CANNOT_CANCEL_EVENT_REGISTRATION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await cancelEventRegistration(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});
