import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const createEventRegistrationSchema = Joi.object({
  event_booking_id: Joi.string().required().messages({
    'any.required': 'Event ID is required',
  }),
});

const idParamEventRegistrationSchema = Joi.object({
  id: Joi.string().min(1).required().messages({
    'any.required': 'ID is required',
  }),
});

export const validateCreateEventRegistration = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = createEventRegistrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateIdParamEventRegistration = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = idParamEventRegistrationSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
