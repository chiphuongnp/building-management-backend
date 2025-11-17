import Joi from 'joi';
import { BusStatus } from '../constants/enum';
import { NextFunction, Request, Response } from 'express';

export const busSchema = Joi.object({
  type_name: Joi.string().required().messages({
    'string.empty': 'Type name is required.',
    'any.required': 'Type name is required.',
  }),
  number: Joi.number().integer().positive().required().messages({
    'number.base': 'Bus number must be a number.',
    'number.positive': 'Bus number must be a positive number.',
    'any.required': 'Bus number is required.',
  }),
  plate_number: Joi.string()
    .pattern(/^[A-Z0-9-]+$/i)
    .required()
    .messages({
      'string.empty': 'License number is required.',
      'string.pattern.base': 'License number must be alphanumeric and can include dashes.',
      'any.required': 'License number is required.',
    }),
  capacity: Joi.number().integer().positive().required().messages({
    'number.base': 'Capacity must be a number.',
    'number.positive': 'Capacity must be a positive number.',
    'any.required': 'Capacity is required.',
  }),
  description: Joi.string().optional().allow('').messages({
    'string.base': 'Description must be a string.',
  }),
  model: Joi.string().required().messages({
    'string.empty': 'Model is required.',
    'any.required': 'Model is required.',
  }),
  features: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Features must be an array of strings.',
  }),
  driver_name: Joi.string().required().messages({
    'string.empty': 'Driver name is required.',
    'any.required': 'Driver name is required.',
  }),
  driver_phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.empty': 'Driver phone is required.',
      'string.pattern.base': 'Driver phone must be a valid phone number (10-15 digits).',
      'any.required': 'Driver phone is required.',
    }),
  status: Joi.string()
    .valid(...Object.values(BusStatus))
    .required()
    .messages({
      'any.only': `Status must be one of the following: ${Object.values(BusStatus).join(', ')}.`,
      'any.required': 'Status is required.',
    }),
});

export const validateBus = (req: Request, res: Response, next: NextFunction) => {
  const { error } = busSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
