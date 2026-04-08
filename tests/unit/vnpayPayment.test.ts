import {
  Collection,
  PaymentReferenceType,
  PaymentServiceProvider,
  Sites,
  VnpayRspCode,
} from '../../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../../constants/message';
import { firebaseHelper, logger, responseSuccess, responseError } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import { MOCK_MOMENT, MOCK_NOW, MOCK_SIGNATURE, mockPayment } from '../data/payment';
import { createVnpayUrl, vnpayIpnHandler, vnpayReturnHandler } from '../../services/vnpayPayment';
import * as paymentService from '../../services/payment';
import * as ENV from '../../configs/envConfig';
import { generateSignatureMock } from '../helpers/utilMock';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedLogger = jest.mocked(logger);
beforeEach(() => {
  jest.clearAllMocks();
});

const paymentCollection = `${Sites.TOKYO}/${Collection.PAYMENTS}`;
const mockBody = {
  payment_id: '0BfJJphzrcrqv8idzNEJ',
  return_url: 'https://test.com?restaurantId=2gJJVHyg5htfu2kYEvHa',
  amount: 100000,
};

describe('createVnpayUrl()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should create vnpay url successfully',
        input: {
          body: mockBody,
          firebasePayment: mockPayment,
        },
        expected: {
          returnUrl: mockBody.return_url,
          referenceContext: {
            restaurantId: '2gJJVHyg5htfu2kYEvHa',
          },
        },
      },
      {
        name: 'should create vnpay url successfully without reference context',
        input: {
          body: { ...mockBody, return_url: 'https://test.com' },
          firebasePayment: {
            ...mockPayment,
            reference_type: PaymentReferenceType.BUS_SUBSCRIPTION,
          },
        },
        expected: {
          returnUrl: 'https://test.com',
          referenceContext: null,
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      mockedFirebase.getDocById.mockResolvedValue(input.firebasePayment);

      const req = mockReq({ body: input.body });
      const res = mockRes();
      const response: any = await createVnpayUrl(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(
        paymentCollection,
        '0BfJJphzrcrqv8idzNEJ',
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.PAYMENT_URL_CREATED,
        expect.objectContaining({
          payUrl: expect.any(String),
          id: mockBody.payment_id,
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockBody.payment_id,
          payUrl: expect.any(String),
        }),
      });

      const url = new URL(response.data.payUrl);
      const params = Object.fromEntries([...url.searchParams.entries()]);
      const orderInfo = JSON.parse(Buffer.from(params.vnp_OrderInfo, 'base64').toString());

      expect(params.vnp_SecureHash).toBeDefined();
      expect(params).toMatchObject({
        vnp_Amount: '10000000',
        vnp_CreateDate: MOCK_MOMENT,
        vnp_TxnRef: `ORDER_${MOCK_NOW}`,
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_CurrCode: 'VND',
      });
      expect(orderInfo).toEqual({
        paymentId: '0BfJJphzrcrqv8idzNEJ',
        returnUrl: expected.returnUrl,
        referenceContext: expected.referenceContext,
      });
    });

    test('should handle x-forwarded-for as array', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockPayment);

      const req = mockReq({ body: mockBody });
      req.headers['x-forwarded-for'] = ['1.1.1.1', '2.2.2.2'];
      const res = mockRes();
      const response: any = await createVnpayUrl(req, res);

      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.PAYMENT_URL_CREATED,
        expect.objectContaining({
          payUrl: expect.any(String),
          id: mockBody.payment_id,
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockBody.payment_id,
          payUrl: expect.any(String),
        }),
      });
      expect(response.data.payUrl).toContain(encodeURIComponent('1.1.1.1'));
    });

    test('should set empty ip when ipAddr invalid', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockPayment);

      const req = mockReq({ body: mockBody });
      req.headers['x-forwarded-for'] = {} as any;
      const res = mockRes();
      const response: any = await createVnpayUrl(req, res);

      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.PAYMENT_URL_CREATED,
        expect.objectContaining({
          payUrl: expect.any(String),
          id: mockBody.payment_id,
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockBody.payment_id,
          payUrl: expect.any(String),
        }),
      });
      expect(response.data.payUrl).toContain('vnp_IpAddr=');
    });

    test('should use remoteAddress when x-forwarded-for missing', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockPayment);

      const req = mockReq({ body: mockBody });
      req.socket.remoteAddress = '9.9.9.9';
      delete req.headers['x-forwarded-for'];

      const res = mockRes();
      const response: any = await createVnpayUrl(req, res);

      expect(response.data.payUrl).toContain(encodeURIComponent('9.9.9.9'));
    });

    test('should fallback when ENV variables missing', async () => {
      await jest.isolateModulesAsync(async () => {
        jest.doMock('../../configs/envConfig', () => ({
          VNP_TMN_CODE: undefined,
          VNP_HASH_SECRET: undefined,
          VNP_URL: undefined,
          VNP_RETURN_URL: undefined,
        }));

        jest.doMock('../../utils/firebaseHelper', () => ({
          getDocById: jest.fn().mockResolvedValue({
            ...mockPayment,
            reference_type: PaymentReferenceType.BUS_SUBSCRIPTION,
          }),
        }));

        const { createVnpayUrl } = await import('../../services/vnpayPayment');

        const req = mockReq({ body: mockBody });
        const res = mockRes();
        const response: any = await createVnpayUrl(req, res);
        const payUrl = response.data.payUrl;

        expect(generateSignatureMock).toHaveBeenCalledWith(expect.anything(), '');
        expect(payUrl.startsWith('?')).toBe(true);

        const url = new URL(payUrl, 'https://dummy.com');
        const params = Object.fromEntries([...url.searchParams.entries()]);

        expect(params.vnp_TmnCode ?? '').toBe('');
        expect(params.vnp_ReturnUrl ?? '').toBe('');
      });
    });
  });

  describe('error cases', () => {
    test('should return error when payment not found', async () => {
      mockedFirebase.getDocById.mockResolvedValue(null);

      const req = mockReq({ body: { payment_id: '0BfJJphzrcrqv8idzNEJ' } });
      const res = mockRes();
      const response = await createVnpayUrl(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(
        paymentCollection,
        '0BfJJphzrcrqv8idzNEJ',
      );
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.PAYMENT_NOT_FOUND,
        ErrorMessage.PAYMENT_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.PAYMENT_NOT_FOUND,
        message: ErrorMessage.PAYMENT_NOT_FOUND,
      });
    });

    test('should return error when exception occurs', async () => {
      mockedFirebase.getDocById.mockRejectedValue(new Error('db error'));

      const req = mockReq({ body: mockBody });
      const res = mockRes();
      const response = await createVnpayUrl(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_CREATE_VNPAY_PAYMENT_URL,
        ErrorMessage.CANNOT_CREATE_VNPAY_PAYMENT_URL,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_CREATE_VNPAY_PAYMENT_URL,
        message: ErrorMessage.CANNOT_CREATE_VNPAY_PAYMENT_URL,
      });
    });
  });
});

