import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Chat, Message } from '../types/chat';
import { fixMessageEncoding } from '../lib/utils';

export const useChatLoader = (selectedChat: Chat | undefined) => {
    const [activeMessages, setActiveMessages] = useState<Message[]>([]);
    const [isParsingMessages, setIsParsingMessages] = useState(false);

    useEffect(() => {
        if (!selectedChat) {
            setActiveMessages([]);
            return;
        }

        let isCancelled = false;
        const loadMessages = async () => {
            setIsParsingMessages(true);
            try {
                let chatMessages: Message[] = [];
                const files = [...selectedChat.messageFiles].sort((a, b) =>
                    parseInt(a.name.match(/message_(\d+)\.json/)?.[1] || '0') -
                    parseInt(b.name.match(/message_(\d+)\.json/)?.[1] || '0')
                );

                const mostRecentFile = files.find(f => f.name.endsWith('message_1.json')) || files[files.length - 1];
                if (mostRecentFile) {
                    const content = await mostRecentFile.async('string');
                    const data = JSON.parse(content);
                    if (data.messages && !isCancelled) {
                        const parsed = data.messages.map((m: any) => fixMessageEncoding(m));
                        chatMessages.push(...parsed);
                        chatMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);
                        setActiveMessages([...chatMessages]);
                    }
                }

                const otherFiles = files.filter(f => f !== mostRecentFile);
                for (let i = 0; i < otherFiles.length; i++) {
                    if (isCancelled) return;
                    const file = otherFiles[i];
                    const content = await file.async('string');
                    const data = JSON.parse(content);
                    if (data.messages) {
                        const parsed = data.messages.map((m: any) => fixMessageEncoding(m));
                        chatMessages.push(...parsed);
                    }

                    await new Promise(r => setTimeout(r, 0));
                    if (!isCancelled) {
                        const sorted = [...chatMessages].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
                        setActiveMessages(sorted);
                    }
                }
            } catch (e) {
                console.error("Failed to parse messages:", e);
            } finally {
                if (!isCancelled) setIsParsingMessages(false);
            }
        };

        loadMessages();
        return () => { isCancelled = true; };
    }, [selectedChat]);

    return { activeMessages, isParsingMessages };
};
