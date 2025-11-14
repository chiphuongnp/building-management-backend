import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Collection, FacilityStatus, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import logger from '../utils/logger';
import { AuthRequest } from '../interfaces/jwt';
import { responseError, responseSuccess } from '../utils/error';
import { Facility } from '../interfaces/facility';

const facilityCollection = `${Sites.TOKYO}/${Collection.FACILITIES}`;
const buildingCollection = `${Sites.TOKYO}/${Collection.BUILDINGS}`;
const getFacilities = async (req: Request, res: Response) => {
  try {
    const facilities: Facility[] = await firebaseHelper.getAllDocs(facilityCollection);

    return responseSuccess(res, Message.GET_FACILITIES, facilities);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_FACILITY_LIST + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_FACILITY_LIST,
      ErrorMessage.CANNOT_GET_FACILITY_LIST,
    );
  }
};

const getFacilityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const facility: Facility = await firebaseHelper.getDocById(facilityCollection, id);
    if (!facility) {
      return responseError(res, StatusCode.FACILITY_NOT_FOUND, ErrorMessage.FACILITY_NOT_FOUND);
    }

    return responseSuccess(res, Message.GET_FACILITY_DETAIL, facility);
  } catch (error) {
    logger.warn(ErrorMessage.FACILITY_NOT_FOUND + error);

    return responseError(res, StatusCode.FACILITY_NOT_FOUND, ErrorMessage.FACILITY_NOT_FOUND);
  }
};

const getAvailableFacility = async (req: Request, res: Response) => {
  try {
    const facilities: Facility[] = await firebaseHelper.getDocByField(
      facilityCollection,
      'status',
      FacilityStatus.AVAILABLE,
    );

    return responseSuccess(res, Message.GET_AVAILABLE_FACILITY, facilities);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_AVAILABLE_FACILITY + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_AVAILABLE_FACILITY,
      ErrorMessage.CANNOT_GET_AVAILABLE_FACILITY,
    );
  }
};

const createFacility = async (req: AuthRequest, res: Response) => {
  try {
    const { name: facilityName, building_id } = req.body;
    const building = await firebaseHelper.getDocById(buildingCollection, building_id);
    if (!building) {
      return responseError(res, StatusCode.BUILDING_NOT_FOUND, ErrorMessage.BUILDING_NOT_FOUND);
    }

    const nameExists = await firebaseHelper.getDocsByFields(facilityCollection, [
      { field: 'name', operator: '==', value: facilityName },
      { field: 'building_id', operator: '==', value: building_id },
    ]);
    if (nameExists.length) {
      return responseError(
        res,
        StatusCode.FACILITY_NAME_ALREADY_EXISTS,
        ErrorMessage.FACILITY_NAME_ALREADY_EXISTS,
      );
    }

    const docRef = await firebaseHelper.createDoc(facilityCollection, {
      ...req.body,
      created_by: req.user?.uid,
    });
    return responseSuccess(res, Message.FACILITY_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_FACILITY + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_FACILITY,
      ErrorMessage.CANNOT_CREATE_FACILITY,
    );
  }
};

export { getFacilities, getFacilityById, getAvailableFacility, createFacility };
