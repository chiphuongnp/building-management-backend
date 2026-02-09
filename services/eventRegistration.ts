import { Request, Response } from 'express';
import { firebaseHelper, responseError, responseSuccess, logger } from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { Collection, Sites, EventRegistrationsStatus } from '../constants/enum';
import { AuthRequest } from '../interfaces/jwt';
import { EventRegistration } from '../interfaces/eventRegistration';
import { EventBooking } from '../interfaces/eventBooking';

const eventBookingCollection = `${Sites.TOKYO}/${Collection.EVENT_BOOKINGS}`;
const eventRegistrationCollection = `${Sites.TOKYO}/${Collection.EVENT_REGISTRATIONS}`;
const getEventRegistrationsByUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return responseError(res, StatusCode.ACCOUNT_NOT_FOUND, ErrorMessage.ACCOUNT_NOT_FOUND);
    }

    const eventRegistrations: EventRegistration[] = await firebaseHelper.getDocsByFields(
      eventRegistrationCollection,
      [{ field: 'user_id', operator: '==', value: userId }],
    );
    if (!eventRegistrations.length) {
      return responseSuccess(res, Message.NO_REGISTERED_EVENT, eventRegistrations);
    }

    return responseSuccess(res, Message.GET_USER_EVENT_REGISTRATIONS, eventRegistrations);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_USER_EVENT_REGISTRATIONS + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_USER_EVENT_REGISTRATIONS,
      ErrorMessage.CANNOT_GET_USER_EVENT_REGISTRATIONS,
    );
  }
};

const getEventRegistrationsHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return responseError(res, StatusCode.ACCOUNT_NOT_FOUND, ErrorMessage.ACCOUNT_NOT_FOUND);
    }

    const eventRegistrations: EventRegistration[] = await firebaseHelper.getDocsByFields(
      eventRegistrationCollection,
      [
        { field: 'user_id', operator: '==', value: userId },
        {
          field: 'status',
          operator: 'in',
          value: [EventRegistrationsStatus.CANCELLED, EventRegistrationsStatus.CLOSED],
        },
      ],
    );
    if (!eventRegistrations.length) {
      return responseSuccess(res, Message.NO_REGISTERED_EVENT, eventRegistrations);
    }

    return responseSuccess(res, Message.GET_USER_EVENT_REGISTRATION_HISTORY, eventRegistrations);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_USER_EVENT_REGISTRATION_HISTORY + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_USER_EVENT_REGISTRATION_HISTORY,
      ErrorMessage.CANNOT_GET_USER_EVENT_REGISTRATION_HISTORY,
    );
  }
};

const getEventRegistrationsByEventBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { event_booking_id: eventBookingId } = req.body;
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

    const eventRegistrations: EventRegistration[] = await firebaseHelper.getDocsByFields(
      eventRegistrationCollection,
      [
        { field: 'event_booking_id', operator: '==', value: eventBookingId },
        { field: 'status', operator: '==', value: EventRegistrationsStatus.REGISTERED },
      ],
    );
    if (!eventRegistrations.length) {
      return responseError(
        res,
        StatusCode.CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT,
        ErrorMessage.CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT,
      );
    }

    return responseSuccess(res, Message.GET_EVENT_REGISTRATIONS_BY_EVENT, eventRegistrations);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT,
      ErrorMessage.CANNOT_GET_EVENT_REGISTRATIONS_BY_EVENT,
    );
  }
};

const createEventRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return responseError(res, StatusCode.ACCOUNT_NOT_FOUND, ErrorMessage.ACCOUNT_NOT_FOUND);
    }

    const { event_booking_id: eventBookingId } = req.body;
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

    const data = {
      ...req.body,
      user_id: userId,
      status: EventRegistrationsStatus.REGISTERED,
    };
    const eventRegistrationId = await firebaseHelper.runTransaction(async (transaction) => {
      const docRef = await firebaseHelper.setTransaction(
        eventRegistrationCollection,
        data,
        transaction,
      );

      await firebaseHelper.updateTransaction(
        eventBookingCollection,
        eventBookingId,
        {
          current_participants: eventBooking.current_participants + 1,
        },
        transaction,
      );

      return docRef.id;
    });
    return responseSuccess(res, Message.EVENT_REGISTRATION_CREATED, { id: eventRegistrationId });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_EVENT_REGISTRATION + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_EVENT_REGISTRATION,
      ErrorMessage.CANNOT_CREATE_EVENT_REGISTRATION,
    );
  }
};

const cancelEventRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return responseError(res, StatusCode.ACCOUNT_NOT_FOUND, ErrorMessage.ACCOUNT_NOT_FOUND);
    }

    const { id } = req.params;
    const eventRegistration: EventRegistration = await firebaseHelper.getDocById(
      eventRegistrationCollection,
      id,
    );
    if (userId !== eventRegistration.user_id) {
      return responseError(
        res,
        StatusCode.UPDATE_EVENT_REGISTRATION_FORBIDDEN,
        ErrorMessage.UPDATE_EVENT_REGISTRATION_FORBIDDEN,
      );
    }

    const { event_booking_id: eventBookingId } = req.body;
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

    await firebaseHelper.runTransaction(async (transaction) => {
      await firebaseHelper.updateTransaction(
        eventRegistrationCollection,
        id,
        {
          status: EventRegistrationsStatus.CANCELLED,
        },
        transaction,
      );

      await firebaseHelper.updateTransaction(
        eventBookingCollection,
        eventBookingId,
        {
          current_participants: eventBooking.current_participants - 1,
        },
        transaction,
      );
    });

    return responseSuccess(res, Message.EVENT_REGISTRATION_CANCELED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CANCEL_EVENT_REGISTRATION + error);

    return responseError(
      res,
      StatusCode.CANNOT_CANCEL_EVENT_REGISTRATION,
      ErrorMessage.CANNOT_CANCEL_EVENT_REGISTRATION,
    );
  }
};

export {
  getEventRegistrationsByUser,
  getEventRegistrationsHistory,
  getEventRegistrationsByEventBooking,
  createEventRegistration,
  cancelEventRegistration,
};
