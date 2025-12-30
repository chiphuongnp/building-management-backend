import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';

export const bookingBusValidationSchema = Joi.object({
  route_id: Joi.string().required().messages({
    'string.empty': 'Route ID is required.',
    'any.required': 'Route ID is required.',
  }),
  bus_id: Joi.string().required().messages({
    'string.empty': 'Bus ID is required.',
    'any.required': 'Bus ID is required.',
  }),
  start_time: Joi.date().iso().required().messages({
    'date.base': 'Start time must be a valid date.',
    'any.required': 'Start time is required.',
  }),
  end_time: Joi.date().greater(Joi.ref('start_time')).iso().required().messages({
    'date.base': 'End time must be a valid date.',
    'date.greater': 'End time must be greater than start time.',
    'any.required': 'End time is required.',
  }),
  payment_id: Joi.string().optional().allow(null).messages({
    'string.base': 'Payment ID must be a string.',
  }),
  seat_number: Joi.string().required().messages({
    'string.empty': 'Seat number is required.',
    'any.required': 'Seat number is required.',
  }),
  notes: Joi.string().optional().allow('').messages({
    'string.base': 'Notes must be a string.',
  }),
  cancellation_reason: Joi.string().optional().allow('').messages({
    'string.base': 'Cancellation reason must be a string.',
  }),
});

export const validateBookingBus = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = bookingBusValidationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }

  req.body = value;
  next();
};
