import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

// --- FIX START ---
// 1. Use 'import.meta.env' instead of 'process.env'.
// 2. Use the correct, Vercel-stored variable name: VITE_GEMINI_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the GoogleGenAI client with the correct key
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null; 
// --- FIX END ---

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
    ? `Do NOT include these companies (duplicates): ${ignoreList.slice(-50).join(", ")}.` 
    : "";

  const prompt = `
    Find exactly ${batchSize} REAL, verified B2B leads for query: "${query}".
    This is batch #${batchIndex + 1}.
    ${exclusionText}
    
    CRITICAL INSTRUCTIONS:
    1. USE GOOGLE SEARCH to verify the existence of each company.
    2. Do NOT invent companies. If you cannot find ${batchSize} real ones, return as many as you found.
    3. For 'website', provide the REAL public URL.
    4. For 'contact', provide a REAL public email, phone number, or 'Contact Us' page URL.
    5. Find the company's official LinkedIn page URL.
    6. Find 1-2 top executives (CEO, Founder, MD) and their LinkedIn profiles if public.

    Return a JSON Array of objects.
    Structure:
    - company (string)
    - description (string)
    - location (string)
    - confidence (number, 90-100)
    - website (string)
    - contact (string)
    - industry (string)
    - employees (string)
    - socials (object: linkedin, twitter, facebook)
    - management (array of objects: name, role, linkedin)

    Output ONLY valid JSON.
  `;

  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await genAI.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }], // Enable Search Grounding
          temperature: 0.0, // Strict factual data
        },
      });

      let text = response.text;
      if (!text) throw new Error("Empty response from Gemini");

      // Clean up markdown code blocks
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
          text = text.substring(jsonStart, jsonEnd + 1);
      }

      let rawData: any[] = [];
      try {
          rawData = JSON.parse(text);
      } catch (e) {
          console.warn(`JSON Parse Error on attempt ${attempt + 1}`, e);
          throw new Error("Invalid JSON received");
      }
      
      // Add IDs and ensure data integrity
      const processedLeads = Array.isArray(rawData) ? rawData.map((l: any, i: number) => ({
        ...l,
        id: Date.now() + i + Math.random(), 
        confidence: l.confidence || 95, 
        industry: l.industry || "Unknown",
        website: l.website || "",
        contact: l.contact || "N/A",
        socials: l.socials || {},
        management: Array.isArray(l.management) ? l.management : []
      })) : [];

      return processedLeads;

    } catch (error: any) {
      console.warn(`Batch ${batchIndex + 1} attempt ${attempt + 1} failed:`, error.message);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        // Standard backoff: 2s, 4s, 8s
        let waitTime = Math.pow(2, attempt + 1) * 1000; 
        await delay(waitTime);
      }
    }
  }

  throw lastError || new Error("Failed after multiple retries");
};