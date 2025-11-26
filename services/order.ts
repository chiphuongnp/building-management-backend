import { MenuItem } from './../interfaces/menu';
import { Collection, OrderStatus, PickupMethod, Sites, VATRate } from '../constants/enum';
import { Order, OrderDetail } from './../interfaces/order';
import { AuthRequest } from '../interfaces/jwt';
import { Response, NextFunction } from 'express';
import {
  firebaseHelper,
  getNormalizedDate,
  normalizeName,
  responseError,
  responseSuccess,
  calculatePayment,
} from '../utils/index';
import logger from '../utils/logger';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { Timestamp } from 'firebase-admin/firestore';
import { User } from '../interfaces/user';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const userUrl = `${Sites.TOKYO}/${Collection.USERS}`;
const getPaths = (restaurantId: string) => {
  const orderPath = `${restaurantUrl}/${restaurantId}/${Collection.ORDERS}`;
  const detailPath = `${restaurantUrl}/${restaurantId}/${Collection.ORDER_DETAILS}`;
  const menuPath = `${restaurantUrl}/${restaurantId}/${Collection.MENU_ITEMS}`;

  return { orderPath, detailPath, menuPath };
};

const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { order_details, delivery_info, points_used, ...orders } = req.body;
    const { orderPath, detailPath, menuPath } = getPaths(restaurantId);
    const uid = req.user?.uid;
    if (!uid) {
      return responseError(res, StatusCode.ACCOUNT_NOT_FOUND, ErrorMessage.ACCOUNT_NOT_FOUND);
    }

    const user: User = await firebaseHelper.getDocById(userUrl, uid);
    if (points_used > (user.points ?? 0)) {
      return responseError(res, StatusCode.INVALID_POINTS, ErrorMessage.INVALID_POINTS);
    }

    const deliveryInfo =
      orders.pickup_method === PickupMethod.DELIVERY
        ? {
            contact_name: delivery_info?.contact_name || user?.fullName || 'Guest',
            contact_phone: delivery_info?.contact_phone || user?.phone || '',
            notes: delivery_info?.notes || '',
          }
        : delivery_info;
    const menuItems = await firebaseHelper.getAllDocs(menuPath);
    const menuMap = Object.fromEntries(
      menuItems.map((item: MenuItem) => [normalizeName(item.name), item]),
    );
    const base_amount = order_details.reduce(
      (sum: number, item: OrderDetail) => sum + item.price * item.quantity,
      0,
    );
    const vat_charge = base_amount * VATRate.FOOD;
    const total_amount = base_amount + vat_charge;
    const { finalAmount, discount, pointsEarned, finalPointsUsed } = calculatePayment(
      total_amount,
      user.ranks,
      points_used,
    );
    const newOrder: Order = {
      ...orders,
      status: OrderStatus.PENDING,
      user_id: req.user?.uid,
      base_amount,
      vat_charge,
      discount,
      points_used: finalPointsUsed,
      total_amount: finalAmount,
      points_earned: pointsEarned,
      delivery_info: deliveryInfo,
    };

    const orderId = await firebaseHelper.runTransaction(async (transaction) => {
      await Promise.all(
        order_details.map(async (detail: OrderDetail) => {
          const { name: detailName, quantity: detailQuantity } = detail;
          const key = normalizeName(detailName);
          const menuItem = menuMap[key];
          if (!menuItem) {
            logger.warn(`${ErrorMessage.DISH_NOT_FOUND_IN_MENU} | Dish=${detailName}`);

            throw new Error(ErrorMessage.DISH_NOT_FOUND_IN_MENU);
          }

          const snapshot = await firebaseHelper.getTransaction(menuPath, menuItem.id, transaction);
          if (!snapshot) {
            logger.warn(`${ErrorMessage.MENU_ITEM_NOT_FOUND} | Dish=${detailName}`);

            throw new Error(ErrorMessage.MENU_ITEM_NOT_FOUND);
          }

          const stockQuantity = snapshot.quantity;
          if (stockQuantity < detailQuantity) {
            logger.warn(
              `${ErrorMessage.DISH_QUANTITY_EXCEEDS_STOCK} | dish=${detailName} | quantity=${detailQuantity} | stock=${stockQuantity}`,
            );

            throw new Error(ErrorMessage.DISH_QUANTITY_EXCEEDS_STOCK);
          }

          await firebaseHelper.updateTransaction(
            menuPath,
            snapshot.id,
            { quantity: stockQuantity - detailQuantity },
            transaction,
          );
        }),
      );

      const order = await firebaseHelper.setTransaction(orderPath, newOrder, transaction);
      await Promise.all(
        order_details.map((detail: OrderDetail) =>
          firebaseHelper.setTransaction(detailPath, { ...detail, order_id: order.id }, transaction),
        ),
      );

      const updatedPoints = (user.points ?? 0) - finalPointsUsed + pointsEarned;
      await firebaseHelper.updateTransaction(
        userUrl,
        user.uid,
        { points: updatedPoints },
        transaction,
      );

      return order.id;
    });

    return responseSuccess(res, Message.ORDER_CREATED, { id: orderId });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_CREATE_DISH} | ${error}`);

    switch (error.message) {
      case ErrorMessage.MENU_ITEM_NOT_FOUND:
        return responseError(res, StatusCode.MENU_ITEM_NOT_FOUND, ErrorMessage.MENU_ITEM_NOT_FOUND);

      case ErrorMessage.DISH_QUANTITY_EXCEEDS_STOCK:
        return responseError(
          res,
          StatusCode.DISH_QUANTITY_EXCEEDS_STOCK,
          ErrorMessage.DISH_QUANTITY_EXCEEDS_STOCK,
        );

      case ErrorMessage.DISH_NOT_FOUND_IN_MENU:
        return responseError(
          res,
          StatusCode.DISH_NOT_FOUND_IN_MENU,
          ErrorMessage.DISH_NOT_FOUND_IN_MENU,
        );

      default:
        return responseError(res, StatusCode.CANNOT_CREATE_ORDER, ErrorMessage.CANNOT_CREATE_ORDER);
    }
  }
};

const getOrderDetailsByOrderId = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: orderId } = req.params;
    const { orderPath, detailPath } = getPaths(restaurantId);
    const order: Order = await firebaseHelper.getDocById(orderPath, orderId);
    if (!order) {
      return responseError(res, StatusCode.ORDER_NOT_FOUND, ErrorMessage.ORDER_NOT_FOUND);
    }

    if (req.user?.uid !== order.user_id) {
      logger.warn(ErrorMessage.GET_ORDER_FORBIDDEN);

      return responseError(res, StatusCode.GET_ORDER_FORBIDDEN, ErrorMessage.GET_ORDER_FORBIDDEN);
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

    return responseSuccess(res, Message.GET_ORDER_DETAILS, {
      ...order,
      order_details: orderDetails,
    });
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_GET_ORDER_DETAILS + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_ORDER_DETAILS,
      ErrorMessage.CANNOT_GET_ORDER_DETAILS,
    );
  }
};

const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.query;
    const { orderPath } = getPaths(restaurantId);

    const dateStr = date as string;
    const startTime = getNormalizedDate(dateStr);
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);

    const orders: Order[] = await firebaseHelper.getDocsByFields(orderPath, [
      { field: 'created_at', operator: '>=', value: Timestamp.fromDate(startTime) },
      { field: 'created_at', operator: '<', value: Timestamp.fromDate(endTime) },
    ]);
    if (!orders.length) {
      return responseError(res, StatusCode.ORDER_NOT_FOUND, ErrorMessage.ORDER_NOT_FOUND);
    }

    return responseSuccess(res, Message.GET_ORDER_LIST, orders);
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_GET_ORDER_LIST + error);

    return responseError(res, StatusCode.CANNOT_GET_ORDER_LIST, ErrorMessage.CANNOT_GET_ORDER_LIST);
  }
};

const getOrdersByUserId = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { orderPath } = getPaths(restaurantId);
    const orders: Order[] = await firebaseHelper.getDocsByFields(orderPath, [
      { field: 'user_id', operator: '==', value: req.user?.uid },
      {
        field: 'status',
        operator: 'in',
        value: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.DELIVERING],
      },
    ]);
    if (!orders.length) {
      return responseError(res, StatusCode.ORDER_NOT_FOUND, ErrorMessage.ORDER_NOT_FOUND);
    }

    return responseSuccess(res, Message.GET_USER_ORDERS, orders);
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_GET_USER_ORDERS + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_USER_ORDERS,
      ErrorMessage.CANNOT_GET_USER_ORDERS,
    );
  }
};

const getOrderHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { orderPath } = getPaths(restaurantId);
    const orders: Order[] = await firebaseHelper.getDocsByFields(orderPath, [
      { field: 'user_id', operator: '==', value: req.user?.uid },
      { field: 'status', operator: '==', value: OrderStatus.COMPLETED },
    ]);
    if (!orders.length) {
      return responseError(res, StatusCode.ORDER_NOT_FOUND, ErrorMessage.ORDER_NOT_FOUND);
    }

    return responseSuccess(res, Message.GET_USER_ORDER_HISTORY, orders);
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_GET_USER_ORDER_HISTORY + error);
    return responseError(
      res,
      StatusCode.CANNOT_GET_USER_ORDER_HISTORY,
      ErrorMessage.CANNOT_GET_USER_ORDER_HISTORY,
    );
  }
};

const updateOrderInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: orderId } = req.params;
    const { orderPath } = getPaths(restaurantId);
    const order: Order = await firebaseHelper.getDocById(orderPath, orderId);
    if (!order) {
      return responseError(res, StatusCode.ORDER_NOT_FOUND, ErrorMessage.ORDER_NOT_FOUND);
    }

    if (req.user?.uid !== order.user_id) {
      logger.warn(ErrorMessage.UPDATE_ORDER_FORBIDDEN);

      return responseError(
        res,
        StatusCode.UPDATE_ORDER_FORBIDDEN,
        ErrorMessage.UPDATE_ORDER_FORBIDDEN,
      );
    }

    await firebaseHelper.updateDoc(orderPath, orderId, { ...req.body, updated_by: req.user?.uid });

    return responseSuccess(res, Message.ORDER_UPDATED, { id: orderId });
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_UPDATE_ORDER_INFO + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_ORDER_INFO,
      ErrorMessage.CANNOT_UPDATE_ORDER_INFO,
    );
  }
};

const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: orderId } = req.params;
    const { status } = req.body;
    const { orderPath } = getPaths(restaurantId);
    const order: Order = await firebaseHelper.getDocById(orderPath, orderId);
    if (!order) {
      return responseError(res, StatusCode.ORDER_NOT_FOUND, ErrorMessage.ORDER_NOT_FOUND);
    }

    await firebaseHelper.updateDoc(orderPath, orderId, {
      status,
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.ORDER_STATUS_UPDATED, { id: orderId });
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_UPDATE_ORDER_STATUS + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_ORDER_STATUS,
      ErrorMessage.CANNOT_UPDATE_ORDER_STATUS,
    );
  }
};

export {
  createOrder,
  getOrderDetailsByOrderId,
  getOrders,
  getOrdersByUserId,
  getOrderHistory,
  updateOrderInfo,
  updateOrderStatus,
};
