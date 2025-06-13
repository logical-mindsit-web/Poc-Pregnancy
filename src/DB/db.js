import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const { MONGODB_URL } = process.env;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("MongoDB connected Successfully.");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};
export default connectDB;