import { OpenAI } from "openai";
import Mother from "../Model/MotherModel.js";
import PregnancyRecord from "../Model/PregnancyRecordModel.js";
import ChatHistory from "../Model/ChatHistoryModel.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Symptom urgency mapping
const SYMPTOM_URGENCY = {
  headache: {
    normal: "Routine",
    warning: (bp) => (bp > 140 ? "Urgent" : "Routine"),
  },
  bleeding: { normal: "Emergency" },
  fever: {
    normal: "Routine",
    warning: (fever) => (fever > 100.4 ? "Urgent" : "Monitor"),
  },
  pain: { normal: "Urgent" },
  vision: { normal: "Emergency" },
  discharge: { normal: "Urgent" },
  swelling: { normal: "Urgent" },
};

// Format field names for readability
const formatKey = (key) => {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Build comprehensive health context
const buildHealthContext = (mother, pregnancyRecord) => {
  if (!pregnancyRecord) return "No pregnancy records found";

  const record = pregnancyRecord.toObject();
  let context = "PATIENT HEALTH SUMMARY (Latest Record):\n\n";

  // Basic profile
  context += "👩 PERSONAL PROFILE:\n";
  context += `- Name: ${mother.name}\n`;
  context += `- Age: ${record.AGE || "Not recorded"} years\n`;
  context += `- Height: ${record.HEIGHT || "Not recorded"} cm\n`;
  context += `- Weight: ${record.WEIGHT || "Not recorded"} kg\n`;
  context += `- Blood Group: ${record.BLOOD_GRP || "Not recorded"}\n`;
  context += `- Husband's Blood Group: ${
    record.HUSBAND_BLOOD_GROUP || "Not recorded"
  }\n`;
  context += `- Gestation: ${record.NO_OF_WEEKS || "Unknown"} weeks\n\n`;

  // Pregnancy history
  context += "🤰 PREGNANCY HISTORY:\n";
  context += `- Gravida: ${record.GRAVIDA || "Not recorded"}\n`;
  context += `- Parity: ${record.PARITY || "Not recorded"}\n`;
  context += `- Abortions: ${record.ABORTIONS || "None recorded"}\n`;
  context += `- Live Births: ${record.LIVE || "None recorded"}\n`;
  context += `- Previous Abortion: ${record.PREVIOUS_ABORTION || "No"}\n`;
  context += `- Twin Pregnancy: ${record.TWIN_PREGNANCY || "No"}\n\n`;

  // Vital signs
  context += "❤️ VITAL SIGNS:\n";
  context += `- Blood Pressure: ${record.BP || "Not recorded"} mmHg\n`;
  context += `- Hemoglobin: ${record.HEMOGLOBIN || "Not recorded"} g/dL\n`;
  context += `- Blood Sugar: ${record.BLOOD_SUGAR || "Not recorded"} mg/dL\n`;
  context += `- Fever: ${record.FEVER || "Not recorded"} °F\n`;
  context += `- Pulse Rate: ${record.PULSE_RATE || "Not recorded"} bpm\n`;
  context += `- Respiratory Rate: ${
    record.RESPIRATORY_RATE || "Not recorded"
  } breaths/min\n\n`;

  // Health conditions
  context += "⚕️ HEALTH CONDITIONS:\n";
  context += `- Gestational Diabetes: ${record.GESTANTIONAL_DIA || "No"}\n`;
  context += `- Oedema: ${record.OEDEMA || "No"} (${
    record.OEDEMA_TYPE || "None"
  })\n`;
  context += `- Urine Albumin: ${record.URINE_ALBUMIN || "Not detected"}\n`;
  context += `- Thyroid Issues: ${record.THYROID || "No"}\n`;
  context += `- RH Negative: ${record.RH_NEGATIVE || "No"}\n`;
  context += `- HIV Status: ${record.HIV_RESULT || "Not tested"}\n`;
  context += `- Hepatitis Result: ${record.HEP_RESULT || "Not tested"}\n\n`;

  // Symptoms and warnings
  context += "⚠️ SYMPTOMS & WARNINGS:\n";
  if (record.WARNING_SIGNS_SYMPTOMS_HTN !== "No") {
    context += `- Current Symptom: ${record.WARNING_SIGNS_SYMPTOMS_HTN}\n`;
  }
  if (record.ANY_COMPLAINTS_BLEEDING_OR_ABNORMAL_DISCHARGE !== "No") {
    context += `- Abnormal Discharge: ${record.ANY_COMPLAINTS_BLEEDING_OR_ABNORMAL_DISCHARGE}\n`;
  }
  context += `- Known Epileptic: ${record.KNOWN_EPILEPTIC ? "Yes" : "No"}\n`;
  context += `- Convulsion/Seizures: ${
    record.CONVULSION_SEIZURES ? "Yes" : "No"
  }\n\n`;

  // Medications
  context += "💊 MEDICATIONS & SUPPLEMENTS:\n";
  context += `- IFA Tablets: ${record.IFA_TABLET || "None"} (${
    record.IFA_QUANTITY || 0
  } taken)\n`;
  context += `- Iron Sucrose Injection: ${record.IRON_SUCROSE_INJ || "No"}\n`;
  context += `- Calcium: ${record.CALCIUM || "No"}\n`;
  context += `- Folic Acid: ${record.FOLIC_ACID || "Not recorded"} mg\n\n`;

  // Mental health
  context += "🧠 MENTAL HEALTH:\n";
  if (record.SCREENED_FOR_MENTAL_HEALTH === "Yes") {
    context += `- PHQ Score: ${record.PHQ_SCORE || "Not recorded"}\n`;
    context += `- GAD Score: ${record.GAD_SCORE || "Not recorded"}\n`;
    context += `- Recommended Actions: ${record.PHQ_ACTION || "None"}, ${
      record.GAD_ACTION || "None"
    }\n`;
  } else {
    context += "- Not screened for mental health\n";
  }
  context += "\n";

  // Risk prediction
  if (record.prediction) {
    context += "🔮 RISK ASSESSMENT:\n";
    context += `- Risk Level: ${record.prediction.risk_level}\n`;
    context += `- Confidence: ${Math.round(
      record.prediction.confidence * 100
    )}%\n`;
    context += `- Explanation: ${
      record.explanation || "No detailed explanation"
    }\n\n`;
  }

  // ANC visits
  context += "📅 ANTENATAL CARE:\n";
  context += `- ANC Visits Completed: ${
    [record.ANC1FLG, record.ANC2FLG, record.ANC3FLG, record.ANC4FLG].filter(
      (v) => v === "Yes"
    ).length
  }/4\n`;
  context += `- Missed Visits: ${
    [
      record.MISSANC1FLG,
      record.MISSANC2FLG,
      record.MISSANC3FLG,
      record.MISSANC4FLG,
    ].filter((v) => v === "Yes").length
  }/4\n\n`;

  return context;
};

// Detect symptoms in question
const detectSymptom = (question) => {
  const symptoms = Object.keys(SYMPTOM_URGENCY);
  const normalized = question.toLowerCase();
  return symptoms.find((symptom) => normalized.includes(symptom));
};

// Get urgency level for symptom
const getUrgencyLevel = (symptom, records) => {
  const symptomConfig = SYMPTOM_URGENCY[symptom];
  if (!symptomConfig) return "Consult";

  if (symptomConfig.warning) {
    return symptomConfig.warning(records[symptom.toUpperCase()] || records.BP);
  }
  return symptomConfig.normal;
};

export const handleChat = async (req, res) => {
  try {
    const motherId = req.motherId;
    const { question } = req.body;

    // Validate input
    if (!question || typeof question !== "string" || question.length > 500) {
      return res.status(400).json({
        error: "Valid question required (1-500 characters)",
      });
    }

    // Fetch latest data
    const [mother, pregnancyRecord] = await Promise.all([
      Mother.findOne({ motherId }),
      PregnancyRecord.findOne({ motherId }).sort({ createdAt: -1 }).limit(1),
    ]);

    if (!mother) {
      return res.status(404).json({ error: "Mother not found" });
    }

    // Prepare comprehensive context
    const healthContext = buildHealthContext(mother, pregnancyRecord);
    const recordDate = pregnancyRecord?.createdAt
      ? new Date(pregnancyRecord.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString();

    // System prompt with trust elements
    const systemPrompt = `You are a friendly, knowledgeable pregnancy health assistant. Follow these guidelines:
    1. CONTEXT: ${healthContext}
    2. RESPONSE STYLE:
       - Use simple, warm language: "I see from your records..."
       - Emojis are welcome where appropriate 😊
       - Explain medical terms in plain language
    3. DATA HANDLING:
       - Answer directly about any health record values
       - Compare values to normal ranges when relevant
       - If data is missing, say "Your records don't show..."
    4. TRUST PRACTICES:
       - Reference records: "According to your latest checkup..."
       - Clarify limits: "This is based on your data from ${recordDate}"
       - Always remind: "Confirm with your healthcare provider"
    5. FOR SYMPTOMS: 
       - BP > 140 = Urgent
       - Fever > 100.4°F = Emergency
       - Headache + vision changes = Emergency
    6. OUTPUT JSON: {
         "answer": "Full friendly response",
         "nextSteps": ["Step 1", "Step 2"],
         "urgency": "Routine|Urgent|Emergency"
       }`;

    // Generate response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.3, // Slightly higher for friendliness
      max_tokens: 1200,
    });

    // Parse and validate response
    let response;
    try {
      response = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.error("JSON parse error:", e);
      return res.status(500).json({
        error: "Response format error",
        message: "Could not parse medical advice",
      });
    }

    // Add detected urgency for symptoms
    const detectedSymptom = detectSymptom(question);
    if (detectedSymptom) {
      response.urgency = getUrgencyLevel(
        detectedSymptom,
        pregnancyRecord || {}
      );
    }
    // Save conversation to DB
    await ChatHistory.create({
      motherId,
      question,
      answer: response.answer,
      nextSteps: response.nextSteps || [],
      urgency: response.urgency || "Routine",
      recordDate,
    });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Medical chat error:", error);
    const status = error.response?.status || 500;
    res.status(status).json({
      error: "Medical query processing failed",
      action: "Please contact support",
      reference: `ERR-${Date.now()}`,
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const motherId = req.motherId;
    const history = await ChatHistory.find({ motherId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve chat history" });
  }
};
