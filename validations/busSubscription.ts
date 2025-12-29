import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';
import { BusSubscriptionStatus } from '../constants/enum';

export const bookingBusValidationSchema = Joi.object({
  route_id: Joi.string().required().messages({
    'string.empty': 'Route ID is required.',
    'any.required': 'Route ID is required.',
  }),
  route_name: Joi.string().required().messages({
    'string.empty': 'Route name is required.',
    'any.required': 'Route name is required.',
  }),
  bus_id: Joi.string().required().messages({
    'string.empty': 'Bus ID is required.',
    'any.required': 'Bus ID is required.',
  }),
  subscription_date: Joi.string().isoDate().required().messages({
    'string.empty': 'Subscription date is required.',
    'string.isoDate': 'Subscription date must be a valid ISO date (YYYY-MM-DD).',
    'any.required': 'Subscription date is required.',
  }),
  status: Joi.string()
    .valid(...Object.values(BusSubscriptionStatus))
    .required()
    .messages({
      'any.only': `Status must be one of the following: ${Object.values(BusSubscriptionStatus).join(', ')}.`,
      'any.required': 'Status is required.',
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
});

export const validateBookingBus = (req: Request, res: Response, next: NextFunction) => {
  const { error } = bookingBusValidationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }
  next();
};
