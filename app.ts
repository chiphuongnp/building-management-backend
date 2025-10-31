import dotenv from 'dotenv';
import express, { Application } from 'express';
import siteRouter from './routes/site';
import usersRoute from './routes/user';
import { Sites } from './constants/enum';

dotenv.config();
const app: Application = express();
app.use(express.json());

app.use(`/${Sites.NAME}`, siteRouter);
app.use(`/${Sites.TOKYO}/users`, usersRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
