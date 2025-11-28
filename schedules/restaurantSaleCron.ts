import cron from 'node-cron';
import { firebaseHelper, getNormalizedDate, getYesterday, logger } from '../utils/index';
import { Collection, CronSchedule, Sites } from '../constants/enum';
import { TIMEZONE } from '../constants/constant';
import { Restaurant } from './../interfaces/restaurant';
import { Timestamp } from 'firebase-admin/firestore';
import { Order } from '../interfaces/order';

const getPaths = (site: Sites, restaurantId?: string) => {
  const restaurantUrl = `${site}/${Collection.RESTAURANTS}`;
  const dailySalePath = `${restaurantUrl}/${restaurantId}/${Collection.DAILY_SALES}`;
  const orderPath = `${restaurantUrl}/${restaurantId}/${Collection.ORDERS}`;

  return { restaurantUrl, dailySalePath, orderPath };
};

const runDailySalesJob = async (site: Sites) => {
  const startTime = getYesterday();
  const endTime = getNormalizedDate();
  const dailySaleId = startTime.toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
  logger.info(
    `[RestaurantSaleCron] Cron triggered for site ${site} | Daily Sale ID: ${dailySaleId}`,
  );

  try {
    const { restaurantUrl } = getPaths(site);
    const restaurants: Restaurant[] = await firebaseHelper.getAllDocs(restaurantUrl);

    if (!restaurants.length) {
      logger.warn(`[RestaurantSaleCron] No restaurants found in site ${site}!`);

      return;
    }

    await Promise.all(
      restaurants.map(async (restaurant: Restaurant) => {
        const restaurantId = restaurant.id;
        const { dailySalePath, orderPath } = getPaths(site, restaurantId);
        try {
          const orders: Order[] = await firebaseHelper.getDocsByFields(orderPath, [
            { field: 'created_at', operator: '>=', value: Timestamp.fromDate(startTime) },
            { field: 'created_at', operator: '<', value: Timestamp.fromDate(endTime) },
          ]);
          if (!orders.length) {
            logger.info(`[RestaurantSaleCron] No orders for restaurant ${restaurantId}!`);
            return;
          }

          const { totalRevenue, totalVatCharge } = orders.reduce(
            (acc, order) => ({
              totalRevenue: acc.totalRevenue + order.total_amount,
              totalVatCharge: acc.totalVatCharge + order.vat_charge,
            }),
            { totalRevenue: 0, totalVatCharge: 0 },
          );

          await firebaseHelper.createDoc(dailySalePath, {
            id: dailySaleId,
            total_orders: orders.length,
            total_revenue: totalRevenue,
            total_vat_charge: totalVatCharge,
          });

          logger.info(
            `[RestaurantSaleCron] Saved daily sales for restaurant ${restaurantId}: ${totalRevenue}`,
          );
        } catch (error) {
          logger.error(
            `[RestaurantSaleCron] Failed for restaurant ID ${site}/${restaurantId}: `,
            error,
          );
        }
      }),
    );
  } catch (error) {
    logger.error(`[RestaurantSaleCron] Critical failure for site ${site}: `, error);
  }
};

export const startDailySalesJob = (site: Sites) => {
  cron.schedule(CronSchedule.DAILY_SALES, () => runDailySalesJob(site), {
    timezone: TIMEZONE,
  });
};
