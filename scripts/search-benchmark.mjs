import { performance } from 'node:perf_hooks';
import { searchEntries } from '../.test-build/src/lib/search-index.js';

const sizes = [100_000, 250_000, 500_000];
const repetitions = 7;

function createEntries(size) {
  return Array.from({ length: size }, (_, index) => ({
    id: 'message-' + index,
    text: index % 97 === 0
      ? 'project deployment meeting archived message ' + index
      : 'ordinary archived conversation message ' + index,
  }));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

for (const size of sizes) {
  const entries = createEntries(size);
  searchEntries(entries, 'deployment');

  const samples = [];
  let resultCount = 0;

  for (let run = 0; run < repetitions; run += 1) {
    const start = performance.now();
    const results = searchEntries(entries, 'deployment');
    samples.push(performance.now() - start);
    resultCount = results.length;
  }

  const peakHeapMb = process.memoryUsage().heapUsed / 1024 / 1024;

  console.log(JSON.stringify({
    entries: size,
    matches: resultCount,
    medianMs: Number(median(samples).toFixed(2)),
    peakHeapMb: Number(peakHeapMb.toFixed(1)),
  }));
}