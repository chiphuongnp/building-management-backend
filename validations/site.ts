import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const createSiteSchema = Joi.object({
  id: Joi.string().required().min(1).max(255).messages({
    'string.empty': 'ID is required',
    'string.min': 'ID must be at least 1 character',
    'string.max': 'ID must not exceed 255 characters',
  }),
  code: Joi.string().required().min(1).max(50).messages({
    'string.empty': 'Code is required',
    'string.min': 'Code must be at least 1 character',
    'string.max': 'Code must not exceed 50 characters',
  }),
  address: Joi.string().required().min(1).max(500).messages({
    'string.empty': 'Address is required',
    'string.min': 'Address must be at least 1 character',
    'string.max': 'Address must not exceed 500 characters',
  }),
  status: Joi.string().valid('active', 'inactive').required().messages({
    'any.only': 'Status must be either active or inactive',
    'any.required': 'Status is required',
  }),
  created_by: Joi.string().min(1).optional().messages({
    'string.empty': 'Created by is required',
  }),
});

const updateSiteSchema = Joi.object({
  name: Joi.string().min(1).max(255).messages({
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must not exceed 255 characters',
  }),
  code: Joi.string().min(1).max(50).messages({
    'string.min': 'Code must be at least 1 character',
    'string.max': 'Code must not exceed 50 characters',
  }),
  address: Joi.string().min(1).max(500).messages({
    'string.min': 'Address must be at least 1 character',
    'string.max': 'Address must not exceed 500 characters',
  }),
  status: Joi.string().valid('active', 'inactive').messages({
    'any.only': 'Status must be either active or inactive',
  }),
  updated_by: Joi.string().min(1).optional().messages({
    'string.empty': 'Updated by is required',
  }),
});

const idParamSchema = Joi.object({
  id: Joi.string().min(1).required().messages({
    'string.empty': 'ID cannot be empty',
    'any.required': 'ID is required',
  }),
});

export const validateCreateSite = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createSiteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateSite = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateSiteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateIdParam = (req: Request, res: Response, next: NextFunction) => {
  const { error } = idParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
