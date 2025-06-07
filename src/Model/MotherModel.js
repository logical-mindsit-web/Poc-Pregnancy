import { Schema, model } from "mongoose";

const motherSchema = new Schema(
  {
    name: { type: String, required: true },
    motherId: {type:Number,required:true},
    email: { type: String, unique: true, sparse: true, required: true },
    mobilenumber: { type: String, unique: true, sparse: true, required: true },
    password: { type: String, required: true },
    conformpassword: { type: String, required: true },
  },
  { timestamps: true }
);

const Mother = model("Mother-data", motherSchema);
export default Mother;
