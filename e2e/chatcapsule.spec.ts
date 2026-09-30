import { test, expect } from '@playwright/test';
import JSZip from 'jszip';

async function createInstagramZip() {
  const zip = new JSZip();
  zip.file(
    'your_activity/inbox/alex_rivera/message_1.json',
    JSON.stringify({
      title: 'Alex Rivera',
      participants: [{ name: 'Alex Rivera' }, { name: 'Maya Chen' }],
      messages: [
        { sender_name: 'Maya Chen', timestamp_ms: 1750000000000, content: 'Hello from the browser test' },
        { sender_name: 'Alex Rivera', timestamp_ms: 1750000060000, content: 'The archive search should find this message' },
      ],
    }),
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

test('landing page exposes product and engineering paths', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('ChatCapsule').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /See the engineering/i })).toHaveAttribute('href', '/engineering');
  await page.getByRole('link', { name: /Explore the demo/i }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo archive')).toBeVisible();
});

test('demo supports in-chat search and result navigation', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Alex Rivera').first()).toBeVisible();
  await page.getByRole('button', { name: 'Search messages in this conversation' }).click();
  const search = page.getByRole('textbox', { name: 'Find in chat' });
  await search.fill('virtualized');
  await expect(page.getByRole('status').filter({ hasText: /1\// })).toBeVisible();
  await expect(page.getByText('Virtualized timelines for the win.')).toBeVisible();
});

test('real archive upload renders conversation and supports search', async ({ page }) => {
  const zipBuffer = await createInstagramZip();

  await page.goto('/app');
  const fileInput = page.locator('input[type="file"]').last();
  await fileInput.setInputFiles({
    name: 'instagram-export.zip',
    mimeType: 'application/zip',
    buffer: zipBuffer,
  });

  await expect(page.getByRole('heading', { name: 'Alex Rivera' }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Hello from the browser test')).toBeVisible();

  await page.getByRole('button', { name: 'Search messages in this conversation' }).click();
  const search = page.getByRole('textbox', { name: 'Find in chat' });
  await search.fill('browser test');
  await expect(page.getByRole('status').filter({ hasText: /1\// })).toBeVisible();
  await expect(page.getByText('Hello from the browser test')).toBeVisible();
});