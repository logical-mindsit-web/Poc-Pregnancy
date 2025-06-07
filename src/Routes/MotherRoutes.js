import express from "express";
import { registerMother, loginMother } from "../Controller/MotherController.js";

const router = express.Router();

router.post("/reg-mother", registerMother);
router.post("/motherlogin", loginMother);


export default router;
