import Joi from 'joi';
import { Response, Request, NextFunction } from 'express';
import { DayOfWeek } from '../constants/enum';

const busStopSchema = Joi.object({
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
  estimated_arrival: Joi.number().min(0).required().messages({
    'number.base': 'Estimated arrival must be a valid number.',
    'any.required': 'Estimated arrival is required.',
  }),
  location: Joi.string().required().messages({
    'string.empty': 'Location is required.',
    'any.required': 'Location is required.',
  }),
});

export const createBusRouteSchema = Joi.object({
  route_name: Joi.string().required().messages({
    'string.empty': 'Route name is required.',
    'any.required': 'Route name is required.',
  }),
  route_code: Joi.string().required().messages({
    'string.empty': 'Route code is required.',
    'any.required': 'Route code is required.',
  }),
  description: Joi.string().optional().allow('').messages({
    'string.base': 'Description must be a string.',
  }),
  bus_id: Joi.array().items(Joi.string()).unique().optional().messages({
    'array.base': 'Bus IDs must be an array of strings.',
    'string.base': 'Each bus ID must be a string.',
  }),
  departure_time: Joi.date().iso().required().messages({
    'date.base': 'Departure time must be a valid date.',
    'any.required': 'Departure time is required.',
  }),
  estimated_duration: Joi.number().positive().required().messages({
    'date.base': 'Estimated duration must be a valid date.',
    'any.required': 'Estimated duration is required.',
  }),
  operating_dates: Joi.array().items(
    Joi.string()
      .valid(...Object.values(DayOfWeek))
      .required()
      .messages({
        'any.only': `Day must be one of the following: ${Object.values(DayOfWeek).join(', ')}.`,
        'any.required': 'Day is required.',
      }),
  ),
  inactive_dates: Joi.array()
    .items(
      Joi.date().iso().messages({
        'date.base': 'Inactive date must be a valid date.',
        'date.format': 'Inactive date must be in ISO format.',
      }),
    )
    .optional(),
  stops: Joi.array().items(busStopSchema).optional().messages({
    'array.base': 'Stops must be an array of objects.',
  }),
});

export const updateBusRouteSchema = Joi.object({
  route_name: Joi.string().optional(),
  route_code: Joi.string().optional(),
  description: Joi.string().allow('').optional(),
  bus_id: Joi.array().items(Joi.string()).unique().optional(),
  departure_time: Joi.date().iso().optional(),
  estimated_duration: Joi.number().positive().optional(),
  operating_dates: Joi.array()
    .items(Joi.string().valid(...Object.values(DayOfWeek)))
    .optional(),
  inactive_dates: Joi.array().items(Joi.date().iso()).optional(),
  stops: Joi.array().items(busStopSchema).optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update.',
  });

export const validateCreateBusRoute = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = createBusRouteSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }

  req.body = value;
  next();
};

export const validateUpdateBusRoute = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = updateBusRouteSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      errors: error.details.map((d) => d.message),
    });
  }

  req.body = value;
  next();
};
