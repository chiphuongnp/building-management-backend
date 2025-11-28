import { Response } from 'express';
import { Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { Bus } from '../interfaces/bus';
import {
  firebaseHelper,
  responseError,
  responseSuccess,
  logger,
  deleteImages,
} from '../utils/index';

const busCollection = `${Sites.TOKYO}/${Collection.BUSES}`;

export const createBus = async (req: AuthRequest, res: Response) => {
  try {
    const data: Partial<Bus> = req.body;
    const numberSnapshot = await firebaseHelper.getDocByField(busCollection, 'number', data.number);
    if (numberSnapshot.length) {
      return responseError(
        res,
        StatusCode.BUS_NUMBER_ALREADY_EXISTS,
        ErrorMessage.BUS_NUMBER_ALREADY_EXISTS,
      );
    }

    const codeSnapshot = await firebaseHelper.getDocByField(
      busCollection,
      'plate_number',
      data.plate_number,
    );
    if (codeSnapshot.length) {
      return responseError(
        res,
        StatusCode.BUS_CODE_ALREADY_EXISTS,
        ErrorMessage.BUS_CODE_ALREADY_EXISTS,
      );
    }

    const files = req?.files as Express.Multer.File[];
    const docRef = await firebaseHelper.createDoc(busCollection, {
      ...data,
      image_urls: files?.map((file) => file.path.replace(/\\/g, '/')) || [],
      created_by: req.user?.uid,
    });

    return responseSuccess(res, Message.BUS_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_BUS + error);

    return responseError(res, StatusCode.BUS_CREATE, ErrorMessage.CANNOT_CREATE_BUS);
  }
};

export const getAllBuses = async (req: AuthRequest, res: Response) => {
  try {
    const buses = await firebaseHelper.getAllDocs(busCollection);
    if (!buses.length) {
      return responseError(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND);
    }

    return responseSuccess(res, Message.BUS_GET_ALL, buses);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_BUS_LIST + error);

    return responseError(res, StatusCode.BUS_GET_ALL, ErrorMessage.CANNOT_GET_BUS_LIST);
  }
};

export const getBusDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const bus = await firebaseHelper.getDocById(busCollection, id);
    if (!bus) {
      return responseError(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND);
    }

    return responseSuccess(res, Message.BUS_GET_DETAIL, bus);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_BUS_DETAIL + error);

    return responseError(res, StatusCode.BUS_GET_DETAIL, ErrorMessage.CANNOT_GET_BUS_DETAIL);
  }
};

export const updateBus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<Bus> = req.body;

    const existingBus = await firebaseHelper.getDocById(busCollection, id);
    if (!existingBus) {
      return responseError(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND);
    }

    if (data.number && data.number !== existingBus.number) {
      const numberSnapshot = await firebaseHelper.getDocByField(
        busCollection,
        'number',
        data.number,
      );
      if (numberSnapshot.length) {
        return responseError(
          res,
          StatusCode.BUS_NUMBER_ALREADY_EXISTS,
          ErrorMessage.BUS_NUMBER_ALREADY_EXISTS,
        );
      }
    }

    if (data.plate_number && data.plate_number !== existingBus.code) {
      const codeSnapshot = await firebaseHelper.getDocByField(
        busCollection,
        'plate_number',
        data.plate_number,
      );
      if (codeSnapshot.length) {
        return responseError(
          res,
          StatusCode.BUS_CODE_ALREADY_EXISTS,
          ErrorMessage.BUS_CODE_ALREADY_EXISTS,
        );
      }
    }

    const files = req?.files as Express.Multer.File[];
    if (files?.length) {
      if (existingBus.image_urls?.length) {
        await deleteImages(existingBus.image_urls);
      }
      data.image_urls = files.map((file) => file.path.replace(/\\/g, '/'));
    }

    await firebaseHelper.updateDoc(busCollection, id, {
      ...data,
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.BUS_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_BUS + error);
    return responseError(res, StatusCode.BUS_UPDATE, ErrorMessage.CANNOT_UPDATE_BUS);
  }
};
