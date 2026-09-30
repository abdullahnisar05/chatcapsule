import { useState, useEffect } from 'react';
import { Chat, Message } from '../types/chat';
import { loadChatMessages } from '../lib/message-loader';

export const useChatLoader = (selectedChat: Chat | undefined) => {
    const [activeMessages, setActiveMessages] = useState<Message[]>([]);
    const [isParsingMessages, setIsParsingMessages] = useState(false);
    const [parseWarning, setParseWarning] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedChat) {
            setActiveMessages([]);
            setParseWarning(null);
            setIsParsingMessages(false);
            return;
        }

        let isCancelled = false;

        const run = async () => {
            setIsParsingMessages(true);
            setParseWarning(null);

            try {
                const result = await loadChatMessages(selectedChat, {
                    isCancelled: () => isCancelled,
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
                console.error('Failed to load messages:', error);
                if (!isCancelled) {
                    setActiveMessages([]);
                    setParseWarning(
                        'This conversation could not be read. The export may be incomplete or use an unsupported format.',
                    );
                }
            } finally {
                if (!isCancelled) setIsParsingMessages(false);
            }
        };

        void run();

        return () => {
            isCancelled = true;
        };
    }, [selectedChat]);

    return { activeMessages, isParsingMessages, parseWarning };
};
