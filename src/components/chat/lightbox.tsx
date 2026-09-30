"use client";

import React from 'react';
import JSZip from 'jszip';
import { X, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import { useBlobUrls } from '@/hooks/use-blob-urls';
import { MediaFile } from '@/types/chat';

type LightboxProps = {
  zip: JSZip | null;
  mediaFiles: MediaFile[];
  initialIndex: number;
  onClose: () => void;
};

export const Lightbox = ({ zip, mediaFiles, initialIndex, onClose }: LightboxProps) => {
  const { urls, loading } = useBlobUrls(zip, mediaFiles);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  const validUrls = React.useMemo(
    () => urls.filter((url): url is string => url !== null),
    [urls]
  );

  React.useEffect(() => {
    setCurrentIndex(Math.max(0, Math.min(initialIndex, Math.max(validUrls.length - 1, 0))));
  }, [initialIndex, validUrls.length]);

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentIndex((index) => Math.min(index + 1, validUrls.length - 1));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentIndex((index) => Math.max(index - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, validUrls.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Loading media">
        <Loader2 className="h-12 w-12 animate-spin text-white" aria-hidden="true" />
      </div>
    );
  }

  const currentUrl = validUrls[currentIndex];

  if (!currentUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
      onClick={onClose}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        onClick={onClose}
        aria-label="Close media viewer"
      >
        <X className="h-6 w-6" aria-hidden="true" />
      </button>

      <button
        type="button"
        className="absolute top-4 right-16 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        onClick={(event) => {
          event.stopPropagation();
          const anchor = document.createElement('a');
          anchor.href = currentUrl;
          anchor.download = 'instagram_photo_' + (currentIndex + 1) + '.jpg';
          anchor.click();
        }}
        aria-label="Download current photo"
      >
        <Download className="h-6 w-6" aria-hidden="true" />
      </button>

      {currentIndex > 0 && (
        <button
          type="button"
          className="absolute left-4 p-3 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors hidden sm:block z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={(event) => {
            event.stopPropagation();
            setCurrentIndex((index) => index - 1);
          }}
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-8 w-8" aria-hidden="true" />
        </button>
      )}

      <div className="max-w-[95vw] max-h-[95vh] relative flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
        <img
          src={currentUrl}
          alt={'Archived image ' + (currentIndex + 1) + ' of ' + validUrls.length}
          className="max-w-full max-h-[90vh] object-contain select-none"
        />
        <button
          type="button"
          className="absolute inset-y-0 left-0 w-1/4 cursor-pointer"
          onClick={() => currentIndex > 0 && setCurrentIndex((index) => index - 1)}
          aria-label="Previous photo"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 w-1/4 cursor-pointer"
          onClick={() => currentIndex < validUrls.length - 1 && setCurrentIndex((index) => index + 1)}
          aria-label="Next photo"
        />
      </div>

      {currentIndex < validUrls.length - 1 && (
        <button
          type="button"
          className="absolute right-4 p-3 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors hidden sm:block z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={(event) => {
            event.stopPropagation();
            setCurrentIndex((index) => index + 1);
          }}
          aria-label="Next photo"
        >
          <ChevronRight className="h-8 w-8" aria-hidden="true" />
        </button>
      )}

      {validUrls.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 font-medium text-sm bg-black/50 px-3 py-1 rounded-full z-10" aria-live="polite">
          {currentIndex + 1} / {validUrls.length}
        </div>
      )}
    </div>
  );
};
