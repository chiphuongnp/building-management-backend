import { Response } from 'express';
import {
  Collection,
  PaymentReferenceType,
  PaymentServiceProvider,
  PaymentStatus,
  Sites,
  UserRole,
} from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { Payment, PaymentReferenceContext } from '../interfaces/payment';
import { User } from '../interfaces/user';
import {
  firebaseHelper,
  responseError,
  responseSuccess,
  logger,
  getThisMonth,
} from '../utils/index';
import { Timestamp } from 'firebase-admin/firestore';
import { POINTS_EARN_RATE } from '../constants/constant';

const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;
const paymentCollection = `${Sites.TOKYO}/${Collection.PAYMENTS}`;
const restaurantCollection = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const busSubscriptionCollection = `${Sites.TOKYO}/${Collection.BUS_SUBSCRIPTIONS}`;
const facilityReservationCollection = `${Sites.TOKYO}/${Collection.FACILITY_RESERVATIONS}`;
const parkingCollection = `${Sites.TOKYO}/${Collection.PARKING_SPACES}`;
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
  } catch (error: any) {
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

    if (req.user?.role !== UserRole.MANAGER && payment.user_id !== req.user?.uid) {
      return responseError(res, StatusCode.PAYMENT_FORBIDDEN, ErrorMessage.PAYMENT_FORBIDDEN);
    }

    return responseSuccess(res, Message.GET_PAYMENT, { payment });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_PAYMENT} | ${error}`);

    return responseError(res, StatusCode.CANNOT_GET_PAYMENT, ErrorMessage.CANNOT_GET_PAYMENT);
  }
};

export const getUserPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    const startTime = from ? new Date(from as string) : getThisMonth();
    const endTime = to ? new Date(to as string) : new Date();
    const payments: Payment[] = await firebaseHelper.getDocsByFields(paymentCollection, [
      { field: 'transaction_time', operator: '>=', value: Timestamp.fromDate(startTime) },
      { field: 'transaction_time', operator: '<', value: Timestamp.fromDate(endTime) },
      { field: 'status', operator: '==', value: PaymentStatus.SUCCESS },
      { field: 'user_id', operator: '==', value: req.user?.uid },
    ]);
    if (!payments.length) {
      return responseSuccess(res, Message.GET_PAYMENT, {
        payments: [],
        totalAmount: 0,
        pointsEarned: 0,
      });
    }

    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pointsEarned = Math.floor(totalAmount / POINTS_EARN_RATE);

    return responseSuccess(res, Message.GET_PAYMENT, {
      payments,
      totalAmount,
      pointsEarned,
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_PAYMENT} | ${error}`);

    return responseError(res, StatusCode.CANNOT_GET_PAYMENT, ErrorMessage.CANNOT_GET_PAYMENT);
  }
};

export const updatePaymentStatus = async (
  paymentId: string,
  serviceId: string,
  amount: number,
  provider: PaymentServiceProvider,
  isSuccess: boolean,
  referenceContext?: PaymentReferenceContext,
) => {
  if (!paymentId) return;

  await firebaseHelper.runTransaction(async (transaction) => {
    const payment: Payment = await firebaseHelper.getTransaction(
      paymentCollection,
      paymentId,
      transaction,
    );
    if (!payment) {
      throw new Error(ErrorMessage.PAYMENT_NOT_FOUND);
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      logger.info(Message.PAYMENT_ALREADY_SUCCESS);

      return;
    }

    if (isSuccess) {
      switch (payment.reference_type) {
        case PaymentReferenceType.ORDER: {
          if (!referenceContext) {
            throw new Error(ErrorMessage.MISSING_REFERENCE_CONTEXT);
          }

          const orderPath = `${restaurantCollection}/${referenceContext.restaurantId}/${Collection.ORDERS}`;
          const order = await firebaseHelper.getTransaction(
            orderPath,
            payment.reference_id,
            transaction,
          );
          if (!order) {
            throw new Error(ErrorMessage.ORDER_NOT_FOUND);
          }

          await firebaseHelper.updateTransaction(
            orderPath,
            payment.reference_id,
            { payment_status: PaymentStatus.SUCCESS },
            transaction,
          );

          break;
        }

        case PaymentReferenceType.BUS_SUBSCRIPTION: {
          const busSubscription = await firebaseHelper.getTransaction(
            busSubscriptionCollection,
            payment.reference_id,
            transaction,
          );
          if (!busSubscription) {
            throw new Error(ErrorMessage.BUS_SUBSCRIPTION_NOT_FOUND);
          }

          await firebaseHelper.updateTransaction(
            busSubscriptionCollection,
            payment.reference_id,
            { payment_status: PaymentStatus.SUCCESS },
            transaction,
          );

          break;
        }

        case PaymentReferenceType.FACILITY_RESERVATION: {
          const facilityReservation = await firebaseHelper.getTransaction(
            facilityReservationCollection,
            payment.reference_id,
            transaction,
          );
          if (!facilityReservation) {
            throw new Error(ErrorMessage.FACILITY_RESERVATION_NOT_FOUND);
          }

          await firebaseHelper.updateTransaction(
            facilityReservationCollection,
            payment.reference_id,
            { payment_status: PaymentStatus.SUCCESS },
            transaction,
          );

          break;
        }

        case PaymentReferenceType.PARKING_SUBSCRIPTION: {
          if (!referenceContext) {
            throw new Error(ErrorMessage.MISSING_REFERENCE_CONTEXT);
          }

          const parkingSubscriptionCollection = `${parkingCollection}/${referenceContext.parkingId}/${Collection.PARKING_SUBSCRIPTIONS}`;
          const parking = await firebaseHelper.getTransaction(
            parkingSubscriptionCollection,
            payment.reference_id,
            transaction,
          );
          if (!parking) {
            throw new Error(ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND);
          }

          await firebaseHelper.updateTransaction(
            parkingSubscriptionCollection,
            payment.reference_id,
            { payment_status: PaymentStatus.SUCCESS },
            transaction,
          );

          break;
        }

        default: {
          throw new Error(`${ErrorMessage.UNSUPPORTED_REFERENCE_TYPE} ${payment.reference_type}`);
        }
      }
    }

    await firebaseHelper.updateTransaction(
      paymentCollection,
      paymentId,
      {
        status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
        amount,
        service_id: serviceId,
        service_type: provider,
        transaction_time: new Date(),
      },
      transaction,
    );
  });
};

export const buildReferenceContext = (referenceType: PaymentReferenceType, returnUrl: string) => {
  const url = new URL(returnUrl);

  switch (referenceType) {
    case PaymentReferenceType.ORDER: {
      const restaurantId = url.searchParams.get('restaurantId');
      if (!restaurantId) {
        throw new Error(`${ErrorMessage.MISSING_REFERENCE_CONTEXT} RestaurantID`);
      }

      return { restaurantId };
    }

    case PaymentReferenceType.PARKING_SUBSCRIPTION: {
      const buildingId = url.searchParams.get('buildingId');
      if (!buildingId) {
        throw new Error(`${ErrorMessage.MISSING_REFERENCE_CONTEXT} BuildingID`);
      }

      const parkingId = url.searchParams.get('parkingId');
      if (!parkingId) {
        throw new Error(`${ErrorMessage.MISSING_REFERENCE_CONTEXT} ParkingId`);
      }

      return { buildingId, parkingId };
    }

    default:
      return null;
  }
};
