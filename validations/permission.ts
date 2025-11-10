import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const permissionSchema = Joi.object({
  id: Joi.string().required().min(1).max(255).messages({
    'string.empty': 'id is required',
    'string.min': 'id must be at least 1 character',
    'string.max': 'id must not exceed 255 characters',
  }),
  name: Joi.string().required().min(1).max(255).messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must not exceed 255 characters',
  }),
  description: Joi.string().optional().min(1).max(255).messages({
    'string.min': 'Description must be at least 1 character',
    'string.max': 'Description must not exceed 255 characters',
  }),
});

export const validatePermission = (req: Request, res: Response, next: NextFunction) => {
  const { error } = permissionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
