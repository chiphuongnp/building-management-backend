import { Restaurant } from './../interfaces/restaurant';
import { Response, NextFunction } from 'express';
import { firebaseHelper } from '../utils/index';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const getRestaurants = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurants: Restaurant[] = await firebaseHelper.getAllDocs(restaurantUrl);

    return res.status(200).json(restaurants);
  } catch (error) {
    return res.status(404).json({ error });
  }
};

const getRestaurant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const restaurant: Restaurant = await firebaseHelper.getDocById(restaurantUrl, id);

    return res.status(200).json(restaurant);
  } catch (error) {
    return res.status(404).json({
      message: ErrorMessage.RESTAURANT_NOT_FOUND,
      error,
    });
  }
};

const createRestaurant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const nameExists = await firebaseHelper.getDocByField(restaurantUrl, 'name', name);
    if (nameExists.length) {
      return res.status(409).json({
        success: false,
        message: ErrorMessage.RESTAURANT_NAME_EXISTS,
      });
    }

    const newRestaurant = {
      ...req.body,
      status: ActiveStatus.ACTIVE,
      today_menu: [],
      created_by: req.user?.uid,
    };
    const docRef = await firebaseHelper.createDoc(restaurantUrl, newRestaurant);

    return res.status(200).json({
      message: Message.RESTAURANT_CREATED,
      id: docRef.id,
    });
  } catch (error) {
    return res.status(400).json({
      message: ErrorMessage.CANNOT_CREATE_RESTAURANT,
      error,
    });
  }
};

const updateRestaurant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.body || !Object.keys(req.body).length) {
      return res.status(400).json({ message: ErrorMessage.NO_UPDATE_DATA });
    }

    const { name } = req.body;
    if (name) {
      const nameSnapshot = await firebaseHelper.getDocByField(`${restaurantUrl}`, 'name', name);
      const isDuplicate = nameSnapshot.some((doc) => doc.id !== id);
      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: ErrorMessage.RESTAURANT_NAME_EXISTS,
        });
      }
    }

    await firebaseHelper.updateDoc(restaurantUrl, id, {
      ...req.body,
      updated_by: req.user?.uid,
    });

    return res.status(200).json({
      success: true,
      message: Message.RESTAURANT_UPDATED,
      id,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: ErrorMessage.CANNOT_UPDATE_RESTAURANT,
      error,
    });
  }
};

export { createRestaurant, getRestaurants, getRestaurant, updateRestaurant };
