import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const createEventBookingSchema = Joi.object({
  event_title: Joi.string().required().min(5).max(200).trim().messages({
    'string.empty': 'Event title is required',
    'string.min': 'Event title must be at least 5 characters',
    'string.max': 'Event title must not exceed 200 characters',
    'any.required': 'Event title is required',
  }),
  description: Joi.string().allow('', null).max(2000).trim().messages({
    'string.max': 'Description must not exceed 2000 characters',
  }),
  location: Joi.string().allow('', null).max(500).trim().messages({
    'string.max': 'Location must not exceed 500 characters',
  }),
  facility_reservation_id: Joi.string().allow('', null).trim().messages({
    'string.base': 'Facility reservation ID is invalid',
  }),
  max_participants: Joi.number().required().integer().min(1).max(10000).messages({
    'number.base': 'Max participants must be a number',
    'number.integer': 'Max participants must be an integer',
    'number.min': 'Max participants must be at least 1',
    'number.max': 'Max participants must not exceed 10000',
    'any.required': 'Max participants is required',
  }),
  deadline: Joi.date().required().iso().greater('now').messages({
    'date.base': 'Deadline is invalid',
    'date.greater': 'Deadline must be in the future',
    'any.required': 'Deadline is required',
  }),
  start_time: Joi.date().required().iso().greater('now').messages({
    'date.base': 'Start time is invalid',
    'date.greater': 'Start time must be in the future',
    'any.required': 'Start time is required',
  }),
  end_time: Joi.date().required().iso().greater(Joi.ref('start_time')).messages({
    'date.base': 'End time is invalid',
    'date.greater': 'End time must be after start time',
    'any.required': 'End time is required',
  }),
})
  .custom((value, helpers) => {
    if (value.deadline > value.start_time) {
      return helpers.error('custom.deadlineSmallStartTime');
    }

    if (!value.location && !value.facility_reservation_id) {
      return helpers.error('custom.locationOrFacility');
    }

    return value;
  })
  .messages({
    'custom.deadlineSmallStartTime': 'Deadline should be before start time.',
    'custom.locationOrFacility': 'Must provide either location or facility reservation',
  });

const idParamEventBookingSchema = Joi.object({
  id: Joi.string().min(1).required().messages({
    'string.empty': 'ID cannot be empty',
    'any.required': 'ID is required',
  }),
});

export const validateCreateEventBooking = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createEventBookingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateIdParamEventBooking = (req: Request, res: Response, next: NextFunction) => {
  const { error } = idParamEventBookingSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
