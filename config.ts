// config.ts

// These placeholders are used if the environment variables are not set, 
// ensuring the code doesn't crash but alerts the developer.
const GEMINI_API_KEY_PLACEHOLDER = 'YOUR_GEMINI_API_KEY_HERE_FROM_VERCEL';
const APOLLO_API_KEY_PLACEHOLDER = 'YOUR_APOLLO_API_KEY_HERE_FROM_VERCEL';


// The build tool (like Vite/Webpack) will replace 'import.meta.env.VITE_...' 
// with the actual values set in the Vercel environment.

export const GEMINI_API_KEY = typeof import.meta.env !== 'undefined' 
    ? import.meta.env.VITE_GEMINI_API_KEY || GEMINI_API_KEY_PLACEHOLDER
    : GEMINI_API_KEY_PLACEHOLDER;

export const APOLLO_API_KEY = typeof import.meta.env !== 'undefined' 
    ? import.meta.env.VITE_APOLLO_API_KEY || APOLLO_API_KEY_PLACEHOLDER
    : APOLLO_API_KEY_PLACEHOLDER;

if (GEMINI_API_KEY === GEMINI_API_KEY_PLACEHOLDER) {
    console.error("ALERT: GEMINI_API_KEY is not configured. Remember to set VITE_GEMINI_API_KEY in your Vercel environment variables or .env file.");
}
if (APOLLO_API_KEY === APOLLO_API_KEY_PLACEHOLDER) {
    console.error("ALERT: APOLLO_API_KEY is not configured. Remember to set VITE_APOLLO_API_KEY in your Vercel environment variables or .env file.");
}

// Apollo service configuration
export const APOLLO_BASE_URL = 'https://api.apollo.io/v1';

