import { Lead } from '../types.ts';
import { GEMINI_API_KEY } from '../config.ts';

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// Helper for exponential backoff during API calls
async function fetchWithBackoff(payload: any, maxRetries = 5): Promise<any> {
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE_FROM_VERCEL') {
        throw new Error("GEMINI API Key is missing. Please configure it in Vercel environment variables.");
    }
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429 && attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000;
                // console.log(`Rate limit hit, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`Gemini API error: ${response.status} - ${errorBody.error?.message || 'Unknown error'}`);
            }

            return await response.json();

        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
        }
    }
}

/**
 * Generates a batch of leads using the Gemini API based on a search query.
 * It uses Google Search Grounding for real-time, verifiable information.
 * @param query User's description of the ideal customer profile.
 * @param batchSize Number of leads to generate.
 * @param iteration Current batch iteration number.
 * @param existingCompanies Array of companies already found to prevent duplicates.
 * @returns A promise resolving to an array of Lead objects.
 */
export async function generateLeadsBatch(query: string, batchSize: number, iteration: number, existingCompanies: string[]): Promise<Lead[]> {
    const systemPrompt = `You are an expert B2B lead generation agent. Your task is to find and list ${batchSize} high-quality, real companies that strictly match the following Ideal Customer Profile (ICP). 
    You MUST use Google Search grounding to verify the existence and details of every company.
    Do NOT include any of the following companies: ${existingCompanies.join(', ')}.
    Your response MUST be a JSON array matching the provided schema, with no additional text or markdown formatting.`;

    const userQuery = `Find ${batchSize} companies that match the ICP: "${query}". Provide the company name, website, industry, and location. Ensure all information is current and verified via search.`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ google_search: {} }], // Enable Google Search grounding
        systemInstruction: { parts: [{ text: systemPrompt }] },
        config: {
            // Force JSON output
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        company: { type: "STRING", description: "The verified company name." },
                        website: { type: "STRING", description: "The official website URL (must include https:// or http://)." },
                        industry: { type: "STRING", description: "The primary industry (e.g., 'SaaS', 'Fintech', 'Logistics')." },
                        location: { type: "STRING", description: "The primary location/headquarters (City, State/Country)." }
                    },
                    required: ["company", "website", "industry", "location"]
                }
            }
        }
    };

    try {
        const result = await fetchWithBackoff(payload);
        
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!jsonText) {
            throw new Error("Gemini returned an invalid or empty response for lead generation.");
        }
        
        // The API returns the JSON as a string, which must be parsed.
        const generatedLeads: Partial<Lead>[] = JSON.parse(jsonText);
        
        return generatedLeads.map(lead => ({
            id: crypto.randomUUID(),
            score: 0, // Placeholder, calculated later
            email: 'N/A', // Placeholder, enriched later
            contactName: 'N/A', // Placeholder, enriched later
            phone: 'N/A', // Placeholder, enriched later
            ...lead,
        })) as Lead[];

    } catch (error) {
        console.error("Error generating leads:", error);
        throw new Error(`Failed to generate leads: ${(error as Error).message}`);
    }
}