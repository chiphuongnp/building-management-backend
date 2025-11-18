import Joi from 'joi';
import { PickupMethod } from '../constants/enum';
import { Request, Response, NextFunction } from 'express';

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
      'string.length': 'ID must be exactly 20 characters',
      'string.pattern.base': 'ID must contain only letters and numbers',
    }),
});

const orderDetailSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    'string.empty': 'Dish name cannot be empty',
    'string.max': 'Dish name must not exceed 100 characters',
  }),
  price: Joi.number().min(0).messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
  }),
  quantity: Joi.number().required().min(1).messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be at least one',
  }),
  notes: Joi.string().allow('').max(200).optional().messages({
    'string.max': 'Notes must not exceed 200 characters',
  }),
});

export const createOrderSchema = Joi.object({
  pickup_method: Joi.string()
    .valid(...Object.values(PickupMethod))
    .required(),
  delivery_address: Joi.object({
    building: Joi.string().optional().messages({ 'string.base': 'Building must be a string' }),
    floor: Joi.number().optional().messages({ 'number.base': 'Floor must be a number' }),
    room: Joi.string().optional().messages({ 'string.base': 'Room must be a string' }),
  }).when('pickup_method', {
    is: PickupMethod.DELIVERY,
    then: Joi.required().messages({
      'any.required': 'Pickup address is required for delivery',
    }),
    otherwise: Joi.optional(),
  }),
  delivery_info: Joi.object({
    contact_name: Joi.string().optional().messages({
      'string.base': 'Contact name must be a string',
    }),
    contact_phone: Joi.string().optional().messages({
      'string.base': 'Contact phone must be a string',
    }),
    notes: Joi.string().optional().messages({ 'string.base': 'Notes must be a string' }),
  })
    .optional()
    .messages({ 'object.base': 'Delivery info must be an object' }),
  payment_id: Joi.string().optional(),
  order_details: Joi.array().items(orderDetailSchema).required().messages({
    'array.base': 'Order details must be an array',
  }),
});

export const updateOrderSchema = Joi.object({
  pickup_method: Joi.string()
    .valid(...Object.values(PickupMethod))
    .optional(),
  delivery_address: Joi.object({
    building: Joi.string().optional().messages({ 'string.base': 'Building must be a string' }),
    floor: Joi.number().optional().messages({ 'number.base': 'Floor must be a number' }),
    room: Joi.string().optional().messages({ 'string.base': 'Room must be a string' }),
  })
    .optional()
    .when('pickup_method', {
      is: PickupMethod.DELIVERY,
      then: Joi.required().messages({
        'any.required': 'Delivery address is required for delivery orders',
      }),
    })
    .messages({ 'object.base': 'Delivery address must be an object' }),
  delivery_info: Joi.object({
    contact_name: Joi.string().optional().messages({
      'string.base': 'Contact name must be a string',
    }),
    contact_phone: Joi.string().optional().messages({
      'string.base': 'Contact phone must be a string',
    }),
    notes: Joi.string().optional().messages({ 'string.base': 'Notes must be a string' }),
  })
    .optional()
    .messages({ 'object.base': 'Delivery info must be an object' }),
});

export const validateCreateOrder = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createOrderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateOrder = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateOrderSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateOrderIdParams = (req: Request, res: Response, next: NextFunction) => {
  const { error } = idParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
