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

## Archive import benchmark

Run:

```bash
npm run benchmark:import
```

This generates deterministic, compressed ZIP archives with 10k, 25k, and 50k messages, then measures actual `JSZip` loading, archive indexing, and the production conversation message loader. It reports archive size, indexing time, message-loading time, loaded message count, and process heap delta.

The benchmark is useful for regression detection. It is not a substitute for browser profiling of a real export with real media.

## Cancellation and memory behavior

Large selected conversations are parsed in cooperative batches and accept an `AbortSignal`. Changing conversations or cancelling an archive replacement stops further normalization work at safe yield points.

Media grids preload only the first four visible slots and load at most two blobs concurrently. The lightbox can still request the full media set on demand. Stale media loads revoke newly created object URLs before caching them.

## What is not measured yet

The current benchmark does not represent:

- ZIP decompression time
- browser memory for a real Instagram export
- media decoding
- DOM/paint cost on a specific phone
- end-to-end import time

A future performance pass should add real-export fixtures and browser profiling for those paths.