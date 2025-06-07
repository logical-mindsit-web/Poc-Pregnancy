import mongoose from "mongoose";

const ChatHistorySchema = new mongoose.Schema({
  motherId: {
    type: String,
    required: true,
    index: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  nextSteps: {
    type: [String],
    default: [],
  },
  urgency: {
    type: String,
    enum: ['Routine', 'Urgent', 'Emergency', 'Consult'],
    default: 'Routine',
  },
  recordDate: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const ChatHistory = mongoose.model("ChatHistory", ChatHistorySchema);
export default ChatHistory;
