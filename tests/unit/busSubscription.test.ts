import { BusSeatStatus, ActiveStatus } from '../../constants/enum';
import { ErrorMessage, StatusCode } from '../../constants/message';
import {
  getAllBusSubscriptions,
  getBusSubscriptionDetail,
  createBusSubscription,
} from '../../services/busSubscription';
import { Transaction } from 'firebase-admin/firestore';
import { firebaseHelper, calculatePayment, getTomorrow } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import { mockRoute } from '../data/busRoute.mock';
import {
  mockBusSubscription,
  mockBusSubscriptions,
  mockUser,
  mockCalculatePaymentResult,
  mockCreateBusSubscriptionInput,
  mockSeats,
  mockBus,
} from '../data/busSubscription.mock';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedCalculatePayment = jest.mocked(calculatePayment);
const mockedGetTomorrow = jest.mocked(getTomorrow);

beforeEach(() => {
  jest.clearAllMocks();

  mockedFirebase.runTransaction.mockImplementation(async (cb) => cb({} as Transaction));
  mockedCalculatePayment.mockReturnValue(mockCalculatePaymentResult);
  mockedGetTomorrow.mockReturnValue(new Date('2026-03-02'));
});

describe('getAllBusSubscriptions()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return all bus subscriptions without filters',
        input: {
          query: {},
          subscriptions: mockBusSubscriptions,
          total: 2,
        },
      },
      {
        name: 'should return filtered subscriptions by route_id',
        input: {
          query: { route_id: mockRoute.id },
          subscriptions: mockBusSubscriptions,
          total: 2,
        },
      },
      {
        name: 'should return filtered subscriptions by user_id',
        input: {
          query: { user_id: mockUser.id },
          subscriptions: [mockBusSubscription],
          total: 1,
        },
      },
      {
        name: 'should return empty subscriptions list',
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
          subscriptions: mockBusSubscriptions,
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

      const response = await getAllBusSubscriptions(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          busSubscription: subscriptions,
        }),
      });
    });
  });

  describe('edge cases', () => {
    describe('pagination', () => {
      const cases = [
        {
          name: 'should handle missing pagination',
          input: {
            query: {},
            pagination: undefined,
          },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(2);
            mockedFirebase.getAllDocs.mockResolvedValue(mockBusSubscriptions);
          },
        },
        {
          name: 'should handle empty pagination object',
          input: {
            query: {},
            pagination: {},
          },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(3);
            mockedFirebase.getAllDocs.mockResolvedValue(mockBusSubscriptions);
          },
        },
        {
          name: 'should handle null pagination',
          input: {
            query: {},
            pagination: null,
          },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(4);
            mockedFirebase.getAllDocs.mockResolvedValue(mockBusSubscriptions);
          },
        },
        {
          name: 'should use default when page_size is missing',
          input: {
            query: {},
            pagination: { page: 1 },
          },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(5);
            mockedFirebase.getAllDocs.mockResolvedValue(mockBusSubscriptions);
          },
        },
        {
          name: 'should calculate totalPage correctly',
          input: {
            query: {},
            pagination: { page: 1, page_size: 2 },
          },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(5);
            mockedFirebase.getAllDocs.mockResolvedValue(mockBusSubscriptions);
          },
        },
      ];

      test.each(cases)('$name', async ({ input, mockFire }) => {
        const req = mockReq(input);
        const res = mockRes();

        mockFire();

        const response = await getAllBusSubscriptions(req, res);

        expect(response).toEqual(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              busSubscription: expect.any(Array),
              pagination: expect.any(Object),
            }),
          }),
        );
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq({
        query: {},
        pagination: { page: 1, page_size: 10 },
      });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockRejectedValue(new Error('firestore error') as never);

      const response = await getAllBusSubscriptions(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.BUS_SUBSCRIPTION_GET_ALL_ERROR,
        message: ErrorMessage.CANNOT_GET_BUS_SUBSCRIPTION_LIST,
      });
    });
  });
});

