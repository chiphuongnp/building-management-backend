import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { DishCategory, DayOfWeek } from '../constants/enum';
import { MenuItem, MenuSchedule } from '../interfaces/menu';

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
    .valid(...Object.values(DayOfWeek))
    .optional()
    .messages({
      'any.only': `ID must be one of: ${Object.values(DayOfWeek).join(', ')}`,
      'any.required': 'The "id" field (day of week) is required',
    }),
  itemId: Joi.string()
    .length(20)
    .regex(/^[A-Za-z0-9]+$/)
    .optional()
    .messages({
      'string.length': 'Menu Item ID must be exactly 20 characters',
      'string.pattern.base': 'Menu Item ID must contain only letters and numbers',
    }),
});

const itemSchema = Joi.object<MenuItem>({
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
  quantity: Joi.number().integer().min(1).required().messages({
    'any.required': 'The quantity field is required.',
    'number.base': 'Quantity must be a number.',
    'number.integer': 'Quantity must be a whole number (integer).',
    'number.min': 'Quantity must be 1 or greater.',
  }),
  image_urls: Joi.array()
    .items(Joi.string().trim().allow(''))
    .unique()
    .optional()
    .custom((value) => {
      const cleaned = value.filter((v: string) => v && v.trim() !== '');

      return cleaned;
    })
    .messages({
      'array.unique': 'Image URLs must be unique (case-insensitive) for each dish',
      'array.base': 'image_urls must be an array',
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
    .custom((items, helpers) => {
      const allUrls = items.flatMap((item: MenuItem) =>
        (item.image_urls || []).filter((u) => u.trim() !== ''),
      );
      const duplicates = allUrls.filter(
        (url: string, index: number) => allUrls.indexOf(url) !== index,
      );
      if (duplicates.length) {
        return helpers.error('any.custom', {
          message: `Duplicate image URLs across items: ${duplicates.join(', ')}`,
        });
      }

      return items;
    }, 'Validate unique image_urls across all items')
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
  try {
    const { error } = createMenuScheduleBatchSchema.validate(req.body.schedules);
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message });
    }
    next();
  } catch (err) {
    return res.status(400).json({ status: false, message: 'Invalid JSON for schedules' });
  }
};

export const validateAddMenuItem = (req: Request, res: Response, next: NextFunction) => {
  const { error } = itemSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateMenuItem = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = itemSchema
    .fork(Object.keys(itemSchema.describe().keys), (schema) => schema.optional())
    .validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateMenuIdParams = (req: Request, res: Response, next: NextFunction) => {
  const { error } = idParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
