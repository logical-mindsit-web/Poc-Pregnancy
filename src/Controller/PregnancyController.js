// controllers/pregnancyController.js
import PregnancyRecord from "../Model/PregnancyRecordModel.js";

import fetch from "node-fetch"; 

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const webhookUploadUrl = process.env.WEBHOOK_UPLOAD_URL;
const webhookRiskAlertUrl = process.env.WEBHOOK_RISK_ALERT_URL;
const fastApiUrl = process.env.FASTAPI_PREDICT_URL;

export const createPregnancyRecord = async (req, res) => {
  try {
    const motherId = req.motherId; 

   const record = new PregnancyRecord({
      ...req.body,
      motherId,
    });
    const saved = await record.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

//////////////////////////////////////////////////////////////////////////////

// pregnancyController.js
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

export const saveAndPredict = async (req, res) => {
  try {
    // Step 1: Validate motherId if saving to DB
    if (!req.motherId) {
      return res.status(400).json({
        success: false,
        message: "Mother ID missing in token.",
      });
    }

    // Step 2: Convert boolean values to "Yes"/"No"
    const convertedData = {};
    for (const [key, value] of Object.entries(req.body)) {
      convertedData[key] = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
    }

    // Step 3: Add motherId for saving (only in DB)
    convertedData.motherId = req.motherId;

    // Step 4: Prepare prediction data (exclude motherId)
    const { motherId, ...predictionData } = convertedData;

    // Step 5: Call FastAPI for risk prediction
    const fastApiResponse = await fetch(fastApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(predictionData),
    });

    if (!fastApiResponse.ok) {
      const errText = await fastApiResponse.text();
      return res.status(fastApiResponse.status).json({
        success: false,
        message: "FastAPI error",
        details: errText,
      });
    }

    const fastApiResult = await fastApiResponse.json();
    const riskLabel = fastApiResult?.risk_level || "Unknown";

    // Step 6: Build OpenAI prompt
    const promptWithContext = basePrompt
      .replaceAll("{risk}", riskLabel)
      .replace("{query}", JSON.stringify(predictionData, null, 2));

    // Step 7: Get explanation from OpenAI
    const openAIResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a medical assistant specialized in pregnancy risk evaluation." },
        { role: "user", content: promptWithContext },
      ],
      temperature: 0.7,
    });

    const explanation = openAIResponse.choices[0].message.content;

    // Step 8: Send webhook alerts
    const payload = {
      riskLabel,
      explanation,
      patientData: predictionData,
      motherId: req.motherId,
      source: "predict-api",
    };

    const webhookUrls = [webhookUploadUrl, webhookRiskAlertUrl];

    const webhookResponsesRaw = await Promise.all(
      webhookUrls
        .filter(Boolean)
        .map(url =>
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then(async res => ({
            status: res.status,
            ok: res.ok,
            body: await res.text(),
          })).catch(err => ({
            status: 500,
            ok: false,
            body: `Error: ${err.message}`,
          }))
        )
    );

    // Step 9: Save to MongoDB (excluding URL in webhookResponses)
    const record = new PregnancyRecord({
      ...convertedData,
      prediction: fastApiResult,
      explanation,
      webhookResponses: webhookResponsesRaw,
    });

    const savedRecord = await record.save();

    // Step 10: Respond to client
    return res.status(201).json({
      success: true,
      message: "Record saved, prediction completed, explanation generated",
      record: savedRecord,
      prediction: fastApiResult,
      explanation,
      webhookResponses: webhookResponsesRaw,
    });

  } catch (error) {
    console.error("Error in saveAndPredict:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { details: error.stack }),
    });
  }
};


//////////////////////////////////////////////////// 

export const predectlevel = async (req,res)=>{
  try {
    const input = req.body;
    
    if (!input || typeof input !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid input. Expected a JSON object.",
      });
    }
    // const fastApiUrl = process.env.FASTAPI_URL
    const fastApiUrl ="https://4287-157-20-251-15.ngrok-free.app/predict/";

    const response = await fetch(fastApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("FastAPI Error:", errorText);
      return res.status(response.status).json({
        success: false,
        message: "Error from FastAPI backend",
        details: errorText,
      });
    }

    const result = await response.json();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during prediction",
      error: error.message,
    });
  }
};