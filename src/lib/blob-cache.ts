import JSZip from 'jszip';

// Blob URL cache scoped to whichever zip is currently active. Keeping this
// keyed off zip identity (rather than a single global map) means switching
// archives can never surface leftover media from a previously opened export,
// and old object URLs are revoked as soon as they're no longer reachable.
let activeZip: JSZip | null = null;
let cache = new Map<string, string>();

export const getBlobCache = (zip: JSZip | null) => {
  if (zip !== activeZip) {
    cache.forEach(url => URL.revokeObjectURL(url));
    cache = new Map();
    activeZip = zip;
  }
  return cache;
};
