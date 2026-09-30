import { spawn } from 'node:child_process';
import process from 'node:process';

const port = 3199;
const nextCommand = process.platform === 'win32'
  ? './node_modules/.bin/next.cmd'
  : './node_modules/.bin/next';

const server = spawn(nextCommand, ['start', '-p', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
});

const output = [];
server.stdout.on('data', (chunk) => output.push(String(chunk)));
server.stderr.on('data', (chunk) => output.push(String(chunk)));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await fetch(url);
    } catch {
      await sleep(500);
    }
  }

  throw new Error('Timed out waiting for the Next.js production server.');
}

try {
  const root = await fetchWithRetry('http://127.0.0.1:' + port + '/');
  const demo = await fetchWithRetry('http://127.0.0.1:' + port + '/demo');
  const engineering = await fetchWithRetry('http://127.0.0.1:' + port + '/engineering');

  if (!root.ok) throw new Error('/ returned HTTP ' + root.status);
  if (!demo.ok) throw new Error('/demo returned HTTP ' + demo.status);
  if (!engineering.ok) throw new Error('/engineering returned HTTP ' + engineering.status);

  const [rootHtml, demoHtml, engineeringHtml] = await Promise.all([root.text(), demo.text(), engineering.text()]);

  if (!rootHtml.includes('ChatCapsule')) {
    throw new Error('Root route is missing the ChatCapsule brand marker.');
  }

  if (!demoHtml.toLowerCase().includes('demo')) {
    throw new Error('Demo route is missing the demo marker.');
  }

  if (!engineeringHtml.toLowerCase().includes('engineering case study')) {
    throw new Error('Engineering route is missing the case study marker.');
  }

  console.log('✓ / returns 200 and renders ChatCapsule');
  console.log('✓ /demo returns 200 and renders the demo marker');
  console.log('✓ /engineering returns 200 and renders the case study marker');
} finally {
  if (!server.killed) {
    server.kill('SIGTERM');
  }

  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    sleep(2000),
  ]);

  if (server.exitCode === null) {
    server.kill('SIGKILL');
  }

  if (output.length && process.env.DEBUG_SMOKE === '1') {
    console.log(output.join(''));
  }
}
