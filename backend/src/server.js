import { app } from './app.js';
import { env } from './config/env.js';
import { startDispatchWorker, stopDispatchWorker } from './jobs/dispatch.worker.js';

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`MySawari API listening on http://${env.HOST}:${env.PORT}`);
  console.log(`Supabase configured: ${env.supabaseConfigured}; admin operations configured: ${env.supabaseAdminConfigured}`);
  startDispatchWorker();
});

function shutdown(signal) {
  console.log(`${signal} received. Closing HTTP server...`);
  stopDispatchWorker();
  server.close((error) => {
    if (error) {
      console.error('Graceful shutdown failed:', error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
