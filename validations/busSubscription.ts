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
  start_time: Joi.date().iso().greater('now').optional().messages({
    'date.base': 'Start time must be a valid date.',
    'any.required': 'Start time is required.',
  }),
  month_duration: Joi.number().integer().min(1).max(12).required().messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration must be at least 1 month',
    'number.max': 'Duration cannot exceed 12 months',
  }),
  base_amount: Joi.number().min(0).messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount cannot be negative',
  }),
  points_used: Joi.number().min(0).optional().messages({
    'number.base': 'Points used must be a number',
    'number.min': 'Points used cannot be negative',
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
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  req.body = value;
  next();
};
