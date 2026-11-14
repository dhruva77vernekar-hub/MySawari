import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
const names = (await readdir(dir)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
const requiredNames = [
  '001_phase1_foundation.sql',
  '002_full_platform.sql',
  '003_dispatch_security_forecasting.sql',
  '004_pool_dispatch_and_model_forecasting.sql'
];
if (names.length < 4) throw new Error(`Expected at least four ordered migrations; found ${names.length}.`);
for (let index = 0; index < requiredNames.length; index += 1) {
  if (names[index] !== requiredNames[index]) throw new Error(`Unexpected migration order at position ${index + 1}: ${names[index]}`);
}
for (const migrationName of names) {
  const sql = await readFile(join(dir, migrationName), 'utf8');
  if (sql.trim().length < 50 || !sql.trim().endsWith(';')) throw new Error(`Migration may be truncated: ${migrationName}`);
  if (/\b(TODO|FIXME|REPLACE_ME)\b/i.test(sql)) throw new Error(`Unresolved marker found in ${migrationName}`);
}
const finalSql = await readFile(join(dir, requiredNames[3]), 'utf8');
for (const fn of ['allocate_pool', 'pool_ride_action', 'reassign_pool', 'close_singleton_pool', 'set_captain_verification']) {
  if (!finalSql.includes(`function public.${fn}(`)) throw new Error(`Required v3 database function missing: ${fn}`);
}
if (!finalSql.includes('model_metrics')) throw new Error('Forecast model metrics column is missing.');
console.log(`Migration structure check passed: ${names.join(', ')}`);
console.log('Required v3 pool-dispatch and forecasting database functions found.');
console.log('Note: this is a static file check, not a live PostgreSQL migration test.');
