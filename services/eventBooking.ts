import { Request, Response } from 'express';
import { firebaseHelper, responseError, responseSuccess } from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import logger from '../utils/logger';
import { Collection, EventBookingStatus, Sites } from '../constants/enum';
import { AuthRequest } from '../interfaces/jwt';
import { EventBooking } from '../interfaces/eventBooking';
import { DEFAULT_PARTICIPANTS } from '../constants/constant';

const facilityReservationCollection = `${Sites.TOKYO}/${Collection.FACILITY_RESERVATIONS}`;
const eventBookingCollection = `${Sites.TOKYO}/${Collection.EVENT_BOOKINGS}`;
const getEventBookings = async (req: Request, res: Response) => {
  try {
    const eventBookings: EventBooking[] = await firebaseHelper.getAllDocs(eventBookingCollection);

    return responseSuccess(res, Message.GET_EVENT_BOOKINGS, eventBookings);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_EVENT_BOOKING_LIST + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_EVENT_BOOKING_LIST,
      ErrorMessage.CANNOT_GET_EVENT_BOOKING_LIST,
    );
  }
};

const getEventBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventBooking: EventBooking = await firebaseHelper.getDocById(eventBookingCollection, id);
    if (!eventBooking) {
      return responseError(
        res,
        StatusCode.EVENT_BOOKING_NOT_FOUND,
        ErrorMessage.EVENT_BOOKING_NOT_FOUND,
      );
    }

    return responseSuccess(res, Message.GET_EVENT_BOOKING_DETAIL, eventBooking);
  } catch (error) {
    logger.warn(ErrorMessage.EVENT_BOOKING_NOT_FOUND + error);

    return responseError(
      res,
      StatusCode.EVENT_BOOKING_NOT_FOUND,
      ErrorMessage.EVENT_BOOKING_NOT_FOUND,
    );
  }
};

const getAvailableEventBooking = async (req: Request, res: Response) => {
  try {
    const eventBookings: EventBooking[] = await firebaseHelper.getDocsByFields(
      eventBookingCollection,
      [
        { field: 'status', operator: '==', value: EventBookingStatus.APPROVED },
        { field: 'deadline', operator: '>=', value: new Date().toISOString() },
      ],
    );
    const availableEvents = eventBookings.filter(
      (event) => event.current_participants < event.max_participants,
    );

    return responseSuccess(res, Message.GET_AVAILABLE_EVENT_BOOKING, availableEvents);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_AVAILABLE_EVENT_BOOKINGS + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_AVAILABLE_EVENT_BOOKINGS,
      ErrorMessage.CANNOT_GET_AVAILABLE_EVENT_BOOKINGS,
    );
  }
};

const createEventBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { facility_reservation_id: facilityReservationId } = req.body;
    if (facilityReservationId) {
      const facilityReservation = await firebaseHelper.getDocById(
        facilityReservationCollection,
        facilityReservationId,
      );
      if (!facilityReservation) {
        return responseError(
          res,
          StatusCode.FACILITY_RESERVATION_NOT_FOUND,
          ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
        );
      }
    }

    const docRef = await firebaseHelper.createDoc(eventBookingCollection, {
      ...req.body,
      current_participants: DEFAULT_PARTICIPANTS,
      status: EventBookingStatus.PENDING,
      created_by: req.user?.uid,
    });
    return responseSuccess(res, Message.EVENT_BOOKING_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_FACILITY + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_EVENT_BOOKING,
      ErrorMessage.CANNOT_CREATE_EVENT_BOOKING,
    );
  }
};

const updateEventBookingInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { id: eventBookingId } = req.params;
    const userId = req.user?.uid;
    const dataEventBooking = {
      ...req.body,
      status: EventBookingStatus.PENDING,
      updated_by: userId,
    };
    const { facility_reservation_id: facilityReservationId, location } = dataEventBooking;
    const eventBooking: EventBooking = await firebaseHelper.getDocById(
      eventBookingCollection,
      eventBookingId,
    );
    if (!eventBooking) {
      return responseError(
        res,
        StatusCode.EVENT_BOOKING_NOT_FOUND,
        ErrorMessage.EVENT_BOOKING_NOT_FOUND,
      );
    }

    if (userId !== eventBooking.created_by) {
      return responseError(
        res,
        StatusCode.UPDATE_EVENT_BOOKING_FORBIDDEN,
        ErrorMessage.UPDATE_EVENT_BOOKING_FORBIDDEN,
      );
    }

    if (facilityReservationId) {
      const facilityReservation = await firebaseHelper.getDocById(
        facilityReservationCollection,
        facilityReservationId,
      );
      if (!facilityReservation) {
        return responseError(
          res,
          StatusCode.FACILITY_RESERVATION_NOT_FOUND,
          ErrorMessage.FACILITY_RESERVATION_NOT_FOUND,
        );
      }

      dataEventBooking.location = null;
    }

    if (location) {
      dataEventBooking.facility_reservation_id = null;
    }

    await firebaseHelper.updateDoc(eventBookingCollection, eventBookingId, dataEventBooking);

    return responseSuccess(res, Message.EVENT_BOOKING_UPDATED, {
      id: eventBookingId,
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_EVENT_BOOKING + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_EVENT_BOOKING,
      ErrorMessage.CANNOT_UPDATE_EVENT_BOOKING,
    );
  }
};

const updateEventBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await firebaseHelper.updateDoc(eventBookingCollection, id, {
      status: req.body.status,
      approved_by: req.user?.uid,
    });

    return responseSuccess(res, Message.EVENT_BOOKING_STATUS_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_EVENT_BOOKING_STATUS + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_EVENT_BOOKING_STATUS,
      ErrorMessage.CANNOT_UPDATE_EVENT_BOOKING_STATUS,
    );
  }
};

export {
  getEventBookings,
  getEventBookingById,
  getAvailableEventBooking,
  createEventBooking,
  updateEventBookingInfo,
  updateEventBookingStatus,
};
