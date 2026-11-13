import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SUPABASE_URL: z.union([z.string().url(), z.literal('')]).default(''),
  SUPABASE_ANON_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  DISPATCH_ENABLED: z.enum(['true', 'false']).default('true'),
  DISPATCH_INTERVAL_MS: z.coerce.number().int().min(5000).max(120000).default(10000),
  CAPTAIN_OFFER_TIMEOUT_SECONDS: z.coerce.number().int().min(15).max(300).default(35),
  POOL_WAIT_SECONDS: z.coerce.number().int().min(15).max(300).default(60),
  OSRM_BASE_URL: z.string().url().default('https://router.project-osrm.org'),
  NOMINATIM_BASE_URL: z.string().url().default('https://nominatim.openstreetmap.org'),
  NOMINATIM_USER_AGENT: z.string().min(8).default('MySawari/2.1 (configure-contact@example.com)'),
  NVIDIA_BASE_URL: z.string().url().default('https://integrate.api.nvidia.com/v1'),
  NVIDIA_API_KEY: z.string().default(''),
  NVIDIA_MODEL: z.string().default(''),
  FARE_BIKE_BASE: z.coerce.number().positive().default(25),
  FARE_SCOOTER_BASE: z.coerce.number().positive().default(30),
  FARE_CAR_BASE: z.coerce.number().positive().default(60),
  FARE_PER_KM: z.coerce.number().nonnegative().default(9),
  SURGE_CAP: z.coerce.number().min(1).max(2).default(1.5),
  LOCATION_STALE_SECONDS: z.coerce.number().int().positive().default(90)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration:\n${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')}`);
}

export const env = Object.freeze({
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  trustProxy: parsed.data.TRUST_PROXY === 'true',
  dispatchEnabled: parsed.data.DISPATCH_ENABLED === 'true',
  supabaseConfigured: Boolean(parsed.data.SUPABASE_URL && parsed.data.SUPABASE_ANON_KEY),
  supabaseAdminConfigured: Boolean(parsed.data.SUPABASE_URL && parsed.data.SUPABASE_SERVICE_ROLE_KEY)
});
