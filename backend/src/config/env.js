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
  LOCATION_STALE_SECONDS: z.coerce.number().int().positive().default(90),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_TzfBO7UYhGdDs8'),
  RAZORPAY_KEY_SECRET: z.string().default('rzp_test_secret_placeholder'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('mysawari_webhook_secret_demo'),
  // Real SOS SMS & WhatsApp Configuration
  SOS_SMS_ENABLED: z.enum(['true', 'false']).default('true'),
  SOS_SMS_PROVIDER: z.string().default('MSG91'),
  SOS_SMS_AUTH_KEY: z.string().default('589861AXxH3gV5Dl6af79aacP1'),
  SOS_SMS_SENDER_ID: z.string().default('SAWARI'),
  SOS_SMS_FLOW_ID: z.string().default(''),
  WHATSAPP_ENABLED: z.enum(['true', 'false']).default('true'),
  WHATSAPP_PROVIDER: z.string().default('MSG91'),
  WHATSAPP_AUTH_KEY: z.string().default('589861AXxH3gV5Dl6af79aacP1'),
  WHATSAPP_INTEGRATED_NUMBER: z.string().default(''),
  WHATSAPP_TEMPLATE_NAME: z.string().default('sos_emergency_alert'),
  WHATSAPP_ACCESS_TOKEN: z.string().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(''),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().default('')
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
  supabaseAdminConfigured: Boolean(parsed.data.SUPABASE_URL && parsed.data.SUPABASE_SERVICE_ROLE_KEY),
  razorpayConfigured: Boolean(parsed.data.RAZORPAY_KEY_ID && parsed.data.RAZORPAY_KEY_SECRET && parsed.data.RAZORPAY_KEY_SECRET !== 'rzp_test_secret_placeholder'),
  sosSmsEnabled: parsed.data.SOS_SMS_ENABLED === 'true',
  whatsappEnabled: parsed.data.WHATSAPP_ENABLED === 'true',
  msg91Configured: Boolean(parsed.data.SOS_SMS_AUTH_KEY)
});
