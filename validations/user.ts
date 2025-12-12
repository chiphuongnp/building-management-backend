import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../constants/enum';

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string()
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .messages({
      'string.pattern.base':
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
    }),
  confirm_password: Joi.string().min(8).required().trim().valid(Joi.ref('password')).messages({
    'string.empty': 'Confirm password is required',
    'string.min': 'Confirm password must be at least 8 characters long',
    'any.only': 'Confirm password must match password',
  }),
  full_name: Joi.string().min(3).max(50).required(),
  phone: Joi.string().min(8).max(15).required(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
  permissions: Joi.array()
    .items(Joi.string())
    .when('role', {
      is: UserRole.MANAGER,
      then: Joi.array().items(Joi.string()).min(1).required(),
      otherwise: Joi.forbidden(),
    }),
});

const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional(),
  full_name: Joi.string().min(3).max(50).optional(),
  phone: Joi.string().min(8).max(15).optional(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string()
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .messages({
      'string.pattern.base':
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
    }),
  confirm_password: Joi.string().min(8).required().trim().valid(Joi.ref('password')).messages({
    'string.empty': 'Confirm password is required',
    'string.min': 'Confirm password must be at least 8 characters long',
    'any.only': 'Confirm password must match password',
  }),
  full_name: Joi.string().min(3).max(50).required(),
  phone: Joi.string().min(8).max(15).required(),
});

const updatePasswordSchema = Joi.object({
  password: Joi.string()
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .messages({
      'string.pattern.base':
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
    }),
  confirm_password: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Confirm password must match password',
    'string.empty': 'Confirm password is required',
  }),
});

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateUser = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdatePassword = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updatePasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
