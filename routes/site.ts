import express from "express";
import { createSite, getSites } from "../controllers/site";

const siteRouter = express.Router();
siteRouter.post("/create", createSite);
siteRouter.get("/", getSites);

export default siteRouter;
