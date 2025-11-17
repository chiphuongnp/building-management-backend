import express from 'express';
import { authenticate } from '../middlewares/auth';
import { validateBus } from '../validations/bus';
import { requirePermission, requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';
import { upload } from '../middlewares/multer';
import { MAX_IMAGE_COUNT } from '../constants/constant';
import { createBus, getAllBuses, getBusDetail, updateBus } from '../services/bus';

const busRouter = express.Router();

busRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('create_bus'),
  upload.array('bus-images', MAX_IMAGE_COUNT),
  validateBus,
  createBus,
);

busRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  requirePermission('get_all_bus'),
  getAllBuses,
);

busRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  requirePermission('get_bus'),
  getBusDetail,
);

busRouter.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission('update_bus'),
  upload.array('bus-images', MAX_IMAGE_COUNT),
  validateBus,
  updateBus,
);

export default busRouter;
