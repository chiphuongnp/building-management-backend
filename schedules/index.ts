import { Sites } from '../constants/enum';
import { startMenuItemsSync } from './menuCron';
import { startParkingExpiration } from './parkingCron';
import { startDailySalesJob } from './restaurantSaleCron';

export const initSchedules = (site: Sites) => {
  startMenuItemsSync(site);
  startParkingExpiration(site);
  startDailySalesJob(site);
};
