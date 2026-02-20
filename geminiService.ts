
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { MEDICAL_SYSTEM_PROMPT } from "./constants.tsx";
import { VignetteQuestion, MedicalSubject, MedicalCase } from "./types.ts";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key) {
    console.warn("Missing API Key. Ensure GEMINI_API_KEY is set in environment.");
  }
  return key || "";
};

export const generateMedicalCase = async () => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Generate a realistic, high-complexity medical clinical case focusing on the 'Next Best Step in Management' logic.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          patientDemographics: { type: Type.STRING },
          chiefComplaint: { type: Type.STRING },
          history: { type: Type.STRING },
          vitals: {
            type: Type.OBJECT,
            properties: {
              bp: { type: Type.STRING },
              hr: { type: Type.STRING },
              rr: { type: Type.STRING },
              temp: { type: Type.STRING }
            },
            required: ["bp", "hr", "rr", "temp"]
          },
          physicalExam: { type: Type.STRING },
          initialLabs: { type: Type.STRING }
        },
        required: ["id", "title", "patientDemographics", "chiefComplaint", "history", "vitals", "physicalExam"]
      },
      systemInstruction: "You are a Chief Clinical Educator. Generate a structured clinical case study for USMLE Step 3 level students."
    }
  });

  return JSON.parse(response.text || "{}") as MedicalCase;
};

export const generateVignetteMCQ = async (subject: MedicalSubject, difficulty: string = 'Consultant') => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a ${difficulty}-level clinical vignette MCQ for ${subject}. 
    Follow the OnCourse AI Methodology strictly.
    The question should be extremely challenging, high-yield, and confusing, requiring senior-level clinical decision making.
    Include USMLE Step 2/3, NEET-PG, and INI-CET style integration.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          title: { type: Type.STRING },
          prompt: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answerIndex: { type: Type.NUMBER },
          socraticProbe: { type: Type.STRING },
          residencyDirectorLogic: { type: Type.STRING },
          distractorAnalysis: { type: Type.ARRAY, items: { type: Type.STRING } },
          conceptCluster: { type: Type.STRING },
          revisionPearl: { type: Type.STRING },
          synapsesLink: { type: Type.STRING },
          managementAlgorithm: { type: Type.STRING },
          sources: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                title: { type: Type.STRING }, 
                type: { type: Type.STRING } 
              } 
            } 
          }
        },
        required: ["id", "category", "title", "prompt", "options", "answerIndex", "socraticProbe", "residencyDirectorLogic", "distractorAnalysis", "conceptCluster", "revisionPearl"]
      },
      systemInstruction: MEDICAL_SYSTEM_PROMPT
    }
  });

  return JSON.parse(response.text || "{}") as VignetteQuestion;
};

export const createMedicalChat = (isThinking: boolean = false) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const model = isThinking ? "gemini-3.1-pro-preview" : "gemini-3.1-pro-preview";
  
  const config: any = {
    systemInstruction: MEDICAL_SYSTEM_PROMPT,
    temperature: 0.7
  };

  if (isThinking) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  return ai.chats.create({
    model: model,
    config: config
  });
};

export const analyzeMedicalImage = async (imageBase64: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        { text: prompt || "Provide a clinical description of this image, differential diagnosis, and the next best step in management according to USMLE and ERMP standards." }
      ]
    }
  });
  return result.text || "No analysis generated.";
};

export const searchGroundingQuery = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return result.text || "No search results found.";
};
