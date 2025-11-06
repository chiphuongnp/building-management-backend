import { responseError, responseSuccess } from '../utils/error';
import { Response, NextFunction } from 'express';
import { Collection, Sites } from '../constants/enum';
import { AuthRequest } from '../interfaces/jwt';
import { firebaseHelper } from '../utils';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import logger from '../utils/logger';
import { Item, MenuSchedule } from '../interfaces/menu';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const handleCreateMenuSchedule = async (
  restaurantId: string,
  schedule: MenuSchedule,
  uid?: string,
) => {
  const { id: dayId, items } = schedule;
  const menuPath = `${restaurantUrl}/${restaurantId}/${Collection.MENU_SCHEDULES}`;
  const itemPath = `${menuPath}/${dayId}/${Collection.ITEMS}`;

  const dayExists = await firebaseHelper.getDocById(menuPath, dayId);
  if (!dayExists) {
    await firebaseHelper.createDoc(menuPath, {
      id: dayId,
      created_by: uid,
    });
  } else {
    logger.warn(ErrorMessage.MENU_SCHEDULE_DAY_EXISTS + ` Day: ${dayId}`);
  }

  const existingItems = await firebaseHelper.getAllDocs(itemPath);
  const existingNames = existingItems.map((i) => i.name.trim().toLowerCase());
  const newItems = items.filter(
    (item: Item) => !existingNames.includes(item.name.trim().toLowerCase()),
  );
  if (newItems.length) {
    await firebaseHelper.createBatchDocs(itemPath, newItems);
    return { id: dayId, createdCount: newItems.length, status: 'created' };
  }

  logger.warn(ErrorMessage.MENU_ITEM_NAME_EXISTS + ` Day: ${dayId}`);
  return { id: dayId, createdCount: 0, status: 'skipped' };
};

const createMenuSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const menuSchedules = req.body;
    const uid = req.user?.uid;

    const results = await Promise.all(
      menuSchedules.map((schedule: MenuSchedule) =>
        handleCreateMenuSchedule(restaurantId, schedule, uid),
      ),
    );
    const created_ids = results
      .filter((result) => result.status === 'created')
      .map((result) => result.id);

    if (created_ids.length) {
      return responseSuccess(res, Message.MENU_SCHEDULE_CREATED, { created_ids });
    } else {
      return responseError(
        res,
        StatusCode.MENU_SCHEDULE_DAY_EXISTS,
        ErrorMessage.MENU_SCHEDULE_DAY_EXISTS,
      );
    }
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_MENU_SCHEDULE + error);
    return responseError(
      res,
      StatusCode.CANNOT_CREATE_MENU_SCHEDULE,
      ErrorMessage.CANNOT_CREATE_MENU_SCHEDULE,
    );
  }
};

export { createMenuSchedule };
