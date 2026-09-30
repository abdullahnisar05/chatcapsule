"use client";

import React from 'react';
import JSZip from 'jszip';
import { Loader2, Paperclip, Instagram, Download } from 'lucide-react';
import Twemoji from 'react-twemoji';
import { cn, isSafeHttpUrl } from '@/lib/utils';
import { Message, MediaFile } from '@/types/chat';
import { useBlobUrl } from '@/hooks/use-blob-urls';
import { PhotoGrid } from './ui';
import { VoiceMessagePlayer } from './voice-message-player';
import { useInView } from '@/hooks/use-in-view';

type MediaDisplayProps = {
  message: Message;
  zip: JSZip | null;
  onImageClick?: (files: MediaFile[], index: number) => void;
  isVisible: boolean;
};

export const MediaDisplay = React.memo(({ message, zip, onImageClick, isVisible }: MediaDisplayProps) => {
  const hasMultiplePhotos = Boolean(message.photos && message.photos.length > 1);
  const { url: photoUrl, loading: photoLoading } = useBlobUrl(zip, !hasMultiplePhotos ? message.photos?.[0]?.uri : undefined, isVisible);
  const { url: videoUrl, loading: videoLoading } = useBlobUrl(zip, message.videos?.[0]?.uri, isVisible);
  const { url: stickerUrl, loading: stickerLoading } = useBlobUrl(zip, message.sticker?.uri, isVisible);

  const isLoading = !isVisible || (!hasMultiplePhotos && (photoLoading || videoLoading || stickerLoading));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-black/20 p-4 w-32 h-32 aspect-square" role="status" aria-label="Loading media">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (hasMultiplePhotos) {
    return <PhotoGrid photos={message.photos!} zip={zip} onImageClick={(index) => onImageClick?.(message.photos!, index)} isVisible={isVisible} />;
  }

  if (photoUrl) {
    return (
      <button
        type="button"
        onClick={() => onImageClick?.(message.photos!, 0)}
        className={cn('block max-h-[400px] w-auto max-w-full rounded-lg overflow-hidden text-left', onImageClick && 'cursor-pointer transition-opacity hover:opacity-90')}
        aria-label="Open archived photo"
      >
        <img src={photoUrl} loading="lazy" className="block max-h-[400px] w-auto max-w-full rounded-lg object-contain" alt="Archived photo" />
      </button>
    );
  }

  if (videoUrl) {
    return (
      <div className="relative group/media inline-block">
        <video src={videoUrl} controls preload="metadata" className="block max-h-[400px] w-auto max-w-full rounded-lg" aria-label="Archived video" />
        <a
          href={videoUrl}
          download="instagram_video.mp4"
          onClick={(event) => event.stopPropagation()}
          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-md opacity-0 group-hover/media:opacity-100 focus:opacity-100 transition-opacity z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Download archived video"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    );
  }

  if (stickerUrl) {
    return <img src={stickerUrl} loading="lazy" className="h-32 w-32 object-contain" alt="Archived sticker" />;
  }

  if (message.audio_files?.length) {
    return <VoiceMessagePlayer message={message} zip={zip} isVisible={isVisible} />;
  }

  if (message.share) {
    const safeLink = isSafeHttpUrl(message.share.link) ? message.share.link : null;

    return (
      <div className="flex flex-col bg-secondary/30 rounded-lg overflow-hidden max-w-[280px] border border-white/10 shadow-sm">
        <div className="flex items-center gap-2 p-2.5 bg-secondary/50 border-b border-white/5">
          <Instagram className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-semibold">Instagram</span>
        </div>
        <div className="p-3 space-y-2">
          <Twemoji options={{ className: 'emoji' }}>
            <p className="text-sm line-clamp-4 break-words">{message.share.share_text || 'Sent a post'}</p>
          </Twemoji>
          {safeLink && (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Open shared Instagram post in a new tab"
            >
              View Post
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 h-32 w-32 bg-secondary/20 rounded-lg" role="img" aria-label="Archived attachment">
      <Paperclip className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-semibold text-xs text-center text-muted-foreground">Attachment</p>
    </div>
  );
});
MediaDisplay.displayName = 'MediaDisplay';

export const LazyMediaDisplay = React.memo((props: Omit<MediaDisplayProps, 'isVisible'>) => {
  const { ref, isInView } = useInView({ rootMargin: '400px' });
  return (
    <div ref={ref} className="min-h-[40px] min-w-[40px]" aria-busy={!isInView}>
      <MediaDisplay {...props} isVisible={isInView} />
    </div>
  );
});
LazyMediaDisplay.displayName = 'LazyMediaDisplay';
