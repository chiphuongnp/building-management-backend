import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { PaymentMethod, PaymentReferenceType } from './../constants/enum';

export const createPaymentSchema = Joi.object({
  reference_id: Joi.string()
    .length(20)
    .regex(/^[A-Za-z0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Reference ID cannot be empty',
      'any.required': 'Reference ID is required',
      'string.length': 'Reference ID must be exactly 20 characters',
      'string.pattern.base': 'Reference ID must contain only letters and numbers',
    }),
  reference_type: Joi.string()
    .valid(...Object.values(PaymentReferenceType))
    .required()
    .messages({
      'any.only': `Reference type must be one of ${Object.values(PaymentReferenceType).join(', ')}`,
      'any.required': 'Reference type is required',
    }),
  method: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .required()
    .messages({
      'any.only': `Payment method must be one of ${Object.values(PaymentMethod).join(', ')}`,
      'any.required': 'Payment method is required',
    }),
});

export const createPaymentUrlSchema = Joi.object({
  payment_id: Joi.string()
    .length(20)
    .regex(/^[A-Za-z0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Payment ID is required',
      'any.required': 'Payment ID is required',
      'string.length': 'Payment ID must be exactly 20 characters',
      'string.pattern.base': 'Payment ID must contain only letters and numbers',
    }),

  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be greater than 0',
    'any.required': 'Amount is required',
  }),
});

export const validateCreatePayment = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createPaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateCreatePaymentUrl = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createPaymentUrlSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
