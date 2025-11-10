import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { responseError, responseSuccess } from '../utils/error';
import logger from '../utils/logger';
import { Permission } from '../interfaces/permission';

const permissionCollection = `${Sites.TOKYO}/${Collection.PERMISSIONS}`;

export const getPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await firebaseHelper.getAllDocs(permissionCollection);
    return responseSuccess(res, Message.PERMISSION_GET_ALL, permissions);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_PERMISSION_LIST + error);
    return responseError(
      res,
      StatusCode.PERMISSION_GET_ALL,
      ErrorMessage.CANNOT_GET_PERMISSION_LIST,
    );
  }
};

export const getPermissionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const permission = await firebaseHelper.getDocById(permissionCollection, id);
    if (!permission) {
      return responseError(res, StatusCode.PERMISSION_NOT_FOUND, ErrorMessage.PERMISSION_NOT_FOUND);
    }

    return responseSuccess(res, Message.PERMISSION_GET_DETAIL, permission);
  } catch (error) {
    logger.warn(ErrorMessage.PERMISSION_GET_DETAIL + error);
    return responseError(res, StatusCode.PERMISSION_GET_DETAIL, ErrorMessage.PERMISSION_GET_DETAIL);
  }
};

export const createPermission = async (req: AuthRequest, res: Response) => {
  try {
    const data: Permission = req.body;
    const idSnapshot = await firebaseHelper.getDocByField(permissionCollection, 'id', data.id);
    if (idSnapshot.length) {
      return responseError(
        res,
        StatusCode.PERMISSION_ALREADY_EXISTS,
        ErrorMessage.PERMISSION_ALREADY_EXISTS,
      );
    }

    const docRef = await firebaseHelper.createDoc(permissionCollection, {
      ...data,
      created_by: req.user?.uid,
    });
    return responseSuccess(res, Message.PERMISSION_CREATED, data);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_PERMISSION + error);
    return responseError(res, StatusCode.PERMISSION_CREATE, ErrorMessage.CANNOT_CREATE_PERMISSION);
  }
};

export const updatePermission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: Permission = req.body;
    const permission = await firebaseHelper.getDocById(permissionCollection, id);
    if (!permission) {
      return responseError(res, StatusCode.PERMISSION_NOT_FOUND, ErrorMessage.PERMISSION_NOT_FOUND);
    }

    const idSnapshot = await firebaseHelper.getDocByField(permissionCollection, 'id', data.id);
    if (idSnapshot.length) {
      return responseError(
        res,
        StatusCode.PERMISSION_ALREADY_EXISTS,
        ErrorMessage.PERMISSION_ALREADY_EXISTS,
      );
    }

    const docRef = await firebaseHelper.updateDoc(permissionCollection, id, {
      ...data,
      updated_by: req.user?.uid,
    });
    return responseSuccess(res, Message.PERMISSION_UPDATED, data);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_PERMISSION + error);
    return responseError(res, StatusCode.PERMISSION_UPDATE, ErrorMessage.CANNOT_UPDATE_PERMISSION);
  }
};
