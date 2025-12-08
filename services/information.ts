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

    if (newInfo.priority === InformationPriority.HIGH) {
      const users: User[] =
        newInfo.target === InformationTarget.ALL
          ? await firebaseHelper.getAllDocs(userCollection)
          : await firebaseHelper.getDocsByFields(userCollection, [
              { field: 'role', operator: '==', value: UserRole.MANAGER },
            ]);
      if (!users.length)
        return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);

      await sendInformation(users, newInfo);
    }

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

    if (req.user?.role !== UserRole.MANAGER && information.target === InformationTarget.MANAGER) {
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

export const sendInformation = async (users: User[], info: Information) => {
  const recipients = users.map((user) => user.email).filter((email): email is string => !!email);
  if (!recipients.length) {
    throw new Error(ErrorMessage.NO_RECIPIENT_EMAILS);
  }

  const subject = `BuildingEco: ${info.title}`;
  const html = `
  <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px; color:#333;">
    <div style="max-width:600px; margin:0 auto; background:#fff; padding:20px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
      <h1 style="color:#d32f2f; margin-bottom:10px;">${info.title}</h1>
      <h3 style="color:#555; margin-top:0; margin-bottom:20px;">Category: ${info.category}</h3>
      <p style="line-height:1.6; margin-bottom:20px;">${info.content}</p>
      <hr style="border:none; border-top:1px solid #eee; margin-bottom:20px;" />
      <p style="font-size:0.85em; color:#777; margin:0;">
        This is an automated notification from <strong>BuildingEco</strong>.
      </p>
    </div>
  </div>
  `;

  try {
    await Promise.all(recipients.map((email) => sendEmail(email, subject, html)));
  } catch (error) {
    logger.error(`${ErrorMessage.SEND_INFORMATION_FAILED}' | ${error}`);

    throw new Error(ErrorMessage.SEND_INFORMATION_FAILED);
  }
};
