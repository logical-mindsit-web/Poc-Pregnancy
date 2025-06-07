import mongoose from "mongoose";

const PregnancyRecordSchema = new mongoose.Schema({
 motherId: { type: Number },

  AGE: Number,
  HEIGHT: Number,
  WEIGHT: Number,

  BLOOD_GRP: { 
    type: String, 
    enum: [' ', '-1', '-1.0', '0', '0.0', '1', '1.0', '2', '2.0', '3', '3.0', '4', '4.0', '5', '5.0', '6', '6.0', '7', '7.0', '8', '8.0', '9', '9.0'] 
  },

  HUSBAND_BLOOD_GROUP: { 
    type: String, 
    enum: ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0', '7.0', '8.0', '9.0', 'No'] 
  },

  GRAVIDA: { type: String, enum: ['G', 'G1', 'G10', 'G12', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9'] },
  PARITY: { type: String, enum: ['-1', 'P', 'P0', 'P00', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'] },
  ABORTIONS: { type: String, enum: ['A', 'A0', 'A00', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9'] },
  PREVIOUS_ABORTION: { type: String, enum: ['No', 'Yes'] },
  LIVE: { type: String, enum: ['L', 'L0', 'L00', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'P2'] },
  DEATH: { type: String, enum: ['-1', 'D', 'D0', 'D00', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'] },

  KNOWN_EPILEPTIC: Number,
  TWIN_PREGNANCY: { type: String, enum: ['No', 'Yes'] },
  GESTANTIONAL_DIA: { type: String, enum: ['0', 'No', 'Yes'] },
  CONVULSION_SEIZURES: Number,

  BP: Number,
  BP1: Number,
  HEMOGLOBIN: Number,
  PULSE_RATE: Number,
  RESPIRATORY_RATE: Number,
  HEART_RATE: Number,
  FEVER: Number,

  OEDEMA: { type: String, enum: ['No', 'Yes'] },
  OEDEMA_TYPE: { 
    type: String, 
    enum: [
      'No', 
      'Non-dependent oedema (Facial puffiness, abdominal oedema, vulval oedema)', 
      'Pedal Oedema'
    ] 
  },

  UTERUS_SIZE: Number,
  URINE_SUGAR: { type: String, enum: ['No', 'Yes'] },
  URINE_ALBUMIN: { type: String, enum: ['No', 'Yes'] },
  THYROID: { type: String, enum: ['No', 'Yes'] },
  RH_NEGATIVE: { type: String, enum: ['No', 'Yes'] },
  SYPHYLIS: { type: String, enum: ['No', 'Yes'] },
  HIV: { type: String, enum: ['No', 'Yes'] },
  HIV_RESULT: { type: String, enum: ['No', 'Yes'] },
  HEP_RESULT: { type: String, enum: ['Negative', 'Positive'] },

  BLOOD_SUGAR: Number,
  OGTT_2_HOURS: Number,

  WARNING_SIGNS_SYMPTOMS_HTN: {
    type: String,
    enum: ['Blurring of vision', 'Decreased urine output', 'Epigastric pain', 'Headache', 'No', 'Vomitting']
  },

  ANY_COMPLAINTS_BLEEDING_OR_ABNORMAL_DISCHARGE: {
    type: String,
    enum: ['Bleeding', 'No']
  },

  IFA_TABLET: { type: String, enum: [' ', 'No', 'YES', 'Yes'] },
  IFA_QUANTITY: Number,
  IRON_SUCROSE_INJ: { type: String, enum: ['No', 'Yes'] },
  CALCIUM: { type: String, enum: ['No', 'Yes'] },
  FOLIC_ACID: Number,

  SCREENED_FOR_MENTAL_HEALTH: { type: String, enum: ['No', 'Yes'] },
  PHQ_SCORE: Number,
  GAD_SCORE: Number,
  PHQ_ACTION: { type: String, enum: ['Give counselling', 'No', 'Psychiatrist for treatment'] },
  GAD_ACTION: { type: String, enum: ['Give counselling', 'No', 'Psychiatrist for treatment'] },

  ANC1FLG: { type: String, enum: ['No', 'Yes'] },
  ANC2FLG: { type: String, enum: ['No', 'Yes'] },
  ANC3FLG: { type: String, enum: ['No', 'Yes'] },
  ANC4FLG: { type: String, enum: ['No', 'Yes'] },

  MISSANC1FLG: { type: String, enum: ['No', 'Yes'] },
  MISSANC2FLG: { type: String, enum: ['No', 'Yes'] },
  MISSANC3FLG: { type: String, enum: ['No', 'Yes'] },
  MISSANC4FLG: { type: String, enum: ['No', 'Yes'] },

  NO_OF_WEEKS: Number,

  DELIVERY_MODE: {
    type: String,
    enum: ['-1', 'C- Section', 'C-Section', 'LSCS', 'Noraml', 'Normal']
  },

  PLACE_OF_DELIVERY: {
    type: String,
    enum: ['-1', 'C-Section', 'Govt', 'Home', 'Live', 'Other Govt', 'Other State', 'Private', 'Transit', 'govt']
  },

  IS_PREV_PREG: { type: String, enum: ['No', 'Private', 'Yes'] },
  CONSANGUINITY: { type: String, enum: ['No', 'Yes'] },
   prediction: {
    risk_level: String,
    confidence: Number,
    probabilities: {
      High: Number,
      Low: Number,
      Medium: Number,
    }
  },

  explanation: { type: String },

  webhookResponses: [
    {
      url: String,
      status: Number,
      ok: Boolean,
      body: String
    }
  ]
},
{ timestamps: true }
);


export default mongoose.model("PregnancyRecord", PregnancyRecordSchema);
