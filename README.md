# ChatCapsule

Private, local-first Instagram DM archive viewer.

ChatCapsule lets you open an Instagram data-export ZIP and browse conversations, messages, photos, videos, stickers, shared posts, reactions, and voice messages in a familiar chat interface.

## Why ChatCapsule?

Instagram data exports are useful for preserving conversations, but raw JSON and media folders are difficult to navigate.

ChatCapsule turns that archive into a readable, searchable timeline without requiring an account or uploading the archive to a backend.

### Core flow

Instagram data export → ZIP file → Browser / Web Worker → Normalized archive → Searchable conversation viewer

## Privacy architecture

ChatCapsule is designed around a local-first model:
- The archive is selected directly from your device.
- ZIP inspection and message parsing happen in the browser.
- No ChatCapsule database is required for the core viewer.
- No login is required.
- Shared links are validated before being opened.
- The UI is read-only by design; it does not send messages back to Instagram.

## Engineering highlights

- Next.js + React + TypeScript
- JSZip for Instagram export archives
- Single JSZip archive reader with cooperative metadata indexing
- Lazy media loading with IntersectionObserver
- Windowed message rendering with measured variable-height rows
- Worker-backed in-chat search indexing
- Stable deterministic message IDs for rendering and navigation
- Timestamp normalization across export variants
- Non-mutating message normalization
- Search and in-chat navigation
- Responsive desktop/mobile conversation layout
- Media lightbox and voice-message playback
- Graceful parser warnings when individual archive files cannot be read

## Project structure

src/app — Next.js routes and metadata
src/components — landing page, archive viewer, chat UI, reusable UI
src/hooks — archive loading, lazy media, viewport utilities
src/lib — parser worker, normalization utilities, site metadata
src/types — internal archive/message models

## Running locally

npm install
npm run dev

Useful checks:
npm run typecheck
npm run build

## Supported archive behavior

ChatCapsule currently targets Instagram JSON data exports containing conversation files under the export inbox structure.

Because Instagram can change its export format, the parser is defensive: unsupported or malformed conversation files are surfaced as warnings instead of silently disappearing.

## Roadmap

- Automated unit/integration/E2E tests
- Archive statistics
- Better import progress and archive validation
- Explicit current-account selection for reliable message alignment
- Accessibility and keyboard-navigation pass
- Accessibility and keyboard-navigation pass
- Export selected conversations

## Portfolio note

ChatCapsule is intentionally more than a styled JSON viewer. The project explores browser engineering problems around private, user-owned archives: memory pressure, asynchronous parsing, media loading, malformed input, stable identity, search performance, and responsive rendering.

Built as an independent project. Not affiliated with Instagram or Meta.
