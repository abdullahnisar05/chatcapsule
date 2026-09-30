"use client";

import React from 'react';
import JSZip from 'jszip';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Chat, Message, MediaFile } from '@/types/chat';
import { cn } from '@/lib/utils';
import { MessageBubble } from './message-bubble';
import { DateDivider, SystemMessage } from './ui';
import { VirtualMessageList, VirtualMessageListHandle } from './virtual-message-list';

type ChatTimelineProps = {
  chat: Chat;
  messages: Message[];
  mainUser: string | null;
  messageSearchTerm: string;
  searchResults: string[];
  searchResultIndex: number;
  isParsingMessages: boolean;
  parseWarning: string | null;
  zip: JSZip | null;
  virtualListRef: React.RefObject<VirtualMessageListHandle | null>;
  messageRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onReplyClick: (timestamp: number) => void;
  onImageClick: (files: MediaFile[], index: number) => void;
};

const isSystemMessage = (message: Message) =>
  message.type === 'Generic' &&
  !!message.content &&
  (
    message.content.includes(' named the group ') ||
    message.content.includes(' joined the group') ||
    message.content.includes(' left the group') ||
    message.content.includes(' set the theme to ') ||
    message.content.includes(' set the nickname for ') ||
    message.content.includes(' set your nickname to ') ||
    message.content.includes(' deleted a collection') ||
    (message.content.includes(' removed ') && message.content.includes(' from the group'))
  );

export const ChatTimeline = React.memo(function ChatTimeline({
  chat,
  messages,
  mainUser,
  messageSearchTerm,
  searchResults,
  searchResultIndex,
  isParsingMessages,
  parseWarning,
  zip,
  virtualListRef,
  messageRefs,
  onReplyClick,
  onImageClick,
}: ChatTimelineProps) {
  return (
    <main id="chat-message-list" className="flex-1 min-h-0 z-10" aria-label="Conversation messages">
      {parseWarning && !isParsingMessages && (
        <Alert className="mx-4 mt-3 border-amber-500/20 bg-amber-500/5 text-amber-100">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Some messages could not be read</AlertTitle>
          <AlertDescription>{parseWarning}</AlertDescription>
        </Alert>
      )}

      {isParsingMessages ? (
        <div className="flex h-full flex-col items-center justify-center gap-2" role="status" aria-live="polite" aria-label="Loading conversation messages">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full items-center justify-center px-6 text-center" role="status">
          <div>
            <p className="text-sm font-medium text-on-surface">No messages found</p>
            <p className="mt-1 text-xs text-on-surface-variant">This conversation contains no readable messages.</p>
          </div>
        </div>
      ) : (
        <VirtualMessageList
          key={chat.id}
          ref={virtualListRef}
          className="h-full overflow-y-auto p-4 pr-6 scroll-smooth"
          items={messages}
          initialItemIndex={Math.max(messages.length - 1, 0)}
          estimatedItemHeight={78}
          overscan={10}
          getItemKey={(message) => message.id}
          renderItem={(message, index) => {
            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            const messageDate = new Date(message.timestamp_ms).toDateString();
            const previousDate = previousMessage ? new Date(previousMessage.timestamp_ms).toDateString() : null;
            const nextDate = nextMessage ? new Date(nextMessage.timestamp_ms).toDateString() : null;
            const showDateDivider = index === 0 || messageDate !== previousDate;
            const isMainUser = message.sender_name === mainUser;
            const isFirstInGroup = showDateDivider || !previousMessage || previousMessage.sender_name !== message.sender_name;
            const isLastInGroup = !nextMessage || nextMessage.sender_name !== message.sender_name || nextDate !== messageDate;
            const isLastMessage = index === messages.length - 1;
            const isSearchResult = searchResults.includes(message.id);
            const isActiveSearchResult = isSearchResult && searchResults[searchResultIndex] === message.id;
            const showSeenStatus = isMainUser && isLastMessage && chat.participantCount === 2;

            return (
              <div
                ref={(element) => {
                  if (element) messageRefs.current.set(message.id, element);
                  else messageRefs.current.delete(message.id);
                }}
                className={cn(
                  'transition-colors rounded-lg',
                  isActiveSearchResult && 'bg-blue-500/10 ring-1 ring-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                )}
              >
                {showDateDivider && <DateDivider timestamp_ms={message.timestamp_ms} />}
                {isSystemMessage(message) ? (
                  <SystemMessage content={message.content!} />
                ) : (
                  <MessageBubble
                    message={message}
                    isMainUser={isMainUser}
                    isGroupChat={chat.participantCount > 2}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    searchTerm={messageSearchTerm}
                    zip={zip}
                    onReplyClick={onReplyClick}
                    onImageClick={onImageClick}
                  />
                )}
                {showSeenStatus && (
                  <div className="flex justify-end pr-2 pt-0.5 pb-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500/80">Seen</span>
                  </div>
                )}
              </div>
            );
          }}
        />
      )}
    </main>
  );
});
ChatTimeline.displayName = 'ChatTimeline';
