import cron from 'node-cron';
import logger from '../utils/logger';
import { firebaseHelper, getNormalizedDate, getYesterday, normalizeName } from '../utils/index';
import { Collection, CronSchedule, Sites } from '../constants/enum';
import { TIMEZONE } from '../constants/constant';
import { Restaurant } from './../interfaces/restaurant';
import { Timestamp } from 'firebase-admin/firestore';
import { OrderDetail } from '../interfaces/order';

const getPaths = (site: Sites, restaurantId?: string) => {
  const restaurantUrl = `${site}/${Collection.RESTAURANTS}`;
  const dishSalePath = `${restaurantUrl}/${restaurantId}/${Collection.DISH_SALES}`;
  const detailPath = `${restaurantUrl}/${restaurantId}/${Collection.ORDER_DETAILS}`;

  return { restaurantUrl, dishSalePath, detailPath };
};

const runDishSalesJob = async (site: Sites) => {
  const startTime = getYesterday();
  const endTime = getNormalizedDate();
  const dateId = startTime.toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
  logger.info(`[DishSalesCron] Triggered for site ${site} | Date ID: ${dateId}`);

  try {
    const { restaurantUrl } = getPaths(site);
    const restaurants: Restaurant[] = await firebaseHelper.getAllDocs(restaurantUrl);
    if (!restaurants.length) {
      logger.warn(`[DishSalesCron] No restaurants found in site ${site}!`);

      return;
    }

    await Promise.all(
      restaurants.map(async (restaurant: Restaurant) => {
        const restaurantId = restaurant.id;
        const { detailPath, dishSalePath } = getPaths(site, restaurantId);
        try {
          const orderDetails: OrderDetail[] = await firebaseHelper.getDocsByFields(detailPath, [
            { field: 'created_at', operator: '>=', value: Timestamp.fromDate(startTime) },
            { field: 'created_at', operator: '<', value: Timestamp.fromDate(endTime) },
          ]);
          if (!orderDetails.length) {
            logger.info(`[DishSalesCron] No orders for restaurant ${restaurantId}!`);

            return;
          }

          const dishMap = orderDetails.reduce(
            (acc, detail) => {
              const key = normalizeName(detail.name);
              acc[key] = acc[key]
                ? {
                    name: detail.name,
                    totalQuantity: acc[key].totalQuantity + detail.quantity,
                    totalRevenue: acc[key].totalRevenue + detail.quantity * detail.price,
                  }
                : {
                    name: detail.name,
                    totalQuantity: detail.quantity,
                    totalRevenue: detail.quantity * detail.price,
                  };
              return acc;
            },
            {} as Record<string, { name: string; totalQuantity: number; totalRevenue: number }>,
          );

          const newItems = Object.values(dishMap).map((dish) => ({
            date_id: dateId,
            dish_name: dish.name,
            total_quantity: dish.totalQuantity,
            total_revenue: dish.totalRevenue,
            created_at: Timestamp.fromDate(new Date()),
          }));
          await firebaseHelper.createBatchDocs(dishSalePath, newItems);

          logger.info(
            `[DishSalesCron] Saved ${newItems.length} dish sales for restaurant ${restaurantId}`,
          );
        } catch (error) {
          logger.error(`[DishSalesCron] Failed for restaurant ID ${site}/${restaurantId}: `, error);
        }
      }),
    );
  } catch (error) {
    logger.error(`[DishSalesCron] Critical failure for site ${site}: `, error);
  }
};

export const startDishSalesJob = (site: Sites) => {
  cron.schedule(CronSchedule.DISH_SALES, () => runDishSalesJob(site), {
    timezone: TIMEZONE,
  });
};
