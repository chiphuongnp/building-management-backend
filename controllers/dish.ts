import { Request, Response, NextFunction } from 'express';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import { firebaseHelper } from '../utils';
import { ErrorMessage, Message } from '../constants/message';
import { Dish } from '../interfaces/dish';
import { deleteImages } from '../utils/deleteFile';

const getDishes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const dishes: Dish[] = await firebaseHelper.getAllDocs(
      `${Sites.TOKYO}/${Collection.RESTAURANTS}/${restaurantId}/${Collection.DISHES}`,
    );

    return res.status(200).json(dishes);
  } catch (error) {
    return res.status(404).json({ error });
  }
};

const getDishById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id } = req.params;
    if (!id) {
      return res.status(400).json({ message: ErrorMessage.DISH_ID_REQUIRED });
    }

    const dish: Dish = await firebaseHelper.getDocById(
      `${Sites.TOKYO}/${Collection.RESTAURANTS}/${restaurantId}/${Collection.DISHES}`,
      id,
    );
    if (!dish) {
      return res.status(404).json({ message: ErrorMessage.DISH_NOT_FOUND });
    }

    return res.status(200).json(dish);
  } catch (error) {
    return res.status(404).json({ error });
  }
};

const createDish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const files = req?.files as Express.Multer.File[];
    const image_urls = files?.map((file) => file.path.replace(/\\/g, '/')) || [];
    const newDish: Dish = {
      ...req.body,
      image_urls,
      status: ActiveStatus.ACTIVE,
      created_by: req['user'].uid,
    };

    const docRef = await firebaseHelper.createDoc(
      `${Sites.TOKYO}/${Collection.RESTAURANTS}/${restaurantId}/${Collection.DISHES}`,
      newDish,
    );

    return res.status(200).json({
      message: Message.DISH_CREATED,
      id: docRef.id,
    });
  } catch (error) {
    return res.status(400).json({
      message: ErrorMessage.CANNOT_CREATE_DISH,
      error,
    });
  }
};

const updateDish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id } = req.params;
    if (!id) {
      return res.status(400).json({ message: ErrorMessage.DISH_ID_REQUIRED });
    }

    const dish: Dish = await firebaseHelper.getDocById(
      `${Sites.TOKYO}/${Collection.RESTAURANTS}/${restaurantId}/${Collection.DISHES}`,
      id,
    );
    if (!dish) {
      return res.status(404).json({ message: ErrorMessage.DISH_NOT_FOUND });
    }

    const files = req?.files as Express.Multer.File[];
    const image_urls = files?.map((file) => file.path.replace(/\\/g, '/'));
    if (image_urls.length && dish.image_urls?.length) {
      await deleteImages(dish.image_urls);
    }

    const updatedDish = {
      ...req.body,
      image_urls: image_urls.length ? image_urls : dish.image_urls,
      updated_by: req['user'].uid,
    };

    await firebaseHelper.updateDoc(
      `${Sites.TOKYO}/${Collection.RESTAURANTS}/${restaurantId}/${Collection.DISHES}`,
      id,
      updatedDish,
    );

    return res.status(200).json({
      message: Message.DISH_UPDATED,
      id,
    });
  } catch (error) {
    return res.status(400).json({
      message: ErrorMessage.CANNOT_UPDATE_DISH,
      error,
    });
  }
};

export { getDishById, getDishes, createDish, updateDish };
