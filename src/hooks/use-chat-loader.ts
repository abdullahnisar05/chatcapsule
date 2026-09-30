import { useState, useEffect } from 'react';
import { Chat, Message } from '../types/chat';
import { fixMessageEncoding } from '../lib/utils';

export const useChatLoader = (selectedChat: Chat | undefined) => {
    const [activeMessages, setActiveMessages] = useState<Message[]>([]);
    const [isParsingMessages, setIsParsingMessages] = useState(false);
    const [parseWarning, setParseWarning] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedChat) {
            setActiveMessages([]);
            setParseWarning(null);
            return;
        }

        let isCancelled = false;

        const loadMessages = async () => {
            setIsParsingMessages(true);
            setParseWarning(null);

            const chatMessages: Message[] = [];
            const warnings: string[] = [];

            try {
                const files = [...selectedChat.messageFiles].sort((a, b) =>
                    parseInt(a.name.match(/message_(\d+)\.json/)?.[1] || '0', 10) -
                    parseInt(b.name.match(/message_(\d+)\.json/)?.[1] || '0', 10)
                );

                for (const file of files) {
                    if (isCancelled) return;

                    try {
                        const content = await file.async('string');
                        const data = JSON.parse(content);

                        if (!Array.isArray(data.messages)) {
                            warnings.push(file.name);
                            continue;
                        }

                        data.messages.forEach((rawMessage: any, index: number) => {
                            const normalized = fixMessageEncoding(rawMessage);
                            if (!normalized || typeof normalized !== 'object') return;

                            chatMessages.push({
                                ...normalized,
                                id: selectedChat.id + ':' + file.name + ':' + index,
                            } as Message);
                        });
                    } catch (error) {
                        console.warn('Failed to parse ' + file.name, error);
                        warnings.push(file.name);
                    }

                    await new Promise((resolve) => setTimeout(resolve, 0));
                }

                if (isCancelled) return;

                chatMessages.sort((a, b) => {
                    if (a.timestamp_ms !== b.timestamp_ms) {
                        return a.timestamp_ms - b.timestamp_ms;
                    }
                    return a.id.localeCompare(b.id);
                });

                setActiveMessages(chatMessages);

                if (warnings.length > 0) {
                    const preview = warnings.slice(0, 2).join(', ');
                    const suffix = warnings.length > 2 ? ' and ' + (warnings.length - 2) + ' more' : '';
                    setParseWarning('Some archive files could not be read: ' + preview + suffix + '.');
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
                if (!isCancelled) {
                    setActiveMessages([]);
                    setParseWarning('This conversation could not be read. The export may be incomplete or use an unsupported format.');
                }
            } finally {
                if (!isCancelled) setIsParsingMessages(false);
            }
        };

        void loadMessages();

        return () => {
            isCancelled = true;
        };
    }, [selectedChat]);

    return { activeMessages, isParsingMessages, parseWarning };
};
