import { createApp } from './app.js';
import { config, validateConfig } from './config.js';
import { closePool, ping } from './db.js';

validateConfig();
const app = createApp();

const server = app.listen(config.port, config.host, async () => {
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 5_000;
  console.log('====================================================');
  console.log('  MAPAN API v0.1.0');
  console.log(`  http://${config.host}:${config.port}/api`);
  console.log(`  Database: ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.database}`);
  try {
    const info = await ping();
    console.log(`  MySQL ${info.version} tersambung (${info.latency_ms} ms)`);
  } catch (error) {
    console.error(`  GAGAL tersambung ke MySQL: ${error.message}`);
    console.error('  Nyalakan MySQL (MULAI.bat) lalu jalankan ulang server.');
  }
  console.log('====================================================');
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} diterima, menutup server...`);
  const forceClose = setTimeout(() => server.closeAllConnections(), 10_000);
  forceClose.unref();
  server.close(async () => {
    clearTimeout(forceClose);
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
