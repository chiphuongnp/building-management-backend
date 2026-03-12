import {
  Collection,
  PaymentReferenceType,
  PaymentServiceProvider,
  PaymentStatus,
  Sites,
  UserRole,
} from '../../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../../constants/message';
import { POINTS_EARN_RATE } from '../../constants/constant';
import {
  buildReferenceContext,
  updatePaymentStatus,
  getUserPayments,
  getPayment,
  createPayment,
} from '../../services/payment';
import { Transaction } from 'firebase-admin/firestore';
import { firebaseHelper, logger, responseSuccess, responseError, getThisMonth } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import {
  mockBusSubscription,
  mockFacilityReservation,
  mockOrder,
  mockParkingSubscription,
  mockPayment,
  mockUser,
  mockUserPayments,
} from '../data/payment';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedLogger = jest.mocked(logger);
const mockedGetThisMonth = jest.mocked(getThisMonth);
beforeEach(() => {
  jest.clearAllMocks();

  mockedGetThisMonth.mockReturnValue(new Date('2026-03-01'));
  mockedFirebase.runTransaction.mockImplementation(async (cb) => cb({} as Transaction));
});

const paymentCollection = `${Sites.TOKYO}/${Collection.PAYMENTS}`;
const referenceCollectionMap = {
  [PaymentReferenceType.ORDER]: Collection.ORDERS,
  [PaymentReferenceType.BUS_SUBSCRIPTION]: Collection.BUS_SUBSCRIPTIONS,
  [PaymentReferenceType.FACILITY_RESERVATION]: Collection.FACILITY_RESERVATIONS,
  [PaymentReferenceType.PARKING_SUBSCRIPTION]: Collection.PARKING_SUBSCRIPTIONS,
};

describe('buildReferenceContext()', () => {
  describe('valid cases', () => {
    const testCases = [
      {
        name: 'should return restaurantId when referenceType is ORDER',
        input: {
          referenceType: PaymentReferenceType.ORDER,
          url: 'https://test.com?restaurantId=2gJJVHyg5htfu2kYEvHa',
        },
        expected: { restaurantId: '2gJJVHyg5htfu2kYEvHa' },
      },
      {
        name: 'should return buildingId and parkingId when referenceType is PARKING_SUBSCRIPTION',
        input: {
          referenceType: PaymentReferenceType.PARKING_SUBSCRIPTION,
          url: 'https://test.com?buildingId=AjBfMRzDyXC8wbM4KHWb&parkingId=9rw7TRF0ACUD5jc8e2MY',
        },
        expected: { buildingId: 'AjBfMRzDyXC8wbM4KHWb', parkingId: '9rw7TRF0ACUD5jc8e2MY' },
      },
      {
        name: 'should return null for other referenceTypes',
        input: {
          referenceType: 'UNKNOWN' as any,
          url: 'https://test.com',
        },
        expected: null,
      },
    ];

    test.each(testCases)('$name', ({ input, expected }) => {
      const result = buildReferenceContext(input.referenceType, input.url);
      expect(result).toEqual(expected);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should throw when ORDER missing restaurantId',
        input: {
          referenceType: PaymentReferenceType.ORDER,
          url: 'https://test.com',
        },
        error: ErrorMessage.MISSING_REFERENCE_CONTEXT,
      },
      {
        name: 'should throw when PARKING missing buildingId',
        input: {
          referenceType: PaymentReferenceType.PARKING_SUBSCRIPTION,
          url: 'https://test.com',
        },
        error: ErrorMessage.MISSING_REFERENCE_CONTEXT,
      },
      {
        name: 'should throw when PARKING missing parkingId',
        input: {
          referenceType: PaymentReferenceType.PARKING_SUBSCRIPTION,
          url: 'https://test.com?buildingId=AjBfMRzDyXC8wbM4KHWb',
        },
        error: ErrorMessage.MISSING_REFERENCE_CONTEXT,
      },
    ];

    test.each(errorCases)('$name', ({ input, error }) => {
      expect(() => buildReferenceContext(input.referenceType, input.url)).toThrow(error);
    });
  });
});

