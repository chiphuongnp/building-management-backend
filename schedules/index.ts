import { Sites } from '../constants/enum';
import { startMenuItemsSync } from './menuCron';
import { startParkingExpiration } from './parkingCron';

export const initSchedules = (site: Sites) => {
  startMenuItemsSync(site);
  startParkingExpiration(site);
};
