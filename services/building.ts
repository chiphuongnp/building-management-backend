import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message } from '../constants/message';

const buildingCollection = `${Sites.TOKYO}/${Collection.BUILDINGS}`;
const getBuildings = async (req: Request, res: Response) => {
  try {
    const building = await firebaseHelper.getAllDocs(buildingCollection);

    return res.status(200).json({
      success: true,
      data: building,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: ErrorMessage.CANNOT_GET_BUILDING_LIST });
  }
};

const getBuildingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const building = await firebaseHelper.getDocById(buildingCollection, id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: ErrorMessage.BUILDING_NOT_FOUND,
      });
    }

    return res.json({
      success: true,
      data: building,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: ErrorMessage.BUILDING_NOT_FOUND,
    });
  }
};

const createBuilding = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nameExists = await firebaseHelper.getDocByField(buildingCollection, 'name', data.name);
    if (nameExists.length) {
      return res.status(409).json({
        success: false,
        message: ErrorMessage.BUILDING_NAME_ALREADY_EXISTS,
      });
    }

    const codeExists = await firebaseHelper.getDocByField(buildingCollection, 'code', data.code);
    if (codeExists.length) {
      return res.status(409).json({
        success: false,
        message: ErrorMessage.BUILDING_CODE_ALREADY_EXISTS,
      });
    }

    const docRef = await firebaseHelper.createDoc(buildingCollection, data);
    return res.status(200).json({
      success: true,
      message: Message.BUILDING_CREATED,
      id: docRef.id,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: ErrorMessage.CANNOT_CREATE_BUILDING });
  }
};

const updateBuilding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const building = await firebaseHelper.getDocById(buildingCollection, id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: ErrorMessage.BUILDING_NOT_FOUND,
      });
    }

    const { name, code } = req.body;
    if (name) {
      const nameSnapshot = await firebaseHelper.getDocByField(buildingCollection, 'name', name);
      const nameDuplicate = nameSnapshot.some((doc) => doc.id !== id);
      if (nameDuplicate) {
        return res.status(409).json({
          success: false,
          message: ErrorMessage.BUILDING_NAME_ALREADY_EXISTS,
        });
      }
    }

    if (code) {
      const codeSnapshot = await firebaseHelper.getDocByField(buildingCollection, 'code', code);
      const codeDuplicate = codeSnapshot.some((doc) => doc.id !== id);
      if (codeDuplicate) {
        return res.status(409).json({
          success: false,
          message: ErrorMessage.BUILDING_CODE_ALREADY_EXISTS,
        });
      }
    }

    const docRef = await firebaseHelper.updateDoc(buildingCollection, id, req.body);
    return res.status(200).json({
      success: true,
      message: Message.BUILDING_UPDATED,
      data: docRef,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: ErrorMessage.CANNOT_UPDATE_BUILDING });
  }
};

export { createBuilding, updateBuilding, getBuildingById, getBuildings };
