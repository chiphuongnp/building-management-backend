import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { DishCategory, DayOfWeek } from '../constants/enum';
import { Item, MenuSchedule } from '../interfaces/menu';

const itemSchema = Joi.object<Item>({
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

const createMenuScheduleSchema = Joi.object<MenuSchedule>({
  id: Joi.string()
    .valid(...Object.values(DayOfWeek))
    .required()
    .messages({
      'any.only': `ID must be one of: ${Object.values(DayOfWeek).join(', ')}`,
      'any.required': 'The "id" field (day of week) is required',
    }),
  items: Joi.array()
    .items(itemSchema)
    .unique((a, b) => a.name.trim().toLowerCase() === b.name.trim().toLowerCase())
    .min(1)
    .required()
    .messages({
      'array.unique': 'Dish names must be unique (case-insensitive)',
      'array.base': 'Items must be an array',
      'array.min': 'Menu must contain at least one dish',
      'any.required': 'Items field is required',
    }),
});

const createMenuScheduleBatchSchema = Joi.array().items(createMenuScheduleSchema).min(1).messages({
  'array.base': 'Menu schedules must be an array',
  'array.min': 'At least one menu schedule is required',
});

export const validateCreateMenuSchedule = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createMenuScheduleBatchSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }
  next();
};
