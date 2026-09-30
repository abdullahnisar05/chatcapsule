import { searchEntries, type SearchEntry } from './search-index';

type BuildMessage = {
  type: 'BUILD';
  entries: SearchEntry[];
};

type SearchMessage = {
  type: 'SEARCH';
  query: string;
  requestId: number;
};

type WorkerMessage = BuildMessage | SearchMessage;

let entries: SearchEntry[] = [];

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  if (message.type === 'BUILD') {
    entries = message.entries;
    self.postMessage({ type: 'READY' });
    return;
  }

  if (message.type === 'SEARCH') {
    self.postMessage({
      type: 'RESULTS',
      requestId: message.requestId,
      ids: searchEntries(entries, message.query),
    });
  }
};
