import cron from 'node-cron';
import { firebaseHelper, getDayOfWeek, getNormalizedDate, logger } from '../utils/index';
import { Collection, CronSchedule, Sites } from '../constants/enum';
import { TIMEZONE } from '../constants/constant';
import { MenuItem } from '../interfaces/menu';
import { Restaurant } from './../interfaces/restaurant';

const getPaths = (site: Sites, restaurantId?: string, dayId?: string) => {
  const restaurantUrl = `${site}/${Collection.RESTAURANTS}`;
  const menuPath = `${restaurantUrl}/${restaurantId}/${Collection.MENU_SCHEDULES}`;
  const itemPath = `${menuPath}/${dayId}/${Collection.ITEMS}`;
  const menuItemsPath = `${restaurantUrl}/${restaurantId}/${Collection.MENU_ITEMS}`;

  return { restaurantUrl, menuPath, itemPath, menuItemsPath };
};

const runMenuItemsSync = async (site: Sites) => {
  const dayOfWeek = getDayOfWeek(getNormalizedDate());
  logger.info(`[MenuCron] Syncing menu_items for ${dayOfWeek}!`);

  try {
    const { restaurantUrl } = getPaths(site);
    const restaurants: Restaurant[] = await firebaseHelper.getAllDocs(restaurantUrl);
    if (!restaurants.length) {
      logger.warn(`[MenuCron] No restaurants found in site ${site}!`);

      return;
    }

    await Promise.all(
      restaurants.map(async (restaurant: Restaurant) => {
        const restaurantName = restaurant.name;
        const restaurantId = restaurant.id;
        const { itemPath, menuItemsPath } = getPaths(site, restaurantId, dayOfWeek);
        try {
          const scheduledItems: MenuItem[] = await firebaseHelper.getAllDocs(itemPath);
          if (!scheduledItems.length) {
            return;
          }

          const oldItems: MenuItem[] = await firebaseHelper.getAllDocs(menuItemsPath);
          const existingNames = new Set(
            oldItems.map((item: MenuItem) => item.name.trim().toLowerCase()),
          );

          const newItems: MenuItem[] = scheduledItems.filter(
            (item: MenuItem) => !existingNames.has(item.name.trim().toLowerCase()),
          );
          if (newItems.length) {
            await firebaseHelper.createBatchDocs(menuItemsPath, newItems);
            logger.info(
              `[MenuCron] Success: ${newItems.length} new items for restaurant: ${restaurantName}.`,
            );
          }
        } catch (error) {
          logger.error(`[MenuCron] Failed for restaurant: ${restaurantName}: `, error);
        }
      }),
    );
  } catch (error) {
    logger.error(`[MenuCron] Critical failure for site ${site}: `, error);
  }
};

export const startMenuItemsSync = (site: Sites) => {
  cron.schedule(CronSchedule.MENU_ITEMS, () => runMenuItemsSync(site), {
    timezone: TIMEZONE,
  });
};
