import cron from 'node-cron';
import {
  firebaseHelper,
  getLastMonth,
  getNormalizedDate,
  getRankFromAmount,
  logger,
} from '../utils/index';
import { Collection, CronSchedule, PaymentStatus, Sites } from '../constants/enum';
import { TIMEZONE } from '../constants/constant';
import { User } from '../interfaces/user';
import { Payment } from '../interfaces/payment';
import { Timestamp } from 'firebase-admin/firestore';

const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;
const paymentCollection = `${Sites.TOKYO}/${Collection.PAYMENTS}`;
const runUserRankJob = async (site: Sites) => {
  const startTime = getLastMonth();
  const endTime = getNormalizedDate();

  try {
    const users: User[] = await firebaseHelper.getAllDocs(userCollection);
    if (!users.length) {
      logger.warn(`[UserRankCron] No users found in site ${site}!`);

      return;
    }

    await Promise.all(
      users.map(async (user: User) => {
        const userId = user.id;

        try {
          const payments: Payment[] = await firebaseHelper.getDocsByFields(paymentCollection, [
            { field: 'transaction_time', operator: '>=', value: Timestamp.fromDate(startTime) },
            { field: 'transaction_time', operator: '<', value: Timestamp.fromDate(endTime) },
            { field: 'status', operator: '==', value: PaymentStatus.SUCCESS },
            { field: 'user_id', operator: '==', value: userId },
          ]);
          if (!payments.length) {
            logger.info(`[UserRankCron] No payments for user ID ${userId}!`);

            return;
          }

          const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const newRank = getRankFromAmount(totalAmount);
          await firebaseHelper.updateDoc(userCollection, userId, {
            rank: newRank,
          });

          logger.info(`[UserRankCron] Updated rank for user ID ${userId}: ${newRank}`);
        } catch (error) {
          logger.error(`[UserRankCron] Failed for update rank User Id: ${userId}`, error);
        }
      }),
    );
  } catch (error) {
    logger.error(`[UserRankCron] Critical failure for site ${site}: `, error);
  }
};

export const startUserRankJob = (site: Sites) => {
  cron.schedule(CronSchedule.USER_RANK, () => runUserRankJob(site), {
    timezone: TIMEZONE,
  });
};
