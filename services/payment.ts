import { Response } from 'express';
import {
  Collection,
  PaymentServiceProvider,
  PaymentStatus,
  Sites,
  UserRole,
} from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { Payment } from '../interfaces/payment';
import { User } from '../interfaces/user';
import { firebaseHelper, responseError, responseSuccess, logger } from '../utils/index';

const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;
const paymentCollection = `${Sites.TOKYO}/${Collection.PAYMENTS}`;
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = await firebaseHelper.runTransaction(async (transaction) => {
      const user: User =
        req.user?.uid &&
        (await firebaseHelper.getTransaction(userCollection, req.user.uid, transaction));
      if (!user) throw new Error(ErrorMessage.USER_NOT_FOUND);

      const paymentData: Payment = {
        ...req.body,
        user_id: user.id,
        status: PaymentStatus.PENDING,
        transaction_time: new Date(),
      };
      const payment = await firebaseHelper.setTransaction(
        paymentCollection,
        paymentData,
        transaction,
      );

      return payment.id;
    });

    return responseSuccess(res, Message.PAYMENT_CREATED, { id: paymentId });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_CREATE_PAYMENT} | ${error}`);

    switch (error.message) {
      case ErrorMessage.USER_NOT_FOUND:
        return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);

      default:
        return responseError(
          res,
          StatusCode.CANNOT_CREATE_PAYMENT,
          ErrorMessage.CANNOT_CREATE_PAYMENT,
        );
    }
  }
};

export const getPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payment: Payment = await firebaseHelper.getDocById(paymentCollection, id);
    if (!payment) {
      return responseError(res, StatusCode.PAYMENT_NOT_FOUND, ErrorMessage.PAYMENT_NOT_FOUND);
    }

    if (req.user?.roles !== UserRole.MANAGER && payment.user_id !== req.user?.uid) {
      return responseError(res, StatusCode.PAYMENT_FORBIDDEN, ErrorMessage.PAYMENT_FORBIDDEN);
    }

    return responseSuccess(res, Message.GET_PAYMENT, { payment });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_PAYMENT} | ${error}`);

    return responseError(res, StatusCode.CANNOT_GET_PAYMENT, ErrorMessage.CANNOT_GET_PAYMENT);
  }
};

export const updatePaymentStatus = async (
  paymentId: string,
  orderId: string,
  amount: number,
  provider: PaymentServiceProvider,
  isSuccess: boolean,
) => {
  if (!paymentId) return;

  await firebaseHelper.updateDoc(paymentCollection, paymentId, {
    status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
    amount,
    service_id: orderId,
    service_type: provider,
    transaction_time: new Date(),
  });
};
