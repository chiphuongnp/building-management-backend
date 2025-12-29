import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';

export const createBusSchema = Joi.object({
  type_name: Joi.string().required().messages({
    'string.empty': 'Type name is required.',
    'any.required': 'Type name is required.',
  }),
  number: Joi.number().integer().positive().required().messages({
    'number.base': 'Bus number must be a number.',
    'number.integer': 'Bus number must be an integer.',
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
    'number.integer': 'Capacity must be an integer.',
    'number.positive': 'Capacity must be a positive number.',
    'any.required': 'Capacity is required.',
  }),
  model: Joi.string().required().messages({
    'string.empty': 'Model is required.',
    'any.required': 'Model is required.',
  }),
  description: Joi.string().allow('').optional().messages({
    'string.base': 'Description must be a string.',
  }),
  features: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Features must be an array of strings.',
  }),
  driver_id: Joi.string().optional().messages({
    'string.base': 'Driver id must be a string.',
  }),
});

export const updateBusSchema = Joi.object({
  type_name: Joi.string().optional().messages({
    'string.empty': 'Type name cannot be empty.',
  }),
  number: Joi.number().integer().positive().optional().messages({
    'number.base': 'Bus number must be a number.',
    'number.integer': 'Bus number must be an integer.',
    'number.positive': 'Bus number must be a positive number.',
  }),
  plate_number: Joi.string()
    .pattern(/^[A-Z0-9-]+$/i)
    .optional()
    .messages({
      'string.pattern.base': 'License number must be alphanumeric and can include dashes.',
    }),
  capacity: Joi.number().integer().positive().optional().messages({
    'number.base': 'Capacity must be a number.',
    'number.integer': 'Capacity must be an integer.',
    'number.positive': 'Capacity must be a positive number.',
  }),
  model: Joi.string().optional().messages({
    'string.empty': 'Model cannot be empty.',
  }),
  description: Joi.string().allow('').optional().messages({
    'string.base': 'Description must be a string.',
  }),
  features: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Features must be an array of strings.',
  }),
  driver_id: Joi.string().allow(null).optional().messages({
    'string.base': 'Driver id must be a string.',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update.',
  });

export const validateCreateBus = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createBusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateBus = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateBusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
