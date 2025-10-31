import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';
import { User } from '../interfaces/userInterface';
import { UserRank, UserRole } from '../constants/enum';

export const userSchema = Joi.object<User>({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string()
    .optional()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .messages({
      'string.pattern.base':
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
    }),
  fullName: Joi.string().min(3).max(50).required(),
  phone: Joi.string().min(8).max(15).required(),
  avatar_url: Joi.string().uri().allow(null).optional(),
  ranks: Joi.string()
    .valid(...Object.values(UserRank))
    .allow(null)
    .optional(),
  points: Joi.number().min(0).allow(null).optional(),
  roles: Joi.string()
    .valid(...Object.values(UserRole))
    .required(),
  permissions: Joi.array().items(Joi.string()).allow(null).optional(),
});

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
