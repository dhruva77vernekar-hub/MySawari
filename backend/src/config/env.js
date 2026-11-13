import dotenv from 'dotenv';
dotenv.config();

const requiredEnv = ['PORT'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`[WARN] Missing environment variable: ${key}, defaulting to fallback.`);
  }
}

export const env = {
  PORT: process.env.PORT || 4000,
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || '',
  NVIDIA_MODEL: process.env.NVIDIA_MODEL || '',
};