describe('getBusSubscriptionDetail()', () => {
  describe('valid cases', () => {
    test('should return subscription detail', async () => {
      const req = mockReq({
        params: { id: mockBusSubscription.id },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockBusSubscription as never);

      const response = await getBusSubscriptionDetail(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining(mockBusSubscription),
      });
    });
  });

  describe('error cases', () => {
    test('should return not found', async () => {
      const req = mockReq({ params: { id: 'nonexistent_id' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null as never);

      const response = await getBusSubscriptionDetail(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.BUS_SUBSCRIPTION_NOT_FOUND,
        message: ErrorMessage.BUS_SUBSCRIPTION_NOT_FOUND,
      });
    });

    test('should handle firestore error', async () => {
      const req = mockReq({
        params: { id: mockBusSubscription.id },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as never);

      const response = await getBusSubscriptionDetail(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.BUS_SUBSCRIPTION_GET_DETAIL_ERROR,
        message: ErrorMessage.CANNOT_GET_BUS_SUBSCRIPTION_DETAIL,
      });
    });
  });
});

describe('createBusSubscription()', () => {
  const baseInput = mockCreateBusSubscriptionInput;

  const defaultMockFire = () => {
    mockedFirebase.getDocsByFields.mockResolvedValue([]);
    mockedFirebase.getDocById.mockResolvedValue(mockUser as any);

    mockedFirebase.getTransaction
      .mockResolvedValueOnce(JSON.parse(JSON.stringify(mockBus)) as any)
      .mockResolvedValueOnce(mockRoute as any);

    mockedFirebase.updateTransaction.mockResolvedValue(undefined as any);
    mockedFirebase.setTransaction.mockResolvedValue({
      id: 'sub_id',
    } as any);

    mockedCalculatePayment.mockReturnValue(mockCalculatePaymentResult);
  };

  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should create successfully',
        input: baseInput,
        mockFire: defaultMockFire,
      },
      {
        name: 'should use default start_time',
        input: {
          ...baseInput,
          body: { ...baseInput.body, start_time: undefined },
        },
        mockFire: defaultMockFire,
      },
      {
        name: 'should handle user points undefined',
        input: {
          ...baseInput,
          body: { ...baseInput.body, points_used: 0 },
        },
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockUser,
            points: undefined,
          } as any);

          mockedFirebase.getTransaction
            .mockResolvedValueOnce(JSON.parse(JSON.stringify(mockBus)) as any)
            .mockResolvedValueOnce(mockRoute as any);

          mockedFirebase.updateTransaction.mockResolvedValue(undefined as any);
          mockedFirebase.setTransaction.mockResolvedValue({
            id: 'sub_id',
          } as any);
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createBusSubscription(req, res);

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'sub_id',
          }),
        }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return USER_NOT_FOUND when user is missing',
        input: { ...baseInput, user: {} },
        mockFire: () => {},
        error: {
          statusCode: StatusCode.USER_NOT_FOUND,
          errorMessage: ErrorMessage.USER_NOT_FOUND,
        },
      },
      {
        name: 'should return BUS_SUBSCRIPTION_ALREADY_EXISTS when duplicate subscription exists',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([mockBusSubscription]);
        },
        error: {
          statusCode: StatusCode.BUS_SUBSCRIPTION_ALREADY_EXISTS,
          errorMessage: ErrorMessage.BUS_SUBSCRIPTION_ALREADY_EXISTS,
        },
      },
      {
        name: 'should return INVALID_POINTS when user uses more points than available',
        input: {
          ...baseInput,
          body: { ...baseInput.body, points_used: 9999 },
        },
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockUser,
            points: 100,
          } as any);
        },
        error: {
          statusCode: StatusCode.INVALID_POINTS,
          errorMessage: ErrorMessage.INVALID_POINTS,
        },
      },
      {
        name: 'should return BUS_NOT_FOUND when bus does not exist',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);

          mockedFirebase.getTransaction.mockResolvedValueOnce(null as any);
        },
        error: {
          statusCode: StatusCode.BUS_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_NOT_FOUND,
        },
      },
      {
        name: 'should return BUS_ROUTE_NOT_FOUND when route does not exist',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);

          mockedFirebase.getTransaction
            .mockResolvedValueOnce(mockBus as any)
            .mockResolvedValueOnce(null as any);
        },
        error: {
          statusCode: StatusCode.BUS_ROUTE_NOT_FOUND,
          errorMessage: ErrorMessage.BUS_ROUTE_NOT_FOUND,
        },
      },
      {
        name: 'should return BUS_ROUTE_INACTIVE when route is inactive',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);

          mockedFirebase.getTransaction
            .mockResolvedValueOnce(mockBus as any)
            .mockResolvedValueOnce({
              ...mockRoute,
              status: ActiveStatus.INACTIVE,
            } as any);
        },
        error: {
          statusCode: StatusCode.BUS_ROUTE_INACTIVE,
          errorMessage: ErrorMessage.BUS_ROUTE_INACTIVE,
        },
      },
      {
        name: 'should return BUS_NOT_IN_ROUTE when bus is not assigned to route',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);

          mockedFirebase.getTransaction
            .mockResolvedValueOnce(mockBus as any)
            .mockResolvedValueOnce({
              ...mockRoute,
              bus_id: ['other'],
            } as any);
        },
        error: {
          statusCode: StatusCode.BUS_NOT_IN_ROUTE,
          errorMessage: ErrorMessage.BUS_NOT_IN_ROUTE,
        },
      },
      {
        name: 'should return SEAT_ALREADY_BOOKED when seat is already reserved',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);

          mockedFirebase.getTransaction
            .mockResolvedValueOnce({
              ...mockBus,
              seats: [
                {
                  seat_number: mockSeats.seat_number,
                  status: BusSeatStatus.RESERVED,
                },
              ],
            } as any)
            .mockResolvedValueOnce(mockRoute as any);
        },
        error: {
          statusCode: StatusCode.SEAT_ALREADY_BOOKED,
          errorMessage: ErrorMessage.SEAT_ALREADY_BOOKED,
        },
      },
      {
        name: 'should return default error when transaction fails',
        input: baseInput,
        mockFire: () => {
          mockedFirebase.getDocsByFields.mockResolvedValue([]);
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);

          mockedFirebase.runTransaction.mockImplementation(async () => {
            throw new Error('UNKNOWN_ERROR');
          });
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_BUS_SUBSCRIPTION,
          errorMessage: ErrorMessage.CANNOT_CREATE_BUS_SUBSCRIPTION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createBusSubscription(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});
