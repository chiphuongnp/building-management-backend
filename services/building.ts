import { Request, Response } from 'express';
import {
  capitalizeName,
  firebaseHelper,
  logger,
  responseError,
  responseSuccess,
} from '../utils/index';
import { ActiveStatus, Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { OrderByDirection, WhereFilterOp } from 'firebase-admin/firestore';
import { DEFAULT_PAGE_TOTAL } from '../constants/constant';
import { Building } from '../interfaces/building';

const buildingCollection = `${Sites.TOKYO}/${Collection.BUILDINGS}`;
const getBuildings = async (req: AuthRequest, res: Response) => {
  try {
    const { status, name, order, order_by } = req.query;
    const { page, page_size } = req.pagination ?? {};
    const filters: { field: string; operator: WhereFilterOp; value: any }[] = [];
    if (name) {
      const capitalizedName = capitalizeName(name as string);
      filters.push(
        { field: 'name', operator: '>=', value: capitalizedName },
        { field: 'name', operator: '<=', value: capitalizedName + '\uf8ff' },
      );
    }

    if (status) {
      filters.push({ field: 'status', operator: '==', value: status });
    }

    const total = filters.length
      ? await firebaseHelper.countDocsByFields(buildingCollection, filters)
      : await firebaseHelper.countAllDocs(buildingCollection);
    const totalPage = page_size
      ? Math.max(DEFAULT_PAGE_TOTAL, Math.ceil(total / page_size))
      : DEFAULT_PAGE_TOTAL;
    const orderBy = name ? 'name' : (order_by as string);
    const orderDirection = order as OrderByDirection;
    let buildings: Building[];
    if (filters.length) {
      buildings = await firebaseHelper.getDocsByFields(
        buildingCollection,
        filters,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    } else {
      buildings = await firebaseHelper.getAllDocs(
        buildingCollection,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    }

    return responseSuccess(res, Message.GET_BUILDINGS, {
      buildings,
      pagination: {
        page,
        page_size,
        total,
        total_page: totalPage,
      },
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_BUILDING_LIST + error);

    return responseError(
      res,
      StatusCode.CANNOT_GET_BUILDING_LIST,
      ErrorMessage.CANNOT_GET_BUILDING_LIST,
    );
  }
};

const getBuildingsStats = async (req: AuthRequest, res: Response) => {
  try {
    const total = await firebaseHelper.countAllDocs(buildingCollection);
    const active = await firebaseHelper.countDocsByFields(buildingCollection, [
      { field: 'status', operator: '==', value: ActiveStatus.ACTIVE },
    ]);
    const inactive = total - active;

    return responseSuccess(res, Message.BUILDING_GET_STATS, {
      total,
      active,
      inactive,
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_BUILDING_STATS} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_BUILDING_STATS,
      ErrorMessage.CANNOT_GET_BUILDING_STATS,
    );
  }
};

const getBuildingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const building = await firebaseHelper.getDocById(buildingCollection, id);
    if (!building) {
      return responseError(res, StatusCode.BUILDING_NOT_FOUND, ErrorMessage.BUILDING_NOT_FOUND);
    }

    return responseSuccess(res, Message.GET_BUILDINGS, building);
  } catch (error) {
    logger.warn(ErrorMessage.BUILDING_NOT_FOUND + error);

    return responseError(res, StatusCode.BUILDING_NOT_FOUND, ErrorMessage.BUILDING_NOT_FOUND);
  }
};

const createBuilding = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const nameExists = await firebaseHelper.getDocByField(buildingCollection, 'name', data.name);
    if (nameExists.length) {
      return responseError(
        res,
        StatusCode.BUILDING_NAME_ALREADY_EXISTS,
        ErrorMessage.BUILDING_NAME_ALREADY_EXISTS,
      );
    }

    const codeExists = await firebaseHelper.getDocByField(buildingCollection, 'code', data.code);
    if (codeExists.length) {
      return responseError(
        res,
        StatusCode.BUILDING_CODE_ALREADY_EXISTS,
        ErrorMessage.BUILDING_CODE_ALREADY_EXISTS,
      );
    }

    const buildingData = {
      ...data,
      status: ActiveStatus.ACTIVE,
      created_by: req.user?.uid,
    };
    const docRef = await firebaseHelper.createDoc(buildingCollection, buildingData);
    return responseSuccess(res, Message.BUILDING_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_BUILDING + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_BUILDING,
      ErrorMessage.CANNOT_CREATE_BUILDING,
    );
  }
};

const updateBuilding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const building = await firebaseHelper.getDocById(buildingCollection, id);
    if (!building) {
      return responseError(res, StatusCode.BUILDING_NOT_FOUND, ErrorMessage.BUILDING_NOT_FOUND);
    }

    const { name, code } = req.body;
    if (name) {
      const nameSnapshot = await firebaseHelper.getDocByField(buildingCollection, 'name', name);
      const nameDuplicate = nameSnapshot.some((doc) => doc.id !== id);
      if (nameDuplicate) {
        return responseError(
          res,
          StatusCode.BUILDING_NAME_ALREADY_EXISTS,
          ErrorMessage.BUILDING_NAME_ALREADY_EXISTS,
        );
      }
    }

    if (code) {
      const codeSnapshot = await firebaseHelper.getDocByField(buildingCollection, 'code', code);
      const codeDuplicate = codeSnapshot.some((doc) => doc.id !== id);
      if (codeDuplicate) {
        return responseError(
          res,
          StatusCode.BUILDING_CODE_ALREADY_EXISTS,
          ErrorMessage.BUILDING_CODE_ALREADY_EXISTS,
        );
      }
    }

    await firebaseHelper.updateDoc(buildingCollection, id, req.body);

    return responseSuccess(res, Message.BUILDING_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_BUILDING + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_BUILDING,
      ErrorMessage.CANNOT_UPDATE_BUILDING,
    );
  }
};

const updateBuildingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await firebaseHelper.updateDoc(buildingCollection, id, {
      status: req.body.status,
    });

    return responseSuccess(res, Message.BUILDING_STATUS_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_BUILDING_STATUS + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_BUILDING_STATUS,
      ErrorMessage.CANNOT_UPDATE_BUILDING_STATUS,
    );
  }
};

export {
  createBuilding,
  updateBuilding,
  updateBuildingStatus,
  getBuildingById,
  getBuildings,
  getBuildingsStats,
};
