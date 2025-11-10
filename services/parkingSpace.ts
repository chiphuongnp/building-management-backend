import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Collection, ParkingSpaceStatus, Sites } from '../constants/enum';
import { ParkingSpace } from '../interfaces/parkingSpace';
import { AuthRequest } from '../interfaces/jwt';
import { ErrorMessage, Message } from '../constants/message';

const parkingSpaceCollection = `${Sites.TOKYO}/${Collection.PARKING_SPACES}`;
const getParkingSpaces = async (req: Request, res: Response) => {
  try {
    const parkingSpaces: ParkingSpace[] = await firebaseHelper.getAllDocs(parkingSpaceCollection);

    return res.status(200).json({
      success: true,
      data: parkingSpaces,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_GET_PARKING_SPACE_LIST });
  }
};

const getBuildingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parkingSpace: ParkingSpace = await firebaseHelper.getDocById(parkingSpaceCollection, id);
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: ErrorMessage.PARKING_SPACE_NOT_FOUND,
      });
    }

    return res.json({
      success: true,
      data: parkingSpace,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: ErrorMessage.PARKING_SPACE_NOT_FOUND,
    });
  }
};

const getParkingSpaceAvailable = async (req: Request, res: Response) => {
  try {
    const parkingSpaces: ParkingSpace[] = await firebaseHelper.getDocByField(
      parkingSpaceCollection,
      'status',
      ParkingSpaceStatus.AVAILABLE,
    );

    return res.status(200).json({
      success: true,
      data: parkingSpaces,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_GET_AVAILABLE_PARKING_SPACE });
  }
};

const createParkingSpace = async (req: AuthRequest, res: Response) => {
  try {
    const { code: parkingCode, building_id } = req.body;
    const building = await firebaseHelper.getDocById(
      `${Sites.TOKYO}/${Collection.BUILDINGS}`,
      building_id,
    );
    if (!building) {
      return res.status(404).json({
        success: false,
        message: ErrorMessage.BUILDING_NOT_FOUND,
      });
    }

    const codeExists = await firebaseHelper.getDocsByFields(parkingSpaceCollection, [
      { field: 'code', operator: '==', value: parkingCode },
      { field: 'building_id', operator: '==', value: building_id },
    ]);
    if (codeExists.length) {
      return res.status(409).json({
        success: false,
        message: ErrorMessage.PARKING_SPACE_CODE_ALREADY_EXISTS,
      });
    }

    const docRef = await firebaseHelper.createDoc(`${Sites.TOKYO}/${Collection.PARKING_SPACES}`, {
      ...req.body,
      created_by: req.user?.uid,
    });
    return res.status(200).json({
      success: true,
      message: Message.PARKING_SPACE_CREATED,
      id: docRef.id,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_CREATE_PARKING_SPACE });
  }
};

const updateParkingSpace = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parkingSpace = await firebaseHelper.getDocById(parkingSpaceCollection, id);
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: ErrorMessage.PARKING_SPACE_NOT_FOUND,
      });
    }

    const { code: parkingCode } = req.body;
    if (parkingCode) {
      const codeSnapshot = await firebaseHelper.getDocByField(
        parkingSpaceCollection,
        'code',
        parkingCode,
      );
      const isDuplicate = codeSnapshot.some((doc) => doc.id !== id);
      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: ErrorMessage.PARKING_SPACE_CODE_ALREADY_EXISTS,
        });
      }
    }

    const docRef = await firebaseHelper.updateDoc(parkingSpaceCollection, id, {
      ...req.body,
      updated_by: req.user?.uid,
    });
    return res.status(200).json({
      success: true,
      message: Message.PARKING_SPACE_UPDATED,
      data: docRef,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_UPDATE_PARKING_SPACE });
  }
};

const updateParkingSpaceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = await firebaseHelper.updateDoc(parkingSpaceCollection, id, {
      status: req.body.status,
    });

    return res.status(200).json({
      success: true,
      message: Message.PARKING_SPACE_STATUS_UPDATED,
      data: docRef,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: ErrorMessage.CANNOT_UPDATE_PARKING_SPACE_STATUS });
  }
};

export {
  getParkingSpaces,
  getParkingSpaceAvailable,
  getBuildingById,
  updateParkingSpaceStatus,
  createParkingSpace,
  updateParkingSpace,
};
