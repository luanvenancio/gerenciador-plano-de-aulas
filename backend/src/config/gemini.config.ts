import dotenv from "dotenv";
dotenv.config();

export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  projectId: process.env.GOOGLE_PROJECT_ID,
  location: process.env.GOOGLE_LOCATION || "us-central1",
  modelId: process.env.GEMINI_MODEL_ID || "gemini-1.5-flash-latest",
};
