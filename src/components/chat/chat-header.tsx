import React from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chat } from '@/types/chat';
import { cn, getInitials } from '@/lib/utils';

export type ArchiveStats = {
  messageCount: number;
  participantCount: number;
  photoCount: number;
  videoCount: number;
  voiceCount: number;
  firstMessageAt: number;
  lastMessageAt: number;
};

type ChatHeaderProps = {
  chat: Chat;
  stats: ArchiveStats;
  demo: boolean;
  messageSearchTerm: string;
  showHeaderSearch: boolean;
  searchResultIndex: number;
  searchResultCount: number;
  searchIndexReady: boolean;
  onBack: () => void;
  onOpenSearch: () => void;
  onSearchChange: (value: string) => void;
  onSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearchBlur: () => void;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  onCloseSearch: () => void;
};

export const ChatHeader = React.memo(function ChatHeader({
  chat,
  stats,
  demo,
  messageSearchTerm,
  showHeaderSearch,
  searchResultIndex,
  searchResultCount,
  searchIndexReady,
  onBack,
  onOpenSearch,
  onSearchChange,
  onSearchKeyDown,
  onSearchBlur,
  onPrevMatch,
  onNextMatch,
  onCloseSearch,
}: ChatHeaderProps) {
  const mediaSummary = [
    stats.photoCount > 0 ? stats.photoCount + ' photos' : '',
    stats.videoCount > 0 ? stats.videoCount + ' videos' : '',
    stats.voiceCount > 0 ? stats.voiceCount + ' voice notes' : '',
  ].filter(Boolean).join(' · ') || 'Text and shared content';

  return (
    <header className="p-3 flex items-center gap-3 sticky top-0 bg-background z-20 border-b border-[#262626]">
      <Button variant="ghost" size="icon" className="md:hidden hover:bg-surface-container-high rounded-full" onClick={onBack} aria-label="Back to conversations">
        <ArrowLeft className="text-on-surface h-5 w-5" aria-hidden="true" />
      </Button>
      <Avatar className="h-10 w-10" aria-hidden="true">
        <AvatarFallback className="bg-surface-container-high font-headline">{getInitials(chat.title)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-headline font-semibold truncate" title={chat.title}>{chat.title}</h2>
        <p className="text-sm text-on-surface-variant">
          {stats.participantCount} participants
          {stats.messageCount > 0 && ' · ' + stats.messageCount.toLocaleString() + ' messages'}
          {demo && ' · Demo archive'}
        </p>
        {stats.messageCount > 0 && <p className="mt-0.5 text-[11px] text-on-surface-variant/70">{mediaSummary}</p>}
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className={cn(
          'flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg transition-all px-3 py-1 overflow-hidden',
          messageSearchTerm || showHeaderSearch ? 'w-[220px] sm:w-[380px]' : 'w-0 border-none p-0'
        )}>
          <Input
            placeholder="Find in chat..."
            aria-label="Find in chat"
            className="h-8 bg-transparent border-none text-sm focus-visible:ring-0 p-0 flex-1 placeholder:text-zinc-500"
            value={messageSearchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onBlur={onSearchBlur}
            onKeyDown={onSearchKeyDown}
            autoFocus={showHeaderSearch}
          />
          {messageSearchTerm && (
            <div className="flex items-center gap-2 ml-2 h-5 text-zinc-400">
              <span className={cn(
                'text-[12px] whitespace-nowrap font-medium min-w-[50px] text-right',
                searchResultCount === 0 && 'text-red-400'
              )} role="status" aria-live="polite">
                {!searchIndexReady
                  ? 'Indexing…'
                  : searchResultCount > 0
                    ? (searchResultIndex + 1) + '/' + searchResultCount.toLocaleString()
                    : 'No results'}
              </span>
              <div className="w-[1px] h-full bg-zinc-700 mx-1" aria-hidden="true" />
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-zinc-800 hover:text-white" onClick={onPrevMatch} disabled={searchResultCount === 0} aria-label="Previous search result">
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-zinc-800 hover:text-white" onClick={onNextMatch} disabled={searchResultCount === 0} aria-label="Next search result">
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-zinc-800 hover:text-white" onClick={onCloseSearch} aria-label="Clear chat search">
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
        {!messageSearchTerm && !showHeaderSearch && (
          <Button variant="ghost" size="icon" onClick={onOpenSearch} aria-label="Search messages in this conversation">
            <Search className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </header>
  );
});
ChatHeader.displayName = 'ChatHeader';
