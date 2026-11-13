import { success } from '../utils/api-response.js';
import { env } from '../config/env.js';

export function getHealth(req, res) {
  return success(res, {
    service: 'mysawari-backend',
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    integrations: {
      supabaseConfigured: env.supabaseConfigured,
      databaseAdminConfigured: env.supabaseAdminConfigured,
      nvidiaConfigured: Boolean(env.NVIDIA_API_KEY && env.NVIDIA_MODEL),
      dispatchWorkerEnabled: env.dispatchEnabled && env.supabaseAdminConfigured
    }
  });
}
