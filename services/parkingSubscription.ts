import { Request, Response } from 'express';
import {
  firebaseHelper,
  responseError,
  responseSuccess,
  logger,
  getTomorrow,
  calculatePayment,
} from '../utils/index';
import {
  Collection,
  ParkingSpaceStatus,
  ParkingSubscriptionStatus,
  Sites,
  VATRate,
} from '../constants/enum';
import { ParkingSubscription } from '../interfaces/parkingSubscription';
import { AuthRequest } from '../interfaces/jwt';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { Timestamp } from 'firebase-admin/firestore';
import { User } from '../interfaces/user';

const parkingCollection = `${Sites.TOKYO}/${Collection.PARKING_SPACES}`;
const subscriptionCollection = (parkingSpaceId: string) => {
  return `${parkingCollection}/${parkingSpaceId}/${Collection.PARKING_SUBSCRIPTIONS}`;
};
const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;
const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const { parkingSpaceId } = req.params;
    const parkingSubscriptions: ParkingSubscription[] = await firebaseHelper.getAllDocs(
      subscriptionCollection(parkingSpaceId),
    );

    return responseSuccess(res, Message.GET_PARKING_SUBSCRIPTION, parkingSubscriptions);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_PARKING_SUBSCRIPTION_LIST + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_PARKING_SUBSCRIPTION_LIST,
      ErrorMessage.CANNOT_GET_PARKING_SUBSCRIPTION_LIST,
    );
  }
};

const getSubscriptionById = async (req: Request, res: Response) => {
  try {
    const { parkingSpaceId, id: parkingSubscriptionId } = req.params;
    const parkingSubscription: ParkingSubscription = await firebaseHelper.getDocById(
      subscriptionCollection(parkingSpaceId),
      parkingSubscriptionId,
    );
    if (!parkingSubscription) {
      return responseError(
        res,
        StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
        ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: parkingSubscription,
    });
  } catch (error) {
    logger.warn(ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND + error);

    return responseError(
      res,
      StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
      ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
    );
  }
};

const createParkingSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { parkingSpaceId } = req.params;
    const parkingSubscriptionCollection = subscriptionCollection(parkingSpaceId);
    const { start_date, month_duration, points_used, base_amount, ...data } = req.body;
    const startTime = start_date ? new Date(start_date) : getTomorrow();
    const endTime = new Date(startTime);
    endTime.setMonth(endTime.getMonth() + month_duration);

    const conflicts = await firebaseHelper.getDocsByFields(parkingSubscriptionCollection, [
      { field: 'start_time', operator: '<', value: Timestamp.fromDate(endTime) },
      { field: 'end_time', operator: '>', value: Timestamp.fromDate(startTime) },
    ]);
    const validConflicts = conflicts.filter(
      (item) => item.status == ParkingSubscriptionStatus.RESERVED,
    );
    if (validConflicts.length) {
      return responseError(
        res,
        StatusCode.PARKING_SPACE_ALREADY_RESERVED,
        ErrorMessage.PARKING_SPACE_ALREADY_RESERVED,
      );
    }

    const uid = req.user?.uid;
    if (!uid) {
      return responseError(res, StatusCode.ACCOUNT_NOT_FOUND, ErrorMessage.ACCOUNT_NOT_FOUND);
    }

    const user: User = await firebaseHelper.getDocById(userCollection, uid);
    if (points_used > (user.points ?? 0)) {
      return responseError(res, StatusCode.INVALID_POINTS, ErrorMessage.INVALID_POINTS);
    }

    const vat_charge = base_amount * VATRate.DEFAULT;
    const total_amount = base_amount + vat_charge;
    const { finalAmount, discount, pointsEarned, finalPointsUsed } = calculatePayment(
      total_amount,
      user.ranks,
      points_used,
    );
    const newParkingSubscription = {
      user_id: uid,
      start_time: Timestamp.fromDate(startTime),
      end_time: Timestamp.fromDate(endTime),
      base_amount,
      vat_charge,
      discount,
      points_used: finalPointsUsed,
      total_amount: finalAmount,
      points_earned: pointsEarned,
      status: ParkingSubscriptionStatus.RESERVED,
      ...data,
    };

    const parkingSubscriptionId = await firebaseHelper.runTransaction(async (transaction) => {
      const parkingSubscription = await firebaseHelper.setTransaction(
        parkingSubscriptionCollection,
        newParkingSubscription,
        transaction,
      );

      await firebaseHelper.updateTransaction(
        parkingCollection,
        parkingSpaceId,
        {
          status: ParkingSpaceStatus.RESERVED,
        },
        transaction,
      );

      const updatedPoints = (user.points ?? 0) - finalPointsUsed + pointsEarned;
      await firebaseHelper.updateTransaction(
        userCollection,
        uid,
        { points: updatedPoints },
        transaction,
      );

      return parkingSubscription.id;
    });

    return responseSuccess(res, Message.PARKING_SUBSCRIPTION_CREATED, {
      id: parkingSubscriptionId,
      finalAmount,
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_PARKING_SUBSCRIPTION + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_PARKING_SUBSCRIPTION,
      ErrorMessage.CANNOT_CREATE_PARKING_SUBSCRIPTION,
    );
  }
};

const updateParkingSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { parkingSpaceId, id: parkingSubscriptionId } = req.params;
    const { status } = req.body;
    const parkingSubscription = await firebaseHelper.getDocById(
      subscriptionCollection(parkingSpaceId),
      parkingSubscriptionId,
    );
    if (!parkingSubscription) {
      return responseError(
        res,
        StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
        ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
      );
    }

    await firebaseHelper.updateDoc(subscriptionCollection(parkingSpaceId), parkingSubscriptionId, {
      status,
    });

    let newParkingSpaceStatus;
    switch (status) {
      case ParkingSubscriptionStatus.RESERVED:
        newParkingSpaceStatus = ParkingSpaceStatus.RESERVED;
        break;

      case ParkingSubscriptionStatus.EXPIRED:
      case ParkingSubscriptionStatus.CANCELLED:
        newParkingSpaceStatus = ParkingSpaceStatus.AVAILABLE;
        break;
    }

    if (newParkingSpaceStatus) {
      await firebaseHelper.updateDoc(parkingCollection, parkingSpaceId, {
        status: newParkingSpaceStatus,
      });
    }

    return responseSuccess(res, Message.PARKING_SUBSCRIPTION_STATUS_UPDATED, {
      id: parkingSubscriptionId,
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_PARKING_SUBSCRIPTION_STATUS + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_PARKING_SUBSCRIPTION_STATUS,
      ErrorMessage.CANNOT_UPDATE_PARKING_SUBSCRIPTION_STATUS,
    );
  }
};

const cancelParkingSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { parkingSpaceId, id: parkingSubscriptionId } = req.params;
    const parkingSubscription: ParkingSubscription = await firebaseHelper.getDocById(
      subscriptionCollection(parkingSpaceId),
      parkingSubscriptionId,
    );
    if (!parkingSubscription) {
      return responseError(
        res,
        StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
        ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
      );
    }

    if (req.user?.uid !== parkingSubscription.user_id) {
      return responseError(
        res,
        StatusCode.CANCEL_PARKING_SUBSCRIPTION_FORBIDDEN,
        ErrorMessage.CANCEL_PARKING_SUBSCRIPTION_FORBIDDEN,
      );
    }

    await firebaseHelper.updateDoc(subscriptionCollection(parkingSpaceId), parkingSubscriptionId, {
      status: ParkingSubscriptionStatus.CANCELLED,
    });

    await firebaseHelper.updateDoc(parkingCollection, parkingSpaceId, {
      status: ParkingSpaceStatus.AVAILABLE,
    });

    return responseSuccess(res, Message.PARKING_SUBSCRIPTION_CANCELED, {
      id: parkingSubscriptionId,
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CANCEL_PARKING_SUBSCRIPTION + error);

    return responseError(
      res,
      StatusCode.CANNOT_CANCEL_PARKING_SUBSCRIPTION,
      ErrorMessage.CANNOT_CANCEL_PARKING_SUBSCRIPTION,
    );
  }
};

export {
  getSubscriptions,
  cancelParkingSubscription,
  updateParkingSubscriptionStatus,
  getSubscriptionById,
  createParkingSubscription,
};
