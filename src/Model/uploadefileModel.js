import mongoose from "mongoose";

const FileRecordSchema = new mongoose.Schema({
  motherId: { type: String },
  filename: String,
  mimetype: String,
  originalname: String,
  decodedText: String,
  webhookResponse: mongoose.Schema.Types.Mixed,
  predictionResponse: mongoose.Schema.Types.Mixed,
  explanation: String,
  uploadWebhookResponse: mongoose.Schema.Types.Mixed,
  uploadedAt: { type: Date, default: Date.now },
});

const FileRecord = mongoose.model("FileRecord", FileRecordSchema);

export default FileRecord;
