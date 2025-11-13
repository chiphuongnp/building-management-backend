import { Restaurant } from './../interfaces/restaurant';
import { Response, NextFunction } from 'express';
import { firebaseHelper } from '../utils/index';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { responseError, responseSuccess } from '../utils/error';
import logger from '../utils/logger';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
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
    const nameExists = await firebaseHelper.getDocByField(restaurantUrl, 'name', name);
    if (nameExists.length) {
      return responseError(
        res,
        StatusCode.RESTAURANT_NAME_EXISTS,
        ErrorMessage.RESTAURANT_NAME_EXISTS,
      );
    }

    const newRestaurant = {
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
      const nameSnapshot = await firebaseHelper.getDocByField(`${restaurantUrl}`, 'name', name);
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

export { createRestaurant, getRestaurants, getRestaurant, updateRestaurant };
