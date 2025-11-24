import { MenuItem } from './../interfaces/menu';
import { DailySale } from './../interfaces/dailySale';
import { DishSale } from './../interfaces/dishSale';
import { Restaurant } from './../interfaces/restaurant';
import { Response, NextFunction } from 'express';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { TIMEZONE } from '../constants/constant';
import { firebaseHelper, getNormalizedDate, responseError, responseSuccess } from '../utils/index';
import logger from '../utils/logger';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const getPaths = (restaurantId: string) => {
  const menuPath = `${restaurantUrl}/${restaurantId}/${Collection.MENU_ITEMS}`;
  const dailySalePath = `${restaurantUrl}/${restaurantId}/${Collection.DAILY_SALES}`;
  const dishSalePath = `${restaurantUrl}/${restaurantId}/${Collection.DISH_SALES}`;

  return { menuPath, dailySalePath, dishSalePath };
};

const getRestaurants = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurants: Restaurant[] = await firebaseHelper.getAllDocs(restaurantUrl);
    if (!restaurants.length) {
      return responseError(res, StatusCode.RESTAURANT_NOT_FOUND, ErrorMessage.RESTAURANT_NOT_FOUND);
    }

    return responseSuccess(res, Message.RESTAURANT_GET_ALL, { restaurants });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_RESTAURANT_LIST + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_RESTAURANT_LIST,
      ErrorMessage.CANNOT_GET_RESTAURANT_LIST,
    );
  }
};

const getRestaurant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const restaurant: Restaurant = await firebaseHelper.getDocById(restaurantUrl, id);
    if (!restaurant) {
      return responseError(res, StatusCode.RESTAURANT_NOT_FOUND, ErrorMessage.RESTAURANT_NOT_FOUND);
    }

    return responseSuccess(res, Message.RESTAURANT_GET_DETAIL, { restaurant });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_RESTAURANT_DETAIL + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_RESTAURANT_DETAIL,
      ErrorMessage.CANNOT_GET_RESTAURANT_DETAIL,
    );
  }
};

const createRestaurant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const nameExists: Restaurant[] = await firebaseHelper.getDocByField(
      restaurantUrl,
      'name',
      name,
    );
    if (nameExists.length) {
      return responseError(
        res,
        StatusCode.RESTAURANT_NAME_EXISTS,
        ErrorMessage.RESTAURANT_NAME_EXISTS,
      );
    }

    const newRestaurant: Restaurant = {
      ...req.body,
      status: ActiveStatus.ACTIVE,
      created_by: req.user?.uid,
    };
    const docRef = await firebaseHelper.createDoc(restaurantUrl, newRestaurant);

    return responseSuccess(res, Message.RESTAURANT_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_RESTAURANT + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_RESTAURANT,
      ErrorMessage.CANNOT_CREATE_RESTAURANT,
    );
  }
};

const updateRestaurant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (name) {
      const nameSnapshot: Restaurant[] = await firebaseHelper.getDocByField(
        `${restaurantUrl}`,
        'name',
        name,
      );
      const isDuplicate = nameSnapshot.some((doc) => doc.id !== id);
      if (isDuplicate) {
        return responseError(
          res,
          StatusCode.RESTAURANT_NAME_EXISTS,
          ErrorMessage.RESTAURANT_NAME_EXISTS,
        );
      }
    }

    await firebaseHelper.updateDoc(restaurantUrl, id, {
      ...req.body,
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.RESTAURANT_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_RESTAURANT + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_RESTAURANT,
      ErrorMessage.CANNOT_UPDATE_RESTAURANT,
    );
  }
};

const getRestaurantMenu = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const restaurant: Restaurant = await firebaseHelper.getDocById(restaurantUrl, id);
    if (!restaurant) {
      return responseError(res, StatusCode.RESTAURANT_NOT_FOUND, ErrorMessage.RESTAURANT_NOT_FOUND);
    }

    const { menuPath } = getPaths(id);
    const menuItems: MenuItem[] = await firebaseHelper.getAllDocs(menuPath);
    if (!menuItems.length) {
      return responseError(
        res,
        StatusCode.MENU_ITEM_LIST_NOT_FOUND,
        ErrorMessage.MENU_ITEM_LIST_NOT_FOUND,
      );
    }

    return responseSuccess(res, Message.GET_MENU_ITEMS, { menuItems });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_MENU_ITEM_LIST + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_MENU_ITEM_LIST,
      ErrorMessage.CANNOT_GET_MENU_ITEM_LIST,
    );
  }
};

const getRestaurantDailySale = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const restaurant: Restaurant = await firebaseHelper.getDocById(restaurantUrl, id);
    if (!restaurant) {
      return responseError(res, StatusCode.RESTAURANT_NOT_FOUND, ErrorMessage.RESTAURANT_NOT_FOUND);
    }

    const now = getNormalizedDate().toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
    const dailySaleId = getNormalizedDate(req.query.date as string).toLocaleDateString('sv-SE', {
      timeZone: TIMEZONE,
    });
    if (dailySaleId === now) {
      const defaultSale: DailySale = {
        id: dailySaleId,
        total_orders: 0,
        total_revenue: 0,
        total_vat_charge: 0,
        created_at: new Date(),
      };

      return responseSuccess(res, Message.NO_SALES_DATA, { dailySales: defaultSale });
    }

    const { dailySalePath } = getPaths(id);
    const dailySales: DailySale = await firebaseHelper.getDocById(dailySalePath, dailySaleId);
    if (!dailySales) {
      return responseError(
        res,
        StatusCode.DAILY_SALES_NOT_FOUND,
        ErrorMessage.DAILY_SALES_NOT_FOUND,
      );
    }

    return responseSuccess(res, Message.GET_DAILY_SALES, { dailySales });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_DAILY_SALES + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_DAILY_SALES,
      ErrorMessage.CANNOT_GET_DAILY_SALES,
    );
  }
};

const getRestaurantDishSales = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const restaurant: Restaurant = await firebaseHelper.getDocById(restaurantUrl, id);
    if (!restaurant) {
      return responseError(res, StatusCode.RESTAURANT_NOT_FOUND, ErrorMessage.RESTAURANT_NOT_FOUND);
    }

    const now = getNormalizedDate().toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
    const dailySaleId = getNormalizedDate(req.query.date as string).toLocaleDateString('sv-SE', {
      timeZone: TIMEZONE,
    });
    if (dailySaleId === now) {
      const defaultDishSales: DishSale[] = [
        {
          id: 'default',
          daily_sale_id: dailySaleId,
          total_quantity: 0,
          total_revenue: 0,
          dish_name: 'No data',
          created_at: new Date(),
        },
      ];

      return responseSuccess(res, Message.NO_SALES_DATA, {
        dishSales: defaultDishSales,
      });
    }

    const { dishSalePath } = getPaths(id);
    const dishSales: DishSale[] = await firebaseHelper.getDocsByFields(dishSalePath, [
      { field: 'date_id', operator: '==', value: dailySaleId },
    ]);
    if (!dishSales.length) {
      return responseError(res, StatusCode.DISH_SALES_NOT_FOUND, ErrorMessage.DISH_SALES_NOT_FOUND);
    }

    return responseSuccess(res, Message.GET_DISH_SALES, { dishSales });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_DISH_SALES + error);

    return responseError(res, StatusCode.CANNOT_GET_DISH_SALES, ErrorMessage.CANNOT_GET_DISH_SALES);
  }
};

export {
  createRestaurant,
  getRestaurants,
  getRestaurant,
  updateRestaurant,
  getRestaurantMenu,
  getRestaurantDailySale,
  getRestaurantDishSales,
};
