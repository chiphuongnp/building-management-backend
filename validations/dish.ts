import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { Dish } from '../interfaces/dish';
import { DishCategory, ActiveStatus } from '../constants/enum';

const createDishSchema = Joi.object<Dish>({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Dish name is required',
    'string.max': 'Dish name must not exceed 100 characters',
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price must be a number',
    'any.required': 'Price is required',
  }),
  category: Joi.string()
    .valid(...Object.values(DishCategory))
    .required()
    .messages({
      'any.only': `Category must be one of: ${Object.values(DishCategory).join(', ')}`,
      'any.required': 'Category is required',
    }),
});

export const validateCreateDish = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createDishSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }
  next();
};
