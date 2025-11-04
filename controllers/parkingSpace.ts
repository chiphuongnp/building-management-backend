import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Collection, ParkingSpaceStatus, Sites } from '../constants/enum';
import { ParkingSpace } from '../interfaces/parkingSpace';
import { AuthRequest } from '../interfaces/jwt';

const collection = `${Sites.TOKYO}/${Collection.PARKING_SPACES}`;
const getParkingSpaces = async (req: Request, res: Response) => {
  try {
    const parkingSpaces: ParkingSpace[] = await firebaseHelper.getAllDocs(collection);

    return res.status(200).json({
      success: true,
      data: parkingSpaces,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Can not get list parking spaces!' });
  }
};

const getBuildingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parkingSpace: ParkingSpace = await firebaseHelper.getDocById(collection, id);
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: 'Parking space not found!',
      });
    }

    return res.json({
      success: true,
      data: parkingSpace,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Cannot get parking space by Id!',
    });
  }
};

const getParkingSpaceAvailable = async (req: Request, res: Response) => {
  try {
    const parkingSpaces: ParkingSpace[] = await firebaseHelper.getDocByField(
      collection,
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
      .json({ success: false, message: 'Can not get list parking spaces available!' });
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
        message: 'Building not found.',
      });
    }

    const codeExists = await firebaseHelper.getDocsByFields(collection, [
      { field: 'code', operator: '==', value: parkingCode },
      { field: 'building_id', operator: '==', value: building_id },
    ]);
    if (codeExists) {
      return res.status(409).json({
        success: false,
        message: 'Parking code already exists in this building.',
      });
    }

    const docRef = await firebaseHelper.createDoc(`${Sites.TOKYO}/${Collection.PARKING_SPACES}`, {
      ...req.body,
      created_by: req.user?.uid,
    });
    return res.status(200).json({
      success: true,
      message: 'Parking space created successfully.',
      id: docRef.id,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Cannot create parking space!' });
  }
};

const updateParkingSpace = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parkingSpace = await firebaseHelper.getDocById(collection, id);
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: 'parking space not found',
      });
    }

    const { code: parkingCode } = req.body;
    if (parkingCode) {
      const codeSnapshot = await firebaseHelper.getDocByField(collection, 'code', parkingCode);
      const isDuplicate = codeSnapshot.some((doc) => doc.id !== id);
      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: 'parking space code already exists',
        });
      }
    }

    const docRef = await firebaseHelper.updateDoc(collection, id, {
      ...req.body,
      updated_by: req.user?.uid,
    });
    return res.status(200).json({
      success: true,
      message: 'parking space updated successfully.',
      data: docRef,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Cannot update parking space!' });
  }
};

export {
  getParkingSpaces,
  getParkingSpaceAvailable,
  getBuildingById,
  createParkingSpace,
  updateParkingSpace,
};
