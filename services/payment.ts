import { Response } from 'express';
import { Collection, PaymentStatus, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { Payment } from '../interfaces/payment';
import { User } from '../interfaces/user';
import { firebaseHelper, responseError, responseSuccess } from '../utils/index';
import logger from '../utils/logger';

const userUrl = `${Sites.TOKYO}/${Collection.USERS}`;
const paymentUrl = `${Sites.TOKYO}/${Collection.PAYMENTS}`;
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = await firebaseHelper.runTransaction(async (transaction) => {
      const user: User =
        req.user?.uid && (await firebaseHelper.getTransaction(userUrl, req.user.uid, transaction));
      if (!user) return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);

      const paymentData: Payment = {
        ...req.body,
        user_id: user.uid,
        status: PaymentStatus.PENDING,
        transaction_time: new Date(),
      };
      const payment: Payment = await firebaseHelper.setTransaction(
        paymentUrl,
        paymentData,
        transaction,
      );

      return payment.id;
    });

    return responseSuccess(res, Message.PAYMENT_CREATED, { id: paymentId });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_CREATE_PAYMENT} | ${error}`);

    return responseError(res, StatusCode.CANNOT_CREATE_PAYMENT, ErrorMessage.CANNOT_CREATE_PAYMENT);
  }
};
