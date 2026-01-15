import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ParkingSpaceLocation, ParkingSpace } from '../interfaces/parkingSpace';
import { ParkingSpaceStatus, ParkingSpaceType } from '../constants/enum';

const locationSchema = Joi.object<ParkingSpaceLocation>({
  floor: Joi.number().integer().required().messages({
    'number.base': 'Floor must be a number',
    'number.integer': 'Floor must be an integer',
    'any.required': 'Floor is required',
  }),
  area: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Area is required',
    'string.min': 'Area must be at least 1 character',
    'string.max': 'Area must not exceed 50 characters',
  }),
});

const createParkingSpaceSchema = Joi.object<ParkingSpace>({
  building_id: Joi.string().length(20).required().messages({
    'string.empty': 'Building ID is required',
    'string.length': 'Building ID must be 20 characters',
    'any.required': 'Building ID is required',
  }),
  location: locationSchema.required(),
  code: Joi.string().min(1).max(20).required().messages({
    'string.empty': 'Parking spot code is required',
    'string.min': 'Code must be at least 1 character',
    'string.max': 'Code must not exceed 20 characters',
    'any.required': 'Code is required',
  }),
  type: Joi.string()
    .valid(...Object.values(ParkingSpaceType))
    .required()
    .messages({
      'any.only': 'Type must be either motorbike or car',
      'any.required': 'Type is required',
    }),
  base_price: Joi.number().min(1000).required().messages({
    'any.required': 'Price is required.',
    'number.base': 'Base price must be a number',
    'number.min': 'Base price cannot be negative',
  }),
  status: Joi.string()
    .valid(...Object.values(ParkingSpaceStatus))
    .optional()
    .messages({
      'any.only': 'Invalid status value',
    }),
});

const updateParkingSpaceSchema = Joi.object<ParkingSpace>({
  code: Joi.string().min(1).max(20).optional().messages({
    'string.min': 'Code must be at least 1 character',
    'string.max': 'Code must not exceed 20 characters',
  }),
  type: Joi.string()
    .valid(...Object.values(ParkingSpaceType))
    .optional()
    .messages({
      'any.only': 'Type must be either motorbike or car',
    }),
  base_price: Joi.number().min(1000).optional().messages({
    'number.base': 'Base price must be a number',
    'number.min': 'Base price cannot be negative',
  }),
});

const updateParkingSpaceStatusSchema = Joi.object<ParkingSpace>({
  status: Joi.string()
    .valid(...Object.values(ParkingSpaceStatus))
    .optional()
    .messages({
      'any.only': 'Invalid status value',
      'any.required': 'Status is required',
    }),
});

const idParamSchema = Joi.object({
  id: Joi.string().length(20).required().messages({
    'string.length': 'ID must be 20 characters',
    'string.empty': 'ID is required',
    'any.required': 'ID is required',
  }),
});

export const validateCreateParkingSpace = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createParkingSpaceSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateParkingSpace = (req: Request, res: Response, next: NextFunction) => {
  const { error: paramError } = idParamSchema.validate(req.params);
  if (paramError) {
    return res.status(400).json({ success: false, message: paramError.details[0].message });
  }

  const { error } = updateParkingSpaceSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateStatusParkingSpace = (req: Request, res: Response, next: NextFunction) => {
  const { error: paramError } = idParamSchema.validate(req.params);
  if (paramError) {
    return res.status(400).json({ success: false, message: paramError.details[0].message });
  }

  const { error } = updateParkingSpaceStatusSchema.validate(req.body);
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
