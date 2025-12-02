import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { InformationCategory, InformationPriority, InformationTarget } from '../constants/enum';
import { getNormalizedDate } from '../utils/index';

export const createInformationSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must not exceed 200 characters',
  }),
  content: Joi.string().min(5).max(1000).required().messages({
    'string.empty': 'Message is required',
    'string.min': 'Message must be at least 5 characters',
    'string.max': 'Message must not exceed 1000 characters',
  }),
  category: Joi.string()
    .valid(...Object.values(InformationCategory))
    .required(),
  priority: Joi.string()
    .valid(...Object.values(InformationPriority))
    .required(),
  target: Joi.string()
    .valid(...Object.values(InformationTarget))
    .required(),
  schedule_at: Joi.string()
    .isoDate()
    .optional()
    .messages({
      'string.isoDate': 'Schedule date must be a valid ISO date',
    })
    .when('priority', {
      not: InformationPriority.HIGH,
      then: Joi.required().messages({
        'any.required': 'Schedule date is required for non-high priority information',
      }),
    }),
})
  .custom((value, helpers) => {
    if (value.schedule_at) {
      const startDate = new Date(value.schedule_at);
      const today = getNormalizedDate();

      if (startDate < today) {
        return helpers.error('schedule.dateInPast');
      }
    }
    return value;
  })
  .messages({
    'schedule.dateInPast': 'Schedule date cannot be in the past',
  });

export const validateCreateInformation = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createInformationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
