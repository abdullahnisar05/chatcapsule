"use client";

import React from 'react';
import JSZip from 'jszip';
import { CornerUpLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Twemoji from 'react-twemoji';
import { cn, getInitials, escapeRegex, isEmojiOnly } from '@/lib/utils';
import { Message, MediaFile } from '@/types/chat';
import { LazyMediaDisplay } from './media-display';
import { MessageTimestamp, ReactionsDisplay } from './ui';

export const MessageBubble = React.memo(({
    message, isMainUser, isGroupChat, isFirstInGroup, isLastInGroup, searchTerm, zip, onReplyClick, onImageClick
}: {
    message: Message;
    isMainUser: boolean;
    isGroupChat: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    searchTerm: string | null;
    zip: JSZip | null;
    onReplyClick: (timestamp: number) => void;
    onImageClick?: (files: MediaFile[], index: number) => void;
}) => {
    const alignment = isMainUser ? 'justify-end' : 'justify-start';
    const bubbleColor = isMainUser
        ? 'bg-[#3797f0] text-white'
        : 'bg-[#262626] text-[#f5f5f5]';

    let borderRadius;
    const baseRounding = "rounded-[22px]";
    if (isMainUser) {
        borderRadius = isFirstInGroup && isLastInGroup ? baseRounding :
            isFirstInGroup ? "rounded-t-[22px] rounded-bl-[22px] rounded-br-[6px]" :
                isLastInGroup ? "rounded-b-[22px] rounded-tl-[22px] rounded-tr-[6px]" :
                    "rounded-l-[22px] rounded-r-[6px]";
    } else {
        borderRadius = isFirstInGroup && isLastInGroup ? baseRounding :
            isFirstInGroup ? "rounded-t-[22px] rounded-br-[22px] rounded-bl-[6px]" :
                isLastInGroup ? "rounded-b-[22px] rounded-tr-[22px] rounded-tl-[6px]" :
                    "rounded-r-[22px] rounded-l-[6px]";
    }

    const hasMedia = message.photos || message.videos || message.audio_files || message.sticker || message.share;
    const isEmojiMessage = message.content ? isEmojiOnly(message.content) : false;

    const highlightText = (text: string, highlight: string | null) => {
        if (!highlight) return text;
        const escaped = escapeRegex(highlight);
        const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
        return <span> {parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ?
                <mark key={i} className="bg-yellow-400 text-black rounded">{part}</mark> :
                part
        )} </span>;
    }

    return (
        <div data-testid="message-bubble" className={cn("group/message relative flex items-end gap-2 mb-1", alignment, isFirstInGroup ? "mt-6" : "mt-0.5")}>
            {!isMainUser && isGroupChat && (
                <Avatar className={cn("h-6 w-6 sm:h-8 sm:w-8 self-end mb-1", !isLastInGroup && "invisible")}>
                    <AvatarFallback className="text-[10px] sm:text-xs bg-surface-container-high">{getInitials(message.sender_name)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[65%]",
                isMainUser ? "items-end" : "items-start"
            )}>
                {isGroupChat && !isMainUser && isFirstInGroup && <p className="text-xs text-muted-foreground ml-3 mb-0.5">{message.sender_name}</p>}

                {message.reply && (
                    <div className={cn(
                        "flex flex-col mb-1 w-fit",
                        isMainUser ? "items-end text-right pr-2.5 border-r-2 border-white/10" : "items-start text-left pl-2.5 border-l-2 border-white/10"
                    )}>
                        <button
                            type="button"
                            onClick={() => { if (message.reply && typeof message.reply.timestamp === 'number') onReplyClick(message.reply.timestamp); }}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1 cursor-pointer hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                            aria-label="Jump to replied message"
                        >
                            <CornerUpLeft className="h-3 w-3" />
                            <span className="font-medium">
                                {isMainUser
                                    ? `You replied to ${message.reply.sender || 'them'}`
                                    : `${message.sender_name} replied to you`}
                            </span>
                        </button>
                        {(message.reply.message || typeof message.reply.message === 'string') && (
                            <button
                                type="button"
                                onClick={() => { if (message.reply && typeof message.reply.timestamp === 'number') onReplyClick(message.reply.timestamp); }}
                                aria-label="Jump to replied message preview"
                                className={cn(
                                    "px-3.5 py-1.5 rounded-2xl text-xs opacity-70 cursor-pointer max-w-full truncate text-left",
                                    isMainUser ? "bg-gray-700" : "bg-blue-600"
                                )}
                            >
                                <Twemoji options={{ className: 'emoji' }}>
                                    <span>{message.reply.message}</span>
                                </Twemoji>
                            </button>
                        )}
                    </div>
                )}

                <div className={cn('relative', !hasMedia && !message.content && 'p-0', !hasMedia && message.content && 'px-4 py-2.5', bubbleColor, borderRadius)}>

                    {message.is_unsent ? (
                        <p className="text-sm italic opacity-70 px-3 py-2">Message unsent</p>
                    ) : hasMedia ? (
                        <LazyMediaDisplay message={message} zip={zip} onImageClick={onImageClick} />
                    ) : message.content ? (
                        <Twemoji options={{ className: 'emoji' }}>
                            <p key={message.content + (searchTerm || "")} className={cn("text-base leading-relaxed break-words whitespace-pre-wrap", isEmojiMessage && "text-5xl leading-none")}>
                                {highlightText(message.content, searchTerm)}
                            </p>
                        </Twemoji>
                    ) : null}

                    <ReactionsDisplay reactions={message.reactions || []} isMainUser={isMainUser} />
                </div>
                {isLastInGroup && (
                    <p className={cn("text-xs text-muted-foreground mt-1 opacity-50 transition-all",
                        isMainUser ? "text-right pr-2" : "text-left pl-2",
                        message.reactions && message.reactions.length > 0 && "mt-5"
                    )}>
                        <MessageTimestamp timestamp_ms={message.timestamp_ms} />
                    </p>
                )}
            </div>
        </div>
    );
});
MessageBubble.displayName = 'MessageBubble';
