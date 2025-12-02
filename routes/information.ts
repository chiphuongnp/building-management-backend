import express from 'express';
import { requirePermission, requireRole } from '../middlewares/permission';
import { authenticate } from '../middlewares/auth';
import { Permission, UserRole } from '../constants/enum';
import { validateCreateInformation } from '../validations/information';
import { createInformation, getInformation, getInformationList } from '../services/information';

const informationRouter = express.Router();

informationRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.CREATE_INFORMATION),
  validateCreateInformation,
  createInformation,
);

informationRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.VIEW_INFORMATION_LIST),
  getInformationList,
);

informationRouter.get('/:id', authenticate, getInformation);

export default informationRouter;
