import { Response, NextFunction } from 'express';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import {
  firebaseHelper,
  logger,
  responseError,
  responseSuccess,
  deleteImages,
  capitalizeName,
} from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { Dish } from '../interfaces/dish';
import { AuthRequest } from '../interfaces/jwt';
import { OrderByDirection, WhereFilterOp } from 'firebase-admin/firestore';
import { DEFAULT_PAGE_TOTAL } from '../constants/constant';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const getDishPath = (restaurantId: string) => {
  return `${restaurantUrl}/${restaurantId}/${Collection.DISHES}`;
};

const getDishes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { name, category, status, order, order_by } = req.query;
    const { page, page_size } = req.pagination ?? {};
    const filters: { field: string; operator: WhereFilterOp; value: any }[] = [];
    if (name) {
      const capitalizedName = capitalizeName(name as string);
      filters.push(
        { field: 'name', operator: '>=', value: capitalizedName },
        { field: 'name', operator: '<=', value: capitalizedName + '\uf8ff' },
      );
    }

    if (category) {
      filters.push({ field: 'category', operator: '==', value: category });
    }

    if (status) {
      filters.push({ field: 'status', operator: '==', value: status });
    }

    const dishUrl = getDishPath(restaurantId);
    const total = filters.length
      ? await firebaseHelper.countDocsByFields(dishUrl, filters)
      : await firebaseHelper.countAllDocs(dishUrl);
    const totalPage = page_size
      ? Math.max(DEFAULT_PAGE_TOTAL, Math.ceil(total / page_size))
      : DEFAULT_PAGE_TOTAL;
    const orderBy = name ? 'name' : (order_by as string) || 'created_at';
    const orderDirection = (order as OrderByDirection) || 'desc';
    let dishes: Dish[];
    if (filters.length) {
      dishes = await firebaseHelper.getDocsByFields(
        dishUrl,
        filters,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    } else {
      dishes = await firebaseHelper.getAllDocs(dishUrl, orderBy, orderDirection, page, page_size);
    }

    if (!dishes.length) {
      return responseError(res, StatusCode.DISH_NOT_FOUND, ErrorMessage.DISH_NOT_FOUND);
    }

    return responseSuccess(res, Message.DISH_GET_ALL, {
      dishes,
      pagination: {
        page,
        page_size,
        total,
        total_page: totalPage,
      },
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_DISH_LIST + error);

    return responseError(res, StatusCode.CANNOT_GET_DISH_LIST, ErrorMessage.CANNOT_GET_DISH_LIST);
  }
};

const getDishById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: dishId } = req.params;
    const dish: Dish = await firebaseHelper.getDocById(getDishPath(restaurantId), dishId);
    if (!dish) {
      return responseError(res, StatusCode.DISH_NOT_FOUND, ErrorMessage.DISH_NOT_FOUND);
    }

    return responseSuccess(res, Message.DISH_GET_DETAIL, { dish });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_DISH_DETAIL + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_DISH_DETAIL,
      ErrorMessage.CANNOT_GET_DISH_DETAIL,
    );
  }
};

const createDish = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { name } = req.body;
    const dishPath = getDishPath(restaurantId);
    const nameExists = await firebaseHelper.getDocByField(dishPath, 'name', name);
    if (nameExists.length) {
      return responseError(res, StatusCode.DISH_NAME_EXISTS, ErrorMessage.DISH_NAME_EXISTS);
    }

    const files = req?.files as Express.Multer.File[];
    const newDish: Dish = {
      ...req.body,
      image_urls: files?.map((file) => file.path.replace(/\\/g, '/')) || [],
      status: ActiveStatus.ACTIVE,
      created_by: req.user?.uid,
    };
    const docRef = await firebaseHelper.createDoc(dishPath, newDish);

    return responseSuccess(res, Message.DISH_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_DISH + error);

    return responseError(res, StatusCode.CANNOT_CREATE_DISH, ErrorMessage.CANNOT_CREATE_DISH);
  }
};

const updateDish = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: dishId } = req.params;
    const dishPath = getDishPath(restaurantId);
    const dish: Dish = await firebaseHelper.getDocById(dishPath, dishId);
    if (!dish) {
      return responseError(res, StatusCode.DISH_NOT_FOUND, ErrorMessage.DISH_NOT_FOUND);
    }

    const { name, image_urls } = req.body;
    if (name) {
      const nameSnapshot = await firebaseHelper.getDocByField(dishPath, 'name', name);
      const isDuplicate = nameSnapshot.some((doc) => doc.id !== dishId);
      if (isDuplicate) {
        return responseError(res, StatusCode.DISH_NAME_EXISTS, ErrorMessage.DISH_NAME_EXISTS);
      }
    }

    if (image_urls) {
      const deletedImages = dish.image_urls?.filter((url) => !image_urls.includes(url)) ?? [];
      if (deletedImages.length) await deleteImages(deletedImages);

      dish.image_urls = image_urls;
    }

    const files = req?.files as Express.Multer.File[];
    const newImages = files?.map((f) => f.path.replace(/\\/g, '/')) || [];
    const updatedDish = {
      ...req.body,
      image_urls: [...(dish.image_urls ?? []), ...newImages],
      updated_by: req.user?.uid,
    };
    await firebaseHelper.updateDoc(dishPath, dishId, updatedDish);

    return responseSuccess(res, Message.DISH_UPDATED, { id: dishId });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_DISH + error);

    return responseError(res, StatusCode.CANNOT_UPDATE_DISH, ErrorMessage.CANNOT_UPDATE_DISH);
  }
};

export { getDishById, getDishes, createDish, updateDish };
