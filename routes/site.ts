import express from 'express';
import * as siteController from '../controllers/site';
import {
  validateCreateSite,
  validateIdParam,
  validateUpdateSite,
} from '../middlewares/siteValidation';

const siteRouter = express.Router();

siteRouter.get('/', siteController.getSites);

siteRouter.get('/:id', validateIdParam, siteController.getSiteById);

siteRouter.post('/create', validateCreateSite, siteController.createSite);

siteRouter.patch('/update/:id', validateIdParam, validateUpdateSite, siteController.updateSite);

export default siteRouter;
