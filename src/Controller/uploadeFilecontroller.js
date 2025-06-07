import fs from "fs";
import axios from "axios";
import Tesseract from "tesseract.js";
import FileRecord from "../Model/uploadefileModel.js";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { OpenAI } from "openai";

const { getDocument } = pdfjsLib;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const extractPdfText = async (filePath) => {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdfDocument = await getDocument({ data }).promise;

    let textContent = "";

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      textContent += strings.join(" ") + "\n";
    }

    return textContent;
  } catch (error) {
    console.error("PDF extraction failed:", error);
    return "Error extracting PDF text";
  }
};

const basePrompt = `
You are a medical data assistant. Use only the provided context below to answer the question.
Do not use external knowledge or make assumptions.

Context:
Risk classification result: {risk}

Question:
Explain why the patient's pregnancy is classified as {risk} risk based on their characteristics below. Focus only on clinical reasoning and avoid general statements.

Patient characteristics:
{query}

Response must be in two parts, separated by the line '---':
1. First part: Output a single word only — one of: Low, Medium, or High.
2. Second part: Provide a clear, clinical justification for classifying the pregnancy as {risk} risk.

Format:
Low/Medium/High
---
Detailed explanation here...
`;

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const motherId = req.motherId;
    if (!motherId)
      return res
        .status(401)
        .json({ error: "Unauthorized: motherId missing in token" });

    let decodedText = "";

    if (file.mimetype === "application/pdf") {
      try {
        decodedText = await extractPdfText(file.path);
      } catch (pdfErr) {
        console.error("PDF parse error:", pdfErr);
        decodedText = "Error extracting PDF text";
      }
    } else if (file.mimetype.startsWith("image/")) {
      try {
        const result = await Tesseract.recognize(file.path, "eng");
        decodedText = result.data.text;
      } catch (ocrErr) {
        console.error("OCR error:", ocrErr);
        decodedText = "Error extracting text from image";
      }
    } else {
      decodedText = "Unsupported file type for decoding.";
    }

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    let webhookResponse;
    try {
      const webhookRes = await axios.post(
        process.env.WEBHOOK_PARSE_URL,
        {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          decodedText,
        }
      );
      webhookResponse = webhookRes.data;
    } catch (webhookErr) {
      console.error("Webhook POST failed:", webhookErr);
      webhookResponse = { error: "Webhook call failed" };
    }

    let predictionResponse;
    try {
      const predictionRes = await axios.post(
        process.env.FASTAPI_PREDICT_URL,
        webhookResponse
      );
      predictionResponse = predictionRes.data;
    } catch (predictErr) {
      console.error("FastAPI Prediction failed:", predictErr);
      predictionResponse = {
        error: "Prediction failed",
        details: predictErr.message,
      };
    }

    let explanation = "";
    if (predictionResponse?.risk_level && webhookResponse) {
      const riskLabel = predictionResponse.risk_level;
      const patientData = JSON.stringify(webhookResponse, null, 2);

      const promptWithContext = basePrompt
        .replaceAll("{risk}", riskLabel)
        .replaceAll("{query}", patientData);

      try {
        const openAIResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a medical assistant specialized in pregnancy risk evaluation.",
            },
            { role: "user", content: promptWithContext },
          ],
          temperature: 0.7,
        });

        explanation = openAIResponse.choices[0].message.content.trim();
      } catch (openAIErr) {
        console.error("OpenAI call failed:", openAIErr);
        explanation = "Error generating explanation.";
      }
    } else {
      explanation =
        "Prediction data missing or incomplete, explanation not generated.";
    }

    let uploadWebhookResponse;
    try {
      const uploadWebhookRes = await axios.post(
        process.env.WEBHOOK_UPLOAD_URL,
        {
          motherId,
          filename: file.filename,
          originalname: file.originalname,
          webhookResponse,
          predictionResponse,
          explanation,
        }
      );
      uploadWebhookResponse = uploadWebhookRes.data;

      // Send alert after successful upload webhook
      if (predictionResponse?.risk_level) {
        await axios.post(process.env.WEBHOOK_RISK_ALERT_URL, {
          motherId,
          risk_level: predictionResponse.risk_level,
          patientName: webhookResponse?.name || "Unknown",
          alertMessage: `Risk level identified: ${predictionResponse.risk_level}`,
        });
      }
    } catch (uploadWebhookErr) {
      console.error("Upload webhook call failed:", uploadWebhookErr);
      uploadWebhookResponse = { error: "Upload webhook call failed" };
    }

    // Save to MongoDB including decodedText
    const fileRecord = new FileRecord({
      motherId,
      filename: file.filename,
      mimetype: file.mimetype,
      originalname: file.originalname,
      decodedText,
      webhookResponse,
      predictionResponse,
      explanation,
      uploadWebhookResponse,
    });
    await fileRecord.save();

    // Send to client including decodedText
    return res.json({
      message:
        "File uploaded, decoded, parsed, predicted, explained, and webhook notified",
      fileRecord,
      decodedText,
      webhookResponse,
      predictionResponse,
      explanation,
      uploadWebhookResponse,
    });
  } catch (error) {
    console.error("Upload error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: "File upload failed" });
  }
};
