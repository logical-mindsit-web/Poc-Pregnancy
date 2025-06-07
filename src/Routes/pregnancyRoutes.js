// routes/pregnancyRoutes.js
import express from "express";
import { createPregnancyRecord,predectlevel,saveAndPredict } from "../Controller/pregnancyController.js";

const router = express.Router();

router.post("/post-record", createPregnancyRecord);

router.post("/predict", predectlevel);

router.post("/save-and-predict", saveAndPredict);

export default router;
