import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Site } from '../interfaces/site';
import { Collection } from '../constants/enum';

const getSites = async (req: Request, res: Response) => {
  try {
    const sites = await firebaseHelper.getAllDocs(`${Collection.SITES}`);
    return res.status(200).json({
      success: true,
      data: sites,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Can not get list sites!', error });
  }
};

const getSiteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const site = await firebaseHelper.getDocById(`${Collection.SITES}`, id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found',
      });
    }

    return res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Cannot get site by Id!',
      error,
    });
  }
};

const createSite = async (req: Request, res: Response) => {
  try {
    const data: Site = req.body;
    const idSnapshot = await firebaseHelper.getDocByField(`${Collection.SITES}`, 'id', data.id);
    if (!idSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'site id already exists',
      });
    }

    const codeSnapshot = await firebaseHelper.getDocByField(
      `${Collection.SITES}`,
      'code',
      data.code,
    );
    if (!codeSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'Site code already exists',
      });
    }

    const docRef = await firebaseHelper.createDoc(`${Collection.SITES}`, data);
    return res.status(200).json({
      success: true,
      message: 'Site created successfully.',
      id: docRef.id,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Cannot create site!', error });
  }
};

const updateSite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const site = await firebaseHelper.getDocById(`${Collection.SITES}`, id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found',
      });
    }

    const data: Site = req.body;
    const { code } = data;
    if (code) {
      const codeSnapshot = await firebaseHelper.getDocByField(`${Collection.SITES}`, 'code', code);
      const isDuplicate = codeSnapshot.docs.some((doc) => doc.id !== id);
      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: 'Site code already exists',
        });
      }
    }

    const docRef = await firebaseHelper.updateDoc(`${Collection.SITES}`, id, data);
    return res.status(200).json({
      success: true,
      message: 'Site updated successfully.',
      data: docRef,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Cannot update site!', error });
  }
};

export { createSite, updateSite, getSites, getSiteById };
