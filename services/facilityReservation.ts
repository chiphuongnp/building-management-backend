import { Request, Response } from 'express';
import {
  firebaseHelper,
  getTomorrow,
  responseError,
  responseSuccess,
  calculateHoursDifference,
  logger,
  calculatePayment,
} from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import {
  Collection,
  FacilityReservationStatus,
  FacilityStatus,
  FacilityType,
  Sites,
  VATRate,
} from '../constants/enum';
import { FacilityReservation } from '../interfaces/facilityReservation';
import { Timestamp } from 'firebase-admin/firestore';
import { Facility } from '../interfaces/facility';
import { CANCEL_TIME_VALID } from '../constants/constant';
import { User } from '../interfaces/user';

const facilityReservationCollection = `${Sites.TOKYO}/${Collection.FACILITY_RESERVATIONS}`;
const facilityCollection = `${Sites.TOKYO}/${Collection.FACILITIES}`;
const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;
const getFacilityReservations = async (req: Request, res: Response) => {
  try {
    const facilityReservations: FacilityReservation[] = await firebaseHelper.getAllDocs(
      facilityReservationCollection,
    );

    return responseSuccess(res, Message.GET_FACILITY_RESERVATIONS, facilityReservations);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_FACILITY_RESERVATION_LIST + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_FACILITY_RESERVATION_LIST,
      ErrorMessage.CANNOT_GET_FACILITY_RESERVATION_LIST,
    );
  }
};

const getFacilityReservationsByUser = async (req: AuthRequest, res: Response) => {
  try {
    const facilityReservations: FacilityReservation[] = await firebaseHelper.getDocByField(
      facilityReservationCollection,
      'user_id',
      req.user?.uid,
    );

    return responseSuccess(res, Message.GET_FACILITY_RESERVATION_HISTORY, facilityReservations);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_USER_FACILITY_RESERVATION + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_FACILITY_RESERVATION_HISTORY,
      ErrorMessage.CANNOT_GET_USER_FACILITY_RESERVATION,
    );
  }
};

const getFacilityReservationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const facilityReservation: FacilityReservation = await firebaseHelper.getDocById(
      facilityReservationCollection,
      id,
    );
    if (!facilityReservation) {
      return responseError(
        res,
        StatusCode.FACILITY_RESERVATION_NOT_FOUND,
        ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
      );
    }

    return responseSuccess(res, Message.GET_FACILITY_RESERVATION_DETAIL, facilityReservation);
  } catch (error) {
    logger.warn(ErrorMessage.FACILITY_RESERVATION_NOT_FOUND + error);

    return responseError(
      res,
      StatusCode.FACILITY_RESERVATION_NOT_FOUND,
      ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
    );
  }
};

const createFacilityReservation = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return responseError(res, StatusCode.ACCOUNT_NOT_FOUND, ErrorMessage.ACCOUNT_NOT_FOUND);
    }

    const {
      facility_id: facilityId,
      start_date: startDate,
      hour_duration: hourDuration,
      points_used,
      ...data
    } = req.body;
    const facility: Facility = await firebaseHelper.getDocById(facilityCollection, facilityId);
    if (!facility) {
      return responseError(res, StatusCode.FACILITY_NOT_FOUND, ErrorMessage.FACILITY_NOT_FOUND);
    }

    const user: User = await firebaseHelper.getDocById(userCollection, uid);
    if (points_used > (user.points ?? 0)) {
      return responseError(res, StatusCode.INVALID_POINTS, ErrorMessage.INVALID_POINTS);
    }

    const startTime = startDate ? new Date(startDate) : getTomorrow();
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + hourDuration);

    const conflicts = await firebaseHelper.getDocsByFields(facilityReservationCollection, [
      { field: 'facility_id', operator: '==', value: facility.id },
      { field: 'start_time', operator: '<', value: Timestamp.fromDate(endTime) },
      { field: 'end_time', operator: '>', value: Timestamp.fromDate(startTime) },
      { field: 'status', operator: '==', value: FacilityReservationStatus.RESERVED },
    ]);
    if (conflicts.length) {
      return responseError(
        res,
        StatusCode.FACILITY_RESERVATION_ALREADY_EXISTS,
        ErrorMessage.FACILITY_RESERVATION_ALREADY_EXISTS,
      );
    }

    const baseAmount = facility.base_price * Number(hourDuration) + facility.service_charge;
    const facilityReservationData = {
      user_id: uid,
      facility_id: facilityId,
      start_time: Timestamp.fromDate(startTime),
      end_time: Timestamp.fromDate(endTime),
      status: FacilityReservationStatus.RESERVED,
      ...data,
    };
    const { finalAmount, discount, pointsEarned, finalPointsUsed, vatCharge } = calculatePayment(
      baseAmount,
      user.rank,
      points_used,
      VATRate.DEFAULT,
    );
    if (facility.facility_type !== FacilityType.ROOM) {
      facilityReservationData.base_amount = baseAmount;
      facilityReservationData.vat_charge = vatCharge;
      facilityReservationData.discount = discount;
      facilityReservationData.points_earned = pointsEarned;
      facilityReservationData.points_used = finalPointsUsed;
      facilityReservationData.total_amount = finalAmount;
    }
    const facilityReservationId = await firebaseHelper.runTransaction(async (transaction) => {
      const facilityReservation = await firebaseHelper.setTransaction(
        facilityReservationCollection,
        facilityReservationData,
        transaction,
      );

      await firebaseHelper.updateTransaction(
        facilityCollection,
        facilityId,
        {
          status: FacilityStatus.RESERVED,
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

      return facilityReservation.id;
    });

    return responseSuccess(res, Message.FACILITY_RESERVATION_CREATED, {
      id: facilityReservationId,
      finalAmount,
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_FACILITY_RESERVATION + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_FACILITY_RESERVATION,
      ErrorMessage.CANNOT_CREATE_FACILITY_RESERVATION,
    );
  }
};

const cancelFacilityReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const facilityReservation: FacilityReservation = await firebaseHelper.getDocById(
      facilityReservationCollection,
      id,
    );
    if (!facilityReservation) {
      return responseError(
        res,
        StatusCode.FACILITY_RESERVATION_NOT_FOUND,
        ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
      );
    }

    if (facilityReservation.status === FacilityReservationStatus.CANCELLED) {
      return responseError(
        res,
        StatusCode.FACILITY_RESERVATION_IS_CANCELLED,
        ErrorMessage.FACILITY_RESERVATION_IS_CANCELLED,
      );
    }

    const startTime = facilityReservation.start_time;
    const now = new Date();
    const hoursUntilStart = calculateHoursDifference(startTime, now);
    if (hoursUntilStart < CANCEL_TIME_VALID) {
      return responseError(
        res,
        StatusCode.FACILITY_RESERVATION_LATE_CANCELLATION,
        ErrorMessage.FACILITY_RESERVATION_LATE_CANCELLATION,
      );
    }

    await firebaseHelper.updateDoc(facilityReservationCollection, id, {
      status: FacilityReservationStatus.CANCELLED,
    });

    return responseSuccess(res, Message.FACILITY_RESERVATION_CANCELED, {
      id,
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CANCEL_FACILITY_RESERVATION + error);

    return responseError(
      res,
      StatusCode.CANNOT_CANCEL_FACILITY_RESERVATION,
      ErrorMessage.CANNOT_CANCEL_FACILITY_RESERVATION,
    );
  }
};

export {
  getFacilityReservations,
  getFacilityReservationById,
  getFacilityReservationsByUser,
  createFacilityReservation,
  cancelFacilityReservation,
};
