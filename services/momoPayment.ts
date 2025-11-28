import axios from 'axios';
import { Request, Response } from 'express';
import { momoConfig } from '../configs/momo';
import {
  firebaseHelper,
  generateSignature,
  responseError,
  responseSuccess,
  logger,
} from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import {
  Collection,
  HmacAlgorithm,
  PaymentServiceProvider,
  PaymentStatus,
  Sites,
} from '../constants/enum';

const paymentCollection = `${Sites.TOKYO}/${Collection.PAYMENTS}`;

const updatePaymentStatus = async (paymentId: string, orderId: string, isSuccess: boolean) => {
  if (!paymentId) return;

  await firebaseHelper.updateDoc(paymentCollection, paymentId, {
    status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
    service_id: orderId,
    service_type: PaymentServiceProvider.MOMO,
    transaction_time: new Date(),
  });
};

const createMomoPayment = async (req: Request, res: Response) => {
  try {
    const {
      payment_id,
      amount,
      orderId = `ORDER_${Date.now()}`,
      orderInfo = `Order ID: ${orderId}`,
      requestId = Date.now().toString(),
      extraData = Buffer.from(JSON.stringify({ payment_id })).toString('base64'),
    } = req.body;
    const rawSignature =
      `accessKey=${momoConfig.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${momoConfig.ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${momoConfig.partnerCode}` +
      `&redirectUrl=${momoConfig.redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=payWithMethod`;
    const signature = generateSignature(rawSignature, momoConfig.secretKey!, HmacAlgorithm.SHA256);
    const payload = {
      partnerCode: momoConfig.partnerCode,
      partnerName: momoConfig.partnerName,
      storeId: 'MomoStore',
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
      requestType: 'payWithMethod',
      autoCapture: true,
      lang: 'en',
      extraData: extraData,
      signature: signature,
    };

    const response = await axios.post(momoConfig.endpoint!, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return responseSuccess(res, Message.MOMO_CREATED, response.data);
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_CREATE_MOMO_PAYMENT + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_MOMO_PAYMENT,
      ErrorMessage.CANNOT_CREATE_MOMO_PAYMENT,
    );
  }
};

const handleMomoCallback = async (req: Request, res: Response) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.query;
    const rawSignature =
      `accessKey=${momoConfig.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;
    const calculatedSignature = generateSignature(
      rawSignature,
      momoConfig.secretKey!,
      HmacAlgorithm.SHA256,
    );

    if (calculatedSignature !== signature) {
      return responseError(res, StatusCode.INVALID_SIGNATURE, ErrorMessage.INVALID_SIGNATURE);
    }

    const decoded = JSON.parse(Buffer.from(String(extraData), 'base64').toString());
    let paymentId = decoded.payment_id;

    if (!Number(resultCode)) {
      await updatePaymentStatus(paymentId, String(orderId), true);

      return responseSuccess(res, Message.PAYMENT_SUCCESSFUL);
    }

    await updatePaymentStatus(paymentId, String(orderId), false);

    return responseSuccess(res, Message.PAYMENT_FAILED);
  } catch (error) {
    logger.error(ErrorMessage.MOMO_CALLBACK_FAILED + error);

    return responseError(res, StatusCode.MOMO_CALLBACK_FAILED, ErrorMessage.MOMO_CALLBACK_FAILED);
  }
};

const handleMomoIpn = async (req: Request, res: Response) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;
    const rawSignature =
      `accessKey=${momoConfig.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;
    const calculatedSignature = generateSignature(
      rawSignature,
      momoConfig.secretKey!,
      HmacAlgorithm.SHA256,
    );

    if (calculatedSignature !== signature) {
      return responseError(res, StatusCode.INVALID_SIGNATURE, ErrorMessage.INVALID_SIGNATURE);
    }

    const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString());
    let paymentId = decoded.payment_id;

    if (!Number(resultCode)) {
      await updatePaymentStatus(paymentId, String(orderId), true);

      return responseSuccess(res, Message.PAYMENT_SUCCESSFUL);
    }

    await updatePaymentStatus(paymentId, String(orderId), false);

    return responseSuccess(res, Message.PAYMENT_FAILED);
  } catch (error) {
    logger.error(ErrorMessage.MOMO_IPN_CALLBACK_FAILED + error);

    return responseError(
      res,
      StatusCode.MOMO_IPN_CALLBACK_FAILED,
      ErrorMessage.MOMO_IPN_CALLBACK_FAILED,
    );
  }
};

export { createMomoPayment, handleMomoCallback, handleMomoIpn };
