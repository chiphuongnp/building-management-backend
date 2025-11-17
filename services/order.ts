import { Collection, OrderStatus, PickupMethod, Sites, VATRate } from '../constants/enum';
import { Order, OrderDetail } from './../interfaces/order';
import { AuthRequest } from '../interfaces/jwt';
import { Response, NextFunction } from 'express';
import { firebaseHelper, responseError, responseSuccess } from '../utils/index';
import logger from '../utils/logger';
import { ErrorMessage, Message, StatusCode } from '../constants/message';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const getPaths = (restaurantId: string) => {
  const orderPath = `${restaurantUrl}/${restaurantId}/${Collection.ORDERS}`;
  const detailPath = `${restaurantUrl}/${restaurantId}/${Collection.ORDER_DETAILS}`;

  return { orderPath, detailPath };
};

const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { orderPath, detailPath } = getPaths(restaurantId);

    const { order_details, ...orders } = req.body;
    const base_amount = order_details.reduce(
      (sum: number, item: OrderDetail) => sum + item.price * item.quantity,
      0,
    );
    const vat_charge = base_amount * VATRate.FOOD;
    const total_amount = base_amount + vat_charge;
    const newOrder: Order = {
      ...orders,
      status: OrderStatus.PENDING,
      user_id: req.user?.uid,
      base_amount,
      vat_charge,
      total_amount,
    };
    const docRef = await firebaseHelper.createDoc(orderPath, newOrder);

    const newOrderDetails: OrderDetail[] = order_details.map((detail: OrderDetail) => ({
      ...detail,
      order_id: docRef.id,
    }));
    await firebaseHelper.createBatchDocs(detailPath, newOrderDetails);

    return responseSuccess(res, Message.ORDER_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_DISH + error);

    return responseError(res, StatusCode.CANNOT_CREATE_ORDER, ErrorMessage.CANNOT_CREATE_ORDER);
  }
};

const getOrderDetailsById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: orderId } = req.params;
    const { orderPath, detailPath } = getPaths(restaurantId);
    const order: Order = await firebaseHelper.getDocById(orderPath, orderId);
    if (!order) {
      return responseError(res, StatusCode.ORDER_NOT_FOUND, ErrorMessage.ORDER_NOT_FOUND);
    }

    const orderDetails = await firebaseHelper.getDocsByFields(detailPath, [
      { field: 'order_id', operator: '==', value: orderId },
    ]);
    if (!orderDetails.length) {
      return responseError(
        res,
        StatusCode.ORDER_DETAIL_NOT_FOUND,
        ErrorMessage.ORDER_DETAIL_NOT_FOUND,
      );
    }

    return responseSuccess(res, Message.GET_ORDER_DETAILS, { order, orderDetails });
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_GET_ORDER_DETAILS + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_ORDER_DETAILS,
      ErrorMessage.CANNOT_GET_ORDER_DETAILS,
    );
  }
};

export { createOrder, getOrderDetailsById };
