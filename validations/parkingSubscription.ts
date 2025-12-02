import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ParkingSubscriptionStatus } from '../constants/enum';
import { getNormalizedDate } from '../utils/date';

const subscriptionFieldsSchema = {
  start_date: Joi.string().isoDate().messages({
    'string.isoDate': 'Start date must be a valid ISO date',
  }),
  month_duration: Joi.number().integer().min(1).max(12).messages({
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
  status: Joi.string()
    .valid(...Object.values(ParkingSubscriptionStatus))
    .optional()
    .messages({
      'any.only': 'Invalid status value',
    }),
};

const validateStartDate = (value: any, helpers: any) => {
  const dateValue = value.start_date;
  if (dateValue) {
    const startDate = new Date(dateValue);
    const today = getNormalizedDate();

    if (startDate < today) {
      return helpers.error('date.min');
    }
  }
  return value;
};

const createSubscriptionSchema = Joi.object({
  start_date: subscriptionFieldsSchema.start_date.optional(),
  month_duration: subscriptionFieldsSchema.month_duration.required().messages({
    'any.required': 'Duration is required',
  }),
  base_amount: subscriptionFieldsSchema.base_amount.required().messages({
    'any.required': 'Amount is required',
  }),
  points_used: subscriptionFieldsSchema.points_used,
})
  .custom(validateStartDate)
  .messages({
    'date.min': 'Start date cannot be in the past',
  });

export const updateSubscriptionStatusSchema = Joi.object({
  status: subscriptionFieldsSchema.status,
});

const idParamSubscriptionSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.length': 'ID must be 20 characters',
    'string.empty': 'ID is required',
    'any.required': 'ID is required',
  }),
  parkingSpaceId: Joi.string().required().messages({
    'string.length': 'parkingSpaceId must be 20 characters',
    'string.empty': 'parkingSpaceId is required',
    'any.required': 'parkingSpaceId is required',
  }),
});

export const validateCreateSubscription = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createSubscriptionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateStatusSubscription = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateSubscriptionStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateIdParamSubscription = (req: Request, res: Response, next: NextFunction) => {
  const { error } = idParamSubscriptionSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
