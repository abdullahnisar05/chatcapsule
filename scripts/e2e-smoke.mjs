import { chromium } from 'playwright';
import JSZip from 'jszip';
import { spawn } from 'node:child_process';

const port = 4174;
const baseUrl = 'http://127.0.0.1:' + port;

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl + '/');
      if (response.ok) return;
    } catch {}
    await wait(500);
  }
  throw new Error('Next.js server did not start in time.');
}

async function createFixture() {
  const zip = new JSZip();
  zip.file(
    'your_activity/inbox/alex_rivera/message_1.json',
    JSON.stringify({
      title: 'Alex Rivera',
      participants: [{ name: 'Alex Rivera' }, { name: 'Maya Chen' }],
      messages: [
        { sender_name: 'Maya Chen', timestamp_ms: 1750000000000, content: 'Hello from the browser test.' },
        { sender_name: 'Alex Rivera', timestamp_ms: 1750000001000, content: 'Deployment meeting is tomorrow.' },
        { sender_name: 'Maya Chen', timestamp_ms: 1750000002000, content: 'Perfect, see you then.' },
      ],
    }),
  );
  return zip.generateAsync({ type: 'uint8array' });
}

const server = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start', '--', '-p', String(port)], {
  stdio: 'ignore',
  shell: false,
});

try {
  await waitForServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

  await page.goto(baseUrl + '/demo', { waitUntil: 'networkidle' });
  await page.getByText('Demo archive', { exact: false }).waitFor();

  await page.goto(baseUrl + '/engineering', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'A private archive viewer built for the browser.' }).waitFor();

  const archive = await createFixture();
  await page.goto(baseUrl + '/app', { waitUntil: 'networkidle' });
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'instagram-export.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from(archive),
  });

  await page.getByRole('heading', { name: 'Alex Rivera' }).waitFor();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export conversation as text' }).click();
  const download = await downloadPromise;
  if (download.suggestedFilename() !== 'Alex Rivera-chatcapsule.txt') {
    throw new Error('Unexpected export filename: ' + download.suggestedFilename());
  }

  await page.getByText('Conversation exported as a text file.').waitFor();
  await page.getByRole('button', { name: 'Search messages in this conversation' }).click();
  await page.getByRole('textbox', { name: 'Find in chat' }).fill('deployment');
  await page.getByRole('status').filter({ hasText: '1/1' }).waitFor();
  await page.getByText('Deployment meeting is tomorrow.').waitFor();

    console.log('✓ browser e2e flow passed');
  } finally {
    await browser?.close();
  }
} finally {
  server.kill('SIGTERM');
}