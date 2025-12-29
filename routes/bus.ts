import express from 'express';
import { authenticate } from '../middlewares/auth';
import { validateCreateBus, validateUpdateBus } from '../validations/bus';
import { requirePermission, requireRole } from '../middlewares/permission';
import { Permission, UserRole } from '../constants/enum';
import { upload } from '../middlewares/multer';
import { MAX_IMAGE_COUNT } from '../constants/constant';
import { createBus, getAllBuses, getBusDetail, updateBus } from '../services/bus';

const busRouter = express.Router();

busRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.CREATE_BUS),
  upload.array('bus-images', MAX_IMAGE_COUNT),
  validateCreateBus,
  createBus,
);

busRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  requirePermission(Permission.GET_ALL_BUSES),
  getAllBuses,
);

busRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  requirePermission(Permission.GET_BUS),
  getBusDetail,
);

busRouter.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_BUS),
  upload.array('bus-images', MAX_IMAGE_COUNT),
  validateUpdateBus,
  updateBus,
);

export default busRouter;
