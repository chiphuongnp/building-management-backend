import { Sites } from '../constants/enum';
import { startEventExpiration } from './eventCron';
import { startMenuItemsSync } from './menuCron';
import { startParkingExpiration } from './parkingCron';
import { startDishSalesJob } from './restaurantDishCron';
import { startDailySalesJob } from './restaurantSaleCron';

export const initSchedules = (site: Sites) => {
  startMenuItemsSync(site);
  startParkingExpiration(site);
  startDailySalesJob(site);
  startDishSalesJob(site);
  startEventExpiration(site);
};
