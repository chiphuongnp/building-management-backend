jest.mock('../../utils', () => {
  const { utilMock } = require('../helpers/utilMock');
  return utilMock({
    calculateHoursDifference: jest.fn(),
    calculatePayment: jest.fn(),
  })();
});
import {
  getFacilityReservations,
  getFacilityReservationById,
  getFacilityReservationsByUser,
  createFacilityReservation,
  cancelFacilityReservation,
} from '../../services/facilityReservation';
import { ErrorMessage, StatusCode } from '../../constants/message';
import {
  calculateHoursDifference,
  calculatePayment,
  firebaseHelper,
  getTomorrow,
} from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import { FacilityReservationStatus, FacilityType } from '../../constants/enum';
import { Transaction } from 'firebase-admin/firestore';
import { mockCalculatePaymentResult, mockUser } from '../data/busSubscription.mock';
import {
  mockCreateReservationInput,
  mockFacilityReservation,
  mockFacilityReservations,
} from '../data/facilityReservation.mock';
import { mockFacility } from '../data/facility.mock';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedGetTomorrow = jest.mocked(getTomorrow);
const mockedCalculateHoursDifference = jest.mocked(calculateHoursDifference);
const mockedCalculatePayment = jest.mocked(calculatePayment);

beforeEach(() => {
  jest.clearAllMocks();

  mockedFirebase.runTransaction.mockImplementation(async (cb) => cb({} as Transaction));
  mockedGetTomorrow.mockReturnValue(new Date('2026-03-02'));
  mockedCalculatePayment.mockReturnValue(mockCalculatePaymentResult);
  mockedCalculateHoursDifference.mockReturnValue(48);
});

describe('getFacilityReservations()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return all reservations without filters',
        input: {
          query: {},
          subscriptions: mockFacilityReservations,
          total: 2,
        },
      },
      {
        name: 'should return filtered reservations by status',
        input: {
          query: { status: FacilityReservationStatus.RESERVED },
          subscriptions: mockFacilityReservations,
          total: 2,
        },
      },
      {
        name: 'should return empty reservations list',
        input: {
          query: {},
          subscriptions: [],
          total: 0,
        },
      },
      {
        name: 'should handle order and order_by query params',
        input: {
          query: { order: 'asc', order_by: 'created_at' },
          subscriptions: mockFacilityReservations,
          total: 2,
        },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const { query, subscriptions, total } = input;
      const req = mockReq({ query, pagination: { page: 1, page_size: 10 } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(total as never);
      mockedFirebase.countDocsByFields.mockResolvedValue(total as never);
      mockedFirebase.getAllDocs.mockResolvedValue(subscriptions as never);
      mockedFirebase.getDocsByFields.mockResolvedValue(subscriptions as never);

      const response = await getFacilityReservations(req, res);
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          facilityReservations: subscriptions,
        }),
      });
    });
  });

  describe('edge cases', () => {
    describe('pagination', () => {
      const cases = [
        {
          name: 'should handle missing pagination',
          input: { query: {}, pagination: undefined },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(2);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilityReservations);
          },
        },
        {
          name: 'should handle empty pagination object',
          input: { query: {}, pagination: {} },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(3);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilityReservations);
          },
        },
        {
          name: 'should handle null pagination',
          input: { query: {}, pagination: null },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(4);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilityReservations);
          },
        },
        {
          name: 'should use default when page_size is missing',
          input: { query: {}, pagination: { page: 1 } },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(5);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilityReservations);
          },
        },
        {
          name: 'should calculate totalPage correctly',
          input: { query: {}, pagination: { page: 1, page_size: 2 } },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(5);
            mockedFirebase.getAllDocs.mockResolvedValue(mockFacilityReservations);
          },
        },
      ];

      test.each(cases)('$name', async ({ input, mockFire }) => {
        const req = mockReq(input);
        const res = mockRes();

        mockFire();

        const response = await getFacilityReservations(req, res);
        expect(response).toEqual(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              facilityReservations: expect.any(Array),
              pagination: expect.any(Object),
            }),
          }),
        );
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({ query: {}, pagination: { page: 1, page_size: 10 } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockRejectedValue(new Error('firestore error') as never);

      const response = await getFacilityReservations(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_FACILITY_RESERVATION_LIST,
        message: ErrorMessage.CANNOT_GET_FACILITY_RESERVATION_LIST,
      });
    });
  });
});

