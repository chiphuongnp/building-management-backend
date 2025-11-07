import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Collection, ParkingSubscriptionStatus, Sites } from '../constants/enum';
import { ParkingSubscription } from '../interfaces/parkingSubscription';
import { AuthRequest } from '../interfaces/jwt';
import { ErrorMessage, Message } from '../constants/message';
import { Timestamp } from 'firebase-admin/firestore';
import { getTomorrow } from '../utils/date';

const parkingCollection = `${Sites.TOKYO}/${Collection.PARKING_SPACES}`;
const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const { parkingSpaceId } = req.params;
    const parkingSubscriptions: ParkingSubscription[] = await firebaseHelper.getAllDocs(
      `${parkingCollection}/${parkingSpaceId}/${Collection.PARKING_SUBSCRIPTIONS}`,
    );

    return res.status(200).json({
      success: true,
      data: parkingSubscriptions,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_GET_PARKING_SUBSCRIPTION_LIST });
  }
};

const getSubscriptionById = async (req: Request, res: Response) => {
  try {
    const { parkingSpaceId, id: parkingSubscriptionId } = req.params;
    const parkingSubscription: ParkingSubscription = await firebaseHelper.getDocById(
      `${parkingCollection}/${parkingSpaceId}/${Collection.PARKING_SUBSCRIPTIONS}`,
      parkingSubscriptionId,
    );
    if (!parkingSubscription) {
      return res.status(404).json({
        success: false,
        message: ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
      });
    }

    return res.json({
      success: true,
      data: parkingSubscription,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: ErrorMessage.PARKING_SUBSCRIPTION_NOT_FOUND,
    });
  }
};

const createParkingSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { parkingSpaceId } = req.params;
    const { start_date, month_duration, ...data } = req.body;
    const startTime = start_date ? new Date(start_date) : getTomorrow();
    const endTime = new Date(startTime);
    endTime.setMonth(endTime.getMonth() + month_duration);

    const conflicts = await firebaseHelper.getDocsByFields(
      `${parkingCollection}/${parkingSpaceId}/${Collection.PARKING_SUBSCRIPTIONS}`,
      [
        { field: 'start_time', operator: '<', value: Timestamp.fromDate(endTime) },
        { field: 'end_time', operator: '>', value: Timestamp.fromDate(startTime) },
      ],
    );
    const validConflicts = conflicts.filter(
      (item) => item.status !== ParkingSubscriptionStatus.RESERVED,
    );
    if (validConflicts.length) {
      return res.status(409).json({
        success: false,
        message: ErrorMessage.PARKING_SPACE_ALREADY_RESERVED,
      });
    }

    const docRef = await firebaseHelper.createDoc(
      `${parkingCollection}/${parkingSpaceId}/${Collection.PARKING_SUBSCRIPTIONS}`,
      {
        user_id: req.user?.uid,
        start_time: Timestamp.fromDate(startTime),
        end_time: Timestamp.fromDate(endTime),
        ...data,
      },
    );

    return res.status(200).json({
      success: true,
      message: Message.PARKING_SUBSCRIPTION_CREATED,
      id: docRef.id,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_CREATE_PARKING_SUBSCRIPTION });
  }
};

export { getSubscriptions, getSubscriptionById, createParkingSubscription };
