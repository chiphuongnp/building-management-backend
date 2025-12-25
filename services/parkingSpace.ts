import { Request, Response } from 'express';
import { firebaseHelper, logger, responseError, responseSuccess } from '../utils/index';
import { Collection, ParkingSpaceStatus, Sites } from '../constants/enum';
import { ParkingSpace } from '../interfaces/parkingSpace';
import { AuthRequest } from '../interfaces/jwt';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { WhereFilterOp } from 'firebase-admin/firestore';

const parkingSpaceCollection = `${Sites.TOKYO}/${Collection.PARKING_SPACES}`;
const getParkingSpaces = async (req: Request, res: Response) => {
  try {
    const { building_id } = req.query;
    const filters: { field: string; operator: WhereFilterOp; value: any }[] = [];
    if (building_id) {
      filters.push({ field: 'building_id', operator: '==', value: building_id });
    }

    let parkingSpaces: ParkingSpace[];
    if (filters.length) {
      parkingSpaces = await firebaseHelper.getDocsByFields(parkingSpaceCollection, filters);
    } else {
      parkingSpaces = await firebaseHelper.getAllDocs(parkingSpaceCollection);
    }

    return responseSuccess(res, Message.GET_PARKING_SPACE, parkingSpaces);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_PARKING_SPACE_LIST + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_PARKING_SPACE_LIST,
      ErrorMessage.CANNOT_GET_PARKING_SPACE_LIST,
    );
  }
};

const getParkingSpaceStats = async (req: AuthRequest, res: Response) => {
  try {
    const { building_id } = req.query;
    const parkingSpaces = await firebaseHelper.getDocByField(
      parkingSpaceCollection,
      'building_id',
      building_id,
    );
    const stats = parkingSpaces.reduce(
      (acc, space) => {
        acc.total += 1;

        switch (space.status) {
          case ParkingSpaceStatus.AVAILABLE:
            acc.available += 1;
            break;
          case ParkingSpaceStatus.MAINTENANCE:
            acc.maintenance += 1;
            break;
          case ParkingSpaceStatus.RESERVED:
            acc.reserved += 1;
            break;
        }

        return acc;
      },
      {
        total: 0,
        available: 0,
        maintenance: 0,
        reserved: 0,
      },
    );

    return responseSuccess(res, Message.PARKING_SPACE_GET_STATS, stats);
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_PARKING_SPACE_STATS} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_PARKING_SPACE_STATS,
      ErrorMessage.CANNOT_GET_PARKING_SPACE_STATS,
    );
  }
};

const getParkingSpaceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parkingSpace: ParkingSpace = await firebaseHelper.getDocById(parkingSpaceCollection, id);
    if (!parkingSpace) {
      return responseError(
        res,
        StatusCode.PARKING_SPACE_NOT_FOUND,
        ErrorMessage.PARKING_SPACE_NOT_FOUND,
      );
    }

    return responseSuccess(res, Message.GET_PARKING_SPACE, parkingSpace);
  } catch (error) {
    logger.warn(ErrorMessage.PARKING_SPACE_NOT_FOUND + error);

    return responseError(
      res,
      StatusCode.PARKING_SPACE_NOT_FOUND,
      ErrorMessage.PARKING_SPACE_NOT_FOUND,
    );
  }
};

const getParkingSpaceAvailable = async (req: Request, res: Response) => {
  try {
    const parkingSpaces: ParkingSpace[] = await firebaseHelper.getDocByField(
      parkingSpaceCollection,
      'status',
      ParkingSpaceStatus.AVAILABLE,
    );

    return responseSuccess(res, Message.GET_AVAILABLE_PARKING_SPACE, parkingSpaces);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_AVAILABLE_PARKING_SPACE + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_AVAILABLE_PARKING_SPACE,
      ErrorMessage.CANNOT_GET_AVAILABLE_PARKING_SPACE,
    );
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
      return responseError(res, StatusCode.BUILDING_NOT_FOUND, ErrorMessage.BUILDING_NOT_FOUND);
    }

    const codeExists = await firebaseHelper.getDocsByFields(parkingSpaceCollection, [
      { field: 'code', operator: '==', value: parkingCode },
      { field: 'building_id', operator: '==', value: building_id },
    ]);
    if (codeExists.length) {
      return responseError(
        res,
        StatusCode.PARKING_SPACE_CODE_ALREADY_EXISTS,
        ErrorMessage.PARKING_SPACE_CODE_ALREADY_EXISTS,
      );
    }

    const docRef = await firebaseHelper.createDoc(parkingSpaceCollection, {
      ...req.body,
      created_by: req.user?.uid,
    });
    return responseSuccess(res, Message.PARKING_SPACE_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_PARKING_SPACE + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_PARKING_SPACE,
      ErrorMessage.CANNOT_CREATE_PARKING_SPACE,
    );
  }
};

const updateParkingSpace = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parkingSpace = await firebaseHelper.getDocById(parkingSpaceCollection, id);
    if (!parkingSpace) {
      return responseError(
        res,
        StatusCode.PARKING_SPACE_NOT_FOUND,
        ErrorMessage.PARKING_SPACE_NOT_FOUND,
      );
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
        return responseError(
          res,
          StatusCode.PARKING_SPACE_CODE_ALREADY_EXISTS,
          ErrorMessage.PARKING_SPACE_CODE_ALREADY_EXISTS,
        );
      }
    }

    await firebaseHelper.updateDoc(parkingSpaceCollection, id, {
      ...req.body,
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.PARKING_SPACE_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_PARKING_SPACE + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_PARKING_SPACE,
      ErrorMessage.CANNOT_UPDATE_PARKING_SPACE,
    );
  }
};

const updateParkingSpaceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await firebaseHelper.updateDoc(parkingSpaceCollection, id, {
      status: req.body.status,
    });

    return responseSuccess(res, Message.PARKING_SPACE_STATUS_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_PARKING_SPACE_STATUS + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_PARKING_SPACE_STATUS,
      ErrorMessage.CANNOT_UPDATE_PARKING_SPACE_STATUS,
    );
  }
};

export {
  getParkingSpaces,
  getParkingSpaceAvailable,
  getParkingSpaceById,
  getParkingSpaceStats,
  updateParkingSpaceStatus,
  createParkingSpace,
  updateParkingSpace,
};
