# ChatCapsule Architecture

ChatCapsule is a local-first browser application for viewing Instagram JSON data-export ZIP files.

## System flow

```text
Instagram JSON export
        │
        ▼
   ZIP selected
        │
        ▼
   JSZip instance
        │
        ├──► archive-reader
        │      └── conversation metadata index
        │
        └──► use-chat-loader
               └── selected conversation messages
                         │
                         ├──► Zod validation / normalization
                         ├──► search worker
                         └──► virtual message list
                                   │
                                   └──► lazy media / blob cache

No application backend is required for the core viewing flow.
```

## Boundaries

### Import boundary

ChatImporter owns the application state for the currently selected archive and conversation. It owns one JSZip instance and passes that instance to the archive indexer, message loader, and media readers.

### Validation boundary

Raw conversation JSON is validated with Zod before being converted into the internal message model. Malformed conversations are skipped with warnings rather than becoming unchecked any data.

### Message loading boundary

`loadChatMessages` is the reusable production parser for a selected conversation. The React hook coordinates cancellation and UI state around that function, allowing the same parser to be benchmarked outside React.

### Rendering boundary

Long conversations use VirtualMessageList with measured variable-height rows. Only the visible window plus overscan is mounted in the DOM.

### Search boundary

Search index construction and queries run in a Web Worker. The actual matching algorithm lives in src/lib/search-index.ts, so it is independently testable and benchmarkable.

### Media boundary

Media files are read on demand from the active ZIP. Object URLs are cached per archive and revoked when the active archive changes or the viewer unmounts.

## Why this architecture?

The hardest constraint is that the user may have a large, private archive while the browser remains the only processing environment.

That leads to four deliberate choices:

1. One archive reader to avoid parsing the same ZIP twice.
2. Windowed rendering to avoid placing every message in the DOM.
3. Worker-backed search to keep text matching away from the UI event loop.
4. Lazy media plus explicit object-URL cleanup to control browser memory pressure.

## Failure handling

The viewer treats imported data as untrusted input. ZIP contents can be incomplete, malformed, or different across Instagram export versions. Parsing is defensive and the application surfaces recoverable warnings where possible.

The UI also has an error boundary around the archive viewer, so an unexpected rendering failure can be recovered without requiring a fresh upload.

## Verification

The repository's CI currently gates changes on:

- TypeScript typecheck
- Unit tests
- Production build
- Production route smoke test

The search core also has a reproducible benchmark under scripts/search-benchmark.mjs.