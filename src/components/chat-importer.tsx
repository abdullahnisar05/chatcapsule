"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { AlertCircle, FileUp, Loader2, PenSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Chat, MediaFile } from '@/types/chat';
import { useChatLoader } from '@/hooks/use-chat-loader';
import { buildChatIndex } from '@/lib/archive-reader';
import { clearBlobCache } from '@/lib/blob-cache';
import { DEMO_CHAT, DEMO_MESSAGES, DEMO_USER } from '@/lib/demo-data';
import { ChatSidebar } from './chat/chat-sidebar';
import { ChatHeader, ArchiveStats } from './chat/chat-header';
import { ChatTimeline } from './chat/chat-timeline';
import { ReadOnlyComposer } from './chat/read-only-composer';
import { Lightbox } from './chat/lightbox';
import { VirtualMessageListHandle } from './chat/virtual-message-list';

export function ChatImporter({ demo = false }: { demo?: boolean }) {
  const [allChats, setAllChats] = useState<Chat[]>(() => demo ? [DEMO_CHAT] : []);
  const [zip, setZip] = useState<JSZip | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(() => demo ? DEMO_CHAT.id : null);
  const [mainUser, setMainUser] = useState<string | null>(() => demo ? DEMO_USER : null);
  const [error, setError] = useState<string | null>(null);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [searchResultIndex, setSearchResultIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchIndexReady, setSearchIndexReady] = useState(false);
  const [lightboxData, setLightboxData] = useState<{ mediaFiles: MediaFile[]; index: number } | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const virtualListRef = useRef<VirtualMessageListHandle>(null);
  const searchWorkerRef = useRef<Worker | null>(null);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    return () => clearBlobCache();
  }, []);

  const selectedChat = useMemo(
    () => allChats.find((chat) => chat.id === selectedChatId),
    [allChats, selectedChatId]
  );

  const { activeMessages, isParsingMessages, parseWarning } = useChatLoader(
    demo ? undefined : selectedChat
  );
  const displayMessages = demo ? DEMO_MESSAGES : activeMessages;

  useEffect(() => {
    if (!selectedChat || displayMessages.length === 0) {
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

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data;

      if (data?.type === 'READY') {
        setSearchIndexReady(true);
        return;
      }

      if (data?.type === 'RESULTS' && data.requestId === searchRequestRef.current) {
        const ids = Array.isArray(data.ids) ? (data.ids as string[]) : [];
        setSearchResults(ids);
        setSearchResultIndex(ids.length > 0 ? 0 : -1);
      }
    };

    worker.onerror = () => {
      setSearchIndexReady(false);
      setSearchResults([]);
      setSearchResultIndex(-1);
    };

    worker.postMessage({
      type: 'BUILD',
      entries: displayMessages
        .filter((message) => Boolean(message.content))
        .map((message) => ({ id: message.id, text: message.content! })),
    });

    return () => {
      worker.terminate();
      if (searchWorkerRef.current === worker) searchWorkerRef.current = null;
    };
  }, [selectedChatId, displayMessages]);

  useEffect(() => {
    const worker = searchWorkerRef.current;
    const query = messageSearchTerm.trim();

    if (!worker || !searchIndexReady) {
      if (!query) {
        setSearchResults([]);
        setSearchResultIndex(-1);
      }
      return;
    }

    const requestId = ++searchRequestRef.current;
    worker.postMessage({ type: 'SEARCH', query: messageSearchTerm, requestId });

    if (!query) {
      setSearchResults([]);
      setSearchResultIndex(-1);
    }
  }, [messageSearchTerm, searchIndexReady]);

  const messageIndexById = useMemo(() => {
    const map = new Map<string, number>();
    displayMessages.forEach((message, index) => map.set(message.id, index));
    return map;
  }, [displayMessages]);

  const messageIndexByTimestamp = useMemo(() => {
    const map = new Map<number, number>();
    displayMessages.forEach((message, index) => {
      if (!map.has(message.timestamp_ms)) map.set(message.timestamp_ms, index);
    });
    return map;
  }, [displayMessages]);

  const archiveStats = useMemo<ArchiveStats>(() => {
    const stats = {
      messageCount: displayMessages.length,
      participantCount: selectedChat?.participantCount ?? 0,
      photoCount: 0,
      videoCount: 0,
      voiceCount: 0,
      firstMessageAt: displayMessages[0]?.timestamp_ms ?? 0,
      lastMessageAt: displayMessages[displayMessages.length - 1]?.timestamp_ms ?? 0,
    };

    for (const message of displayMessages) {
      stats.photoCount += message.photos?.length ?? 0;
      stats.videoCount += message.videos?.length ?? 0;
      stats.voiceCount += message.audio_files?.length ?? 0;
    }

    return stats;
  }, [displayMessages, selectedChat?.participantCount]);

  const senderCandidates = useMemo(() => {
    const names = new Set<string>();

    allChats.forEach((chat) => {
      chat.participants.forEach((participant) => {
        if (participant.name) names.add(participant.name);
      });
    });

    if (mainUser) names.add(mainUser);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allChats, mainUser]);

  const filteredChats = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return allChats.map((chat) => ({ ...chat, matchCount: 0 }));

    return allChats
      .filter((chat) => chat.title.toLowerCase().includes(term))
      .map((chat) => ({ ...chat, matchCount: 0 }));
  }, [allChats, debouncedSearchTerm]);

  const flashMessage = (id: string) => {
    const element = messageRefs.current.get(id);
    if (!element) return;

    element.classList.add('animate-pulse', 'bg-blue-500/20', 'rounded-lg');
    window.setTimeout(() => {
      element.classList.remove('animate-pulse', 'bg-blue-500/20', 'rounded-lg');
    }, 2000);
  };

  const scrollToMessage = (index: number, id: string) => {
    if (index < 0) return;
    virtualListRef.current?.scrollToIndex(index, {
      align: 'center',
      behavior: 'smooth',
    });
    window.setTimeout(() => flashMessage(id), 250);
  };

  const handleReplyClick = (timestamp: number) => {
    const targetIndex = messageIndexByTimestamp.get(timestamp) ?? -1;
    if (targetIndex === -1) return;

    const target = displayMessages[targetIndex];
    scrollToMessage(targetIndex, target.id);
  };

  const scrollToSearchResult = (index: number) => {
    if (index < 0 || index >= searchResults.length) return;

    const id = searchResults[index];
    const targetIndex = messageIndexById.get(id) ?? -1;
    if (targetIndex === -1) return;

    scrollToMessage(targetIndex, id);
  };

  const goToNextMatch = () => {
    if (searchResults.length === 0) return;

    const nextIndex = searchResultIndex < 0
      ? 0
      : (searchResultIndex + 1) % searchResults.length;

    setSearchResultIndex(nextIndex);
    scrollToSearchResult(nextIndex);
  };

  const goToPrevMatch = () => {
    if (searchResults.length === 0) return;

    const previousIndex = searchResultIndex < 0
      ? searchResults.length - 1
      : (searchResultIndex - 1 + searchResults.length) % searchResults.length;

    setSearchResultIndex(previousIndex);
    scrollToSearchResult(previousIndex);
  };

  const processFile = async (file: File) => {

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please upload a valid Instagram chat .zip file.');
      return;
    }

    clearBlobCache();
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    setImportWarning(null);
    setAllChats([]);
    setSelectedChatId(null);
    setMainUser(null);
    setZip(null);
    setMessageSearchTerm('');
    setSearchTerm('');

    try {
      const zipInstance = await JSZip.loadAsync(file);
      setZip(zipInstance);
      const { chats, frequentSender, warnings } = await buildChatIndex(zipInstance, setLoadingProgress);

      if (warnings.length > 0) {
        const preview = warnings.slice(0, 2).join(', ');
        const suffix = warnings.length > 2 ? ' and ' + (warnings.length - 2) + ' more' : '';
        setImportWarning('Some conversations could not be indexed: ' + preview + suffix + '.');
      }

      setMainUser(frequentSender || null);
      setAllChats(chats);
      setSelectedChatId(chats[0]?.id ?? null);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'An unexpected error occurred while reading the file.';
      setError(message);
      setZip(null);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const renderInitialView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-4">
      <Card className="w-full max-w-lg shadow-2xl bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-headline tracking-tight text-white">ChatCapsule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              'text-center space-y-4 p-8 border-2 border-dashed rounded-lg transition-colors',
              isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600',
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            role="region"
            aria-label="Instagram ZIP upload area"
          >
            <FileUp className="mx-auto h-12 w-12 text-gray-500" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-white">Upload your Instagram Chat ZIP</h3>
            <p className="text-gray-400">Processed entirely on your device. Your archive is never uploaded.</p>
            <p className="text-xs text-gray-500">Drop a .zip file here or choose one from your device.</p>
            <Input ref={fileInputRef} type="file" accept=".zip,application/zip" onChange={handleFileChange} className="hidden" />
            <Button onClick={triggerFileSelect} aria-label="Select Instagram ZIP file">
              <FileUp className="mr-2 h-4 w-4" aria-hidden="true" /> Select .zip file
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-black px-4" role="status" aria-live="polite">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" aria-hidden="true" />
        <p className="mt-4 text-gray-300 font-medium">Preparing your archive</p>
        <p className="mt-1 text-sm text-gray-500">Everything stays in your browser.</p>
        <div className="mt-6 w-full max-w-sm">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
            <div className="h-full rounded-full bg-blue-500 transition-[width] duration-200" style={{ width: loadingProgress + '%' }} />
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
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full mt-4" onClick={() => { setError(null); triggerFileSelect(); }}>
              Try Again
            </Button>
          </CardContent>
        </Card>
        <Input ref={fileInputRef} type="file" accept=".zip,application/zip" onChange={handleFileChange} className="hidden" />
      </div>
    );
  }

  if (allChats.length === 0) return renderInitialView();

  return (
    <div className="grid md:grid-cols-[350px_1fr] h-screen w-full overflow-hidden font-body antialiased bg-background text-on-surface">
      <div className={cn('h-full overflow-hidden', selectedChatId && 'hidden md:block')}>
        <ChatSidebar
          chats={filteredChats}
          selectedChatId={selectedChatId}
          searchTerm={searchTerm}
          mainUser={mainUser}
          senderCandidates={senderCandidates}
          onSearchChange={setSearchTerm}
          onMainUserChange={setMainUser}
          onSelectChat={(id) => {
            setSelectedChatId(id);
            setMessageSearchTerm('');
            setShowHeaderSearch(false);
          }}
          onUploadAnother={triggerFileSelect}
        />
      </div>

      <section className={cn('flex flex-col h-full overflow-hidden bg-background relative', !selectedChatId && 'hidden md:flex')} aria-label="Conversation viewer">
        {selectedChat ? (
          <>
            <ChatHeader
              chat={selectedChat}
              stats={archiveStats}
              demo={demo}
              messageSearchTerm={messageSearchTerm}
              showHeaderSearch={showHeaderSearch}
              searchResultIndex={searchResultIndex}
              searchResultCount={searchResults.length}
              searchIndexReady={searchIndexReady}
              onBack={() => setSelectedChatId(null)}
              onOpenSearch={() => setShowHeaderSearch(true)}
              onSearchChange={setMessageSearchTerm}
              onSearchKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  event.shiftKey ? goToPrevMatch() : goToNextMatch();
                }
                if (event.key === 'Escape') {
                  setMessageSearchTerm('');
                  setShowHeaderSearch(false);
                }
              }}
              onSearchBlur={() => {
                if (!messageSearchTerm) setShowHeaderSearch(false);
              }}
              onPrevMatch={goToPrevMatch}
              onNextMatch={goToNextMatch}
              onCloseSearch={() => {
                setMessageSearchTerm('');
                setShowHeaderSearch(false);
              }}
            />

            {importWarning && (
              <Alert className="mx-4 mt-3 border-amber-500/30 bg-amber-500/10 text-amber-100" role="status">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Archive warning</AlertTitle>
                <AlertDescription>{importWarning}</AlertDescription>
              </Alert>
            )}

            <ChatTimeline
              chat={selectedChat}
              messages={displayMessages}
              mainUser={mainUser}
              messageSearchTerm={messageSearchTerm}
              searchResults={searchResults}
              searchResultIndex={searchResultIndex}
              isParsingMessages={isParsingMessages}
              parseWarning={parseWarning}
              zip={zip}
              virtualListRef={virtualListRef}
              messageRefs={messageRefs}
              onReplyClick={handleReplyClick}
              onImageClick={(files, index) => setLightboxData({ mediaFiles: files, index })}
            />

            <ReadOnlyComposer />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center" role="status">
            <div className="text-gray-500">
              <PenSquare className="mx-auto h-12 w-12" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-medium text-white">No conversation selected</h3>
              <p className="mt-1 text-sm">Choose one from the left to get started.</p>
            </div>
          </div>
        )}
      </section>

      {lightboxData && (
        <Lightbox
          zip={zip}
          mediaFiles={lightboxData.mediaFiles}
          initialIndex={lightboxData.index}
          onClose={() => setLightboxData(null)}
        />
      )}

      <Input ref={fileInputRef} type="file" accept=".zip,application/zip" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
