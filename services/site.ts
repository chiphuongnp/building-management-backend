import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Site } from '../interfaces/site';
import { Collection } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import logger from '../utils/logger';
import { responseError, responseSuccess } from '../utils/error';

const siteCollection = `${Collection.SITES}`;
const getSites = async (req: Request, res: Response) => {
  try {
    const sites = await firebaseHelper.getAllDocs(siteCollection);
    return responseSuccess(res, Message.GET_SITES, sites);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_SITE_LIST + error);

    return responseError(res, StatusCode.CANNOT_GET_SITE_LIST, ErrorMessage.CANNOT_GET_SITE_LIST);
  }
};

const getSiteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const site = await firebaseHelper.getDocById(siteCollection, id);
    if (!site) {
      return responseError(res, StatusCode.SITE_NOT_FOUND, ErrorMessage.SITE_NOT_FOUND);
    }

    return responseSuccess(res, Message.GET_SITES, site);
  } catch (error) {
    logger.warn(ErrorMessage.SITE_NOT_FOUND + error);

    return responseError(res, StatusCode.SITE_NOT_FOUND, ErrorMessage.SITE_NOT_FOUND);
  }
};

const createSite = async (req: AuthRequest, res: Response) => {
  try {
    const data: Site = req.body;
    const idSnapshot = await firebaseHelper.getDocByField(siteCollection, 'id', data.id);
    if (idSnapshot.length) {
      return responseError(
        res,
        StatusCode.SITE_ALREADY_EXISTS,
        ErrorMessage.SITE_ID_ALREADY_EXISTS,
      );
    }

    const codeSnapshot = await firebaseHelper.getDocByField(siteCollection, 'code', data.code);
    if (codeSnapshot.length) {
      return responseError(
        res,
        StatusCode.SITE_CODE_ALREADY_EXISTS,
        ErrorMessage.SITE_CODE_ALREADY_EXISTS,
      );
    }

    const docRef = await firebaseHelper.createDoc(siteCollection, {
      ...data,
      created_by: req.user?.uid,
    });
    return responseSuccess(res, Message.SITE_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_SITE + error);

    return responseError(res, StatusCode.CANNOT_CREATE_SITE, ErrorMessage.CANNOT_CREATE_SITE);
  }
};

const updateSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const site = await firebaseHelper.getDocById(siteCollection, id);
    if (!site) {
      return responseError(res, StatusCode.SITE_NOT_FOUND, ErrorMessage.SITE_NOT_FOUND);
    }

    const data: Site = req.body;
    const { code } = data;
    if (code) {
      const codeSnapshot = await firebaseHelper.getDocByField(siteCollection, 'code', code);
      const isDuplicate = codeSnapshot.some((doc) => doc.id !== id);
      if (isDuplicate) {
        return responseError(
          res,
          StatusCode.SITE_CODE_ALREADY_EXISTS,
          ErrorMessage.SITE_CODE_ALREADY_EXISTS,
        );
      }
    }

    await firebaseHelper.updateDoc(siteCollection, id, {
      ...data,
      updated_by: req.user?.uid,
    });
    return responseSuccess(res, Message.SITE_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_SITE + error);

    return responseError(res, StatusCode.CANNOT_UPDATE_SITE, ErrorMessage.CANNOT_UPDATE_SITE);
  }
};

export { createSite, updateSite, getSites, getSiteById };
