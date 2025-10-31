import { Request, Response, NextFunction } from 'express';
import { firebaseHelper } from '../utils/index';
import { ActiveStatus, Sites } from '../constants/enum';

const getRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurants = await firebaseHelper.getAllDocs(`${Sites.TOKYO}/restaurants`);

    return res.status(200).json(restaurants);
  } catch (error) {
    return res.status(404).json({ error });
  }
};

const getRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const restaurant = await firebaseHelper.getDoc(`${Sites.TOKYO}/restaurants`, id);

    return res.status(200).json(restaurant);
  } catch (error) {
    return res.status(404).json({ message: 'Restaurant not found!', error });
  }
};

const createRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newRestaurant = {
      ...req.body,
      status: ActiveStatus.ACTIVE,
      today_menu: [],
      created_by: 'admin',
    };
    const docRef = await firebaseHelper.createDoc(`${Sites.TOKYO}/restaurants`, newRestaurant);

    return res.status(200).json({
      message: 'Restaurant created successfully.',
      id: docRef.id,
    });
  } catch (error) {
    return res.status(400).json({ message: 'Cannot create restaurant!', error });
  }
};

const updateRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Restaurant ID is required.' });
    }

    if (!req.body || !Object.keys(req.body).length) {
      return res.status(400).json({ message: 'No update data provided.' });
    }

    await firebaseHelper.updateDoc(`${Sites.TOKYO}/restaurants`, id, {
      ...req.body,
      updated_by: 'admin',
    });

    return res.status(200).json({
      message: 'Restaurant updated successfully.',
      id,
    });
  } catch (error) {
    return res.status(404).json({ message: 'Cannot update restaurant!', error });
  }
};

export { createRestaurant, getRestaurants, getRestaurant, updateRestaurant };