describe('vnpayReturnHandler()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should redirect success when payment success',
        input: {
          rspCode: VnpayRspCode.SUCCESS,
        },
        expected: {
          paymentResult: 'success',
          successFlag: true,
        },
      },
      {
        name: 'should redirect failed when payment failed',
        input: {
          rspCode: VnpayRspCode.SYSTEM_ERROR,
        },
        expected: {
          paymentResult: 'failed',
          successFlag: false,
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      mockedFirebase.getDocById.mockResolvedValue(mockPayment);
      jest.spyOn(paymentService, 'updatePaymentStatus').mockResolvedValue(undefined);

      const orderInfo = Buffer.from(
        JSON.stringify({
          paymentId: '0BfJJphzrcrqv8idzNEJ',
          returnUrl: 'https://test.com',
          referenceContext: null,
        }),
      ).toString('base64');
      const req = mockReq({
        query: {
          vnp_ResponseCode: input.rspCode,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_OrderInfo: orderInfo,
          vnp_SecureHash: MOCK_SIGNATURE,
        },
      });

      const res = mockRes();
      const response = await vnpayReturnHandler(req, res);
      const call = (paymentService.updatePaymentStatus as jest.Mock).mock.calls[0];

      expect(call[0]).toBe('0BfJJphzrcrqv8idzNEJ');
      expect(call[1]).toBe(`ORDER_${MOCK_NOW}`);
      expect(call[2]).toBe(100000);
      expect(call[3]).toBe(PaymentServiceProvider.VNPAY);
      expect(call[4]).toBe(expected.successFlag);
      expect(res.redirect).toHaveBeenCalledTimes(1);
      expect(response).toContain(`payment=${expected.paymentResult}`);
      expect(response).toContain('payment_id=0BfJJphzrcrqv8idzNEJ');
    });
  });

  describe('error cases', () => {
    test('should return error when signature invalid', async () => {
      const orderInfo = Buffer.from(
        JSON.stringify({
          paymentId: '0BfJJphzrcrqv8idzNEJ',
          returnUrl: 'https://test.com',
          referenceContext: null,
        }),
      ).toString('base64');
      const req = mockReq({
        query: {
          vnp_ResponseCode: VnpayRspCode.SUCCESS,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_OrderInfo: orderInfo,
          vnp_SecureHash: 'wrong_signature',
        },
      });
      const res = mockRes();
      const response = await vnpayReturnHandler(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.INVALID_SIGNATURE,
        ErrorMessage.INVALID_SIGNATURE,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.INVALID_SIGNATURE,
        message: ErrorMessage.INVALID_SIGNATURE,
      });
    });

    test('should fallback empty secret and call generateSignature with empty string', async () => {
      await jest.isolateModulesAsync(async () => {
        jest.doMock('../../configs/envConfig', () => ({
          VNP_HASH_SECRET: undefined,
        }));

        const { vnpayReturnHandler } = await import('../../services/vnpayPayment');

        const orderInfo = Buffer.from(
          JSON.stringify({
            paymentId: '0BfJJphzrcrqv8idzNEJ',
            returnUrl: 'https://test.com',
            referenceContext: null,
          }),
        ).toString('base64');
        const req = mockReq({
          query: {
            vnp_ResponseCode: VnpayRspCode.SUCCESS,
            vnp_TxnRef: `ORDER_${MOCK_NOW}`,
            vnp_Amount: '10000000',
            vnp_OrderInfo: orderInfo,
            vnp_SecureHash: MOCK_SIGNATURE,
          },
        });
        const res = mockRes();
        await vnpayReturnHandler(req, res);

        expect(generateSignatureMock).toHaveBeenCalledWith(expect.anything(), '');
      });
    });

    test('should return error when missing orderInfo', async () => {
      const req = mockReq({
        query: {
          vnp_ResponseCode: VnpayRspCode.SUCCESS,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_SecureHash: MOCK_SIGNATURE,
        },
      });
      const res = mockRes();
      const response = await vnpayReturnHandler(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.MISSING_PAYMENT_INFO,
        ErrorMessage.MISSING_PAYMENT_INFO,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.MISSING_PAYMENT_INFO,
        message: ErrorMessage.MISSING_PAYMENT_INFO,
      });
    });

    test('should return error when payment not found', async () => {
      mockedFirebase.getDocById.mockResolvedValue(null);

      const orderInfo = Buffer.from(
        JSON.stringify({
          paymentId: '0BfJJphzrcrqv8idzNEJ',
          returnUrl: 'https://test.com',
          referenceContext: null,
        }),
      ).toString('base64');
      const req = mockReq({
        query: {
          vnp_ResponseCode: VnpayRspCode.SUCCESS,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_OrderInfo: orderInfo,
          vnp_SecureHash: MOCK_SIGNATURE,
        },
      });
      const res = mockRes();
      const response = await vnpayReturnHandler(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.PAYMENT_NOT_FOUND,
        ErrorMessage.PAYMENT_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.PAYMENT_NOT_FOUND,
        message: ErrorMessage.PAYMENT_NOT_FOUND,
      });
    });

    test('should return error when exception occurs', async () => {
      mockedFirebase.getDocById.mockRejectedValue(new Error('firebase error'));

      const orderInfo = Buffer.from(
        JSON.stringify({
          paymentId: '0BfJJphzrcrqv8idzNEJ',
          returnUrl: 'https://test.com',
          referenceContext: null,
        }),
      ).toString('base64');
      const req = mockReq({
        query: {
          vnp_ResponseCode: VnpayRspCode.SUCCESS,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_OrderInfo: orderInfo,
          vnp_SecureHash: MOCK_SIGNATURE,
        },
      });
      const res = mockRes();
      const response = await vnpayReturnHandler(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_CALL_BACK_VNPAY_PAYMENT,
        ErrorMessage.CANNOT_CALL_BACK_VNPAY_PAYMENT,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_CALL_BACK_VNPAY_PAYMENT,
        message: ErrorMessage.CANNOT_CALL_BACK_VNPAY_PAYMENT,
      });
    });
  });
});

