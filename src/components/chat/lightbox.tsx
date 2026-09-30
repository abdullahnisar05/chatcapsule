"use client";

import React from 'react';
import JSZip from 'jszip';
import { X, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import { useBlobUrls } from '@/hooks/use-blob-urls';
import { MediaFile } from '@/types/chat';

export const Lightbox = ({ zip, mediaFiles, initialIndex, onClose }: { zip: JSZip | null, mediaFiles: MediaFile[], initialIndex: number, onClose: () => void }) => {
    const { urls, loading } = useBlobUrls(zip, mediaFiles);
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
    const validUrls = React.useMemo(() => urls.filter((u): u is string => u !== null), [urls]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') setCurrentIndex(prev => Math.min(prev + 1, validUrls.length - 1));
            if (e.key === 'ArrowLeft') setCurrentIndex(prev => Math.max(prev - 1, 0));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, validUrls.length]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
            </div>
        );
    }

    // Ensure index doesn't overshoot if images fail to load
    if (currentIndex >= validUrls.length && validUrls.length > 0) {
        setCurrentIndex(validUrls.length - 1);
        return null; // Next render will have correct index
    }
    
    const currentUrl = validUrls[currentIndex];

    if (!currentUrl) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={onClose}>
            <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors z-10"
                onClick={onClose} title="Close">
                <X className="h-6 w-6" />
            </button>

            <button className="absolute top-4 right-16 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    const a = document.createElement('a');
                    a.href = currentUrl;
                    a.download = `instagram_photo_${currentIndex + 1}.jpg`;
                    a.click();
                }}
                title="Download Photo"
            >
                <Download className="h-6 w-6" />
            </button>

            {currentIndex > 0 && (
                <button
                    className="absolute left-4 p-3 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors hidden sm:block z-10"
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i - 1); }}
                >
                    <ChevronLeft className="h-8 w-8" />
                </button>
            )}

            <div className="max-w-[95vw] max-h-[95vh] relative flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <img src={currentUrl} alt={`Image ${currentIndex + 1}`} className="max-w-full max-h-[90vh] object-contain select-none" />
                <div className="absolute inset-y-0 left-0 w-1/4 cursor-pointer" onClick={() => currentIndex > 0 && setCurrentIndex(i => i - 1)} />
                <div className="absolute inset-y-0 right-0 w-1/4 cursor-pointer" onClick={() => currentIndex < validUrls.length - 1 && setCurrentIndex(i => i + 1)} />
            </div>

            {currentIndex < validUrls.length - 1 && (
                <button
                    className="absolute right-4 p-3 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors hidden sm:block z-10"
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i + 1); }}
                >
                    <ChevronRight className="h-8 w-8" />
                </button>
            )}

            {validUrls.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 font-medium text-sm bg-black/50 px-3 py-1 rounded-full z-10">
                    {currentIndex + 1} / {validUrls.length}
                </div>
            )}
        </div>
    );
};
