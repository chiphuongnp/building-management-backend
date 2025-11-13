import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import {
  Collection,
  ParkingSpaceStatus,
  ParkingSubscriptionStatus,
  Sites,
} from '../constants/enum';
import { ParkingSubscription } from '../interfaces/parkingSubscription';
import { AuthRequest } from '../interfaces/jwt';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { Timestamp } from 'firebase-admin/firestore';
import { getTomorrow } from '../utils/date';
import logger from '../utils/logger';
import { responseError, responseSuccess } from '../utils/error';

const parkingCollection = `${Sites.TOKYO}/${Collection.PARKING_SPACES}`;
const subscriptionCollection = (parkingSpaceId: string) => {
  return `${parkingCollection}/${parkingSpaceId}/${Collection.PARKING_SUBSCRIPTIONS}`;
};
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
    const { start_date, month_duration, ...data } = req.body;
    const startTime = start_date ? new Date(start_date) : getTomorrow();
    const endTime = new Date(startTime);
    endTime.setMonth(endTime.getMonth() + month_duration);

    const conflicts = await firebaseHelper.getDocsByFields(subscriptionCollection(parkingSpaceId), [
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

    const docRef = await firebaseHelper.createDoc(subscriptionCollection(parkingSpaceId), {
      user_id: req.user?.uid,
      start_time: Timestamp.fromDate(startTime),
      end_time: Timestamp.fromDate(endTime),
      ...data,
    });

    return responseSuccess(res, Message.PARKING_SUBSCRIPTION_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_PARKING_SUBSCRIPTION + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_PARKING_SUBSCRIPTION,
      ErrorMessage.CANNOT_CREATE_PARKING_SUBSCRIPTION,
    );
  }
};

const updateParkingSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { parkingSpaceId, id: parkingSubcriptionId } = req.params;
    const parkingSubscription = await firebaseHelper.getDocById(
      subscriptionCollection(parkingSpaceId),
      parkingSubcriptionId,
    );
    if (!parkingSubscription) {
      return responseError(
        res,
        StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
        ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
      );
    }

    const { month_duration, ...data } = req.body;
    const startTime = parkingSubscription.start_time;
    const endTime = new Date(startTime);
    endTime.setMonth(endTime.getMonth() + month_duration);

    await firebaseHelper.updateDoc(subscriptionCollection(parkingSpaceId), parkingSubcriptionId, {
      end_time: Timestamp.fromDate(endTime),
      ...data,
    });

    return responseSuccess(res, Message.PARKING_SUBSCRIPTION_UPDATED);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_PARKING_SUBSCRIPTION + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_PARKING_SUBSCRIPTION,
      ErrorMessage.CANNOT_UPDATE_PARKING_SUBSCRIPTION,
    );
  }
};

const updateParkingSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { parkingSpaceId, id: parkingSubcriptionId } = req.params;
    const { status } = req.body;
    const parkingSubscription = await firebaseHelper.getDocById(
      subscriptionCollection(parkingSpaceId),
      parkingSubcriptionId,
    );
    if (!parkingSubscription) {
      return responseError(
        res,
        StatusCode.PARKING_SUBSCRIPTION_NOT_FOUND,
        ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
      );
    }

    await firebaseHelper.updateDoc(subscriptionCollection(parkingSpaceId), parkingSubcriptionId, {
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
      id: parkingSubcriptionId,
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

export {
  getSubscriptions,
  updateParkingSubscription,
  updateParkingSubscriptionStatus,
  getSubscriptionById,
  createParkingSubscription,
};