describe('updatePaymentStatus()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update payment successfully for ORDER',
        input: {
          payment: {
            ...mockPayment,
            reference_type: PaymentReferenceType.ORDER,
          },
          referenceContext: { restaurantId: 'AjBfMRzDyXC8wbM4KHWb' },
          referenceResult: mockOrder,
        },
      },
      {
        name: 'should update payment successfully for BUS_SUBSCRIPTION',
        input: {
          payment: {
            ...mockPayment,
            reference_type: PaymentReferenceType.BUS_SUBSCRIPTION,
          },
          referenceContext: undefined,
          referenceResult: mockBusSubscription,
        },
      },
      {
        name: 'should update payment successfully for FACILITY_RESERVATION',
        input: {
          payment: {
            ...mockPayment,
            reference_type: PaymentReferenceType.FACILITY_RESERVATION,
          },
          referenceContext: undefined,
          referenceResult: mockFacilityReservation,
        },
      },
      {
        name: 'should update payment successfully for PARKING_SUBSCRIPTION',
        input: {
          payment: {
            ...mockPayment,
            reference_type: PaymentReferenceType.PARKING_SUBSCRIPTION,
          },
          referenceContext: { parkingId: 'AjBfMRzDyXC8wbM4KHWb' },
          referenceResult: mockParkingSubscription,
        },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const { payment, referenceContext, referenceResult } = input;
      mockedFirebase.getTransaction
        .mockResolvedValueOnce(payment)
        .mockResolvedValueOnce(referenceResult);
      mockedFirebase.updateTransaction.mockResolvedValue(undefined as never);
      await updatePaymentStatus(
        '0BfJJphzrcrqv8idzNEJ',
        'AjBfMRzDyXC8wbM4KHWb',
        100000,
        PaymentServiceProvider.MOMO,
        true,
        referenceContext,
      );

      expect(mockedFirebase.updateTransaction).toHaveBeenCalledTimes(2);
      expect(mockedFirebase.updateTransaction).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(referenceCollectionMap[payment.reference_type]),
        expect.any(String),
        expect.objectContaining({
          payment_status: PaymentStatus.SUCCESS,
        }),
        expect.anything(),
      );

      expect(mockedFirebase.updateTransaction).toHaveBeenNthCalledWith(
        2,
        paymentCollection,
        '0BfJJphzrcrqv8idzNEJ',
        expect.objectContaining({
          status: PaymentStatus.SUCCESS,
        }),
        expect.anything(),
      );
    });
  });

  describe('error cases', () => {
    describe('reference not found', () => {
      const errorCases = [
        {
          name: 'should throw when ORDER not found',
          input: {
            payment: {
              ...mockPayment,
              reference_type: PaymentReferenceType.ORDER,
            },
            referenceContext: { restaurantId: '0BfJJphzrcrqv8idzNEJ' },
            referenceResult: null,
          },
          error: ErrorMessage.ORDER_NOT_FOUND,
        },
        {
          name: 'should throw when BUS_SUBSCRIPTION not found',
          input: {
            payment: {
              ...mockPayment,
              reference_type: PaymentReferenceType.BUS_SUBSCRIPTION,
            },
            referenceResult: null,
          },
          error: ErrorMessage.BUS_SUBSCRIPTION_NOT_FOUND,
        },
        {
          name: 'should throw when FACILITY_RESERVATION not found',
          input: {
            payment: {
              ...mockPayment,
              reference_type: PaymentReferenceType.FACILITY_RESERVATION,
            },
            referenceResult: null,
          },
          error: ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
        },
        {
          name: 'should throw when PARKING_SUBSCRIPTION not found',
          input: {
            payment: {
              ...mockPayment,
              reference_type: PaymentReferenceType.PARKING_SUBSCRIPTION,
            },
            referenceContext: { parkingId: '0BfJJphzrcrqv8idzNEJ' },
            referenceResult: null,
          },
          error: ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
        },
      ];

      test.each(errorCases)('$name', async ({ input, error }) => {
        const { payment, referenceContext, referenceResult } = input;
        mockedFirebase.getTransaction
          .mockResolvedValueOnce(payment)
          .mockResolvedValueOnce(referenceResult);

        await expect(
          updatePaymentStatus(
            '0BfJJphzrcrqv8idzNEJ',
            'AjBfMRzDyXC8wbM4KHWb',
            100000,
            PaymentServiceProvider.MOMO,
            true,
            referenceContext,
          ),
        ).rejects.toThrow(error);
      });
    });

    describe('transaction errors', () => {
      const errorCases = [
        {
          name: 'should throw when payment not found',
          input: {
            payment: null,
            referenceContext: undefined,
          },
          error: ErrorMessage.PAYMENT_NOT_FOUND,
        },
        {
          name: 'should throw when ORDER missing referenceContext',
          input: {
            payment: {
              ...mockPayment,
              reference_type: PaymentReferenceType.ORDER,
            },
            referenceContext: undefined,
          },
          error: ErrorMessage.MISSING_REFERENCE_CONTEXT,
        },
        {
          name: 'should throw when PARKING missing referenceContext',
          input: {
            payment: {
              ...mockPayment,
              reference_type: PaymentReferenceType.PARKING_SUBSCRIPTION,
            },
            referenceContext: undefined,
          },
          error: ErrorMessage.MISSING_REFERENCE_CONTEXT,
        },
        {
          name: 'should throw when reference type unsupported',
          input: {
            payment: {
              ...mockPayment,
              reference_type: 'UNKNOWN' as any,
            },
          },
          error: ErrorMessage.UNSUPPORTED_REFERENCE_TYPE,
        },
      ];

      test.each(errorCases)('$name', async ({ input, error }) => {
        const { payment, referenceContext } = input;
        mockedFirebase.getTransaction.mockResolvedValueOnce(payment);

        await expect(
          updatePaymentStatus(
            '0BfJJphzrcrqv8idzNEJ',
            'AjBfMRzDyXC8wbM4KHWb',
            100000,
            PaymentServiceProvider.MOMO,
            true,
            referenceContext,
          ),
        ).rejects.toThrow(error);
      });
    });

    test('should return when paymentId is empty', async () => {
      await updatePaymentStatus('' as any, 'svc', 1000, PaymentServiceProvider.MOMO, true);

      expect(mockedFirebase.runTransaction).not.toHaveBeenCalled();
    });

    test('should throw when transaction fails', async () => {
      mockedFirebase.runTransaction.mockRejectedValueOnce(new Error('tx error'));

      await expect(
        updatePaymentStatus('0BfJJphzrcrqv8idzNEJ', 'svc', 1000, PaymentServiceProvider.MOMO, true),
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    test('should return early when payment already SUCCESS', async () => {
      mockedFirebase.getTransaction.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.SUCCESS,
      });
      await updatePaymentStatus(
        '0BfJJphzrcrqv8idzNEJ',
        'AjBfMRzDyXC8wbM4KHWb',
        100000,
        PaymentServiceProvider.MOMO,
        true,
      );

      expect(mockedFirebase.updateTransaction).not.toHaveBeenCalled();
    });

    test('should update payment FAILED when isSuccess is false', async () => {
      mockedFirebase.getTransaction.mockResolvedValue(mockPayment);
      await updatePaymentStatus(
        '0BfJJphzrcrqv8idzNEJ',
        'AjBfMRzDyXC8wbM4KHWb',
        100000,
        PaymentServiceProvider.MOMO,
        false,
      );

      expect(mockedFirebase.updateTransaction).toHaveBeenCalledWith(
        paymentCollection,
        '0BfJJphzrcrqv8idzNEJ',
        expect.objectContaining({
          status: PaymentStatus.FAILED,
        }),
        expect.anything(),
      );
    });
  });
});

