import express from 'express';
import {
  validateCreateRestaurant,
  validateUpdateRestaurant,
} from '../middlewares/restaurantValidation';
import {
  createRestaurant,
  getRestaurant,
  getRestaurants,
  updateRestaurant,
} from '../controllers/restaurant';

const restaurantRouter = express.Router({ mergeParams: true });
restaurantRouter.post('/', validateCreateRestaurant, createRestaurant);
restaurantRouter.get('/', getRestaurants);
restaurantRouter.get('/:id', getRestaurant);
restaurantRouter.patch('/:id', validateUpdateRestaurant, updateRestaurant);

export default restaurantRouter;
