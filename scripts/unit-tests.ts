import { chatExportSchema } from '../src/lib/archive-schemas';
import { fixMessageEncoding, isSafeHttpUrl } from '../src/lib/utils';
import { searchEntries } from '../src/lib/search-index';
import JSZip from 'jszip';
import { buildChatIndex } from '../src/lib/archive-reader';
import { loadChatMessages } from '../src/lib/message-loader';

type Check = () => void;

const equal = (actual: unknown, expected: unknown, label: string) => {
  if (actual !== expected) throw new Error(label + ': expected ' + String(expected) + ', received ' + String(actual));
};

const notEqual = (actual: unknown, expected: unknown, label: string) => {
  if (actual === expected) throw new Error(label + ': values should differ');
};

const deepEqual = (actual: unknown, expected: unknown, label: string) => {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(label + ': expected ' + expectedJson + ', received ' + actualJson);
  }
};

function test(name: string, fn: Check): void {
  fn();
  console.log('✓ ' + name);
}

const pendingTests: Promise<void>[] = [];

function testAsync(name: string, fn: () => Promise<void>): void {
  pendingTests.push(fn().then(() => console.log('✓ ' + name)));
}

test('accepts a minimal Instagram archive shape', () => {
  const result = chatExportSchema.safeParse({
    title: 'Demo chat',
    participants: [{ name: 'Maya Chen' }, { name: 'Alex Rivera' }],
    messages: [{ sender_name: 'Maya Chen', timestamp_ms: 1_750_000_000_000, content: 'Hello' }],
  });

  equal(result.success, true, 'schema should accept a valid archive');
});

test('rejects malformed participant entries', () => {
  const result = chatExportSchema.safeParse({
    participants: [{ name: 123 }],
    messages: [],
  });

  equal(result.success, false, 'schema should reject malformed participants');
});

test('normalizes second-based timestamps without mutating the input', () => {
  const original = {
    sender_name: 'Maya Chen',
    timestamp_ms: 1_750_000_000,
    content: 'Hello',
    reply: { sender: 'Alex Rivera', timestamp: 1_750_000_100 },
  };

  const normalized = fixMessageEncoding(original);

  equal(normalized.timestamp_ms, 1_750_000_000_000, 'message timestamp should normalize to milliseconds');
  equal(normalized.reply.timestamp, 1_750_000_100_000, 'reply timestamp should normalize to milliseconds');
  equal(original.timestamp_ms, 1_750_000_000, 'input message timestamp must not change');
  equal(original.reply.timestamp, 1_750_000_100, 'input reply timestamp must not change');
  notEqual(normalized, original, 'normalization should return a new object');
});

test('normalizes second-based timestamps from the legacy timestamp field', () => {
  const normalized = fixMessageEncoding({
    sender_name: 'Maya Chen',
    timestamp: 1_750_000_000,
    content: 'Legacy timestamp',
  });

  equal(normalized.timestamp_ms, 1_750_000_000_000, 'legacy timestamp should normalize to milliseconds');
});

test('accepts only HTTP(S) URLs', () => {
  equal(isSafeHttpUrl('https://instagram.com/p/abc'), true, 'https URL should be accepted');
  equal(isSafeHttpUrl('http://example.com'), true, 'http URL should be accepted');
  equal(isSafeHttpUrl('javascript:alert(1)'), false, 'javascript URL should be rejected');
  equal(isSafeHttpUrl('data:text/html,hello'), false, 'data URL should be rejected');
  equal(isSafeHttpUrl('not a url'), false, 'invalid URL should be rejected');
});

test('search is case-insensitive and returns matching message IDs', () => {
  const entries = [
    { id: 'm1', text: 'Meeting at 8 PM' },
    { id: 'm2', text: 'see you tomorrow' },
    { id: 'm3', text: 'MEETING moved to Friday' },
  ];

  deepEqual(searchEntries(entries, 'meeting'), ['m1', 'm3'], 'search should match case-insensitively');
  deepEqual(searchEntries(entries, '  TOMORROW  '), ['m2'], 'search should trim whitespace');
  deepEqual(searchEntries(entries, '   '), [], 'blank queries should return no results');
});

testAsync('indexes readable conversations and reports malformed conversation files', async () => {
  const zip = new JSZip();

  zip.file(
    'your_activity/inbox/alex_rivera/message_1.json',
    JSON.stringify({
      title: 'Alex Rivera',
      participants: [{ name: 'Alex Rivera' }, { name: 'Maya Chen' }],
      messages: [{ sender_name: 'Maya Chen', timestamp_ms: 1_750_000_000_000, content: 'Hello' }],
    }),
  );

  zip.file(
    'your_activity/inbox/broken_participant/message_1.json',
    JSON.stringify({
      title: 'Broken',
      participants: [{ name: 123 }],
      messages: [],
    }),
  );

  zip.file(
    'your_activity/inbox/broken_json/message_1.json',
    '{ invalid json',
  );

  const result = await buildChatIndex(zip);

  equal(result.chats.length, 1, 'only the readable conversation should be indexed');
  equal(result.warnings.length, 2, 'both malformed conversations should be reported');
});

testAsync('fails clearly when no readable conversations remain', async () => {
  const zip = new JSZip();
  zip.file('your_activity/inbox/broken/message_1.json', '{ invalid json');

  let message = '';
  try {
    await buildChatIndex(zip);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  equal(
    message,
    'No readable conversations were found. The archive may be incomplete or use an unsupported Instagram export format.',
    'empty readable archive should have a clear error',
  );
});


testAsync('loads and orders messages across archive parts', async () => {
  const zip = new JSZip();
  const makeMessageFile = (number, messages) => {
    zip.file(
      'your_activity/inbox/alex_rivera/message_' + number + '.json',
      JSON.stringify({
        title: 'Alex Rivera',
        participants: [{ name: 'Alex Rivera' }, { name: 'Maya Chen' }],
        messages,
      }),
    );
  };

  makeMessageFile(1, [
    { sender_name: 'Maya Chen', timestamp_ms: 3000, content: 'third' },
    { sender_name: 'Alex Rivera', timestamp_ms: 1000, content: 'first' },
  ]);
  makeMessageFile(2, [
    { sender_name: 'Maya Chen', timestamp_ms: 2000, content: 'second' },
  ]);

  const indexed = await buildChatIndex(zip);
  const result = await loadChatMessages(indexed.chats[0]);

  deepEqual(
    result.messages.map((message) => message.content),
    ['first', 'second', 'third'],
    'messages should be returned in timestamp order',
  );
});

Promise.all(pendingTests).then(() => {
  console.log('All ChatCapsule unit tests passed.');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
