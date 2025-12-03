import { Response } from 'express';
import {
  Collection,
  InformationPriority,
  InformationStatus,
  InformationTarget,
  Sites,
  UserRole,
} from '../constants/enum';
import { firebaseHelper, logger, responseError, responseSuccess, sendEmail } from '../utils/index';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { Information } from '../interfaces/notification';
import { User } from '../interfaces/user';

const informationCollection = `${Sites.TOKYO}/${Collection.INFORMATION}`;
const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;
export const createInformation = async (req: AuthRequest, res: Response) => {
  try {
    const { title, schedule_at, ...data } = req.body;
    const titleExists = await firebaseHelper.getDocByField(informationCollection, 'title', title);
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
      title,
      created_by: req.user?.uid,
    };
    const docRef = await firebaseHelper.createDoc(informationCollection, newInfo);

    if (newInfo.priority === InformationPriority.HIGH) await sendInformation(newInfo);

    return responseSuccess(res, Message.INFO_CREATED, { id: docRef.id });
  } catch (error: any) {
    logger.warn(`${ErrorMessage.CANNOT_CREATE_INFORMATION} | ${error}`);

    switch (error?.message) {
      case ErrorMessage.NO_RECIPIENT_EMAILS:
        return responseError(res, StatusCode.NO_RECIPIENT_EMAILS, ErrorMessage.NO_RECIPIENT_EMAILS);

      case ErrorMessage.SEND_INFORMATION_FAILED:
        return responseError(
          res,
          StatusCode.SEND_INFORMATION_FAILED,
          ErrorMessage.SEND_INFORMATION_FAILED,
        );

      default:
        return responseError(
          res,
          StatusCode.CANNOT_CREATE_INFORMATION,
          ErrorMessage.CANNOT_CREATE_INFORMATION,
        );
    }
  }
};

export const getInformationList = async (req: AuthRequest, res: Response) => {
  try {
    const informationList: Information[] = await firebaseHelper.getAllDocs(informationCollection);
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
    const information: Information = await firebaseHelper.getDocById(informationCollection, id);
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

export const sendInformation = async (info: Information) => {
  const users: User[] =
    info.target === InformationTarget.ALL
      ? await firebaseHelper.getAllDocs(userCollection)
      : await firebaseHelper.getDocsByFields(userCollection, [
          { field: 'roles', operator: '==', value: UserRole.MANAGER },
        ]);
  const recipients = users.map((user) => user.email).filter((email): email is string => !!email);
  if (!recipients.length) {
    throw new Error(ErrorMessage.NO_RECIPIENT_EMAILS);
  }

  const subject = `BuildingEco: ${info.title}`;
  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #d32f2f;">${info.title}</h2>
    <h2 style="color: #d32f2f;">${info.category}</h2>
    <p>${info.content}</p>
    <hr style="border:none; border-top:1px solid #eee;" />
    <p style="font-size: 0.9em; color:#777;">
      This is an automated notification from BuildingEco.
    </p>
  </div>
  `;

  try {
    await Promise.all(recipients.map((email) => sendEmail(email, subject, html)));
  } catch (error) {
    logger.error(`${ErrorMessage.SEND_INFORMATION_FAILED}' | ${error}`);

    throw new Error(ErrorMessage.SEND_INFORMATION_FAILED);
  }
};
