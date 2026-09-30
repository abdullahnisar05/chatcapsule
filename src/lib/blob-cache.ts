import JSZip from 'jszip';

// Blob URLs are scoped to the active archive. Replacing or explicitly clearing
// the archive revokes every object URL owned by the viewer.
let activeZip: JSZip | null = null;
let cache = new Map<string, string>();

export const getBlobCache = (zip: JSZip | null) => {
  if (zip !== activeZip) {
    clearBlobCache();
    activeZip = zip;
  }
  return cache;
};

export const clearBlobCache = (zip?: JSZip | null) => {
  if (zip !== undefined && zip !== activeZip) return;

  cache.forEach((url) => URL.revokeObjectURL(url));
  cache = new Map();
  activeZip = zip === undefined ? null : zip;
};
