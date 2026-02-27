import { Request, Response } from 'express';
import {
  Collection,
  PaymentServiceProvider,
  VnpayRspCode,
  Sites,
  PaymentReferenceType,
} from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { Payment, PaymentExtraData, PaymentReferenceContext } from '../interfaces/payment';
import { buildReferenceContext, updatePaymentStatus } from './payment';
import {
  firebaseHelper,
  generateSignature,
  responseError,
  responseSuccess,
  logger,
} from '../utils/index';
import qs from 'qs';
import moment from 'moment';
import * as ENV from '../configs/envConfig';

const paymentCollection = `${Sites.TOKYO}/${Collection.PAYMENTS}`;
export const createVnpayUrl = async (req: Request, res: Response) => {
  try {
    const { payment_id: paymentId, return_url: returnUrl, amount } = req.body;
    const payment: Payment = await firebaseHelper.getDocById(paymentCollection, paymentId);
    if (!payment)
      return responseError(res, StatusCode.PAYMENT_NOT_FOUND, ErrorMessage.PAYMENT_NOT_FOUND);

    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (Array.isArray(ipAddr)) {
      ipAddr = ipAddr[0];
    } else if (typeof ipAddr !== 'string') {
      ipAddr = '';
    }

    const referenceContext: PaymentReferenceContext = buildReferenceContext(
      payment.reference_type,
      returnUrl,
    );
    const extraData = Buffer.from(
      JSON.stringify({ paymentId, returnUrl, referenceContext }),
    ).toString('base64');
    const createDate = moment(new Date()).format('YYYYMMDDHHmmss');
    const tmnCode = ENV.VNP_TMN_CODE ?? '';
    const secretKey = ENV.VNP_HASH_SECRET ?? '';
    const vnpUrl = ENV.VNP_URL ?? '';
    const vnpReturnUrl = ENV.VNP_RETURN_URL ?? '';
    let params: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: `ORDER_${Date.now()}`,
      vnp_OrderInfo: extraData,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: encodeURIComponent(vnpReturnUrl),
      vnp_IpAddr: encodeURIComponent(ipAddr),
      vnp_CreateDate: createDate,
    };
    params = sortObject(params);
    const signData = qs.stringify(params, { encode: false });
    const signed = generateSignature(signData, secretKey);
    params.vnp_SecureHash = signed;
    const queryString = qs.stringify(params, { encode: false });

    return responseSuccess(res, Message.PAYMENT_URL_CREATED, {
      payUrl: `${vnpUrl}?${queryString}`,
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
    const secretKey = ENV.VNP_HASH_SECRET ?? '';
    const secureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    const signData = qs.stringify(sortObject(query), { encode: false });
    const signed = generateSignature(signData, secretKey);
    if (secureHash !== signed) {
      logger.warn(ErrorMessage.INVALID_SIGNATURE);

      return responseError(res, StatusCode.INVALID_SIGNATURE, ErrorMessage.INVALID_SIGNATURE);
    }

    const serviceId = query['vnp_TxnRef'];
    const rspCode = query['vnp_ResponseCode'];
    const orderInfo = query['vnp_OrderInfo'];
    if (!orderInfo) {
      logger.warn(ErrorMessage.MISSING_PAYMENT_INFO);

      return responseError(res, StatusCode.MISSING_PAYMENT_INFO, ErrorMessage.MISSING_PAYMENT_INFO);
    }

    const decoded = JSON.parse(
      Buffer.from(String(orderInfo), 'base64').toString(),
    ) as PaymentExtraData;
    const { paymentId, returnUrl, referenceContext } = decoded;
    const amount = Number(query['vnp_Amount']) / 100;
    const payment: Payment = await firebaseHelper.getDocById(paymentCollection, paymentId);
    if (!payment) {
      return responseError(res, StatusCode.PAYMENT_NOT_FOUND, ErrorMessage.PAYMENT_NOT_FOUND);
    }

    let url = new URL(returnUrl);
    url.searchParams.set('payment_id', paymentId);
    if (rspCode === VnpayRspCode.SUCCESS) {
      await updatePaymentStatus(
        paymentId,
        serviceId,
        amount,
        PaymentServiceProvider.VNPAY,
        true,
        referenceContext,
      );
      url.searchParams.set('payment', 'success');

      return res.redirect(url.toString());
    }

    await updatePaymentStatus(paymentId, serviceId, amount, PaymentServiceProvider.VNPAY, false);
    url.searchParams.set('payment', 'failed');

    return res.redirect(url.toString());
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
    const vnp_HashSecret = ENV.VNP_HASH_SECRET ?? '';
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
    const amount = Number(query['vnp_Amount']) / 100;
    const payment: Payment = await firebaseHelper.getDocById(paymentCollection, paymentId);
    if (!payment) {
      return responseError(res, StatusCode.PAYMENT_NOT_FOUND, ErrorMessage.PAYMENT_NOT_FOUND);
    }

    if (rspCode === VnpayRspCode.SUCCESS) {
      await updatePaymentStatus(paymentId, serviceId, amount, PaymentServiceProvider.VNPAY, true);

      return res.send({ RspCode: rspCode, Message: Message.PAYMENT_SUCCESSFUL });
    }

    await updatePaymentStatus(paymentId, serviceId, amount, PaymentServiceProvider.VNPAY, false);

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
