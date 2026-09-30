import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { MediaFile } from '../types/chat';
import { getBlobCache } from '../lib/blob-cache';
import { escapeRegex } from '../lib/utils';

const resolveZipFile = (zip: JSZip, uri: string) => {
    const direct = zip.file(uri);
    if (direct) return direct;

    const escaped = escapeRegex(uri);
    const matches = zip.file(new RegExp('.*' + escaped + '$'));
    return matches[0] ?? null;
};

export const useBlobUrl = (zip: JSZip | null, uri: string | undefined, enabled: boolean = true) => {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setUrl(null);
        setLoading(false);
    }, [zip]);

    useEffect(() => {
        if (!zip || !uri || !enabled) {
            setLoading(false);
            return;
        }

        const cache = getBlobCache(zip);
        const cached = cache.get(uri);
        if (cached) {
            setUrl(cached);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);

            try {
                const file = resolveZipFile(zip, uri);
                if (!file) {
                    if (!cancelled) setUrl(null);
                    return;
                }

                const blob = await file.async('blob');
                const objectUrl = URL.createObjectURL(blob);

                if (cancelled) {
                    URL.revokeObjectURL(objectUrl);
                    return;
                }

                cache.set(uri, objectUrl);
                setUrl(objectUrl);
            } catch (error) {
                console.error('Failed to load media blob:', uri, error);
                if (!cancelled) setUrl(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [zip, uri, enabled]);

    return { url, loading };
};

export const useBlobUrls = (
    zip: JSZip | null,
    mediaFiles: MediaFile[] | undefined,
    enabled: boolean = true,
) => {
    const [urls, setUrls] = useState<(string | null)[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setUrls([]);
        setLoading(false);
    }, [zip, mediaFiles]);

    useEffect(() => {
        if (!zip || !mediaFiles || mediaFiles.length === 0 || !enabled) {
            setLoading(false);
            return;
        }

        const cache = getBlobCache(zip);
        const results: (string | null)[] = Array(mediaFiles.length).fill(null);
        let cancelled = false;
        let cursor = 0;

        const loadOne = async (index: number) => {
            const mediaFile = mediaFiles[index];
            const cached = cache.get(mediaFile.uri);

            if (cached) {
                results[index] = cached;
                return;
            }

            const file = resolveZipFile(zip, mediaFile.uri);
            if (!file) return;

            try {
                const blob = await file.async('blob');
                const objectUrl = URL.createObjectURL(blob);

                if (cancelled) {
                    URL.revokeObjectURL(objectUrl);
                    return;
                }

                cache.set(mediaFile.uri, objectUrl);
                results[index] = objectUrl;
            } catch (error) {
                console.error('Failed to load media blob:', mediaFile.uri, error);
            }
        };

        const worker = async () => {
            while (!cancelled) {
                const index = cursor++;
                if (index >= mediaFiles.length) return;
                await loadOne(index);
            }
        };

        const loadAll = async () => {
            setLoading(true);

            try {
                const concurrency = Math.min(2, mediaFiles.length);
                await Promise.all(
                    Array.from({ length: concurrency }, () => worker()),
                );

                if (!cancelled) setUrls(results);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadAll();
        return () => {
            cancelled = true;
        };
    }, [zip, mediaFiles, enabled]);

    return { urls, loading };
};
