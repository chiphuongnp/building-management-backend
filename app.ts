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

dotenv.config();
const app: Application = express();
app.use(express.json());

app.use(`/${Collection.SITES}`, siteRouter);
app.use(`/${Sites.TOKYO}/${Collection.AUTH}`, authRouter);
app.use(`/${Sites.TOKYO}/${Collection.USERS}`, usersRoute);
app.use(`/${Sites.TOKYO}/${Collection.RESTAURANTS}`, restaurantRouter);
app.use(`/${Sites.TOKYO}/${Collection.RESTAURANTS}/:restaurantId/${Collection.DISHES}`, dishRouter);
app.use(`/${Sites.TOKYO}/${Collection.BUILDINGS}`, buildingRouter);
app.use(`/${Sites.TOKYO}/${Collection.PARKING_SPACES}`, parkingSpaceRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
