import dotenv from 'dotenv';
import express, { Application } from 'express';
import { Collection, Sites } from './constants/enum';
import siteRouter from './routes/site';
import usersRoute from './routes/user';
import restaurantRouter from './routes/restaurant';
import buildingRouter from './routes/building';
import authRouter from './routes/auth';
import dishRouter from './routes/dish';
import parkingSpaceRouter from './routes/parkingSpace';
import menuRouter from './routes/menu';
import parkingSubscriptionRouter from './routes/parkingSubscription';
import permissionRouter from './routes/permission';
import logger from './utils/logger';
import facilityRouter from './routes/facility';
import busRouter from './routes/bus';
import orderRouter from './routes/order';
import facilityReservationRouter from './routes/facilityReservation';

dotenv.config();
const app: Application = express();
app.use(express.json());

app.use(`/${Collection.SITES}`, siteRouter);
app.use(`/${Sites.TOKYO}/${Collection.AUTH}`, authRouter);
app.use(`/${Sites.TOKYO}/${Collection.USERS}`, usersRoute);
app.use(`/${Sites.TOKYO}/${Collection.PERMISSIONS}`, permissionRouter);
app.use(`/${Sites.TOKYO}/${Collection.BUILDINGS}`, buildingRouter);
app.use(`/${Sites.TOKYO}/${Collection.FACILITIES}`, facilityRouter);
app.use(`/${Sites.TOKYO}/${Collection.FACILITY_RESERVATIONS}`, facilityReservationRouter);
app.use(`/${Sites.TOKYO}/${Collection.RESTAURANTS}`, restaurantRouter);
app.use(`/${Sites.TOKYO}/${Collection.BUSES}`, busRouter);
app.use(`/${Sites.TOKYO}/${Collection.RESTAURANTS}/:restaurantId/${Collection.DISHES}`, dishRouter);
app.use(
  `/${Sites.TOKYO}/${Collection.RESTAURANTS}/:restaurantId/${Collection.MENU_SCHEDULES}`,
  menuRouter,
);
app.use(
  `/${Sites.TOKYO}/${Collection.RESTAURANTS}/:restaurantId/${Collection.ORDERS}`,
  orderRouter,
);
app.use(`/${Sites.TOKYO}/${Collection.PARKING_SPACES}`, parkingSpaceRouter);
app.use(
  `/${Sites.TOKYO}/${Collection.PARKING_SPACES}/:parkingSpaceId/${Collection.PARKING_SUBSCRIPTIONS}`,
  parkingSubscriptionRouter,
);

const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
