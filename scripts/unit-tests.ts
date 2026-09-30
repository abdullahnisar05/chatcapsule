import { strict as assert } from 'node:assert';
import { chatExportSchema } from '../src/lib/archive-schemas';
import { fixMessageEncoding, isSafeHttpUrl } from '../src/lib/utils';
import { searchEntries } from '../src/lib/search-index';

function test(name: string, fn: () => void): void {
  fn();
  console.log('✓ ' + name);
}

test('accepts a minimal Instagram archive shape', () => {
  const result = chatExportSchema.safeParse({
    title: 'Demo chat',
    participants: [{ name: 'Maya Chen' }, { name: 'Alex Rivera' }],
    messages: [{ sender_name: 'Maya Chen', timestamp_ms: 1_750_000_000_000, content: 'Hello' }],
  });

  assert.equal(result.success, true);
});

test('rejects malformed participant entries', () => {
  const result = chatExportSchema.safeParse({
    participants: [{ name: 123 }],
    messages: [],
  });

  assert.equal(result.success, false);
});

test('normalizes second-based timestamps without mutating the input', () => {
  const original = {
    sender_name: 'Maya Chen',
    timestamp_ms: 1_750_000_000,
    content: 'Hello',
    reply: { sender: 'Alex Rivera', timestamp: 1_750_000_100 },
  };

  const normalized = fixMessageEncoding(original);

  assert.equal(normalized.timestamp_ms, 1_750_000_000_000);
  assert.equal(normalized.reply.timestamp, 1_750_000_100_000);
  assert.equal(original.timestamp_ms, 1_750_000_000);
  assert.equal(original.reply.timestamp, 1_750_000_100);
  assert.notEqual(normalized, original);
});

test('normalizes second-based timestamps from the legacy timestamp field', () => {
  const normalized = fixMessageEncoding({
    sender_name: 'Maya Chen',
    timestamp: 1_750_000_000,
    content: 'Legacy timestamp',
  });

  assert.equal(normalized.timestamp_ms, 1_750_000_000_000);
});

test('accepts only HTTP(S) URLs', () => {
  assert.equal(isSafeHttpUrl('https://instagram.com/p/abc'), true);
  assert.equal(isSafeHttpUrl('http://example.com'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,hello'), false);
  assert.equal(isSafeHttpUrl('not a url'), false);
});

test('search is case-insensitive and returns matching message IDs', () => {
  const entries = [
    { id: 'm1', text: 'Meeting at 8 PM' },
    { id: 'm2', text: 'see you tomorrow' },
    { id: 'm3', text: 'MEETING moved to Friday' },
  ];

  assert.deepEqual(searchEntries(entries, 'meeting'), ['m1', 'm3']);
  assert.deepEqual(searchEntries(entries, '  TOMORROW  '), ['m2']);
  assert.deepEqual(searchEntries(entries, '   '), []);
});

console.log('All ChatCapsule unit tests passed.');
