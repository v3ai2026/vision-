/**
 * Environment Variables Validation
 * Ensures all required environment variables are present
 */

interface EnvConfig {
  // Gemini AI
  GEMINI_API_KEY: string;
  
  // Supabase
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  
  // Stripe
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_PRO_PRICE_ID?: string;
  STRIPE_ENTERPRISE_PRICE_ID?: string;
  
  // Backend API
  API_GATEWAY_URL?: string;
}

const getEnv = (): EnvConfig => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      '❌ GEMINI_API_KEY is not configured!\n\n' +
      'Please add VITE_GEMINI_API_KEY to your .env.local file:\n' +
      'VITE_GEMINI_API_KEY=your_api_key_here\n\n' +
      'Get your API key from: https://ai.google.dev'
    );
  }

  return {
    GEMINI_API_KEY: apiKey,
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    STRIPE_PRO_PRICE_ID: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    STRIPE_ENTERPRISE_PRICE_ID: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID,
    API_GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL,
  };
};

export const env = getEnv();
