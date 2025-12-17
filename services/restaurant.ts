import { Response } from 'express';
import { AuthRequest } from './../interfaces/jwt';
import { MenuItem } from './../interfaces/menu';
import { DailySale } from './../interfaces/dailySale';
import { DishSale } from './../interfaces/dishSale';
import { Restaurant } from './../interfaces/restaurant';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { DEFAULT_PAGE_TOTAL, TIMEZONE } from '../constants/constant';
import {
  firebaseHelper,
  getNormalizedDate,
  responseError,
  responseSuccess,
  logger,
  capitalizeName,
} from '../utils/index';
import { OrderByDirection, WhereFilterOp } from 'firebase-admin/firestore';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const buildingUrl = `${Sites.TOKYO}/${Collection.BUILDINGS}`;
const getPaths = (restaurantId: string) => {
  const menuPath = `${restaurantUrl}/${restaurantId}/${Collection.MENU_ITEMS}`;
  const dailySalePath = `${restaurantUrl}/${restaurantId}/${Collection.DAILY_SALES}`;
  const dishSalePath = `${restaurantUrl}/${restaurantId}/${Collection.DISH_SALES}`;

  return { menuPath, dailySalePath, dishSalePath };
};

const getRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const { status, building_id, name, order, order_by } = req.query;
    const { page, page_size } = req.pagination ?? {};
    const filters: { field: string; operator: WhereFilterOp; value: any }[] = [];
    if (name) {
      const capitalizedName = capitalizeName(name as string);
      filters.push(
        { field: 'name', operator: '>=', value: capitalizedName },
        { field: 'name', operator: '<=', value: capitalizedName + '\uf8ff' },
      );
    }

    if (building_id) {
      filters.push({ field: 'building_id', operator: '==', value: building_id });
    }

    if (status) {
      filters.push({ field: 'status', operator: '==', value: status });
    }

    const total = filters.length
      ? await firebaseHelper.countDocsByFields(restaurantUrl, filters)
      : await firebaseHelper.countAllDocs(restaurantUrl);
    const totalPage = page_size
      ? Math.max(DEFAULT_PAGE_TOTAL, Math.ceil(total / page_size))
      : DEFAULT_PAGE_TOTAL;
    const orderBy = name ? 'name' : (order_by as string);
    const orderDirection = order as OrderByDirection;
    let restaurants: Restaurant[];
    if (filters.length) {
      restaurants = await firebaseHelper.getDocsByFields(
        restaurantUrl,
        filters,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    } else {
      restaurants = await firebaseHelper.getAllDocs(
        restaurantUrl,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    }

    return responseSuccess(res, Message.RESTAURANT_GET_ALL, {
      restaurants,
      pagination: {
        page,
        page_size,
        total,
        total_page: totalPage,
      },
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_RESTAURANT_LIST} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_RESTAURANT_LIST,
      ErrorMessage.CANNOT_GET_RESTAURANT_LIST,
    );
  }
};

const getRestaurantsStats = async (req: AuthRequest, res: Response) => {
  try {
    const total = await firebaseHelper.countAllDocs(restaurantUrl);
    const active = await firebaseHelper.countDocsByFields(restaurantUrl, [
      { field: 'status', operator: '==', value: ActiveStatus.ACTIVE },
    ]);
    const inactive = total - active;

    return responseSuccess(res, Message.RESTAURANT_GET_STATS, {
      total,
      active,
      inactive,
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_RESTAURANT_STATS} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_RESTAURANT_STATS,
      ErrorMessage.CANNOT_GET_RESTAURANT_STATS,
    );
  }
};

const getRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant: Restaurant = await firebaseHelper.getDocById(restaurantUrl, id);
    if (!restaurant) {
      return responseError(res, StatusCode.RESTAURANT_NOT_FOUND, ErrorMessage.RESTAURANT_NOT_FOUND);
    }

    return responseSuccess(res, Message.RESTAURANT_GET_DETAIL, restaurant);
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_RESTAURANT_DETAIL} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_RESTAURANT_DETAIL,
      ErrorMessage.CANNOT_GET_RESTAURANT_DETAIL,
    );
  }
};

const createRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { building_id, name } = req.body;
    const building = await firebaseHelper.getDocById(buildingUrl, building_id);
    if (!building) {
      return responseError(res, StatusCode.BUILDING_NOT_FOUND, ErrorMessage.BUILDING_NOT_FOUND);
    }

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
    logger.warn(`${ErrorMessage.CANNOT_CREATE_RESTAURANT} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_RESTAURANT,
      ErrorMessage.CANNOT_CREATE_RESTAURANT,
    );
  }
};

const updateRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { building_id, name } = req.body;
    const restaurant: Restaurant = await firebaseHelper.getDocById(restaurantUrl, id);
    if (!restaurant) {
      return responseError(res, StatusCode.RESTAURANT_NOT_FOUND, ErrorMessage.RESTAURANT_NOT_FOUND);
    }

    if (building_id) {
      const building = await firebaseHelper.getDocById(buildingUrl, building_id);
      if (!building) {
        return responseError(res, StatusCode.BUILDING_NOT_FOUND, ErrorMessage.BUILDING_NOT_FOUND);
      }
    }

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
    logger.warn(`${ErrorMessage.CANNOT_UPDATE_RESTAURANT} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_RESTAURANT,
      ErrorMessage.CANNOT_UPDATE_RESTAURANT,
    );
  }
};

const getRestaurantMenu = async (req: AuthRequest, res: Response) => {
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

    return responseSuccess(res, Message.GET_MENU_ITEMS, menuItems);
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_MENU_ITEM_LIST} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_MENU_ITEM_LIST,
      ErrorMessage.CANNOT_GET_MENU_ITEM_LIST,
    );
  }
};

const getRestaurantDailySale = async (req: AuthRequest, res: Response) => {
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

      return responseSuccess(res, Message.NO_SALES_DATA, defaultSale);
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

    return responseSuccess(res, Message.GET_DAILY_SALES, dailySales);
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_DAILY_SALES} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_DAILY_SALES,
      ErrorMessage.CANNOT_GET_DAILY_SALES,
    );
  }
};

const getRestaurantDishSales = async (req: AuthRequest, res: Response) => {
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

      return responseSuccess(res, Message.NO_SALES_DATA, defaultDishSales);
    }

    const { dishSalePath } = getPaths(id);
    const dishSales: DishSale[] = await firebaseHelper.getDocsByFields(dishSalePath, [
      { field: 'date_id', operator: '==', value: dailySaleId },
    ]);
    if (!dishSales.length) {
      return responseError(res, StatusCode.DISH_SALES_NOT_FOUND, ErrorMessage.DISH_SALES_NOT_FOUND);
    }

    return responseSuccess(res, Message.GET_DISH_SALES, dishSales);
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_DISH_SALES} | ${error}`);

    return responseError(res, StatusCode.CANNOT_GET_DISH_SALES, ErrorMessage.CANNOT_GET_DISH_SALES);
  }
};

const updateRestaurantStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const restaurant: Restaurant = await firebaseHelper.getDocById(restaurantUrl, id);
    if (!restaurant) {
      return responseError(res, StatusCode.RESTAURANT_NOT_FOUND, ErrorMessage.RESTAURANT_NOT_FOUND);
    }

    await firebaseHelper.updateDoc(restaurantUrl, id, { status, updated_by: req.user?.uid });

    return responseSuccess(res, Message.ORDER_UPDATED, { id });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_UPDATE_ORDER_STATUS} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_ORDER_STATUS,
      ErrorMessage.CANNOT_UPDATE_ORDER_STATUS,
    );
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
  updateRestaurantStatus,
  getRestaurantsStats,
};
