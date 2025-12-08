import { Request, Response } from 'express';
import {
  firebaseHelper,
  logger,
  deleteImages,
  responseError,
  responseSuccess,
} from '../utils/index';
import { Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { User } from '../interfaces/user';

const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;

export const getAllUser = async (req: Request, res: Response) => {
  try {
    const users = await firebaseHelper.getAllDocs(userCollection);
    return responseSuccess(res, Message.USER_GET_ALL, users);
  } catch (error) {
    logger.warn(ErrorMessage.USER_GET_ALL + error);
    return responseError(res, StatusCode.USER_GET_ALL, ErrorMessage.REQUEST_FAILED);
  }
};

export const getUserDetail = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const userDetail = await firebaseHelper.getDocById(userCollection, userId);
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
    const profile = await firebaseHelper.getDocById(userCollection, uid);
    if (!profile) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    return responseSuccess(res, Message.USER_GET_PROFILE, profile);
  } catch (error) {
    logger.warn(ErrorMessage.USER_GET_PROFILE + error);
    return responseError(res, StatusCode.USER_GET_PROFILE, ErrorMessage.USER_GET_PROFILE);
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user: User = await firebaseHelper.getDocById(userCollection, userId);
    if (!user) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    const file = req.file as Express.Multer.File | undefined;
    const newImageUrl = file ? file.path.replace(/\\/g, '/') : null;
    if (newImageUrl && user.image_url) {
      await deleteImages([user.image_url]);
    }

    const updatedUser: User = {
      ...req.body,
      image_url: newImageUrl ? newImageUrl : user.image_url,
      updated_by: req.user?.uid,
    };
    await firebaseHelper.updateDoc(userCollection, userId, updatedUser);

    return responseSuccess(res, Message.USER_UPDATED, userId);
  } catch (error) {
    logger.warn(ErrorMessage.USER_UPDATED + error);
    return responseError(res, StatusCode.USER_UPDATE, ErrorMessage.REQUEST_FAILED);
  }
};
