
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Lead, CompetitorAnalysis } from "../types";

const API_KEY = process.env.API_KEY;

// Fallback if key is missing to prevent crash on init
const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateLeadsBatch = async (
  query: string,
  batchSize: number,
  batchIndex: number,
  ignoreList: string[] = []
): Promise<Lead[]> => {
  if (!genAI) throw new Error("API Key is missing.");

  const modelId = "gemini-2.5-flash";

  // Construct exclusion text (limit to last 50 to save tokens)
  const exclusionText = ignoreList.length > 0 
    ? `Do NOT include these companies: ${ignoreList.slice(-50).join(", ")}.` 
    : "";

  const prompt = `
    ROLE: B2B Market Research Agent.
    TASK: Aggregate PUBLICLY AVAILABLE business contact details for ${batchSize} companies matching: "${query}".
    
    CONTEXT: Batch #${batchIndex + 1}. ${exclusionText}
    
    INSTRUCTIONS:
    1. SEARCH: Use Google Search to find real, active companies.
    2. PUBLIC DATA ONLY: Extract contact info (Phone, Email, Address) from public websites, directories, and social profiles.
    3. FORMAT: Return ONLY a JSON Array. Do not write "Here is the data".
    
    REQUIRED JSON STRUCTURE:
    [
      {
        "company": "string",
        "description": "string",
        "location": "City, Country",
        "googleMapsUrl": "string", 
        "confidence": number (0-100),
        "website": "string", 
        "contact": "Phone | Email",
        "industry": "string",
        "employees": "string", 
        "socials": { "linkedin": "", "instagram": "", "whatsapp": "", "facebook": "", "twitter": "" },
        "management": [{ "name": "string", "role": "string", "linkedin": "string" }]
      }
    ]
  `;

  // Increase retries to handle long pauses
  const maxRetries = 4;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await genAI.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "Output strictly valid JSON. No markdown.",
          temperature: 0.7,
          safetySettings: [
             { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
             { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
             { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
             { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        },
      });

      let text = response.text;
      if (!text) {
          console.warn(`Batch ${batchIndex} attempt ${attempt}: Empty text response`);
          throw new Error("Empty response from Gemini");
      }

      // CLEANUP: Aggressively remove markdown and conversational filler
      // 1. Remove markdown code blocks
      text = text.replace(/```json/gi, "").replace(/```/g, "");
      
      // 2. Find the JSON array
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1) {
          text = text.substring(firstBracket, lastBracket + 1);
      } else {
          // Fallback: Check for single object
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
             text = `[${text.substring(firstBrace, lastBrace + 1)}]`;
          } else {
             console.error("Invalid Response Format:", text.substring(0, 200));
             throw new Error("Model did not return a JSON array");
          }
      }

      let rawData: any[] = [];
      try {
          rawData = JSON.parse(text);
      } catch (e) {
          console.warn(`JSON Parse failed on attempt ${attempt + 1}. Trying cleanup.`);
          // Attempt to fix common trailing comma or unclosed array
          try {
             let cleanText = text.trim();
             if (cleanText.endsWith(',')) cleanText = cleanText.slice(0, -1);
             if (!cleanText.endsWith(']')) cleanText += ']';
             rawData = JSON.parse(cleanText);
          } catch (e2) {
             throw new Error("Invalid JSON syntax");
          }
      }
      
      if (!Array.isArray(rawData)) {
          throw new Error("Response was valid JSON but not an array");
      }

      // Process and validate
      const processedLeads = rawData.map((l: any, i: number) => ({
        ...l,
        id: Date.now() + i + Math.random(), 
        confidence: l.confidence || 85, 
        industry: l.industry || "Unknown",
        website: l.website || "",
        contact: l.contact || "N/A",
        socials: l.socials || {},
        management: Array.isArray(l.management) ? l.management : [],
        coordinates: null, // Geocoded by UI
        googleMapsUrl: l.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.company + " " + l.location)}`,
        status: 'new'
      }));

      return processedLeads;

    } catch (error: any) {
      console.warn(`Batch ${batchIndex + 1} attempt ${attempt + 1} error:`, error);
      lastError = error;
      
      // Check for rate limit error patterns (429 Resource Exhausted)
      const isRateLimit = 
        error.status === 429 || 
        error.code === 429 || 
        (error.message && error.message.includes('429')) ||
        (error.message && error.message.toLowerCase().includes('quota'));

      let waitTime = Math.pow(2, attempt) * 1000; 
      
      if (isRateLimit) {
         console.log("Quota exceeded. Cooling down for 65 seconds...");
         // Wait for quota reset (usually 1 minute window) plus buffer
         waitTime = 65000 + (Math.random() * 2000); 
      }

      if (attempt < maxRetries - 1) {
        await delay(waitTime);
      } else {
        if (isRateLimit) throw new Error("API Quota Reached. The system paused but could not recover. Please try again in a few minutes.");
      }
    }
  }

  console.error("Batch failed after retries:", lastError);
  return []; 
};

export const analyzeCompetitors = async (website: string): Promise<CompetitorAnalysis | null> => {
  if (!genAI) throw new Error("API Key is missing.");

  const prompt = `
    Analyze this company domain: "${website}".
    
    1. Identify Company Name, Industry, Summary.
    2. Search for 5-8 DIRECT COMPETITORS.
    3. Return strictly valid JSON.
    
    Structure:
    {
      "target": { "name": "...", "industry": "...", "summary": "..." },
      "competitors": [
        { 
          "name": "...", 
          "website": "...", 
          "description": "...", 
          "strength": "...", 
          "weakness": "...",
          "socials": { "linkedin": "", "twitter": "", "instagram": "", "facebook": "" }
        }
      ]
    }
  `;

  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a market researcher. Output strictly valid JSON.",
          temperature: 0.5,
          safetySettings: [
             { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
             { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
             { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
             { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        }
      });

      let text = response.text;
      if (!text) throw new Error("Empty response");

      text = text.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "").trim();
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(text);
      }
    } catch (error: any) {
      console.warn("Competitor analysis retry:", error);
      
      // Handle rate limits here too
      const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
      const waitTime = isRateLimit ? 65000 : 2000 * (attempt + 1);
      
      if (attempt < maxRetries - 1) await delay(waitTime);
    }
  }
  
  throw new Error("Analysis failed");
};

export const findLookalikes = async (website: string): Promise<Lead[]> => {
  if (!genAI) throw new Error("API Key is missing.");

  const prompt = `
    Find 20 "Lookalike" companies similar to: "${website}".
    Match Revenue Model, Tech Stack, and Customer Base.
    Verify they exist with Google Search.
    
    Output strictly valid JSON Array of Lead objects.
    Structure: [{ "company": "...", "description": "...", "location": "...", "website": "...", "contact": "...", "industry": "...", "employees": "...", "socials": {}, "management": [] }]
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Output JSON only.",
        temperature: 0.6,
        safetySettings: [
             { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
             { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
             { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
             { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      }
    });

    let text = response.text || "";
    text = text.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "").trim();
    
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      text = text.substring(firstBracket, lastBracket + 1);
      const rawData = JSON.parse(text);
      
      return rawData.map((l: any, i: number) => ({
        ...l,
        id: Date.now() + i,
        confidence: l.confidence || 85,
        status: 'new',
        socials: l.socials || {},
        management: l.management || []
      }));
    }
    return [];

  } catch (e) {
    console.error("Lookalike search failed", e);
    throw new Error("Failed to find lookalike audiences.");
  }
};
