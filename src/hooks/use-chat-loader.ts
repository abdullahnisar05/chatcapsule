import { useState, useEffect } from 'react';
import { Chat, Message } from '../types/chat';
import { loadChatMessages } from '../lib/message-loader';
import { isAbortError } from '../lib/abort';

export const useChatLoader = (selectedChat: Chat | undefined) => {
    const [activeMessages, setActiveMessages] = useState<Message[]>([]);
    const [isParsingMessages, setIsParsingMessages] = useState(false);
    const [parseWarning, setParseWarning] = useState<string | null>(null);
    const [messageLoadProgress, setMessageLoadProgress] = useState(0);

    useEffect(() => {
        if (!selectedChat) {
            setActiveMessages([]);
            setParseWarning(null);
            setMessageLoadProgress(0);
            setIsParsingMessages(false);
            return;
        }

        const controller = new AbortController();
        let isCancelled = false;

        const run = async () => {
            setIsParsingMessages(true);
            setParseWarning(null);
            setMessageLoadProgress(0);

            try {
                const result = await loadChatMessages(selectedChat, {
                    signal: controller.signal,
                    onProgress: setMessageLoadProgress,
                });

                if (isCancelled) return;

                setActiveMessages(result.messages);

                if (result.warnings.length > 0) {
                    const preview = result.warnings.slice(0, 2).join(', ');
                    const suffix = result.warnings.length > 2
                        ? ' and ' + (result.warnings.length - 2) + ' more'
                        : '';
                    setParseWarning('Some archive files could not be read: ' + preview + suffix + '.');
                }
            } catch (error) {
                if (isAbortError(error) || isCancelled) return;

                console.error('Failed to load messages:', error);
                setActiveMessages([]);
                setParseWarning(
                    'This conversation could not be read. The export may be incomplete or use an unsupported format.',
                );
            } finally {
                if (!isCancelled) setIsParsingMessages(false);
            }
        };

        void run();

        return () => {
            isCancelled = true;
            controller.abort();
        };
    }, [selectedChat]);

    return { activeMessages, isParsingMessages, parseWarning, messageLoadProgress };
};
