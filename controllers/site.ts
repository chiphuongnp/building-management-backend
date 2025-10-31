import { Request, Response, NextFunction } from 'express';
import { firebaseHelper } from '../utils/index';

const getSites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sites = await firebaseHelper.getAllDocs('sites');

    return res.status(200).json(sites);
  } catch (error) {
    return res.status(401).json({ error });
  }
};

const createSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docRef = await firebaseHelper.createDoc('sites', req.body);

    return res.status(200).json({
      message: 'Site created successfully.',
      id: docRef.id,
    });
  } catch (error) {
    return res.status(405).json({ error: 'Cannot create site!' });
  }
};

export { createSite, getSites };
