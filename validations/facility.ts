import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { FacilityType, FacilityStatus } from '../constants/enum';
import { Facility, FacilityLocation } from '../interfaces/facility';

const facilityLocationSchema = Joi.object<FacilityLocation>({
  floor: Joi.string().min(1).required().messages({
    'string.empty': 'Floor is required',
    'string.min': 'Floor must be at least 1 character',
  }),
  outdoor: Joi.boolean().optional().messages({
    'boolean.base': 'Outdoor must be a boolean (true/false)',
  }),
  area: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Area is required',
    'string.min': 'Area must be at least 1 character',
    'string.max': 'Area must not exceed 50 characters',
  }),
});

const createFacilitySchema = Joi.object<Facility>({
  building_id: Joi.string().min(1).required().messages({
    'string.empty': 'Building ID cannot be empty',
    'any.required': 'Building ID is required',
  }),
  name: Joi.string().required().min(3).max(255).messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name must not exceed 255 characters',
    'any.required': 'Name is required',
  }),
  facility_type: Joi.string()
    .valid(...Object.values(FacilityType))
    .required()
    .messages({
      'any.only': 'Facility type must be either field, room, or other',
      'any.required': 'Facility type is required',
    }),
  description: Joi.string().max(1000).allow('').optional().messages({
    'string.max': 'Description must not exceed 1000 characters',
  }),
  capacity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Capacity must be a number',
    'number.integer': 'Capacity must be an integer',
    'number.min': 'Capacity must be at least 1',
    'any.required': 'Capacity is required',
  }),
  location: facilityLocationSchema.required(),
  base_price: Joi.number().min(0).optional().messages({
    'number.base': 'Base price must be a number',
    'number.min': 'Base price cannot be negative',
  }),
  service_charge: Joi.number().min(0).optional().messages({
    'number.base': 'Service charge must be a number',
    'number.min': 'Service charge cannot be negative',
  }),
  created_by: Joi.string().min(1).optional().messages({
    'string.empty': 'Created by cannot be empty',
  }),
});

const updateFacilitySchema = Joi.object({
  name: Joi.string().min(3).max(255).messages({
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name must not exceed 255 characters',
  }),
  facility_type: Joi.string()
    .valid(...Object.values(FacilityType))
    .messages({
      'any.only': 'Facility type must be either field, room, or other',
    }),
  description: Joi.string().max(1000).allow('').messages({
    'string.max': 'Description must not exceed 1000 characters',
  }),
  capacity: Joi.number().integer().min(1).messages({
    'number.base': 'Capacity must be a number',
    'number.integer': 'Capacity must be an integer',
    'number.min': 'Capacity must be at least 1',
  }),
  location: facilityLocationSchema.optional(),
  base_price: Joi.number().min(0).messages({
    'number.base': 'Base price must be a number',
    'number.min': 'Base price cannot be negative',
  }),
  service_charge: Joi.number().min(0).messages({
    'number.base': 'Service charge must be a number',
    'number.min': 'Service charge cannot be negative',
  }),
  updated_by: Joi.string().min(1).optional().messages({
    'string.empty': 'Updated by cannot be empty',
  }),
});

const updateFacilityStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(FacilityStatus))
    .messages({
      'any.only': 'Status must be either available, reserved, or maintenance',
    }),
});

const idParamFacilitySchema = Joi.object({
  id: Joi.string().min(1).required().messages({
    'string.empty': 'ID cannot be empty',
    'any.required': 'ID is required',
  }),
});

export const validateCreateFacility = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createFacilitySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateFacility = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateFacilitySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateFacilityStatus = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateFacilityStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateIdParamFacility = (req: Request, res: Response, next: NextFunction) => {
  const { error } = idParamFacilitySchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
