import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { FacilityReservationStatus } from '../constants/enum';
import { getTomorrow } from '../utils/index';

const createReservationSchema = Joi.object({
  user_id: Joi.string().min(1).required().messages({
    'string.empty': 'User ID cannot be empty',
    'any.required': 'User ID is required',
  }),
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
  end_date: Joi.date().iso().greater(Joi.ref('start_time')).optional().messages({
    'date.base': 'End time must be a valid date',
    'date.format': 'End time must be in ISO 8601 format',
    'date.greater': 'End time must be after start time',
    'any.required': 'End time is required',
  }),
  payment_id: Joi.string().min(1).required().messages({
    'string.empty': 'Payment ID cannot be empty',
    'any.required': 'Payment ID is required',
  }),
  status: Joi.string()
    .valid(...Object.values(FacilityReservationStatus))
    .optional()
    .messages({
      'any.only': 'Status must be either pending, confirmed, cancelled, or completed',
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
