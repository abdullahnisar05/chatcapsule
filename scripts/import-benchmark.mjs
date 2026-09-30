import { performance } from 'node:perf_hooks';
import JSZip from 'jszip';
import { buildChatIndex } from '../.test-build/src/lib/archive-reader.js';
import { loadChatMessages } from '../.test-build/src/lib/message-loader.js';

const sizes = [10_000, 25_000, 50_000];

function createMessage(index) {
  return {
    sender_name: index % 2 === 0 ? 'Maya Chen' : 'Alex Rivera',
    timestamp_ms: 1_750_000_000_000 + index * 1000,
    content: 'Archive benchmark message ' + index + ' about deployment and planning.',
    type: 'Generic',
    is_unsent: false,
  };
}

async function createArchive(messageCount) {
  const zip = new JSZip();
  const chunkSize = 5_000;
  for (let start = 0; start < messageCount; start += chunkSize) {
    const messages = [];
    const end = Math.min(start + chunkSize, messageCount);
    for (let index = start; index < end; index += 1) messages.push(createMessage(index));

    const sequence = Math.floor(start / chunkSize) + 1;
    zip.file(
      'your_activity/inbox/maya_alex/message_' + sequence + '.json',
      JSON.stringify({
        title: 'Maya Chen and Alex Rivera',
        participants: [{ name: 'Maya Chen' }, { name: 'Alex Rivera' }],
        messages,
      }),
    );
  }
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

for (const messageCount of sizes) {
  const archiveBuffer = await createArchive(messageCount);
  const heapBefore = process.memoryUsage().heapUsed;

  const parseStart = performance.now();
  const zip = await JSZip.loadAsync(archiveBuffer);
  const indexed = await buildChatIndex(zip);
  const indexMs = performance.now() - parseStart;

  const chat = indexed.chats[0];
  const messageStart = performance.now();
  const loaded = await loadChatMessages(chat);
  const messageMs = performance.now() - messageStart;
  const heapAfter = process.memoryUsage().heapUsed;

  console.log(JSON.stringify({
    messages: messageCount,
    archiveMb: Number((archiveBuffer.byteLength / 1024 / 1024).toFixed(2)),
    indexMs: Number(indexMs.toFixed(2)),
    messageMs: Number(messageMs.toFixed(2)),
    loadedMessages: loaded.messages.length,
    heapDeltaMb: Number(((heapAfter - heapBefore) / 1024 / 1024).toFixed(1)),
  }));
}