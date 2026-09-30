"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2, FileUp, AlertCircle, ArrowLeft, Search, PenSquare,
  Instagram, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X,
  Smile, Mic, Image as ImageIcon
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip"
import Twemoji from 'react-twemoji';

import { cn, isEmojiOnly, fixEncoding, fixMessageEncoding, escapeRegex, getInitials } from '@/lib/utils';
import { Chat, Message, MediaFile, Share, Reaction, Reply } from '@/types/chat';
import { useChatLoader } from '@/hooks/use-chat-loader';

// --- Modular Chat Components ---
import { MessageTimestamp, DateDivider, ReactionsDisplay, SystemMessage } from './chat/ui';
import { VoiceMessagePlayer } from './chat/voice-message-player';
import { MediaDisplay, LazyMediaDisplay } from './chat/media-display';
import { MessageBubble } from './chat/message-bubble';
import { Lightbox } from './chat/lightbox';
import { ChatListItem } from './chat/chat-list-item';
import { VirtualMessageList, VirtualMessageListHandle } from './chat/virtual-message-list';

// --- Custom Hooks ---

// --- Main Component ---
export function ChatImporter() {
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [zip, setZip] = useState<JSZip | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [mainUser, setMainUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [searchResultIndex, setSearchResultIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchIndexReady, setSearchIndexReady] = useState(false);
  const [lightboxData, setLightboxData] = useState<{ mediaFiles: MediaFile[], index: number } | null>(null);

  // Debounced search for better sidebar performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const virtualListRef = useRef<VirtualMessageListHandle>(null);
  const searchWorkerRef = useRef<Worker | null>(null);
  const searchRequestRef = useRef(0);

  const selectedChat = useMemo(() => allChats.find(c => c.id === selectedChatId), [allChats, selectedChatId]);

  // USE MODULAR LOADER HOOK
  const { activeMessages, isParsingMessages, parseWarning } = useChatLoader(selectedChat);

  useEffect(() => {
    if (!selectedChat || !activeMessages.length) {
      searchWorkerRef.current?.terminate();
      searchWorkerRef.current = null;
      setSearchIndexReady(false);
      setSearchResults([]);
      setSearchResultIndex(-1);
      return;
    }

    const worker = new Worker(new URL('../lib/search-worker', import.meta.url), { type: 'module' });
    searchWorkerRef.current = worker;
    setSearchIndexReady(false);
    setSearchResults([]);
    setSearchResultIndex(-1);

    worker.onmessage = (event) => {
      const data = event.data;

      if (data?.type === 'READY') {
        setSearchIndexReady(true);
        return;
      }

      if (data?.type === 'RESULTS' && data.requestId === searchRequestRef.current) {
        const ids = Array.isArray(data.ids) ? data.ids as string[] : [];
        setSearchResults(ids);
        setSearchResultIndex(ids.length > 0 ? ids.length - 1 : -1);
      }
    };

    worker.onerror = () => {
      setSearchIndexReady(false);
      setSearchResults([]);
      setSearchResultIndex(-1);
    };

    worker.postMessage({
      type: 'BUILD',
      entries: activeMessages
        .filter(message => !!message.content)
        .map(message => ({
          id: message.id,
          text: message.content!.toLowerCase(),
        })),
    });

    return () => {
      worker.terminate();
      if (searchWorkerRef.current === worker) {
        searchWorkerRef.current = null;
      }
    };
  }, [selectedChatId, activeMessages]);

  useEffect(() => {
    const worker = searchWorkerRef.current;

    if (!worker || !searchIndexReady) {
      if (!messageSearchTerm) {
        setSearchResults([]);
        setSearchResultIndex(-1);
      }
      return;
    }

    const requestId = ++searchRequestRef.current;
    worker.postMessage({
      type: 'SEARCH',
      query: messageSearchTerm,
      requestId,
    });

    if (!messageSearchTerm.trim()) {
      setSearchResults([]);
      setSearchResultIndex(-1);
    }
  }, [messageSearchTerm, searchIndexReady]);


  const messageIndexById = useMemo(() => {
    const map = new Map<string, number>();
    activeMessages.forEach((message, index) => map.set(message.id, index));
    return map;
  }, [activeMessages]);

  const messageIndexByTimestamp = useMemo(() => {
    const map = new Map<number, number>();
    activeMessages.forEach((message, index) => {
      if (!map.has(message.timestamp_ms)) map.set(message.timestamp_ms, index);
    });
    return map;
  }, [activeMessages]);

  const flashMessage = (id: string) => {
    const el = messageRefs.current.get(id);
    if (!el) return;

    el.classList.add('animate-pulse', 'bg-blue-500/20', 'rounded-lg');
    window.setTimeout(() => {
      el.classList.remove('animate-pulse', 'bg-blue-500/20', 'rounded-lg');
    }, 2000);
  };

  const handleReplyClick = (timestamp: number) => {
    const targetIndex = messageIndexByTimestamp.get(timestamp) ?? -1;
    if (targetIndex === -1) return;

    const target = activeMessages[targetIndex];
    virtualListRef.current?.scrollToIndex(targetIndex, { align: 'center', behavior: 'smooth' });
    window.setTimeout(() => flashMessage(target.id), 250);
  };

  const scrollToSearchResult = (index: number) => {
    if (index < 0 || index >= searchResults.length) return;

    const id = searchResults[index];
    const targetIndex = messageIndexById.get(id) ?? -1;
    if (targetIndex === -1) return;

    virtualListRef.current?.scrollToIndex(targetIndex, { align: 'center', behavior: 'smooth' });
    window.setTimeout(() => flashMessage(id), 250);
  };

  const goToNextMatch = () => {
    if (searchResults.length === 0) return;

    const nextIndex = (searchResultIndex + 1) % searchResults.length;
    setSearchResultIndex(nextIndex);
    scrollToSearchResult(nextIndex);
  };

  const goToPrevMatch = () => {
    if (searchResults.length === 0) return;

    const prevIndex = (searchResultIndex - 1 + searchResults.length) % searchResults.length;
    setSearchResultIndex(prevIndex);
    scrollToSearchResult(prevIndex);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Please upload a valid Instagram chat .zip file.');
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    setAllChats([]);
    setSelectedChatId(null);
    setMainUser(null);
    setZip(null);

    const worker = new Worker(new URL('../lib/parse-worker', import.meta.url), { type: 'module' });

    try {
      // Read the central directory on the main thread (needed later for
      // on-demand message/media reads) at the same time the worker parses
      // chat metadata, instead of waiting for one before starting the other.
      const zipPromise = JSZip.loadAsync(file);
      const workerPromise = new Promise<any>((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data?.type === 'PROGRESS') {
            setLoadingProgress(Math.max(0, Math.min(100, Number(e.data.progress) || 0)));
            return;
          }

          if (e.data?.type === 'SUCCESS' || e.data?.type === 'ERROR') {
            setLoadingProgress(100);
            resolve(e.data);
          }
        };
        worker.onerror = () => reject(new Error('Failed to parse the ZIP file in the background worker.'));
      });
      worker.postMessage(file);

      const [zipInstance, workerData] = await Promise.all([zipPromise, workerPromise]);
      setZip(zipInstance);

      if (workerData.type === 'SUCCESS') {
        const { chats, frequentSender } = workerData;
        // Rehydrate messageFiles from names using zipInstance
        const hydratedChats = chats.map((c: any) => ({
          ...c,
          messageFiles: c.messageFileNames.map((name: string) => zipInstance.file(name)).filter(Boolean)
        }));

        setMainUser(frequentSender);
        setAllChats(hydratedChats);
      } else {
        setError(workerData.error);
        setZip(null);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while reading the file.');
      setZip(null);
    } finally {
      setIsLoading(false);
      worker.terminate();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const senderCandidates = useMemo(() => {
    const names = new Set<string>();

    allChats.forEach(chat => {
      chat.participants.forEach(participant => {
        if (participant.name) names.add(participant.name);
      });
    });

    if (mainUser) names.add(mainUser);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allChats, mainUser]);

  const senderCandidates = useMemo(() => {
    const names = new Set<string>();

    allChats.forEach(chat => {
      chat.participants.forEach(participant => {
        if (participant.name) names.add(participant.name);
      });
    });

    if (mainUser) names.add(mainUser);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allChats, mainUser]);

  const filteredChats = useMemo(() => {
    if (!debouncedSearchTerm) return allChats.map(chat => ({ ...chat, matchCount: 0 }));
    const term = debouncedSearchTerm.toLowerCase();
    return allChats
      .map(chat => {
        const titleMatch = chat.title.toLowerCase().includes(term);
        return { ...chat, matchCount: 0, titleMatch };
      })
      .filter(chat => chat.titleMatch);
  }, [allChats, debouncedSearchTerm]);

  const renderInitialView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-4">
      <Card className="w-full max-w-lg shadow-2xl bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-headline tracking-tight text-white">ChatCapsule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4 p-8 border-2 border-dashed border-gray-600 rounded-lg">
            <FileUp className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="text-xl font-semibold text-white">Upload your Instagram Chat ZIP</h3>
            <p className="text-gray-400">Processed entirely on your device. Your archive is never uploaded.</p>
            <Input ref={fileInputRef} type="file" accept=".zip" onChange={handleFileChange} className="hidden" suppressHydrationWarning />
            <Button onClick={triggerFileSelect}><FileUp className="mr-2 h-4 w-4" /> Select .zip file</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-black px-4">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-300 font-medium">Preparing your archive</p>
        <p className="mt-1 text-sm text-gray-500">Everything stays in your browser.</p>
        <div className="mt-6 w-full max-w-sm">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
              style={{ width: loadingProgress + '%' }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Indexing conversations</span>
            <span>{loadingProgress}%</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
        <Card className="w-full max-w-lg shadow-2xl bg-gray-900 border-gray-700">
          <CardContent className="p-6">
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
            <Button variant="outline" className="w-full mt-4" onClick={() => { setError(null); triggerFileSelect(); }}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (allChats.length === 0) {
    return renderInitialView();
  }

  return (
    <div className="grid md:grid-cols-[350px_1fr] h-screen w-full overflow-hidden font-body antialiased bg-background text-on-surface">
      <div className={cn("flex flex-col h-full overflow-hidden border-r border-[#262626] bg-background transition-colors duration-300", selectedChatId && 'hidden md:flex')}>
        <div className="p-4 flex flex-col gap-4 bg-background shrink-0 z-10 border-b border-[#262626]">
          <h1 className="text-2xl font-headline font-semibold tracking-tight">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <Input placeholder="Search" className="pl-9 rounded-full bg-surface-container-high border-none text-on-surface placeholder:text-on-surface-variant focus-visible:ring-1 focus-visible:ring-on-surface-variant" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-[2px] p-2">
          <div className="mx-1 mb-2 rounded-xl border border-[#262626] bg-surface-container-low p-3">
            <label htmlFor="main-user" className="text-xs font-semibold text-on-surface">
              Message alignment
            </label>
            <select
              id="main-user"
              value={mainUser || ''}
              onChange={(event) => setMainUser(event.target.value || null)}
              className="mt-2 h-9 w-full rounded-lg border border-[#363636] bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-blue-500"
            >
              {senderCandidates.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">
              Used only to place your messages on the right side.
            </p>
          </div>

          {filteredChats.map(chat => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChatId === chat.id}
              onClick={() => { setSelectedChatId(chat.id); setMessageSearchTerm(""); }}
              searchTerm={searchTerm}
            />
          ))}
        </div>
        <div className="p-4 mt-auto">
          <Button variant="outline" className="w-full border-outline-variant/15 text-on-surface hover:bg-surface-bright rounded-full bg-transparent" onClick={triggerFileSelect}>Upload Another ZIP</Button>
        </div>
      </div>

      <div className={cn("flex flex-col h-full overflow-hidden bg-background relative", !selectedChatId && 'hidden md:flex')}>
        {selectedChat ? (
          <>
            <div className="p-3 flex items-center gap-3 sticky top-0 bg-background z-20 border-b border-[#262626]">
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-surface-container-high rounded-full" onClick={() => setSelectedChatId(null)}><ArrowLeft className="text-on-surface" /></Button>
              <Avatar className="h-10 w-10"><AvatarFallback className="bg-surface-container-high font-headline">{getInitials(selectedChat.title)}</AvatarFallback></Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-headline font-semibold truncate" title={selectedChat.title}>{selectedChat.title}</h2>
                <p className="text-sm text-on-surface-variant">{selectedChat.participantCount} participants</p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className={cn("flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg transition-all px-3 py-1 overflow-hidden",
                  (messageSearchTerm || showHeaderSearch) ? "w-[220px] sm:w-[380px]" : "w-0 border-none p-0")}>
                  <Input
                    placeholder="Find in chat..."
                    className="h-8 bg-transparent border-none text-sm focus-visible:ring-0 p-0 flex-1 placeholder:text-zinc-500"
                    value={messageSearchTerm}
                    onChange={e => setMessageSearchTerm(e.target.value)}
                    onBlur={() => !messageSearchTerm && setShowHeaderSearch(false)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) goToPrevMatch();
                        else goToNextMatch();
                      }
                      if (e.key === 'Escape') {
                        setMessageSearchTerm("");
                        setShowHeaderSearch(false);
                      }
                    }}
                    autoFocus
                  />
                  {messageSearchTerm && (
                    <div className="flex items-center gap-3 ml-2 h-5 text-zinc-400">
                      <span className={cn(
                        "text-[12px] whitespace-nowrap font-medium min-w-[50px] text-right",
                        searchResults.length === 0 && "text-red-400"
                      )}>
                        {searchResults.length > 0 ? `${searchResultIndex + 1}/${searchResults.length.toLocaleString()}` : 'No results'}
                      </span>
                      <div className="w-[1px] h-full bg-zinc-700 mx-1" />
                      <div className="flex items-center">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 hover:bg-zinc-800 hover:text-white transition-colors"
                          onClick={goToPrevMatch}
                          disabled={searchResults.length === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 hover:bg-zinc-800 hover:text-white transition-colors"
                          onClick={goToNextMatch}
                          disabled={searchResults.length === 0}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 hover:bg-zinc-800 hover:text-white transition-colors"
                        onClick={() => { setMessageSearchTerm(""); setShowHeaderSearch(false); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {!messageSearchTerm && !showHeaderSearch && (
                  <Button variant="ghost" size="icon" onClick={() => setShowHeaderSearch(true)}>
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 z-10">
              {parseWarning && !isParsingMessages && (
                <Alert className="mx-4 mt-3 border-amber-500/20 bg-amber-500/5 text-amber-100">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Some messages could not be read</AlertTitle>
                  <AlertDescription>{parseWarning}</AlertDescription>
                </Alert>
              )}

              {isParsingMessages ? (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                </div>
              ) : (
                <VirtualMessageList
                  key={selectedChatId}
                  ref={virtualListRef}
                  className="h-full overflow-y-auto p-4 pr-6 scroll-smooth"
                  items={activeMessages}
                  initialItemIndex={activeMessages.length - 1}
                  estimatedItemHeight={78}
                  overscan={10}
                  getItemKey={(msg) => msg.id}
                  renderItem={(msg, index) => {
                    const previousMessage = activeMessages[index - 1];
                    const nextMessage = activeMessages[index + 1];
                    const messageDate = new Date(msg.timestamp_ms).toDateString();
                    const previousDate = previousMessage ? new Date(previousMessage.timestamp_ms).toDateString() : null;
                    const nextDate = nextMessage ? new Date(nextMessage.timestamp_ms).toDateString() : null;
                    const showDateDivider = index === 0 || messageDate !== previousDate;
                    const isMainUser = msg.sender_name === mainUser;
                    const isFirstInGroup = showDateDivider || !previousMessage || previousMessage.sender_name !== msg.sender_name;
                    const isLastInGroup = !nextMessage || nextMessage.sender_name !== msg.sender_name || nextDate !== messageDate;

                    const isSystemMessage = msg.type === "Generic" && !!msg.content && (
                      msg.content.includes(" named the group ") ||
                      msg.content.includes(" joined the group") ||
                      msg.content.includes(" left the group") ||
                      msg.content.includes(" set the theme to ") ||
                      msg.content.includes(" set the nickname for ") ||
                      msg.content.includes(" set your nickname to ") ||
                      msg.content.includes(" deleted a collection") ||
                      (msg.content.includes(" removed ") && msg.content.includes(" from the group"))
                    );

                    const isLastMessage = index === activeMessages.length - 1;
                    const isSearchResult = searchResults.includes(msg.id);
                    const isActiveSearchResult = isSearchResult && searchResults[searchResultIndex] === msg.id;
                    const showSeenStatus = isMainUser && isLastMessage && selectedChat.participantCount === 2;

                    return (
                      <div
                        ref={(element) => {
                          if (element) messageRefs.current.set(msg.id, element);
                          else messageRefs.current.delete(msg.id);
                        }}
                        className={cn(
                          "transition-colors rounded-lg",
                          isActiveSearchResult && "bg-blue-500/10 ring-1 ring-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        )}
                      >
                        {showDateDivider && <DateDivider timestamp_ms={msg.timestamp_ms} />}
                        {isSystemMessage ? (
                          <SystemMessage content={msg.content!} />
                        ) : (
                          <MessageBubble
                            message={msg}
                            isMainUser={isMainUser}
                            isGroupChat={selectedChat.participantCount > 2}
                            isFirstInGroup={isFirstInGroup}
                            isLastInGroup={isLastInGroup}
                            searchTerm={messageSearchTerm}
                            zip={zip}
                            onReplyClick={handleReplyClick}
                            onImageClick={(files, i) => setLightboxData({ mediaFiles: files, index: i })}
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
            </div>
            <div className="p-4 z-10 bg-background">
              <div className="flex items-center gap-3 bg-surface-container-high rounded-full px-4 py-2 border border-[#262626]">
                <Smile className="h-6 w-6 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors" />
                <input
                  type="text"
                  placeholder="Archived conversation — replies are disabled"
                  readOnly
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm text-on-surface placeholder:text-on-surface-variant min-h-[32px]"
                />
                <Mic className="h-6 w-6 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors" />
                <ImageIcon className="h-6 w-6 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-gray-500">
              <PenSquare className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-medium text-white">No conversation selected</h3>
              <p className="mt-1 text-sm">Choose one from the left to get started.</p>
            </div>
          </div>
        )}
      </div>
      {lightboxData && (
        <Lightbox
          zip={zip}
          mediaFiles={lightboxData.mediaFiles}
          initialIndex={lightboxData.index}
          onClose={() => setLightboxData(null)}
        />
      )}
    </div>
  );
}
