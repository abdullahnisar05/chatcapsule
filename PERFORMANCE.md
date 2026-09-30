# ChatCapsule Performance Notes

ChatCapsule optimizes for large, browser-local archives rather than server-side pagination.

## Current techniques

| Area | Technique |
| --- | --- |
| ZIP parsing | One JSZip instance per imported archive |
| Metadata | Cooperative batched indexing with progress updates |
| Messages | Selected conversation loaded on demand |
| Rendering | Measured virtual/windowed list |
| Search | Web Worker + pure search core |
| Media | IntersectionObserver + lazy blob creation |
| Memory | Per-archive object-URL cache with explicit revocation |

## Reproducible search benchmark

Run:

```bash
npm run benchmark:search
```

The benchmark compiles the production search helper and measures matching over deterministic synthetic datasets.

It reports:

- dataset size
- matching result count
- median query time after warm-up
- peak Node.js heap usage during the benchmark

These numbers are machine-dependent. They are intended for regression detection and portfolio evidence, not as universal browser performance claims.

## Browser verification

Run the browser suite with the Playwright test runner installed. CI installs Playwright transiently so the production dependency lockfile stays focused on the application runtime.

The E2E suite uses Chromium and records an HTML report on CI failures.

## What is not measured yet

The current benchmark does not represent:

- ZIP decompression time
- browser memory for a real Instagram export
- media decoding
- DOM/paint cost on a specific phone
- end-to-end import time

Phase 8 adds browser coverage using generated Instagram-style ZIP fixtures, including a 5,000-message conversation. The browser suite verifies upload, conversation rendering, in-chat search, and the windowed DOM.