import { Response } from 'express';
import {
  Collection,
  InformationStatus,
  InformationTarget,
  Sites,
  UserRole,
} from '../constants/enum';
import { firebaseHelper, logger, responseError, responseSuccess } from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { Information } from '../interfaces/notification';

const informationUrl = `${Sites.TOKYO}/${Collection.INFORMATION}`;
export const createInformation = async (req: AuthRequest, res: Response) => {
  try {
    const { title, schedule_at, ...data } = req.body;
    const titleExists = await firebaseHelper.getDocByField(informationUrl, 'title', title);
    if (titleExists.length) {
      return responseError(
        res,
        StatusCode.INFORMATION_TITLE_EXISTS,
        ErrorMessage.INFORMATION_TITLE_EXISTS,
      );
    }

    const newInfo: Information = {
      ...data,
      ...(schedule_at
        ? { schedule_at: new Date(schedule_at), status: InformationStatus.SCHEDULED }
        : { status: InformationStatus.SENT }),
      created_by: req.user?.uid,
    };
    const docRef = await firebaseHelper.createDoc(informationUrl, newInfo);

    return responseSuccess(res, Message.INFO_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_CREATE_INFORMATION} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_INFORMATION,
      ErrorMessage.CANNOT_CREATE_INFORMATION,
    );
  }
};

export const getInformationList = async (req: AuthRequest, res: Response) => {
  try {
    const informationList: Information[] = await firebaseHelper.getAllDocs(informationUrl);
    if (!informationList.length) {
      return responseSuccess(res, Message.INFORMATION_LIST_EMPTY, []);
    }

    return responseSuccess(res, Message.GET_INFORMATION_LIST, { informationList });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_INFORMATION_LIST} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_INFORMATION_LIST,
      ErrorMessage.CANNOT_GET_INFORMATION_LIST,
    );
  }
};

export const getInformation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const information: Information = await firebaseHelper.getDocById(informationUrl, id);
    if (!information) {
      return responseError(
        res,
        StatusCode.INFORMATION_NOT_FOUND,
        ErrorMessage.INFORMATION_NOT_FOUND,
      );
    }

    if (req.user?.roles !== UserRole.MANAGER && information.target === InformationTarget.MANAGER) {
      return responseError(
        res,
        StatusCode.FORBIDDEN_INFORMATION,
        ErrorMessage.FORBIDDEN_INFORMATION,
      );
    }

    return responseSuccess(res, Message.GET_INFORMATION, { information });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_INFORMATION} | ${error}`);

    return responseError(
      res,
      StatusCode.CANNOT_GET_INFORMATION,
      ErrorMessage.CANNOT_GET_INFORMATION,
    );
  }
};
