import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const chatSchema = Joi.object({
  sessionId: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'sessionId is required',
    'string.max': 'sessionId too long (max 100 chars)',
    'any.required': 'sessionId is required',
  }),
  message: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'message is required',
    'string.max': 'message too long (max 2000 chars)',
    'any.required': 'message is required',
  }),
});

const sessionSchema = Joi.object({
  sessionId: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'sessionId is required',
    'any.required': 'sessionId is required',
  }),
});

export const validateChat = (req: Request, res: Response, next: NextFunction) => {
  const { error } = chatSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  next();
};

export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  const { error } = sessionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  next();
};
