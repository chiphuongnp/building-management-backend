import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { getTomorrow } from '../utils/index';

const createReservationSchema = Joi.object({
  facility_id: Joi.string().min(1).required().messages({
    'string.empty': 'Facility ID cannot be empty',
    'any.required': 'Facility ID is required',
  }),
  start_date: Joi.date().iso().optional().messages({
    'date.base': 'Start time must be a valid date',
    'date.format': 'Start time must be in ISO 8601 format',
    'any.required': 'Start time is required',
  }),
  hour_duration: Joi.number().integer().min(1).max(24).required().messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration must be at least 1 hour',
    'number.max': 'Duration cannot exceed 24 hours',
  }),
  points_used: Joi.number().min(0).optional().messages({
    'number.base': 'Points used must be a number',
    'number.min': 'Points used cannot be negative',
  }),
})
  .custom((value: any, helpers: any) => {
    const dateValue = value.start_date;
    if (dateValue) {
      const startDate = new Date(dateValue);
      const tomorrow = getTomorrow();

      if (startDate < tomorrow) {
        return helpers.error('date.min');
      }
    }
    return value;
  })
  .messages({
    'date.min': 'Start date must be at least 1 day!',
  });

const idParamFacilityReservationSchema = Joi.object({
  id: Joi.string().min(1).required().messages({
    'string.empty': 'ID cannot be empty',
    'any.required': 'ID is required',
  }),
});

export const validateCreateFacilityReservation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = createReservationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateIdParamFacilityReservation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = idParamFacilityReservationSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
