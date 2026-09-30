type SearchEntry = {
  id: string;
  text: string;
};

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
    const query = message.query.trim().toLowerCase();

    if (!query) {
      self.postMessage({
        type: 'RESULTS',
        requestId: message.requestId,
        ids: [],
      });
      return;
    }

    const ids = entries
      .filter(entry => entry.text.includes(query))
      .map(entry => entry.id);

    self.postMessage({
      type: 'RESULTS',
      requestId: message.requestId,
      ids,
    });
  }
};
