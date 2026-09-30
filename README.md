# ChatCapsule

Private, local-first Instagram DM archive viewer.

ChatCapsule opens an Instagram data-export ZIP and turns its conversations into a readable, searchable archive with messages, photos, videos, stickers, shared posts, reactions, and voice messages.

## Product

ChatCapsule is designed around a simple promise: your exported archive stays in the browser during the core viewing flow.

Try it:

- Live app: https://chatcapsule.netlify.app/
- Product demo: https://chatcapsule.netlify.app/demo
- Engineering case study: https://chatcapsule.netlify.app/engineering

## Why it exists

Instagram exports are useful for preserving conversations, but raw JSON files and media folders are difficult to navigate.

ChatCapsule turns that archive into a familiar timeline without requiring a ChatCapsule account or database for the core viewer.

## Architecture

Instagram JSON export → ZIP selected in browser → single JSZip reader → conversation index → on-demand message loading → virtualized timeline → lazy media

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the implementation boundaries and trade-offs.

## Privacy model

- The archive is selected directly from the user's device.
- ZIP inspection and message parsing happen in the browser.
- No ChatCapsule database is required for the core viewer.
- No login is required.
- Imported shared links are validated before becoming outbound links.
- The interface is read-only and does not send messages back to Instagram.

## Engineering highlights

- Next.js + React + TypeScript
- JSZip with one active archive reader
- Defensive Zod validation at the archive boundary
- Cooperative batched metadata indexing with progress feedback
- On-demand selected-conversation parsing
- Measured virtual rendering for long timelines
- Web Worker-backed message search
- Stable deterministic message IDs for rendering and navigation
- Non-mutating timestamp/encoding normalization
- Lazy media loading with IntersectionObserver
- Per-archive blob URL cache with explicit cleanup
- Keyboard-accessible search, replies, media, playback, and mobile navigation
- Recoverable viewer error boundary
- Automated typecheck, unit tests, production build, and route smoke tests
- Reproducible 100k/250k/500k search-core benchmark
- Deterministic 10k/25k/50k archive import benchmark
- Chromium end-to-end coverage for demo, engineering route, ZIP upload, conversation rendering, and message search

## Verification

Run:

```bash
npm install
npm run typecheck
npm run test:unit
npm run build
npm run test:smoke
npm run benchmark:search
npm run benchmark:import
npm run test:e2e
```

The search benchmark reports deterministic dataset size, match count, median query time, and process heap usage. These numbers are machine-dependent and should be used for regression tracking rather than universal performance claims.

## Supported archive behavior

ChatCapsule targets Instagram JSON data exports containing conversation files under the export inbox structure.

Instagram can change its export format. The parser therefore treats archive content as untrusted input: unsupported or malformed conversation files are isolated rather than silently becoming unchecked data.

## Project structure

- src/app — routes and page metadata
- src/components — landing page, archive viewer, chat UI, reusable UI
- src/hooks — archive loading, lazy media, viewport utilities
- src/lib — archive reader, validation, search worker/index, normalization
- src/types — internal archive/message models
- scripts — type-compiled unit tests, production smoke test, search benchmark

## Security

See [SECURITY.md](./SECURITY.md) for the privacy model and dependency-security policy.

## Roadmap

- Export selected conversations
- Performance profiling with real large-export fixtures
- More defensive support for future Instagram export formats

## Portfolio note

ChatCapsule is intentionally more than a styled JSON viewer. It is a browser-engineering project focused on private user-owned archives, large-list rendering, asynchronous parsing, worker search, malformed input, media memory management, accessibility, and production verification.

Built as an independent project. Not affiliated with Instagram or Meta.