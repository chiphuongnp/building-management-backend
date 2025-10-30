import dotenv from "dotenv";
import express, { Application } from "express";
import siteRouter from "./routes/site";

dotenv.config();
const app: Application = express();
app.use(express.json());
app.use("/site", siteRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
