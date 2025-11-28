import { Request, Response } from 'express';
import { Collection, PaymentServiceProvider, VnpayRspCode, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { Payment } from '../interfaces/payment';
import { updatePaymentStatus } from './payment';
import {
  firebaseHelper,
  generateSignature,
  responseError,
  responseSuccess,
  logger,
} from '../utils/index';
import qs from 'qs';
import moment from 'moment';

const paymentCollection = `${Sites.TOKYO}/${Collection.PAYMENTS}`;
export const createVnpayUrl = async (req: Request, res: Response) => {
  try {
    const { payment_id: paymentId } = req.body;
    const payment: Payment = await firebaseHelper.getDocById(paymentCollection, paymentId);
    if (!payment)
      return responseError(res, StatusCode.PAYMENT_NOT_FOUND, ErrorMessage.PAYMENT_NOT_FOUND);

    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (Array.isArray(ipAddr)) {
      ipAddr = ipAddr[0];
    } else if (typeof ipAddr !== 'string') {
      ipAddr = '';
    }

    const createDate = moment(new Date()).format('YYYYMMDDHHmmss');
    const tmnCode = process.env.VNP_TMN_CODE ?? '';
    const secretKey = process.env.VNP_HASH_SECRET ?? '';
    const vnpUrl = process.env.VNP_URL ?? '';
    const returnUrl = process.env.VNP_RETURN_URL ?? '';

    let params: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: `ORDER_${Date.now()}`,
      vnp_OrderInfo: `Payment_${payment.id}`,
      vnp_OrderType: 'other',
      vnp_Amount: req.body.amount * 100,
      vnp_ReturnUrl: encodeURIComponent(returnUrl),
      vnp_IpAddr: encodeURIComponent(ipAddr),
      vnp_CreateDate: createDate,
    };
    params = sortObject(params);
    const signData = qs.stringify(params, { encode: false });
    const signed = generateSignature(signData, secretKey);
    params.vnp_SecureHash = signed;
    const queryString = qs.stringify(params, { encode: false });

    return responseSuccess(res, Message.PAYMENT_URL_CREATED, {
      payment_url: `${vnpUrl}?${queryString}`,
      id: paymentId,
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_CREATE_VNPAY_PAYMENT_URL} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_VNPAY_PAYMENT_URL,
      ErrorMessage.CANNOT_CREATE_VNPAY_PAYMENT_URL,
    );
  }
};

export const vnpayReturnHandler = async (req: Request, res: Response) => {
  try {
    const query = { ...req.query } as Record<string, string>;
    const vnp_HashSecret = process.env.VNP_HASH_SECRET ?? '';
    const secureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    const signData = qs.stringify(sortObject(query), { encode: false });
    const signed = generateSignature(signData, vnp_HashSecret);
    if (secureHash !== signed) {
      logger.warn(ErrorMessage.INVALID_SIGNATURE);

      return responseError(res, StatusCode.INVALID_SIGNATURE, ErrorMessage.INVALID_SIGNATURE);
    }

    const serviceId = query['vnp_TxnRef'];
    const rspCode = query['vnp_ResponseCode'];
    const orderInfo = query['vnp_OrderInfo'];
    const paymentId = orderInfo.split('Payment_')[1];
    const payment: Payment = await firebaseHelper.getDocById(paymentCollection, paymentId);
    if (!payment) {
      return responseError(res, StatusCode.PAYMENT_NOT_FOUND, ErrorMessage.PAYMENT_NOT_FOUND);
    }

    if (rspCode === VnpayRspCode.SUCCESS) {
      await updatePaymentStatus(paymentId, serviceId, PaymentServiceProvider.VNPAY, true);

      return responseSuccess(res, Message.PAYMENT_SUCCESSFUL);
    }

    await updatePaymentStatus(paymentId, serviceId, PaymentServiceProvider.VNPAY, false);

    return responseSuccess(res, Message.PAYMENT_FAILED);
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_CALL_BACK_VNPAY_PAYMENT} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_CALL_BACK_VNPAY_PAYMENT,
      ErrorMessage.CANNOT_CALL_BACK_VNPAY_PAYMENT,
    );
  }
};

export const vnpayIpnHandler = async (req: Request, res: Response) => {
  try {
    const query = { ...req.query } as Record<string, string>;
    const vnp_HashSecret = process.env.VNP_HASH_SECRET ?? '';
    const secureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    const signData = qs.stringify(sortObject(query), { encode: false });
    const signed = generateSignature(signData, vnp_HashSecret);
    if (secureHash !== signed) {
      logger.warn(ErrorMessage.INVALID_SIGNATURE);

      return res.send({
        RspCode: VnpayRspCode.INVALID_SIGNATURE,
        Message: ErrorMessage.INVALID_SIGNATURE,
      });
    }

    const serviceId = query['vnp_TxnRef'];
    const rspCode = query['vnp_ResponseCode'];
    const orderInfo = query['vnp_OrderInfo'];
    const paymentId = orderInfo.split('Payment_')[1];
    const payment: Payment = await firebaseHelper.getDocById(paymentCollection, paymentId);
    if (!payment) {
      return responseError(res, StatusCode.PAYMENT_NOT_FOUND, ErrorMessage.PAYMENT_NOT_FOUND);
    }

    if (rspCode === VnpayRspCode.SUCCESS) {
      await updatePaymentStatus(paymentId, serviceId, PaymentServiceProvider.VNPAY, true);

      return res.send({ RspCode: rspCode, Message: Message.PAYMENT_SUCCESSFUL });
    }

    await updatePaymentStatus(paymentId, serviceId, PaymentServiceProvider.VNPAY, false);

    return res.send({ RspCode: rspCode, Message: Message.PAYMENT_FAILED });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_CALL_BACK_VNPAY_IPN} | ${error}`);

    return res.send({
      RspCode: VnpayRspCode.SYSTEM_ERROR,
      Message: ErrorMessage.CANNOT_CALL_BACK_VNPAY_IPN,
    });
  }
};

const sortObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sorted = {} as T;
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    (sorted as Record<string, unknown>)[key] = obj[key];
  });
  return sorted;
};
