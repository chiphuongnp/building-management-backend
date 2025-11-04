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

const updateDishSchema = Joi.object<Partial<Dish>>({
  name: Joi.string().min(2).max(100).messages({
    'string.empty': 'Dish name cannot be empty',
    'string.max': 'Dish name must not exceed 100 characters',
  }),
  description: Joi.string().max(500).messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  price: Joi.number().positive().precision(2).messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be positive',
  }),
  category: Joi.string()
    .valid(...Object.values(DishCategory))
    .messages({
      'any.only': `Category must be one of: ${Object.values(DishCategory).join(', ')}`,
    }),
  status: Joi.string()
    .valid(...Object.values(ActiveStatus))
    .optional()
    .messages({
      'any.only': 'Invalid status value',
    }),
});

const idParamSchema = Joi.object({
  restaurantId: Joi.string()
    .length(20)
    .regex(/^[A-Za-z0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Restaurant ID cannot be empty',
      'any.required': 'Restaurant ID is required',
      'string.length': 'Restaurant ID must be exactly 20 characters',
      'string.pattern.base': 'Restaurant ID must contain only letters and numbers',
    }),
  id: Joi.string()
    .length(20)
    .regex(/^[A-Za-z0-9]+$/)
    .optional()
    .messages({
      'string.length': 'Dish ID must be exactly 20 characters',
      'string.pattern.base': 'Dish ID must contain only letters and numbers',
    }),
});

export const validateCreateDish = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createDishSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateDish = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateDishSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }
  next();
};

export const validateIdParams = (req: Request, res: Response, next: NextFunction) => {
  const { error } = idParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
