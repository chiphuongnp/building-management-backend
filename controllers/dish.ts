import { Request, Response, NextFunction } from 'express';
import { ActiveStatus, Sites } from '../constants/enum';
import { firebaseHelper } from '../utils';

const createDish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required.' });
    }

    const files = req?.files as Express.Multer.File[];
    const image_urls = files?.map((file) => file.path.replace(/\\/g, '/')) || [];
    const newDish = {
      ...req.body,
      image_urls,
      status: ActiveStatus.ACTIVE,
      created_by: 'admin',
    };

    const docRef = await firebaseHelper.createDoc(
      `${Sites.TOKYO}/restaurants/${restaurantId}/available_dishes`,
      newDish,
    );

    return res.status(200).json({
      message: 'New dish has been added successfully.',
      id: docRef.id,
    });
  } catch (error) {
    return res.status(400).json({ message: 'Cannot create restaurant dish!', error });
  }
};

export { createDish };
