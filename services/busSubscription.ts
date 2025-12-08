import { Response } from 'express';
import { firebaseHelper, responseError, responseSuccess, logger } from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { BusSubscriptionStatus, Collection, Sites } from '../constants/enum';
import { BusSubscription } from '../interfaces/busSubscription';
import { Bus } from '../interfaces/bus';
import { User } from '../interfaces/user';

const busSubscriptionCollection = `${Sites.TOKYO}/${Collection.BUS_SUBSCRIPTIONS}`;
const busCollection = `${Sites.TOKYO}/${Collection.BUSES}`;
const busRouteCollection = `${Sites.TOKYO}/${Collection.BUS_ROUTES}`;
const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;

export const getAllBusSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const subscriptions = await firebaseHelper.getAllDocs(busSubscriptionCollection);
    if (!subscriptions.length) {
      return responseError(
        res,
        StatusCode.BUS_SUBSCRIPTION_NOT_FOUND,
        ErrorMessage.BUS_SUBSCRIPTION_NOT_FOUND,
      );
    }

    return responseSuccess(res, Message.BUS_SUBSCRIPTION_GET_ALL, subscriptions);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_BUS_SUBSCRIPTION_LIST + error);

    return responseError(
      res,
      StatusCode.BUS_SUBSCRIPTION_GET_ALL_ERROR,
      ErrorMessage.CANNOT_GET_BUS_SUBSCRIPTION_LIST,
    );
  }
};

export const getBusSubscriptionDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await firebaseHelper.getDocById(busSubscriptionCollection, id);
    if (!subscription) {
      return responseError(
        res,
        StatusCode.BUS_SUBSCRIPTION_NOT_FOUND,
        ErrorMessage.BUS_SUBSCRIPTION_NOT_FOUND,
      );
    }

    return responseSuccess(res, Message.GET_BUS_SUBSCRIPTION_DETAIL, subscription);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_BUS_SUBSCRIPTION_DETAIL + error);

    return responseError(
      res,
      StatusCode.BUS_SUBSCRIPTION_GET_DETAIL_ERROR,
      ErrorMessage.CANNOT_GET_BUS_SUBSCRIPTION_DETAIL,
    );
  }
};

export const createBusSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const data: BusSubscription = req.body;
    const userId = req.user?.uid;
    if (!userId) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    await firebaseHelper.runTransaction(async (transaction) => {
      const bus: Bus = await firebaseHelper.getTransaction(busCollection, data.bus_id, transaction);
      if (!bus) {
        throw new Error(ErrorMessage.BUS_NOT_FOUND);
      }

      const seat = bus.seats.find((s) => s.seat_number === data.seat_number && s.is_available);
      if (!seat) {
        throw new Error(ErrorMessage.SEAT_ALREADY_BOOKED);
      }

      const seatIndex = bus.seats.indexOf(seat);
      bus.seats[seatIndex].is_available = false;
      await firebaseHelper.updateTransaction(
        busCollection,
        data.bus_id,
        { seats: bus.seats },
        transaction,
      );

      const route = await firebaseHelper.getTransaction(
        busRouteCollection,
        data.route_id,
        transaction,
      );
      if (!route) {
        throw new Error(ErrorMessage.BUS_ROUTE_NOT_FOUND);
      }

      const user: User = await firebaseHelper.getTransaction(userCollection, userId, transaction);
      if (!user) {
        throw new Error(ErrorMessage.USER_NOT_FOUND);
      }

      const subscriptionData: BusSubscription = {
        ...data,
        employee_id: user.id,
        employee_name: user.full_name,
        employee_phone: user.phone,
        status: BusSubscriptionStatus.PENDING,
      };

      await firebaseHelper.setTransaction(busSubscriptionCollection, subscriptionData, transaction);
    });

    return responseSuccess(res, Message.BUS_SUBSCRIPTION_CREATED);
  } catch (error: any) {
    logger.warn(ErrorMessage.CANNOT_CREATE_BUS_SUBSCRIPTION + error);

    if (error.message === ErrorMessage.BUS_NOT_FOUND) {
      return responseError(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND);
    }

    if (error.message === ErrorMessage.SEAT_ALREADY_BOOKED) {
      return responseError(res, StatusCode.SEAT_ALREADY_BOOKED, ErrorMessage.SEAT_ALREADY_BOOKED);
    }

    if (error.message === ErrorMessage.BUS_ROUTE_NOT_FOUND) {
      return responseError(res, StatusCode.BUS_ROUTE_NOT_FOUND, ErrorMessage.BUS_ROUTE_NOT_FOUND);
    }

    if (error.message === ErrorMessage.USER_NOT_FOUND) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_BUS_SUBSCRIPTION,
      ErrorMessage.CANNOT_CREATE_BUS_SUBSCRIPTION,
    );
  }
};
