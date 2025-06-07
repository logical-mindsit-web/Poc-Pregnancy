import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/DB/db.js';
import cors from 'cors';

import MotherId from "./src/Routes/MotherRoutes.js"
import { verifyToken } from "./src/Middleware/authMiddleware.js";

import PregnancyRecord from './src/Routes/pregnancyRoutes.js';
import Chat from "./src/Routes/Chatbot.js"
import UploadFile from "./src/Routes/UploadefileRoutes.js"

const app = express();
const PORT =  process.env.PORT || 9000;

// Middleware 
app.use(cors());
app.use(express.json());
app.use(verifyToken);
dotenv.config();


//Routes
app.use('/', MotherId);
app.use('/', PregnancyRecord);
app.use('/', Chat);
app.use('/', UploadFile);

// Start the server
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
