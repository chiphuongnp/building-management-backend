import { MAX_IMAGE_COUNT } from './../constants/constants';
import { createDish } from '../controllers/dish';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/permission';
import { upload } from './../middlewares/multer';
import express from 'express';

const dishRouter = express.Router({ mergeParams: true });
dishRouter.post(
  '/create',
  authenticate,
  requireRole('manager'),
  requirePermission('create_dish'),
  upload.array('dish-images', MAX_IMAGE_COUNT),
  createDish,
);

export default dishRouter;
