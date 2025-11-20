import Joi from 'joi';
import { Response, Request, NextFunction } from 'express';
import { ActiveStatus } from '../constants/enum';

export const busRouteValidationSchema = Joi.object({
  routeName: Joi.string().required().messages({
    'string.empty': 'Route name is required.',
    'any.required': 'Route name is required.',
  }),
  routeCode: Joi.string().required().messages({
    'string.empty': 'Route code is required.',
    'any.required': 'Route code is required.',
  }),
  description: Joi.string().optional().allow('').messages({
    'string.base': 'Description must be a string.',
  }),
  bus_id: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Bus IDs must be an array of strings.',
    'string.base': 'Each bus ID must be a string.',
  }),
  departure_time: Joi.date().required().messages({
    'date.base': 'Departure time must be a valid date.',
    'any.required': 'Departure time is required.',
  }),
  estimated_duration: Joi.date().required().messages({
    'date.base': 'Estimated duration must be a valid date.',
    'any.required': 'Estimated duration is required.',
  }),
  status: Joi.string()
    .valid(...Object.values(ActiveStatus))
    .required()
    .messages({
      'any.only': `Status must be one of the following: ${Object.values(ActiveStatus).join(', ')}.`,
      'any.required': 'Status is required.',
    }),
  operating_dates: Joi.array().items(Joi.number().integer().min(0).max(6)).optional().messages({
    'array.base': 'Operating dates must be an array of numbers.',
    'number.base': 'Each operating date must be a number.',
    'number.min': 'Operating dates must be between 0 (Monday) and 6 (Sunday).',
    'number.max': 'Operating dates must be between 0 (Monday) and 6 (Sunday).',
  }),
  inactive_dates: Joi.array().items(Joi.string().isoDate()).optional().messages({
    'array.base': 'Inactive dates must be an array of ISO date strings.',
    'string.isoDate': 'Each inactive date must be a valid ISO date string.',
  }),
  stops: Joi.array()
    .items(
      Joi.object({
        stop_id: Joi.string().required().messages({
          'string.empty': 'Stop ID is required.',
          'any.required': 'Stop ID is required.',
        }),
        stop_name: Joi.string().required().messages({
          'string.empty': 'Stop name is required.',
          'any.required': 'Stop name is required.',
        }),
        building_id: Joi.string().optional().allow(null).messages({
          'string.base': 'Building ID must be a string.',
        }),
        order: Joi.number().integer().positive().required().messages({
          'number.base': 'Order must be a number.',
          'number.positive': 'Order must be a positive number.',
          'any.required': 'Order is required.',
        }),
        estimatedArrival: Joi.date().required().messages({
          'date.base': 'Estimated arrival must be a valid date.',
          'any.required': 'Estimated arrival is required.',
        }),
        location: Joi.string().required().messages({
          'string.empty': 'Location is required.',
          'any.required': 'Location is required.',
        }),
      }),
    )
    .optional()
    .messages({
      'array.base': 'Stops must be an array of objects.',
    }),
});

export const validateBusRoute = (req: Request, res: Response, next: NextFunction) => {
  const { error } = busRouteValidationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }
  next();
};