describe('getUserPayments()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return payments with totals',
        input: {
          payments: mockUserPayments,
        },
      },
      {
        name: 'should return empty payments',
        input: {
          payments: [],
        },
      },
      {
        name: 'should return payments when query from/to provided',
        input: {
          payments: mockUserPayments,
          query: {
            from: '2026-03-01',
            to: '2026-03-30',
          },
        },
      },
      {
        name: 'should handle undefined amount',
        input: {
          payments: [...mockUserPayments, { amount: undefined }],
        },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const { payments, query } = input;
      const req = mockReq(query);
      const res = mockRes();
      mockedFirebase.getDocsByFields.mockResolvedValue(payments as never);
      const response = await getUserPayments(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        paymentCollection,
        expect.arrayContaining([
          expect.objectContaining({
            field: 'user_id',
            operator: '==',
            value: req.user.uid,
          }),
          expect.objectContaining({
            field: 'transaction_time',
            operator: '>=',
          }),
          expect.objectContaining({
            field: 'transaction_time',
            operator: '<',
          }),
        ]),
      );

      const totalAmount = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const pointsEarned = Math.floor(totalAmount / POINTS_EARN_RATE);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.GET_PAYMENT, {
        payments,
        totalAmount,
        pointsEarned,
      });
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          payments,
          totalAmount,
          pointsEarned,
        }),
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq();
      const res = mockRes();
      mockedFirebase.getDocsByFields.mockRejectedValue(new Error('firestore error') as never);
      const response = await getUserPayments(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_PAYMENT,
        ErrorMessage.CANNOT_GET_PAYMENT,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_PAYMENT,
        message: ErrorMessage.CANNOT_GET_PAYMENT,
      });
    });
  });
});

