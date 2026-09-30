import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { MediaFile } from '../types/chat';
import { getBlobCache } from '../lib/blob-cache';
import { escapeRegex } from '../lib/utils';

export const useBlobUrl = (zip: JSZip | null, uri: string | undefined, enabled: boolean = true) => {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setUrl(null);
    }, [zip]);

    useEffect(() => {
        if (!zip || !uri || !enabled) {
            return;
        }

        const cache = getBlobCache(zip);
        const cached = cache.get(uri);
        if (cached) {
            setUrl(cached);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            const files = zip.file(new RegExp(`.*${escapeRegex(uri)}$`));
            const file = files.length > 0 ? files[0] : zip.file(uri);

            if (file) {
                try {
                    const blob = await file.async('blob');
                    if (!cancelled) {
                        const objectUrl = URL.createObjectURL(blob);
                        cache.set(uri, objectUrl);
                        setUrl(objectUrl);
                    }
                } catch (e) {
                    console.error('Failed to load media blob:', uri, e);
                    if (!cancelled) setUrl(null);
                } finally {
                    if (!cancelled) setLoading(false);
                }
            } else {
                if (!cancelled) {
                    setUrl(null);
                    setLoading(false);
                }
            }
        };

        load();
        return () => { cancelled = true; };
    }, [zip, uri, enabled]);

    return { url, loading };
};

export const useBlobUrls = (zip: JSZip | null, mediaFiles: MediaFile[] | undefined, enabled: boolean = true) => {
    const [urls, setUrls] = useState<(string | null)[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setUrls([]);
    }, [zip]);

    useEffect(() => {
        if (!zip || !mediaFiles || mediaFiles.length === 0 || !enabled) {
            return;
        }

        const cache = getBlobCache(zip);
        const allCached = mediaFiles.map(mf => cache.get(mf.uri));
        if (allCached.every(u => !!u)) {
            setUrls(allCached as string[]);
            return;
        }

        let cancelled = false;

        const loadAll = async () => {
            setLoading(true);
            try {
                const results = await Promise.all(
                    mediaFiles.map(async (mf) => {
                        const cached = cache.get(mf.uri);
                        if (cached) return cached;

                        const files = zip.file(new RegExp(`.*${escapeRegex(mf.uri)}$`));
                        const file = files.length > 0 ? files[0] : zip.file(mf.uri);
                        if (file) {
                            const blob = await file.async('blob');
                            const objectUrl = URL.createObjectURL(blob);
                            cache.set(mf.uri, objectUrl);
                            return objectUrl;
                        }
                        return null;
                    })
                );
                if (!cancelled) setUrls(results);
            } catch (e) {
                console.error('Failed to load media blobs:', e);
                if (!cancelled) setUrls([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadAll();
        return () => { cancelled = true; };
    }, [zip, mediaFiles, enabled]);

    return { urls, loading };
};
