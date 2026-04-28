import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const createPermissionSchema = Joi.object({
  id: Joi.string().required().min(1).max(255).messages({
    'string.empty': 'id is required',
    'string.min': 'id must be at least 1 character',
    'string.max': 'id must not exceed 255 characters',
  }),
  description: Joi.string().optional().min(1).max(255).messages({
    'string.min': 'Description must be at least 1 character',
    'string.max': 'Description must not exceed 255 characters',
  }),
});

const updatePermissionSchema = Joi.object({
  description: Joi.string().optional().min(1).max(255).messages({
    'string.min': 'Description must be at least 1 character',
    'string.max': 'Description must not exceed 255 characters',
  }),
}).unknown(false);

export const validateCreatePermission = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createPermissionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdatePermission = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updatePermissionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
