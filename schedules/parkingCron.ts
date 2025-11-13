import cron from 'node-cron';
import logger from '../utils/logger';
import { Collection, CronSchedule, ParkingSubscriptionStatus, Sites } from '../constants/enum';
import { firebaseHelper } from '../utils';
import { getAllDocs, updateDoc } from '../utils/firebaseHelper';
import { ParkingSpace } from '../interfaces/parkingSpace';
import { Timestamp } from 'firebase-admin/firestore';
import { getNormalizedDate } from '../utils/date';
import { TIMEZONE } from '../constants/constant';

const getPaths = (site: Sites, parkingSpaceId?: string) => {
  const parkingSpaceUrl = `${site}/${Collection.PARKING_SPACES}`;
  const subscriptionPath = `${parkingSpaceUrl}/${parkingSpaceId}/${Collection.PARKING_SUBSCRIPTIONS}`;
  return { parkingSpaceUrl, subscriptionPath };
};

const runParkingExpiration = async (site: Sites) => {
  const now = getNormalizedDate();
  logger.info(`[ParkingCron] Starting expiration check for site ${site}...`);

  try {
    const { parkingSpaceUrl } = getPaths(site);
    const spaces: ParkingSpace[] = await getAllDocs(parkingSpaceUrl);
    if (!spaces.length) {
      logger.info(`[ParkingCron] No parking spaces in site ${site}`);

      return;
    }

    let totalExpired = 0;
    const results = await Promise.all(
      spaces.map(async (space: ParkingSpace) => {
        const spaceId = space.id;
        const { subscriptionPath } = getPaths(site, spaceId);

        try {
          const expiredSubscriptions = await firebaseHelper.getDocsByFields(subscriptionPath, [
            { field: 'status', operator: '==', value: ParkingSubscriptionStatus.RESERVED },
            { field: 'end_time', operator: '<=', value: Timestamp.fromDate(now) },
          ]);
          if (!expiredSubscriptions.length) {
            return { spaceId, expired: expiredSubscriptions.length };
          }

          await Promise.all(
            expiredSubscriptions.map((sub) =>
              updateDoc(subscriptionPath, sub.id, {
                status: ParkingSubscriptionStatus.EXPIRED,
                updated_at: now,
              })
                .then(() => {
                  logger.info(
                    `[ParkingCron] Expired subscription ID ${sub.id} in space ID ${spaceId}!`,
                  );
                })
                .catch((err) => {
                  logger.error(`[ParkingCron] Failed to expire subscription ID ${sub.id}: `, err);
                }),
            ),
          );

          return { spaceId, expired: expiredSubscriptions.length };
        } catch (error) {
          logger.error(`[ParkingCron] Failed for space ID ${spaceId}: `, error);

          return {
            spaceId,
            expired: 0,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    totalExpired = results.reduce((sum, r) => sum + (r.expired ?? 0), 0);
    if (totalExpired) {
      logger.info(
        `[ParkingCron] SUCCESS: Expired ${totalExpired} subscriptions across ${results.length} spaces`,
      );
    } else {
      logger.info(`[ParkingCron] No subscriptions to expire`);
    }
  } catch (error) {
    logger.error('[ParkingCron] CRITICAL ERROR:', error);
  }
};

export const startParkingExpiration = (site: Sites) => {
  cron.schedule(CronSchedule.PARKING_EXPIRATION, () => runParkingExpiration(site), {
    timezone: TIMEZONE,
  });
};
