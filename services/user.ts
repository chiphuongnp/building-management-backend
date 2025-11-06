import { Request, Response } from 'express';
import { firebaseHelper } from '../utils/index';
import { Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { getDocById } from '../utils/firebaseHelper';
import { AuthRequest } from '../interfaces/jwt';
import { responseError, responseSuccess } from '../utils/error';
import logger from '../utils/logger';

export const getAllUser = async (req: Request, res: Response) => {
  try {
    const users = await firebaseHelper.getAllDocs(`${Sites.TOKYO}/users`);
    return responseSuccess(res, Message.USER_GET_ALL, users);
  } catch (error) {
    logger.warn(ErrorMessage.USER_GET_ALL + error);
    return responseError(res, StatusCode.USER_GET_ALL, ErrorMessage.REQUEST_FAILED);
  }
};

export const getUserDetail = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const userDetail = await getDocById(`${Sites.TOKYO}/users`, userId);
    if (!userDetail) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    return responseSuccess(res, Message.USER_GET_DETAIL, userDetail);
  } catch (error) {
    logger.warn(ErrorMessage.USER_GET_DETAIL + error);
    return responseError(res, StatusCode.USER_GET_DETAIL, ErrorMessage.USER_GET_DETAIL);
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) {
    return responseError(res, StatusCode.ACCOUNT_NOT_FOUND, ErrorMessage.ACCOUNT_NOT_FOUND);
  }

  try {
    const profile = await getDocById(`${Sites.TOKYO}/users`, uid);
    if (!profile) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    return responseSuccess(res, Message.USER_GET_PROFILE, profile);
  } catch (error) {
    logger.warn(ErrorMessage.USER_GET_PROFILE + error);
    return responseError(res, StatusCode.USER_GET_PROFILE, ErrorMessage.USER_GET_PROFILE);
  }
};
