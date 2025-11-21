import { Response, NextFunction } from 'express';
import { Collection, DayOfWeek, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { MenuItem, MenuSchedule } from '../interfaces/menu';
import { deleteImages, firebaseHelper, responseError, responseSuccess } from '../utils/index';
import logger from '../utils/logger';

const restaurantUrl = `${Sites.TOKYO}/${Collection.RESTAURANTS}`;
const getPaths = (restaurantId: string, dayId?: string) => {
  const menuPath = `${restaurantUrl}/${restaurantId}/${Collection.MENU_SCHEDULES}`;
  const itemPath = `${menuPath}/${dayId}/${Collection.ITEMS}`;

  return { menuPath, itemPath };
};

const getMenuSchedules = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { menuPath } = getPaths(restaurantId);

    const daysOrder = Object.values(DayOfWeek);
    const schedules: MenuSchedule[] = await Promise.all(
      daysOrder.map(async (dayId) => {
        const schedule = await firebaseHelper.getDocById(menuPath, dayId);
        if (!schedule) {
          logger.warn(ErrorMessage.MENU_SCHEDULE_NOT_FOUND + ` ID: ${dayId}`);

          return { id: dayId, message: ErrorMessage.MENU_SCHEDULE_NOT_FOUND };
        }

        const { itemPath } = getPaths(restaurantId, dayId);
        const items = await firebaseHelper.getAllDocs(itemPath);
        if (!items.length) {
          logger.warn(ErrorMessage.MENU_SCHEDULE_EMPTY + ` ID: ${dayId}`);

          return { ...schedule, message: ErrorMessage.MENU_SCHEDULE_EMPTY };
        }

        return { ...schedule, items };
      }),
    );

    return responseSuccess(res, Message.GET_MENU_SCHEDULES, { schedules });
  } catch (error) {
    logger.warn(ErrorMessage.GET_MENU_SCHEDULES + error);

    return responseError(res, StatusCode.GET_MENU_SCHEDULES, ErrorMessage.GET_MENU_SCHEDULES);
  }
};

const getMenuScheduleById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: dayId } = req.params;
    const { menuPath, itemPath } = getPaths(restaurantId, dayId);
    const schedule: MenuSchedule = await firebaseHelper.getDocById(menuPath, dayId);
    if (!schedule) {
      return responseError(
        res,
        StatusCode.MENU_SCHEDULE_NOT_FOUND,
        ErrorMessage.MENU_SCHEDULE_NOT_FOUND,
      );
    }

    const items: MenuItem[] = await firebaseHelper.getAllDocs(itemPath);
    if (!items.length) {
      return responseError(res, StatusCode.MENU_SCHEDULE_EMPTY, ErrorMessage.MENU_SCHEDULE_EMPTY);
    }
    schedule.items = items;

    return responseSuccess(res, Message.GET_MENU_SCHEDULES, { schedule });
  } catch (error) {
    logger.warn(ErrorMessage.GET_MENU_SCHEDULES + error);

    return responseError(res, StatusCode.GET_MENU_SCHEDULES, ErrorMessage.GET_MENU_SCHEDULES);
  }
};

const handleCreateMenuSchedule = async (
  restaurantId: string,
  schedule: MenuSchedule,
  uid?: string,
) => {
  const { id: dayId, items } = schedule;
  const { menuPath, itemPath } = getPaths(restaurantId, dayId);

  const dayExists = await firebaseHelper.getDocById(menuPath, dayId);
  if (!dayExists) {
    await firebaseHelper.createDoc(menuPath, {
      id: dayId,
      created_by: uid,
    });
  } else {
    logger.warn(ErrorMessage.MENU_SCHEDULE_DAY_EXISTS + ` ID: ${dayId}`);
  }

  const existingItems = await firebaseHelper.getAllDocs(itemPath);
  const existingNames = existingItems.map((i) => i.name.trim().toLowerCase());
  const newItems = items.filter(
    (item: MenuItem) => !existingNames.includes(item.name.trim().toLowerCase()),
  );
  if (newItems.length) {
    await firebaseHelper.createBatchDocs(itemPath, newItems);
    return { id: dayId, createdCount: newItems.length, status: 'created' };
  }
  logger.warn(ErrorMessage.MENU_ITEM_NAME_EXISTS + ` ID: ${dayId}`);

  return { id: dayId, createdCount: 0, status: 'skipped' };
};

const createMenuSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const uid = req.user?.uid;
    const schedules: MenuSchedule[] = req.body.schedules;

    const results = await Promise.all(
      schedules.map((schedule: MenuSchedule) =>
        handleCreateMenuSchedule(restaurantId, schedule, uid),
      ),
    );

    const created_ids = results
      .filter((result) => result.status === 'created')
      .map((result) => result.id);

    return responseSuccess(res, Message.MENU_SCHEDULE_CREATED, { created_ids });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_MENU_SCHEDULE + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_MENU_SCHEDULE,
      ErrorMessage.CANNOT_CREATE_MENU_SCHEDULE,
    );
  }
};

const addMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: dayId } = req.params;
    const { menuPath, itemPath } = getPaths(restaurantId, dayId);
    const schedule: MenuSchedule = await firebaseHelper.getDocById(menuPath, dayId);
    if (!schedule) {
      return responseError(
        res,
        StatusCode.MENU_SCHEDULE_NOT_FOUND,
        ErrorMessage.MENU_SCHEDULE_NOT_FOUND,
      );
    }

    const item: MenuItem = req.body;
    const existingItems = await firebaseHelper.getAllDocs(itemPath);
    const existingNames = existingItems.map((i) => i.name.trim().toLowerCase());
    if (existingNames.includes(item.name.trim().toLowerCase())) {
      return responseError(
        res,
        StatusCode.MENU_ITEM_NAME_EXISTS,
        ErrorMessage.MENU_ITEM_NAME_EXISTS,
      );
    }

    const files = req?.files as Express.Multer.File[];
    const newItem: MenuItem = {
      ...item,
      image_urls: files?.map((file) => file.path.replace(/\\/g, '/')) || [],
      created_by: req.user?.uid,
    };
    const docRef = await firebaseHelper.createDoc(itemPath, newItem);

    return responseSuccess(res, Message.MENU_ITEM_CREATED, {
      dayId,
      id: docRef.id,
      name: newItem.name,
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_MENU_ITEM + error);

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_MENU_ITEM,
      ErrorMessage.CANNOT_CREATE_MENU_ITEM,
    );
  }
};

const updateMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, id: dayId, itemId } = req.params;
    const { menuPath, itemPath } = getPaths(restaurantId, dayId);
    const schedule: MenuSchedule = await firebaseHelper.getDocById(menuPath, dayId);
    if (!schedule) {
      return responseError(
        res,
        StatusCode.MENU_SCHEDULE_NOT_FOUND,
        ErrorMessage.MENU_SCHEDULE_NOT_FOUND,
      );
    }

    const item: MenuItem = await firebaseHelper.getDocById(itemPath, itemId);
    if (!item) {
      return responseError(res, StatusCode.MENU_ITEM_NOT_FOUND, ErrorMessage.MENU_ITEM_NOT_FOUND);
    }

    const { name } = req.body;
    if (name) {
      const existingItems = await firebaseHelper.getAllDocs(itemPath);
      const existingNames = existingItems
        .filter((i) => i.id !== itemId)
        .map((i) => i.name.trim().toLowerCase());
      if (existingNames.includes(name.trim().toLowerCase())) {
        return responseError(
          res,
          StatusCode.MENU_ITEM_NAME_EXISTS,
          ErrorMessage.MENU_ITEM_NAME_EXISTS,
        );
      }
    }

    const files = req?.files as Express.Multer.File[];
    const imageUrls = files?.map((f) => f.path.replace(/\\/g, '/')) || [];
    if (imageUrls.length && item.image_urls?.length) {
      await deleteImages(item.image_urls);
    }

    const updatedItem: Partial<MenuItem> = {
      ...req.body,
      image_urls: imageUrls.length ? imageUrls : item.image_urls || [],
      updated_by: req.user?.uid,
    };
    await firebaseHelper.updateDoc(itemPath, itemId, updatedItem);

    return responseSuccess(res, Message.MENU_ITEM_UPDATED, {
      dayId,
      id: itemId,
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_MENU_ITEM + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_MENU_ITEM,
      ErrorMessage.CANNOT_UPDATE_MENU_ITEM,
    );
  }
};

export { getMenuScheduleById, getMenuSchedules, createMenuSchedule, addMenuItem, updateMenuItem };
