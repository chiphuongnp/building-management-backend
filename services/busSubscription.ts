import { Response } from 'express';
import {
  firebaseHelper,
  responseError,
  responseSuccess,
  logger,
  calculatePayment,
  getTomorrow,
} from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import {
  BusSeatStatus,
  BusSubscriptionStatus,
  Collection,
  Sites,
  ActiveStatus,
  VATRate,
} from '../constants/enum';
import { BusSubscription } from '../interfaces/busSubscription';
import { Bus } from '../interfaces/bus';
import { User } from '../interfaces/user';
import { BusRoute } from '../interfaces/busRoute';
import { OrderByDirection, Timestamp, WhereFilterOp } from 'firebase-admin/firestore';
import { DEFAULT_PAGE_TOTAL } from '../constants/constant';

const busSubscriptionCollection = `${Sites.TOKYO}/${Collection.BUS_SUBSCRIPTIONS}`;
const busCollection = `${Sites.TOKYO}/${Collection.BUSES}`;
const busRouteCollection = `${Sites.TOKYO}/${Collection.BUS_ROUTES}`;
const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;

export const getAllBusSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const { route_id, order, order_by } = req.query;
    const { page, page_size } = req.pagination ?? {};
    const filters: { field: string; operator: WhereFilterOp; value: any }[] = [];
    if (route_id) {
      filters.push({ field: 'route_id', operator: '==', value: route_id });
    }

    const total = filters.length
      ? await firebaseHelper.countDocsByFields(busCollection, filters)
      : await firebaseHelper.countAllDocs(busCollection);
    const totalPage = page_size
      ? Math.max(DEFAULT_PAGE_TOTAL, Math.ceil(total / page_size))
      : DEFAULT_PAGE_TOTAL;
    const orderBy = route_id ? 'route_id' : (order_by as string);
    const orderDirection = order as OrderByDirection;
    let busSubscription: BusSubscription[];
    if (filters.length) {
      busSubscription = await firebaseHelper.getDocsByFields(
        busSubscriptionCollection,
        filters,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    } else {
      busSubscription = await firebaseHelper.getAllDocs(
        busSubscriptionCollection,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    }

    return responseSuccess(res, Message.BUS_SUBSCRIPTION_GET_ALL, {
      busSubscription,
      pagination: {
        page,
        page_size,
        total,
        total_page: totalPage,
      },
    });
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
    const {
      route_id,
      bus_id,
      start_time,
      month_duration,
      points_used,
      base_amount,
      seat_number,
      ...data
    } = req.body;
    const startTime = start_time ? new Date(start_time) : getTomorrow();
    const endTime = new Date(startTime);
    endTime.setMonth(endTime.getMonth() + month_duration);

    const userId = req.user?.uid;
    if (!userId) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    const conflicts = await firebaseHelper.getDocsByFields(busSubscriptionCollection, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'route_id', operator: '==', value: route_id },
      { field: 'bus_id', operator: '==', value: bus_id },
      { field: 'start_time', operator: '<', value: Timestamp.fromDate(endTime) },
      { field: 'end_time', operator: '>', value: Timestamp.fromDate(start_time) },
      { field: 'status', operator: '!=', value: BusSubscriptionStatus.CANCELLED },
    ]);
    if (conflicts.length) {
      return responseError(
        res,
        StatusCode.BUS_SUBSCRIPTION_ALREADY_EXISTS,
        ErrorMessage.BUS_SUBSCRIPTION_ALREADY_EXISTS,
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

    const { finalAmount, discount, pointsEarned, finalPointsUsed, vatCharge } = calculatePayment(
      base_amount,
      user.rank,
      points_used,
      VATRate.DEFAULT,
    );

    const busSubscriptionId = await firebaseHelper.runTransaction(async (transaction) => {
      const bus: Bus = await firebaseHelper.getTransaction(busCollection, bus_id, transaction);
      if (!bus) {
        throw new Error(ErrorMessage.BUS_NOT_FOUND);
      }

      const route: BusRoute = await firebaseHelper.getTransaction(
        busRouteCollection,
        route_id,
        transaction,
      );
      if (!route) {
        throw new Error(ErrorMessage.BUS_ROUTE_NOT_FOUND);
      }

      if (route.status !== ActiveStatus.ACTIVE) {
        throw new Error(ErrorMessage.BUS_ROUTE_INACTIVE);
      }

      if (!route.bus_id?.includes(bus_id)) {
        throw new Error(ErrorMessage.BUS_NOT_IN_ROUTE);
      }

      const seat = bus.seats?.find(
        (s) => s.seat_number === seat_number && s.status === BusSeatStatus.AVAILABLE,
      );
      if (!seat) {
        throw new Error(ErrorMessage.SEAT_ALREADY_BOOKED);
      }

      seat.status = BusSeatStatus.RESERVED;

      await firebaseHelper.updateTransaction(
        busCollection,
        bus_id,
        { seats: bus.seats },
        transaction,
      );

      const subscriptionData = {
        ...data,
        user_id: uid,
        start_time: Timestamp.fromDate(startTime),
        end_time: Timestamp.fromDate(endTime),
        base_amount,
        vat_charge: vatCharge,
        discount,
        points_used: finalPointsUsed,
        total_amount: finalAmount,
        points_earned: pointsEarned,
        status: BusSubscriptionStatus.PENDING,
        created_at: new Date(),
      };
      const busSubscription = await firebaseHelper.setTransaction(
        busSubscriptionCollection,
        subscriptionData,
        transaction,
      );
      const updatedPoints = (user.points ?? 0) - finalPointsUsed + pointsEarned;
      await firebaseHelper.updateTransaction(
        userCollection,
        uid,
        { points: updatedPoints },
        transaction,
      );

      return busSubscription.id;
    });

    return responseSuccess(res, Message.BUS_SUBSCRIPTION_CREATED, {
      id: busSubscriptionId,
      finalAmount,
    });
  } catch (error: any) {
    logger.warn(ErrorMessage.CANNOT_CREATE_BUS_SUBSCRIPTION, error);

    switch (error.message) {
      case ErrorMessage.BUS_NOT_FOUND:
        return responseError(res, StatusCode.BUS_NOT_FOUND, error.message);

      case ErrorMessage.SEAT_ALREADY_BOOKED:
        return responseError(res, StatusCode.SEAT_ALREADY_BOOKED, error.message);

      case ErrorMessage.BUS_ROUTE_NOT_FOUND:
        return responseError(res, StatusCode.BUS_ROUTE_NOT_FOUND, error.message);

      case ErrorMessage.BUS_NOT_IN_ROUTE:
        return responseError(res, StatusCode.BUS_NOT_IN_ROUTE, error.message);

      case ErrorMessage.USER_NOT_FOUND:
        return responseError(res, StatusCode.USER_NOT_FOUND, error.message);

      default:
        return responseError(
          res,
          StatusCode.CANNOT_CREATE_BUS_SUBSCRIPTION,
          ErrorMessage.CANNOT_CREATE_BUS_SUBSCRIPTION,
        );
    }
  }
};
