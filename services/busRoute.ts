import { Response } from 'express';
import { BusRoute } from '../interfaces/busRoute';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { firebaseHelper, responseError, responseSuccess } from '../utils';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import logger from '../utils/logger';
import { getDocById } from '../utils/firebaseHelper';
import { Bus } from '../interfaces/bus';

const busRouteCollection = `${Sites.TOKYO}/${Collection.BUS_ROUTES}`;
const busCollection = `${Sites.TOKYO}/${Collection.BUSES}`;

export const createBusRoute = async (req: AuthRequest, res: Response) => {
  try {
    const data: Partial<BusRoute> = req.body;

    const existingRoute = await firebaseHelper.getDocByField(
      busRouteCollection,
      'route_code',
      data.route_code,
    );
    if (existingRoute.length) {
      return responseError(
        res,
        StatusCode.BUS_ROUTE_ALREADY_EXISTS,
        ErrorMessage.BUS_ROUTE_ALREADY_EXISTS,
      );
    }

    if (data.bus_id?.length) {
      for (const busId of data.bus_id) {
        const existingBus: Bus = await getDocById(busCollection, busId);
        if (!existingBus)
          return responseError(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND, {
            id: busId,
          });
      }
    }

    const docRef = await firebaseHelper.createDoc(busRouteCollection, {
      ...data,
      status: ActiveStatus.INACTIVE,
      created_by: req.user?.uid,
    });

    return responseSuccess(res, Message.BUS_ROUTE_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_BUS_ROUTE + error);

    return responseError(res, StatusCode.BUS_ROUTE_CREATE, ErrorMessage.CANNOT_CREATE_BUS_ROUTE);
  }
};

export const getBusRouteDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const busRoute = await firebaseHelper.getDocById(busRouteCollection, id);
    if (!busRoute) {
      return responseError(res, StatusCode.BUS_ROUTE_NOT_FOUND, ErrorMessage.BUS_ROUTE_NOT_FOUND);
    }

    return responseSuccess(res, Message.BUS_ROUTE_GET_DETAIL, busRoute);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_BUS_ROUTE_DETAIL + error);

    return responseError(
      res,
      StatusCode.BUS_ROUTE_GET_DETAIL,
      ErrorMessage.CANNOT_GET_BUS_ROUTE_DETAIL,
    );
  }
};

export const getAllBusRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const busRoutes = await firebaseHelper.getAllDocs(busRouteCollection);
    if (!busRoutes.length) {
      return responseError(res, StatusCode.BUS_ROUTE_NOT_FOUND, ErrorMessage.BUS_ROUTE_NOT_FOUND);
    }

    return responseSuccess(res, Message.BUS_ROUTE_GET_ALL, busRoutes);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_BUS_ROUTE_LIST + error);

    return responseError(res, StatusCode.BUS_ROUTE_GET_ALL, ErrorMessage.CANNOT_GET_BUS_ROUTE_LIST);
  }
};

export const updateBusRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<BusRoute> = req.body;

    const existingBusRoute = await firebaseHelper.getDocById(busRouteCollection, id);
    if (!existingBusRoute) {
      return responseError(res, StatusCode.BUS_ROUTE_NOT_FOUND, ErrorMessage.BUS_ROUTE_NOT_FOUND);
    }

    if (data.route_code && data.route_code !== existingBusRoute.routeCode) {
      const duplicateRoute = await firebaseHelper.getDocByField(
        busRouteCollection,
        'route_code',
        data.route_code,
      );
      if (duplicateRoute.length) {
        return responseError(
          res,
          StatusCode.BUS_ROUTE_ALREADY_EXISTS,
          ErrorMessage.BUS_ROUTE_ALREADY_EXISTS,
        );
      }
    }

    if (data.bus_id?.length) {
      for (const busId of data.bus_id) {
        const existingBus: Bus = await getDocById(busCollection, busId);
        if (!existingBus) {
          return responseError(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND, {
            id: busId,
          });
        }
      }
    }

    await firebaseHelper.updateDoc(busRouteCollection, id, {
      ...data,
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.BUS_ROUTE_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_BUS_ROUTE + error);

    return responseError(res, StatusCode.BUS_ROUTE_UPDATE, ErrorMessage.CANNOT_UPDATE_BUS_ROUTE);
  }
};

export const activeBusRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingBusRoute = await firebaseHelper.getDocById(busRouteCollection, id);
    if (!existingBusRoute) {
      return responseError(res, StatusCode.BUS_ROUTE_NOT_FOUND, ErrorMessage.BUS_ROUTE_NOT_FOUND);
    }

    await firebaseHelper.updateDoc(busRouteCollection, id, {
      status: ActiveStatus.ACTIVE,
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.BUS_ROUTE_UPDATED, { id, status: ActiveStatus.ACTIVE });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_BUS_ROUTE + error);

    return responseError(res, StatusCode.BUS_ROUTE_UPDATE, ErrorMessage.CANNOT_UPDATE_BUS_ROUTE);
  }
};

export const inactiveBusRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingBusRoute = await firebaseHelper.getDocById(busRouteCollection, id);
    if (!existingBusRoute) {
      return responseError(res, StatusCode.BUS_ROUTE_NOT_FOUND, ErrorMessage.BUS_ROUTE_NOT_FOUND);
    }

    await firebaseHelper.updateDoc(busRouteCollection, id, {
      status: ActiveStatus.INACTIVE,
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.BUS_ROUTE_UPDATED, { id, status: ActiveStatus.INACTIVE });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_BUS_ROUTE + error);

    return responseError(res, StatusCode.BUS_ROUTE_UPDATE, ErrorMessage.CANNOT_UPDATE_BUS_ROUTE);
  }
};
