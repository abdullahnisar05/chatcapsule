"use client";

import React, { useMemo } from 'react';
import JSZip from 'jszip';
import {
    Paperclip, Instagram, CornerUpLeft, ChevronLeft, ChevronRight, X, Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip"
import Twemoji from 'react-twemoji';

import { cn, isEmojiOnly, escapeRegex, getInitials } from '@/lib/utils';
import { Message, MediaFile, Reaction } from '@/types/chat';
import { useBlobUrl, useBlobUrls } from '@/hooks/use-blob-urls';
import { useInView } from '@/hooks/use-in-view';

// --- Helper Components ---

export function MessageTimestamp({ timestamp_ms }: { timestamp_ms: number }) {
    const time = useMemo(() =>
        new Date(timestamp_ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        [timestamp_ms]
    );
    return <>{time}</>;
}

export const DateDivider = ({ timestamp_ms }: { timestamp_ms: number }) => {
    const date = useMemo(() =>
        new Date(timestamp_ms).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        [timestamp_ms]
    );

    if (!date) return null;

    return (
        <div className="relative my-6 flex justify-center">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <Twemoji options={{ className: 'emoji' }}>
                    <span key={date} className="bg-background px-2 text-muted-foreground">{date}</span>
                </Twemoji>
            </div>
        </div>
    );
}

export const PhotoGrid = React.memo(({ photos, zip, onImageClick, isVisible }: { photos: MediaFile[], zip: JSZip | null, onImageClick?: (index: number) => void, isVisible: boolean }) => {
    const maxDisplay = 4;
    const displayPhotos = photos.slice(0, maxDisplay);
    const { urls, loading } = useBlobUrls(zip, displayPhotos, isVisible);
    const count = photos.length;
    const remaining = count - maxDisplay;

    if (loading || !isVisible) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-black/20 p-4 w-48 h-48" role="status" aria-label="Loading photo grid">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">{count} photos</span>
            </div>
        );
    }

    const validUrls = urls.filter((u): u is string => u !== null);
    if (validUrls.length === 0) return null;

    if (validUrls.length === 1) {
        return (
            <button
                type="button"
                onClick={() => onImageClick?.(0)}
                className={cn("block max-h-[400px] w-auto max-w-full rounded-lg overflow-hidden text-left", onImageClick && "cursor-pointer transition-opacity hover:opacity-90")}
                aria-label="Open archived photo"
            >
                <img src={validUrls[0]} loading="lazy" className="block max-h-[400px] w-auto max-w-full rounded-lg object-contain" alt="Archived photo" />
            </button>
        );
    }

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gap: '2px',
        borderRadius: '12px',
        overflow: 'hidden',
        maxWidth: '320px',
        width: '100%',
    };

    if (validUrls.length === 2) {
        gridStyle.gridTemplateColumns = '1fr 1fr';
        gridStyle.aspectRatio = '2 / 1';
    } else if (validUrls.length === 3) {
        gridStyle.gridTemplateColumns = '1fr 1fr';
        gridStyle.gridTemplateRows = '1fr 1fr';
        gridStyle.aspectRatio = '1 / 1';
    } else {
        gridStyle.gridTemplateColumns = '1fr 1fr';
        gridStyle.gridTemplateRows = '1fr 1fr';
        gridStyle.aspectRatio = '1 / 1';
    }

    const displayUrls = validUrls.slice(0, maxDisplay);

    return (
        <div style={gridStyle}>
            {displayUrls.map((url, i) => {
                const isFirstInThreeLayout = validUrls.length === 3 && i === 0;
                const itemStyle: React.CSSProperties = {
                    position: 'relative',
                    overflow: 'hidden',
                    ...(isFirstInThreeLayout ? { gridRow: '1 / 3' } : {}),
                };
                const isLastSlot = i === maxDisplay - 1 && remaining > 0;

                return (
                    <button
                        type="button"
                        key={i}
                        style={itemStyle}
                        onClick={() => onImageClick?.(i)}
                        className={cn(onImageClick && "cursor-pointer hover:opacity-95 transition-opacity", "text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white")}
                        aria-label={"Open archived photo " + (i + 1)}
                    >
                        <img
                            src={url}
                            alt={"Archived photo " + (i + 1)}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        {isLastSlot && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.55)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <span style={{ color: 'white', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px' }}>
                                    +{remaining}
                                </span>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
});
PhotoGrid.displayName = 'PhotoGrid';

export const ReactionsDisplay = React.memo(({ reactions, isMainUser }: { reactions: Reaction[], isMainUser: boolean }) => {
    if (!reactions || reactions.length === 0) return null;
    const side = isMainUser ? 'right-1' : 'left-1';

    return (
        <div className={cn("absolute -bottom-3.5 z-50", side)}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5 rounded-full bg-gray-800 p-0.5 shadow-md border border-white/10">
                            <Twemoji options={{ className: 'emoji' }}>
                                <div className="flex items-center gap-0.5">
                                    {reactions.slice(0, 3).map((r, i) => <span key={i} className="text-xs">{r.reaction}</span>)}
                                </div>
                            </Twemoji>
                            {reactions.length > 0 && <span className="text-xs font-bold pl-0.5 pr-1">{reactions.length}</span>}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <Twemoji options={{ className: 'emoji' }}>
                            <p>{reactions.map(r => `${r.actor} reacted with ${r.reaction}`).join(', ')}</p>
                        </Twemoji>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
});
ReactionsDisplay.displayName = 'ReactionsDisplay';

export const SystemMessage = ({ content }: { content: string }) => (
    <div className="py-2 text-center text-xs text-muted-foreground flex justify-center">
        <Twemoji options={{ className: 'emoji' }}>
            <span key={content}>{content}</span>
        </Twemoji>
    </div>
);