describe('getPayment()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return payment when user is manager',
        input: {
          payment: mockPayment,
          user: { uid: 'DKta2KsiXYPLTM2r0RBskV6hmFM2', role: UserRole.MANAGER },
        },
      },
      {
        name: 'should return payment when user is owner',
        input: {
          payment: mockPayment,
          user: { uid: '2Wv3zE7vsianIJyrafPFJ98YWSj2', role: UserRole.USER },
        },
      },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const { payment, user } = input;
      const req = mockReq(undefined, user, { id: payment.id });
      const res = mockRes();
      mockedFirebase.getDocById.mockResolvedValue(payment as never);
      const response = await getPayment(req, res);

      expect(responseSuccess).toHaveBeenCalledWith(res, Message.GET_PAYMENT, {
        payment,
      });
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({ payment }),
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return PAYMENT_NOT_FOUND when payment does not exist',
        input: {
          payment: null,
          user: { uid: '2Wv3zE7vsianIJyrafPFJ98YWSj2', role: UserRole.USER },
        },
        error: {
          StatusCode: StatusCode.PAYMENT_NOT_FOUND,
          ErrorMessage: ErrorMessage.PAYMENT_NOT_FOUND,
        },
      },
      {
        name: 'should return PAYMENT_FORBIDDEN when user is not owner',
        input: {
          payment: { ...mockPayment, user_id: '2Wv3zE7vsianIJyrafPFJ98YWSj2' },
          user: { uid: 'DKta2KsiXYPLTM2r0RBskV6hmFM2', role: UserRole.USER },
        },
        error: {
          StatusCode: StatusCode.PAYMENT_FORBIDDEN,
          ErrorMessage: ErrorMessage.PAYMENT_FORBIDDEN,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, error }) => {
      const { payment, user } = input;
      const req = mockReq(undefined, user, { id: '0BfJJphzrcrqv8idzNEJ' });
      const res = mockRes();
      mockedFirebase.getDocById.mockResolvedValue(payment as never);
      const response = await getPayment(req, res);

      expect(responseError).toHaveBeenCalledWith(res, error.StatusCode, error.ErrorMessage);
      expect(response).toEqual({
        success: false,
        status: error.StatusCode,
        message: error.ErrorMessage,
      });
    });

    test('should handle firestore error', async () => {
      const req = mockReq(
        undefined,
        { uid: '2Wv3zE7vsianIJyrafPFJ98YWSj2' },
        { id: '0BfJJphzrcrqv8idzNEJ' },
      );
      const res = mockRes();
      mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error') as never);
      const response = await getPayment(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_PAYMENT,
        ErrorMessage.CANNOT_GET_PAYMENT,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_PAYMENT,
        message: ErrorMessage.CANNOT_GET_PAYMENT,
      });
    });
  });
});

describe('createPayment()', () => {
  const createPaymentReqRes = () => {
    const req = mockReq(undefined, { uid: '2Wv3zE7vsianIJyrafPFJ98YWSj2' }, undefined, {
      amount: 1000,
    });
    const res = mockRes();

    return { req, res };
  };

  describe('valid cases', () => {
    test('should create payment successfully', async () => {
      const { req, res } = createPaymentReqRes();
      mockedFirebase.getTransaction.mockResolvedValue(mockUser as never);
      mockedFirebase.setTransaction.mockResolvedValue(mockPayment);
      const response = await createPayment(req, res);

      expect(mockedFirebase.getTransaction).toHaveBeenCalled();
      expect(mockedFirebase.setTransaction).toHaveBeenCalledWith(
        paymentCollection,
        expect.objectContaining({
          user_id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
          status: PaymentStatus.PENDING,
        }),
        expect.anything(),
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.PAYMENT_CREATED, {
        id: '0BfJJphzrcrqv8idzNEJ',
      });
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({ id: '0BfJJphzrcrqv8idzNEJ' }),
      });
    });
  });

  describe('error cases', () => {
    test('should return USER_NOT_FOUND when user does not exist', async () => {
      const { req, res } = createPaymentReqRes();
      mockedFirebase.getTransaction.mockResolvedValue(null as never);
      const response = await createPayment(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.USER_NOT_FOUND,
        ErrorMessage.USER_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.USER_NOT_FOUND,
        message: ErrorMessage.USER_NOT_FOUND,
      });
    });

    test('should return CANNOT_CREATE_PAYMENT when transaction fails', async () => {
      const { req, res } = createPaymentReqRes();
      mockedFirebase.runTransaction.mockRejectedValue(new Error('firestore error'));
      const response = await createPayment(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_CREATE_PAYMENT,
        ErrorMessage.CANNOT_CREATE_PAYMENT,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_CREATE_PAYMENT,
        message: ErrorMessage.CANNOT_CREATE_PAYMENT,
      });
    });

    test('should return error when setTransaction fails', async () => {
      const { req, res } = createPaymentReqRes();
      mockedFirebase.getTransaction.mockResolvedValue({
        id: '2Wv3zE7vsianIJyrafPFJ98YWSj2',
      } as never);
      mockedFirebase.setTransaction.mockRejectedValue(new Error('fail'));
      const response = await createPayment(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_CREATE_PAYMENT,
        ErrorMessage.CANNOT_CREATE_PAYMENT,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_CREATE_PAYMENT,
        message: ErrorMessage.CANNOT_CREATE_PAYMENT,
      });
    });
  });
});
