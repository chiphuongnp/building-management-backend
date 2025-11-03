import dotenv from 'dotenv';
import express, { Application } from 'express';
import { Sites } from './constants/enum';
import siteRouter from './routes/site';
import usersRoute from './routes/user';
import restaurantRouter from './routes/restaurant';
import buildingRouter from './routes/building';
import authRouter from './routes/auth';
import dishRouter from './routes/dish';

dotenv.config();
const app: Application = express();
app.use(express.json());

app.use(`/${Sites.NAME}`, siteRouter);
app.use(`/${Sites.TOKYO}/users`, usersRoute);
app.use(`/${Sites.TOKYO}/restaurants`, restaurantRouter);
app.use(`/${Sites.TOKYO}/restaurants/:restaurantId/dishes`, dishRouter);
app.use(`/${Sites.TOKYO}/auth`, authRouter);
app.use(`/${Sites.TOKYO}/buildings`, buildingRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
