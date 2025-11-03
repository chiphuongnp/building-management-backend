import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Sites } from '../constants/enum';

const getBuildings = async (req: Request, res: Response) => {
  try {
    const building = await firebaseHelper.getAllDocs(`${Sites.TOKYO}/buildings`);

    return res.status(200).json({
      success: true,
      data: building,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Can not get list buildings!' });
  }
};

const getBuildingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const building = await firebaseHelper.getDocById(`${Sites.TOKYO}/buildings`, id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found!',
      });
    }

    return res.json({
      success: true,
      data: building,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Cannot get building by Id!',
    });
  }
};

const createBuilding = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nameExists = await firebaseHelper.getDocByField(
      `${Sites.TOKYO}/buildings`,
      'name',
      data.name,
    );
    if (!nameExists.empty) {
      return res.status(409).json({
        success: false,
        message: 'Building name already exists',
      });
    }

    const codeExists = await firebaseHelper.getDocByField(
      `${Sites.TOKYO}/buildings`,
      'code',
      data.code,
    );
    if (!codeExists.empty) {
      return res.status(409).json({
        success: false,
        message: 'Building code already exists',
      });
    }

    const docRef = await firebaseHelper.createDoc(`${Sites.TOKYO}/buildings`, data);
    return res.status(200).json({
      success: true,
      message: 'Building created successfully.',
      id: docRef.id,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Cannot create building!' });
  }
};

const updateBuilding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const building = await firebaseHelper.getDocById(`${Sites.TOKYO}/buildings`, id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    const { name, code } = req.body;
    if (name) {
      const nameSnapshot = await firebaseHelper.getDocByField(
        `${Sites.TOKYO}/buildings`,
        'name',
        name,
      );
      const nameDuplicate = nameSnapshot.docs.some((doc) => doc.id !== id);
      if (nameDuplicate) {
        return res.status(409).json({
          success: false,
          message: 'Building name already exists',
        });
      }
    }

    if (code) {
      const codeSnapshot = await firebaseHelper.getDocByField(
        `${Sites.TOKYO}/buildings`,
        'code',
        code,
      );
      const codeDuplicate = codeSnapshot.docs.some((doc) => doc.id !== id);
      if (codeDuplicate) {
        return res.status(409).json({
          success: false,
          message: 'Building code already exists',
        });
      }
    }

    const docRef = await firebaseHelper.updateDoc(`${Sites.TOKYO}/buildings`, id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Building updated successfully.',
      data: docRef,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Cannot update building!' });
  }
};

export { createBuilding, updateBuilding, getBuildingById, getBuildings };
