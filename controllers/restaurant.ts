import { Restaurant } from './../interfaces/restaurant';
import { Request, Response, NextFunction } from 'express';
import { firebaseHelper } from '../utils/index';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message } from '../constants/message';

const getRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurants: Restaurant[] = await firebaseHelper.getAllDocs(
      `${Sites.TOKYO}/${Collection.RESTAURANTS}`,
    );

    return res.status(200).json(restaurants);
  } catch (error) {
    return res.status(404).json({ error });
  }
};

const getRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const restaurant: Restaurant = await firebaseHelper.getDocById(
      `${Sites.TOKYO}/${Collection.RESTAURANTS}`,
      id,
    );

    return res.status(200).json(restaurant);
  } catch (error) {
    return res.status(404).json({
      message: ErrorMessage.RESTAURANT_NOT_FOUND,
      error,
    });
  }
};

const createRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newRestaurant = {
      ...req.body,
      status: ActiveStatus.ACTIVE,
      today_menu: [],
      created_by: req['user'].uid,
    };
    const docRef = await firebaseHelper.createDoc(
      `${Sites.TOKYO}/${Collection.RESTAURANTS}`,
      newRestaurant,
    );

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

const updateRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.body || !Object.keys(req.body).length) {
      return res.status(400).json({ message: ErrorMessage.NO_UPDATE_DATA });
    }

    await firebaseHelper.updateDoc(`${Sites.TOKYO}/${Collection.RESTAURANTS}`, id, {
      ...req.body,
      updated_by: req['user'].uid,
    });

    return res.status(200).json({
      message: Message.RESTAURANT_UPDATED,
      id,
    });
  } catch (error) {
    return res.status(404).json({
      message: ErrorMessage.CANNOT_UPDATE_RESTAURANT,
      error,
    });
  }
};

export { createRestaurant, getRestaurants, getRestaurant, updateRestaurant };
