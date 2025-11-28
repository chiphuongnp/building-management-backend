import { Response, NextFunction } from 'express';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import {
  firebaseHelper,
  logger,
  responseError,
  responseSuccess,
  deleteImages,
} from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { Dish } from '../interfaces/dish';
import { AuthRequest } from '../interfaces/jwt';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const getDishPath = (restaurantId: string) => {
  return `${restaurantUrl}/${restaurantId}/${Collection.DISHES}`;
};

const getDishes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const dishes: Dish[] = await firebaseHelper.getAllDocs(getDishPath(restaurantId));
    if (!dishes.length) {
      return responseError(res, StatusCode.DISH_NOT_FOUND, ErrorMessage.DISH_NOT_FOUND);
    }

    return responseSuccess(res, Message.DISH_GET_ALL, { dishes });
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

    const { name } = req.body;
    if (name) {
      const nameSnapshot = await firebaseHelper.getDocByField(dishPath, 'name', name);
      const isDuplicate = nameSnapshot.some((doc) => doc.id !== dishId);
      if (isDuplicate) {
        return responseError(res, StatusCode.DISH_NAME_EXISTS, ErrorMessage.DISH_NAME_EXISTS);
      }
    }

    const files = req?.files as Express.Multer.File[];
    const imageUrls = files?.map((file) => file.path.replace(/\\/g, '/'));
    if (imageUrls.length && dish.image_urls?.length) {
      await deleteImages(dish.image_urls);
    }

    const updatedDish = {
      ...req.body,
      image_urls: imageUrls.length ? imageUrls : dish.image_urls,
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
