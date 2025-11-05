import { Response, NextFunction } from 'express';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import { firebaseHelper } from '../utils';
import { ErrorMessage, Message } from '../constants/message';
import { Dish } from '../interfaces/dish';
import { deleteImages } from '../utils/deleteFile';
import { AuthRequest } from '../interfaces/jwt';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const getDishes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const dishes: Dish[] = await firebaseHelper.getAllDocs(
      `${restaurantUrl}/${restaurantId}/${Collection.DISHES}`,
    );
    if (!dishes.length) {
      return res.status(404).json({ message: ErrorMessage.CANNOT_GET_DISH_LIST });
    }

    return res.status(200).json(dishes);
  } catch (error) {
    return res.status(400).json({ success: false, message: ErrorMessage.CANNOT_GET_DISH_LIST });
  }
};

const getDishById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: dishId } = req.params;
    const dish: Dish = await firebaseHelper.getDocById(
      `${restaurantUrl}/${restaurantId}/${Collection.DISHES}`,
      dishId,
    );
    if (!dish) {
      return res.status(404).json({ message: ErrorMessage.DISH_NOT_FOUND });
    }

    return res.status(200).json(dish);
  } catch (error) {
    return res.status(404).json({ error });
  }
};

const createDish = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { name } = req.body;
    const nameExists = await firebaseHelper.getDocByField(
      `${restaurantUrl}/${restaurantId}/${Collection.DISHES}`,
      'name',
      name,
    );
    if (nameExists.length) {
      return res.status(409).json({
        success: false,
        message: ErrorMessage.DISH_NAME_EXISTS,
      });
    }

    const files = req?.files as Express.Multer.File[];
    const newDish: Dish = {
      ...req.body,
      image_urls: files?.map((file) => file.path.replace(/\\/g, '/')) || [],
      status: ActiveStatus.ACTIVE,
      created_by: req.user?.uid,
    };

    const docRef = await firebaseHelper.createDoc(
      `${restaurantUrl}/${restaurantId}/${Collection.DISHES}`,
      newDish,
    );

    return res.status(200).json({
      message: Message.DISH_CREATED,
      id: docRef.id,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: ErrorMessage.CANNOT_CREATE_DISH,
    });
  }
};

const updateDish = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: dishId } = req.params;
    const dish: Dish = await firebaseHelper.getDocById(
      `${restaurantUrl}/${restaurantId}/${Collection.DISHES}`,
      dishId,
    );
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: ErrorMessage.DISH_NOT_FOUND,
      });
    }

    const { name } = req.body;
    if (name) {
      const nameSnapshot = await firebaseHelper.getDocByField(
        `${restaurantUrl}/${restaurantId}/${Collection.DISHES}`,
        'name',
        name,
      );
      const isDuplicate = nameSnapshot.some((doc) => doc.id !== dishId);
      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: ErrorMessage.DISH_NAME_EXISTS,
        });
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
    await firebaseHelper.updateDoc(
      `${restaurantUrl}/${restaurantId}/${Collection.DISHES}`,
      dishId,
      updatedDish,
    );

    return res.status(200).json({
      success: true,
      message: Message.DISH_UPDATED,
      dishId,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: ErrorMessage.CANNOT_UPDATE_DISH,
    });
  }
};

export { getDishById, getDishes, createDish, updateDish };
