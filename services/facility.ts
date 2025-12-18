import { Request, Response } from 'express';
import {
  firebaseHelper,
  responseError,
  responseSuccess,
  logger,
  capitalizeName,
} from '../utils/index';
import { Collection, FacilityStatus, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { Facility } from '../interfaces/facility';
import { OrderByDirection, WhereFilterOp } from 'firebase-admin/firestore';
import { DEFAULT_PAGE_TOTAL } from '../constants/constant';

const facilityCollection = `${Sites.TOKYO}/${Collection.FACILITIES}`;
const buildingCollection = `${Sites.TOKYO}/${Collection.BUILDINGS}`;
const getFacilities = async (req: AuthRequest, res: Response) => {
  try {
    const { status, building_id, name, order, order_by } = req.query;
    const { page, page_size } = req.pagination ?? {};
    const filters: { field: string; operator: WhereFilterOp; value: any }[] = [];
    if (name) {
      const capitalizedName = capitalizeName(name as string);
      filters.push(
        { field: 'name', operator: '>=', value: capitalizedName },
        { field: 'name', operator: '<=', value: capitalizedName + '\uf8ff' },
      );
    }

    if (building_id) {
      filters.push({ field: 'building_id', operator: '==', value: building_id });
    }

    if (status) {
      filters.push({ field: 'status', operator: '==', value: status });
    }

    const total = filters.length
      ? await firebaseHelper.countDocsByFields(facilityCollection, filters)
      : await firebaseHelper.countAllDocs(facilityCollection);
    const totalPage = page_size
      ? Math.max(DEFAULT_PAGE_TOTAL, Math.ceil(total / page_size))
      : DEFAULT_PAGE_TOTAL;
    const orderBy = name ? 'name' : (order_by as string);
    const orderDirection = order as OrderByDirection;
    let facilities: Facility[];
    if (filters.length) {
      facilities = await firebaseHelper.getDocsByFields(
        facilityCollection,
        filters,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    } else {
      facilities = await firebaseHelper.getAllDocs(
        facilityCollection,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    }

    return responseSuccess(res, Message.GET_FACILITIES, {
      facilities,
      pagination: {
        page,
        page_size,
        total,
        total_page: totalPage,
      },
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_FACILITY_LIST + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_FACILITY_LIST,
      ErrorMessage.CANNOT_GET_FACILITY_LIST,
    );
  }
};

const getFacilityStats = async (req: AuthRequest, res: Response) => {
  try {
    const total = await firebaseHelper.countAllDocs(buildingCollection);
    const maintenance = await firebaseHelper.countDocsByFields(buildingCollection, [
      { field: 'status', operator: '==', value: FacilityStatus.MAINTENANCE },
    ]);
    const reserved = await firebaseHelper.countDocsByFields(buildingCollection, [
      { field: 'status', operator: '==', value: FacilityStatus.RESERVED },
    ]);
    const available = total - maintenance - reserved;

    return responseSuccess(res, Message.FACILITY_GET_STATS, {
      total,
      maintenance,
      reserved,
      available,
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_FACILITY_STATS} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_FACILITY_STATS,
      ErrorMessage.CANNOT_GET_FACILITY_STATS,
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
      status: FacilityStatus.AVAILABLE,
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

const updateFacility = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const facility = await firebaseHelper.getDocById(facilityCollection, id);
    if (!facility) {
      return responseError(res, StatusCode.FACILITY_NOT_FOUND, ErrorMessage.FACILITY_NOT_FOUND);
    }

    const { name, location } = req.body;
    if (name) {
      const nameSnapshot = await firebaseHelper.getDocByField(facilityCollection, 'name', name);
      const nameDuplicate = nameSnapshot.some((doc) => doc.id !== id);
      if (nameDuplicate) {
        return responseError(
          res,
          StatusCode.FACILITY_NAME_ALREADY_EXISTS,
          ErrorMessage.FACILITY_NAME_ALREADY_EXISTS,
        );
      }
    }

    if (location) {
      const locationSnapshot = await firebaseHelper.getDocsByFields(facilityCollection, [
        { field: 'location.area', operator: '==', value: location.area },
        { field: 'location.floor', operator: '==', value: location.floor },
        { field: 'location.outdoor', operator: '==', value: location.outdoor },
      ]);
      const locationDuplicate = locationSnapshot.some((doc) => doc.id !== id);
      if (locationDuplicate) {
        return responseError(
          res,
          StatusCode.FACILITY_LOCATION_ALREADY_EXISTS,
          ErrorMessage.FACILITY_LOCATION_ALREADY_EXISTS,
        );
      }
    }

    await firebaseHelper.updateDoc(facilityCollection, id, {
      ...req.body,
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.FACILITY_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_FACILITY + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_FACILITY,
      ErrorMessage.CANNOT_UPDATE_FACILITY,
    );
  }
};

const updateFacilityStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const facility = await firebaseHelper.getDocById(facilityCollection, id);
    if (!facility) {
      return responseError(res, StatusCode.FACILITY_NOT_FOUND, ErrorMessage.FACILITY_NOT_FOUND);
    }

    await firebaseHelper.updateDoc(facilityCollection, id, {
      ...req.body,
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.FACILITY_STATUS_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_FACILITY_STATUS + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_FACILITY_STATUS,
      ErrorMessage.CANNOT_UPDATE_FACILITY_STATUS,
    );
  }
};

export {
  getFacilities,
  getFacilityById,
  getAvailableFacility,
  createFacility,
  updateFacility,
  updateFacilityStatus,
  getFacilityStats,
};
