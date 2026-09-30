"use client";

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Twemoji from 'react-twemoji';
import { cn, getInitials } from '@/lib/utils';
import { Chat } from '@/types/chat';

export const ChatListItem = React.memo(({ chat, isSelected, onClick, searchTerm }: {
    chat: Chat & { matchCount: number, titleMatch?: boolean },
    isSelected: boolean,
    onClick: () => void,
    searchTerm: string
}) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 mx-2 my-0.5 rounded-lg cursor-pointer transition-all duration-200",
                isSelected ? 'bg-[#262626]' : 'hover:bg-[#1a1a1a]'
            )}
        >
            <Avatar className="h-14 w-14 flex-shrink-0">
                <AvatarFallback className="bg-[#262626] text-[#f5f5f5] font-medium text-base">{getInitials(chat.title)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <p className="font-semibold truncate text-sm text-[#f5f5f5]">{chat.title}</p>
                    {!searchTerm && (
                        <p className="text-xs text-[#a8a8a8] whitespace-nowrap ml-2">
                            {new Date(chat.lastMessageTimestamp).toLocaleDateString()}
                        </p>
                    )}
                </div>
                {searchTerm ? (
                    <p className="text-xs text-[#a8a8a8] mt-0.5">
                        {chat.matchCount.toLocaleString()} matched messages
                    </p>
                ) : (
                    <Twemoji options={{ className: 'emoji' }}>
                        <p className="text-sm text-[#a8a8a8] truncate">{chat.preview}</p>
                    </Twemoji>
                )}
            </div>
        </div>
    );
});
ChatListItem.displayName = 'ChatListItem';
