import cron from 'node-cron';
import { firebaseHelper, logger } from '../utils/index';
import {
  Collection,
  CronSchedule,
  InformationStatus,
  InformationTarget,
  Sites,
  UserRole,
} from '../constants/enum';
import { TIMEZONE } from '../constants/constant';
import { Information } from '../interfaces/notification';
import { sendInformation } from '../services/information';
import { Timestamp } from 'firebase-admin/firestore';
import { User } from '../interfaces/user';

const getPaths = (site: Sites) => {
  const informationCollection = `${site}/${Collection.INFORMATION}`;
  const userCollection = `${site}/${Collection.USERS}`;

  return { informationCollection, userCollection };
};

const runInformationJob = async (site: Sites) => {
  logger.info(`[InfoCron] Triggered for site ${site}!`);

  try {
    const { informationCollection, userCollection } = getPaths(site);
    const informationList: Information[] = await firebaseHelper.getDocsByFields(
      informationCollection,
      [
        { field: 'status', operator: '==', value: InformationStatus.SCHEDULED },
        { field: 'schedule_at', operator: '<=', value: Timestamp.fromDate(new Date()) },
      ],
    );
    if (!informationList.length) {
      logger.warn(`[InfoCron] No scheduled information found in site ${site}!`);

      return;
    }

    let hasAll = false;
    let hasManager = false;
    for (const info of informationList) {
      if (info.target === InformationTarget.ALL) hasAll = true;

      if (info.target === InformationTarget.MANAGER) hasManager = true;

      if (hasAll && hasManager) break;
    }

    let users: User[] = [];
    let managers: User[] = [];
    switch (true) {
      case hasAll && hasManager:
        users = await firebaseHelper.getAllDocs(userCollection);
        if (!users.length) logger.warn(`[InfoCron] No users found in site ${site}!`);

        managers = await firebaseHelper.getDocsByFields(userCollection, [
          { field: 'roles', operator: '==', value: UserRole.MANAGER },
        ]);
        if (!managers.length) logger.warn(`[InfoCron] No managers found in site ${site}!`);

        break;

      case hasAll:
        users = await firebaseHelper.getAllDocs(userCollection);
        if (!users.length) logger.warn(`[InfoCron] No users found in site ${site}!`);

        break;

      case hasManager:
        managers = await firebaseHelper.getDocsByFields(userCollection, [
          { field: 'roles', operator: '==', value: UserRole.MANAGER },
        ]);
        if (!managers.length) logger.warn(`[InfoCron] No managers found in site ${site}!`);

        break;
    }

    await Promise.all(
      informationList.map(async (info) => {
        const infoId = info.id;

        try {
          info.target === InformationTarget.ALL
            ? await sendInformation(users, info)
            : await sendInformation(managers, info);

          await firebaseHelper.updateDoc(informationCollection, infoId, {
            status: InformationStatus.SENT,
          });
          logger.info(`[InfoCron] Sent information ID ${infoId} successfully.`);
        } catch (error) {
          logger.error(`[InfoCron] Failed to send information ID ${infoId}: `, error);
        }
      }),
    );
  } catch (error) {
    logger.error(`[InfoCron] Critical failure for site ${site}: `, error);
  }
};

export const startInformationJob = (site: Sites) => {
  cron.schedule(CronSchedule.INFORMATION, () => runInformationJob(site), {
    timezone: TIMEZONE,
  });
};