describe('vnpayIpnHandler()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return success when payment success',
        input: {
          rspCode: VnpayRspCode.SUCCESS,
        },
        expected: {
          message: Message.PAYMENT_SUCCESSFUL,
          successFlag: true,
        },
      },
      {
        name: 'should return failed when payment failed',
        input: {
          rspCode: VnpayRspCode.SYSTEM_ERROR,
        },
        expected: {
          message: Message.PAYMENT_FAILED,
          successFlag: false,
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      mockedFirebase.getDocById.mockResolvedValue(mockPayment);
      jest.spyOn(paymentService, 'updatePaymentStatus').mockResolvedValue(undefined);

      const req = mockReq({
        query: {
          vnp_ResponseCode: input.rspCode,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_OrderInfo: 'Payment_0BfJJphzrcrqv8idzNEJ',
          vnp_SecureHash: MOCK_SIGNATURE,
        },
      });
      const res = mockRes();
      const response = await vnpayIpnHandler(req, res);
      const call = (paymentService.updatePaymentStatus as jest.Mock).mock.calls[0];

      expect(call[0]).toBe('0BfJJphzrcrqv8idzNEJ');
      expect(call[1]).toBe(`ORDER_${MOCK_NOW}`);
      expect(call[2]).toBe(100000);
      expect(call[3]).toBe(PaymentServiceProvider.VNPAY);
      expect(call[4]).toBe(expected.successFlag);
      expect(res.send).toHaveBeenCalledTimes(1);
      expect(response).toEqual({
        RspCode: input.rspCode,
        Message: expected.message,
      });
    });
  });

  describe('error cases', () => {
    test('should return error when signature invalid', async () => {
      const req = mockReq({
        query: {
          vnp_ResponseCode: VnpayRspCode.SUCCESS,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_OrderInfo: 'Payment_0BfJJphzrcrqv8idzNEJ',
          vnp_SecureHash: 'wrong_signature',
        },
      });
      const res = mockRes();
      const response = await vnpayIpnHandler(req, res);

      expect(mockedLogger.warn).toHaveBeenCalledWith(ErrorMessage.INVALID_SIGNATURE);
      expect(response).toEqual({
        RspCode: VnpayRspCode.INVALID_SIGNATURE,
        Message: ErrorMessage.INVALID_SIGNATURE,
      });
    });

    test('should fallback empty secret and call generateSignature with empty string', async () => {
      await jest.isolateModulesAsync(async () => {
        jest.doMock('../../configs/envConfig', () => ({
          VNP_HASH_SECRET: undefined,
        }));

        const { vnpayIpnHandler } = await import('../../services/vnpayPayment');

        const orderInfo = Buffer.from(
          JSON.stringify({
            paymentId: '0BfJJphzrcrqv8idzNEJ',
            returnUrl: 'https://test.com',
            referenceContext: null,
          }),
        ).toString('base64');
        const req = mockReq({
          query: {
            vnp_ResponseCode: VnpayRspCode.SUCCESS,
            vnp_TxnRef: `ORDER_${MOCK_NOW}`,
            vnp_Amount: '10000000',
            vnp_OrderInfo: orderInfo,
            vnp_SecureHash: MOCK_SIGNATURE,
          },
        });
        const res = mockRes();
        await vnpayIpnHandler(req, res);

        expect(generateSignatureMock).toHaveBeenCalledWith(expect.anything(), '');
      });
    });

    test('should return error when payment not found', async () => {
      mockedFirebase.getDocById.mockResolvedValue(null);

      const req = mockReq({
        query: {
          vnp_ResponseCode: VnpayRspCode.SUCCESS,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_OrderInfo: 'Payment_0BfJJphzrcrqv8idzNEJ',
          vnp_SecureHash: MOCK_SIGNATURE,
        },
      });
      const res = mockRes();
      const response = await vnpayIpnHandler(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.PAYMENT_NOT_FOUND,
        ErrorMessage.PAYMENT_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.PAYMENT_NOT_FOUND,
        message: ErrorMessage.PAYMENT_NOT_FOUND,
      });
    });

    test('should return error when exception occurs', async () => {
      mockedFirebase.getDocById.mockRejectedValue(new Error('firebase error'));

      const req = mockReq({
        query: {
          vnp_ResponseCode: VnpayRspCode.SUCCESS,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_OrderInfo: 'Payment_0BfJJphzrcrqv8idzNEJ',
          vnp_SecureHash: MOCK_SIGNATURE,
        },
      });
      const res = mockRes();
      await vnpayIpnHandler(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({
        RspCode: VnpayRspCode.SYSTEM_ERROR,
        Message: ErrorMessage.CANNOT_CALL_BACK_VNPAY_IPN,
      });
    });

    test('should catch error when updatePaymentStatus throws', async () => {
      mockedFirebase.getDocById.mockResolvedValue(mockPayment);

      jest
        .spyOn(paymentService, 'updatePaymentStatus')
        .mockRejectedValue(new Error('update error'));

      const req = mockReq({
        query: {
          vnp_ResponseCode: VnpayRspCode.SUCCESS,
          vnp_TxnRef: `ORDER_${MOCK_NOW}`,
          vnp_Amount: '10000000',
          vnp_OrderInfo: 'Payment_0BfJJphzrcrqv8idzNEJ',
          vnp_SecureHash: MOCK_SIGNATURE,
        },
      });
      const res = mockRes();
      const response = await vnpayIpnHandler(req, res);
      expect(response).toEqual({
        RspCode: VnpayRspCode.SYSTEM_ERROR,
        Message: ErrorMessage.CANNOT_CALL_BACK_VNPAY_IPN,
      });
    });
  });
});
