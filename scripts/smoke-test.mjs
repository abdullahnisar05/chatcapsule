import { spawn } from 'node:child_process';
import process from 'node:process';

const port = 3199;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const server = spawn(npmCommand, ['run', 'start', '--', '-p', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: String(port) },
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

  if (!root.ok) throw new Error('/ returned HTTP ' + root.status);
  if (!demo.ok) throw new Error('/demo returned HTTP ' + demo.status);

  const [rootHtml, demoHtml] = await Promise.all([root.text(), demo.text()]);

  if (!rootHtml.includes('ChatCapsule')) {
    throw new Error('Root route is missing the ChatCapsule brand marker.');
  }

  if (!demoHtml.toLowerCase().includes('demo')) {
    throw new Error('Demo route is missing the demo marker.');
  }

  console.log('✓ / returns 200 and renders ChatCapsule');
  console.log('✓ /demo returns 200 and renders the demo marker');
} finally {
  server.kill('SIGTERM');
  await sleep(500);
  if (!server.killed) server.kill('SIGKILL');
  if (output.length && process.env.DEBUG_SMOKE === '1') {
    console.log(output.join(''));
  }
}
