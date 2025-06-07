import express from "express";
import multer from "multer";
import { uploadFile } from "../Controller/uploadeFilecontroller.js";

const router = express.Router();

// Multer setup
const upload = multer({ dest: "uploads/" });

// Upload route
router.post("/upload-test", upload.single("file"), uploadFile);

export default router;
