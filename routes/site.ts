import express from 'express';
import { createSite, updateSite, getSites, getSiteById } from '../controllers/site';
import { validateCreateSite, validateIdParam, validateUpdateSite } from '../validations/site';
import { authenticate } from '../middlewares/auth';
import { requireRole, requirePermission } from '../middlewares/permission';
import { UserRole } from '../constants/enum';

const siteRouter = express.Router();

siteRouter.get('/', authenticate, requireRole(UserRole.MANAGER, UserRole.USER), getSites);

siteRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParam,
  getSiteById,
);

siteRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('create_site'),
  validateCreateSite,
  createSite,
);

siteRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_site'),
  validateIdParam,
  validateUpdateSite,
  updateSite,
);

export default siteRouter;
