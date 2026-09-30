import React from 'react';
import { Search, FileUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Chat } from '@/types/chat';
import { ChatListItem } from './chat-list-item';

type SidebarChat = Chat & { matchCount?: number; titleMatch?: boolean };

type ChatSidebarProps = {
  chats: SidebarChat[];
  selectedChatId: string | null;
  searchTerm: string;
  mainUser: string | null;
  senderCandidates: string[];
  onSearchChange: (value: string) => void;
  onMainUserChange: (value: string) => void;
  onSelectChat: (id: string) => void;
  onUploadAnother: () => void;
};

export const ChatSidebar = React.memo(function ChatSidebar({
  chats,
  selectedChatId,
  searchTerm,
  mainUser,
  senderCandidates,
  onSearchChange,
  onMainUserChange,
  onSelectChat,
  onUploadAnother,
}: ChatSidebarProps) {
  return (
    <aside aria-label="Conversation list" className="flex flex-col h-full overflow-hidden border-r border-[#262626] bg-background">
      <div className="p-4 flex flex-col gap-4 bg-background shrink-0 z-10 border-b border-[#262626]">
        <h1 className="text-2xl font-headline font-semibold tracking-tight">Messages</h1>
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <label htmlFor="conversation-search" className="sr-only">Search conversations</label>
          <Input
            id="conversation-search"
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="pl-9 rounded-full bg-surface-container-high border-none text-on-surface placeholder:text-on-surface-variant focus-visible:ring-1 focus-visible:ring-on-surface-variant"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-[2px] p-2">
        {senderCandidates.length > 0 && (
          <div className="mx-1 mb-2 rounded-xl border border-[#262626] bg-surface-container-low p-3">
            <label htmlFor="main-user" className="text-xs font-semibold text-on-surface">Message alignment</label>
            <select
              id="main-user"
              aria-label="Choose which account's messages appear on the right"
              value={mainUser || ''}
              onChange={(event) => onMainUserChange(event.target.value)}
              className="mt-2 h-9 w-full rounded-lg border border-[#363636] bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-blue-500"
            >
              {senderCandidates.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">Used only to place your messages on the right side.</p>
          </div>
        )}
        {chats.length > 0 ? chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isSelected={selectedChatId === chat.id}
            onClick={() => onSelectChat(chat.id)}
            searchTerm={searchTerm}
          />
        )) : (
          <div className="px-4 py-10 text-center text-sm text-on-surface-variant">No conversations match your search.</div>
        )}
      </div>
      <div className="p-4 mt-auto">
        <Button variant="outline" className="w-full border-outline-variant/15 text-on-surface hover:bg-surface-bright rounded-full bg-transparent" onClick={onUploadAnother}>
          <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
          Upload Another ZIP
        </Button>
      </div>
    </aside>
  );
});
ChatSidebar.displayName = 'ChatSidebar';
