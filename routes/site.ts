import express from 'express';
import { createSite, updateSite, getSites, getSiteById } from '../controllers/site';
import { validateCreateSite, validateIdParam, validateUpdateSite } from '../validations/site';
import { authenticate } from '../middlewares/auth';
import { requireRole, requirePermission } from '../middlewares/permission';

const siteRouter = express.Router();

siteRouter.get('/', authenticate, requireRole('user', 'manager'), getSites);

siteRouter.get('/:id', authenticate, requireRole('user', 'manager'), validateIdParam, getSiteById);

siteRouter.post(
  '/create',
  authenticate,
  requireRole('manager'),
  requirePermission('create_site'),
  validateCreateSite,
  createSite,
);

siteRouter.patch(
  '/update/:id',
  authenticate,
  requireRole('manager'),
  requirePermission('update_site'),
  validateIdParam,
  validateUpdateSite,
  updateSite,
);

export default siteRouter;
