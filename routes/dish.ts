import { MAX_IMAGE_COUNT } from './../constants/constant';
import { createDish, getDishById, getDishes, updateDish } from '../services/dish';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { upload } from './../middlewares/multer';
import express from 'express';
import { Permission, UserRole } from '../constants/enum';
import { validateCreateDish, validateIdParams, validateUpdateDish } from '../validations/dish';

const dishRouter = express.Router({ mergeParams: true });

dishRouter.get('/', authenticate, requireRole(UserRole.MANAGER, UserRole.USER), getDishes);

dishRouter.get(
  '/:id',
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.USER),
  validateIdParams,
  getDishById,
);

dishRouter.post(
  '/create',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.CREATE_DISH),
  upload.array('dish-images', MAX_IMAGE_COUNT),
  validateIdParams,
  validateCreateDish,
  createDish,
);

dishRouter.patch(
  '/update/:id',
  authenticate,
  requireRole(UserRole.MANAGER),
  requirePermission(Permission.UPDATE_DISH),
  upload.array('dish-images', MAX_IMAGE_COUNT),
  validateIdParams,
  validateUpdateDish,
  updateDish,
);

export default dishRouter;