describe('getFacilityReservationsByUser()', () => {
  describe('valid cases', () => {
    describe('valid cases', () => {
      const validCases = [
        {
          name: 'should return reservations for current user',
          mockData: [mockFacilityReservation],
          expected: {
            success: true,
            data: expect.arrayContaining([expect.objectContaining({ user_id: mockUser.id })]),
          },
        },
        {
          name: 'should return empty list when user has no reservations',
          mockData: [],
          expected: {
            success: true,
            data: [],
          },
        },
      ];

      test.each(validCases)('$name', async ({ mockData, expected }) => {
        const req = mockReq({ user: { uid: mockUser.id } });
        const res = mockRes();

        mockedFirebase.getDocByField.mockResolvedValue(mockData as never);

        const response = await getFacilityReservationsByUser(req, res);
        expect(response).toEqual(expected);
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({ user: { uid: mockUser.id } });
      const res = mockRes();

      mockedFirebase.getDocByField.mockRejectedValue(new Error('firestore error') as never);

      const response = await getFacilityReservationsByUser(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_FACILITY_RESERVATION_HISTORY,
        message: ErrorMessage.CANNOT_GET_USER_FACILITY_RESERVATION,
      });
    });
  });
});

describe('getFacilityReservationById()', () => {
  describe('valid cases', () => {
    test('should return reservation detail', async () => {
      const req = mockReq({ params: { id: mockFacilityReservation.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockFacilityReservation as never);

      const response = await getFacilityReservationById(req, res);
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining(mockFacilityReservation),
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return not found when reservation does not exist',
        input: { id: 'nonexistent_id' },
        mockFire: () => mockedFirebase.getDocById.mockResolvedValue(null as never),
        error: {
          statusCode: StatusCode.FACILITY_RESERVATION_NOT_FOUND,
          errorMessage: ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        input: { id: mockFacilityReservation.id },
        mockFire: () =>
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as never),
        error: {
          statusCode: StatusCode.FACILITY_RESERVATION_NOT_FOUND,
          errorMessage: ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq({ params: input });
      const res = mockRes();

      mockFire();

      const response = await getFacilityReservationById(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('createFacilityReservation()', () => {
  const baseInput = mockCreateReservationInput;

  const defaultMockFire = () => {
    mockedFirebase.getDocById
      .mockResolvedValueOnce(mockFacility as any)
      .mockResolvedValueOnce(mockUser as any);
    mockedFirebase.getDocsByFields.mockResolvedValue([]);
    mockedFirebase.setTransaction.mockResolvedValue({ id: '0BfJJphzrcrqv8id6jd8ois' } as any);
    mockedFirebase.updateTransaction.mockResolvedValue(undefined as any);
    mockedCalculateHoursDifference.mockReturnValue(48);
  };

  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should create reservation successfully',
        input: baseInput,
        mockFire: defaultMockFire,
      },
      {
        name: 'should use default start_time when start_date is not provided',
        input: {
          ...baseInput,
          body: { ...baseInput.body, start_date: undefined },
        },
        mockFire: defaultMockFire,
      },
      {
        name: 'should handle user with undefined points (no base_price)',
        input: {
          ...baseInput,
          body: { ...baseInput.body, points_used: 0 },
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockFacility as any)
            .mockResolvedValueOnce({ ...mockUser, points: undefined } as any);
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.setTransaction.mockResolvedValue({
            id: '0BfJJphzrcrqv8id6jd8ois',
          } as any);
          mockedCalculatePayment.mockReturnValue(mockCalculatePaymentResult);
        },
      },
      {
        name: 'should skip payment fields when facility_type is ROOM',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce({
              ...mockFacility,
              facility_type: FacilityType.ROOM,
            } as any)
            .mockResolvedValueOnce(mockUser as any);
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.setTransaction.mockResolvedValue({
            id: '0BfJJphzrcrqv8id6jd8ois',
          } as any);
        },
      },
      {
        name: 'should calculate and persist updatedPoints correctly when facility has base_price',
        input: baseInput,
        mockFire: () => {
          const facilityWithBasePrice = {
            ...mockFacility,
            base_price: 100,
          } as any;
          mockedFirebase.getDocById
            .mockResolvedValueOnce(facilityWithBasePrice)
            .mockResolvedValueOnce(mockUser);
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.setTransaction.mockResolvedValue({
            id: '0BfJJphzrcrqv8id6jd8ois',
          } as any);
          mockedFirebase.updateTransaction.mockResolvedValue(undefined as any);
        },
        expected: () => {
          const initialPoints = mockUser.points ?? 0;
          const { finalPointsUsed, pointsEarned } = mockCalculatePaymentResult;
          const expectedUpdatedPoints = initialPoints - finalPointsUsed + pointsEarned;

          expect(mockedFirebase.updateTransaction).toHaveBeenCalledWith(
            expect.any(String),
            mockUser.id,
            expect.objectContaining({
              points: expectedUpdatedPoints,
            }),
            expect.any(Object),
          );
        },
      },
      {
        name: 'should calculate updatedPoints correctly when user.points is undefined and facility has base_price',
        input: {
          ...baseInput,
          body: {
            ...baseInput.body,
            points_used: 0,
          },
        },
        mockFire: () => {
          const facilityWithBasePrice = {
            ...mockFacility,
            base_price: 100,
          } as any;
          const userWithoutPoints = {
            ...mockUser,
            points: undefined,
          } as any;
          mockedFirebase.getDocById
            .mockResolvedValueOnce(facilityWithBasePrice)
            .mockResolvedValueOnce(userWithoutPoints);
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.setTransaction.mockResolvedValue({
            id: '0BfJJphzrcrqv8id6jd8ois',
          } as any);
          mockedFirebase.updateTransaction.mockResolvedValue(undefined as any);
        },
        expected: () => {
          const { finalPointsUsed, pointsEarned } = mockCalculatePaymentResult;
          const expectedUpdatedPoints = 0 - finalPointsUsed + pointsEarned;

          expect(mockedFirebase.updateTransaction).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
              points: expectedUpdatedPoints,
            }),
            expect.any(Object),
          );
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createFacilityReservation(req, res);
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: '0BfJJphzrcrqv8id6jd8ois',
          }),
        }),
      );

      if (expected) {
        expected();
      }
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return ACCOUNT_NOT_FOUND when uid is missing',
        input: { ...baseInput, user: {} },
        mockFire: () => {},
        error: {
          statusCode: StatusCode.ACCOUNT_NOT_FOUND,
          errorMessage: ErrorMessage.ACCOUNT_NOT_FOUND,
        },
      },
      {
        name: 'should return FACILITY_NOT_FOUND when facility does not exist',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(null as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_NOT_FOUND,
          errorMessage: ErrorMessage.FACILITY_NOT_FOUND,
        },
      },
      {
        name: 'should return INVALID_POINTS when user uses more points than available',
        input: {
          ...baseInput,
          body: { ...baseInput.body, points_used: 9999 },
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockFacility as any)
            .mockResolvedValueOnce({ ...mockUser, points: 100 } as any);
        },
        error: {
          statusCode: StatusCode.INVALID_POINTS,
          errorMessage: ErrorMessage.INVALID_POINTS,
        },
      },
      {
        name: 'should return FACILITY_RESERVATION_ALREADY_EXISTS when time slot conflicts',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockFacility as any)
            .mockResolvedValueOnce(mockUser as any);

          mockedFirebase.getDocsByFields.mockResolvedValue([mockFacilityReservation] as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_RESERVATION_ALREADY_EXISTS,
          errorMessage: ErrorMessage.FACILITY_RESERVATION_ALREADY_EXISTS,
        },
      },
      {
        name: 'should return default error when transaction fails',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockFacility as any)
            .mockResolvedValueOnce(mockUser as any);

          mockedFirebase.getDocsByFields.mockResolvedValue([]);

          mockedFirebase.runTransaction.mockImplementation(async () => {
            throw new Error('UNKNOWN_ERROR');
          });
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_FACILITY_RESERVATION,
          errorMessage: ErrorMessage.CANNOT_CREATE_FACILITY_RESERVATION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createFacilityReservation(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('cancelFacilityReservation()', () => {
  describe('valid cases', () => {
    test('should cancel reservation successfully', async () => {
      const req = mockReq({ params: { id: mockFacilityReservation.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockFacilityReservation as never);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as never);
      mockedCalculateHoursDifference.mockReturnValue(48);

      const response = await cancelFacilityReservation(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({ id: mockFacilityReservation.id }),
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return FACILITY_RESERVATION_NOT_FOUND when reservation does not exist',
        input: { params: { id: 'nonexistent_id' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_RESERVATION_NOT_FOUND,
          errorMessage: ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
        },
      },
      {
        name: 'should return FACILITY_RESERVATION_IS_CANCELLED when already cancelled',
        input: { params: { id: mockFacilityReservation.id } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockFacilityReservation,
            status: FacilityReservationStatus.CANCELLED,
          } as any);
        },
        error: {
          statusCode: StatusCode.FACILITY_RESERVATION_IS_CANCELLED,
          errorMessage: ErrorMessage.FACILITY_RESERVATION_IS_CANCELLED,
        },
      },
      {
        name: 'should return FACILITY_RESERVATION_LATE_CANCELLATION when cancelling too close to start',
        input: { params: { id: mockFacilityReservation.id } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockFacilityReservation as any);
          mockedCalculateHoursDifference.mockReturnValue(0);
        },
        error: {
          statusCode: StatusCode.FACILITY_RESERVATION_LATE_CANCELLATION,
          errorMessage: ErrorMessage.FACILITY_RESERVATION_LATE_CANCELLATION,
        },
      },
      {
        name: 'should handle firestore error',
        input: { params: { id: mockFacilityReservation.id } },
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as any);
        },
        error: {
          statusCode: StatusCode.CANNOT_CANCEL_FACILITY_RESERVATION,
          errorMessage: ErrorMessage.CANNOT_CANCEL_FACILITY_RESERVATION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await cancelFacilityReservation(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});
