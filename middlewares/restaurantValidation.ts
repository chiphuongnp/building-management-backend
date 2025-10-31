import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { Restaurant, OperatingHours, ContactInfo } from '../interfaces/restaurantInterface';
import { ActiveStatus } from '../constants/enum';

const operatingHoursSchema = Joi.object<OperatingHours>({
  open: Joi.string()
    .pattern(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Open time must be in HH:mm format',
      'any.required': 'Open time is required',
    }),
  close: Joi.string()
    .pattern(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Close time must be in HH:mm format',
      'any.required': 'Close time is required',
    }),
  days: Joi.array().items(Joi.string()).optional(),
}).custom((value, helpers) => {
  const [openHour, openMin] = value.open.split(':').map(Number);
  const [closeHour, closeMin] = value.close.split(':').map(Number);

  const openTotal = openHour * 60 + openMin;
  const closeTotal = closeHour * 60 + closeMin;
  if (openTotal >= closeTotal) {
    return helpers.error('any.invalid', { message: 'Open time must be before close time' });
  }

  return value;
});

const contactSchema = Joi.object<ContactInfo>({
  phone: Joi.string().min(8).max(15).required(),
  email: Joi.string().email().optional(),
  facebook: Joi.string().optional(),
  zalo: Joi.string().min(8).max(15).optional(),
});

const createRestaurantSchema = Joi.object<Restaurant>({
  building_id: Joi.string().length(20).required().messages({
    'string.empty': 'Building ID is required',
    'string.length': 'Building ID must be 20 characters',
  }),
  floor: Joi.number().integer().min(0).required().messages({
    'number.base': 'Floor must be a number',
    'number.min': 'Floor cannot be negative',
    'any.required': 'Floor is required',
  }),
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name must not exceed 100 characters',
  }),
  description: Joi.string().max(500).optional(),
  operating_hours: operatingHoursSchema.optional(),
  contact: contactSchema.optional(),
});

const updateRestaurantSchema = Joi.object<Partial<Restaurant>>({
  building_id: Joi.string().length(20).optional(),
  floor: Joi.number().integer().min(0).optional(),
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  operating_hours: operatingHoursSchema.optional(),
  contact: contactSchema.optional(),
  status: Joi.string()
    .valid(...Object.values(ActiveStatus))
    .optional()
    .messages({
      'any.only': 'Invalid status value',
    }),
});

export const validateCreateRestaurant = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createRestaurantSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateRestaurant = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateRestaurantSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }
  next();
};
