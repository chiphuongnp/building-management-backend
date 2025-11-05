import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Site } from '../interfaces/site';
import { Collection } from '../constants/enum';
import { ErrorMessage, Message } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';

const siteCollection = `${Collection.SITES}`;
const getSites = async (req: Request, res: Response) => {
  try {
    const sites = await firebaseHelper.getAllDocs(siteCollection);
    return res.status(200).json({
      success: true,
      data: sites,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_GET_SITE_LIST, error });
  }
};

const getSiteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const site = await firebaseHelper.getDocById(siteCollection, id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: ErrorMessage.SITE_NOT_FOUND,
      });
    }

    return res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: ErrorMessage.SITE_NOT_FOUND,
      error,
    });
  }
};

const createSite = async (req: AuthRequest, res: Response) => {
  try {
    const data: Site = req.body;
    const idSnapshot = await firebaseHelper.getDocByField(siteCollection, 'id', data.id);
    if (idSnapshot.length) {
      return res.status(409).json({
        success: false,
        message: ErrorMessage.SITE_ID_ALREADY_EXISTS,
      });
    }

    const codeSnapshot = await firebaseHelper.getDocByField(siteCollection, 'code', data.code);
    if (codeSnapshot.length) {
      return res.status(409).json({
        success: false,
        message: ErrorMessage.SITE_CODE_ALREADY_EXISTS,
      });
    }

    const docRef = await firebaseHelper.createDoc(siteCollection, {
      ...data,
      created_by: req.user?.uid,
    });
    return res.status(200).json({
      success: true,
      message: Message.SITE_CREATED,
      id: docRef.id,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_CREATE_SITE, error });
  }
};

const updateSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const site = await firebaseHelper.getDocById(siteCollection, id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: ErrorMessage.SITE_NOT_FOUND,
      });
    }

    const data: Site = req.body;
    const { code } = data;
    if (code) {
      const codeSnapshot = await firebaseHelper.getDocByField(siteCollection, 'code', code);
      const isDuplicate = codeSnapshot.some((doc) => doc.id !== id);
      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: ErrorMessage.SITE_CODE_ALREADY_EXISTS,
        });
      }
    }

    const docRef = await firebaseHelper.updateDoc(siteCollection, id, {
      ...data,
      updated_by: req.user?.uid,
    });
    return res.status(200).json({
      success: true,
      message: Message.SITE_UPDATED,
      data: docRef,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_UPDATE_SITE, error });
  }
};

export { createSite, updateSite, getSites, getSiteById };
