import JSZip from 'jszip';
import { fixEncoding } from './utils';

self.onmessage = async (e: MessageEvent) => {
    try {
        const file = e.data;
        const zipFile = await JSZip.loadAsync(file);

        const jsonFiles = Object.values(zipFile.files).filter(f => f.name.match(/message_\d+\.json$/) && f.name.includes('/inbox/'));
        if (jsonFiles.length === 0) {
            self.postMessage({ type: 'ERROR', error: 'No chat files found. Ensure you are uploading the complete Instagram data export ZIP.' });
            return;
        }

        const chatsMap = new Map<string, { files: string[] }>();
        for (let i = 0; i < jsonFiles.length; i++) {
            const f = jsonFiles[i];
            const pathParts = f.name.split('/');
            const inboxIndex = pathParts.lastIndexOf('inbox');
            if (inboxIndex !== -1 && pathParts[inboxIndex + 1]) {
                const chatFolder = pathParts.slice(inboxIndex + 1, inboxIndex + 2)[0];
                if (!chatsMap.has(chatFolder)) chatsMap.set(chatFolder, { files: [] });
                chatsMap.get(chatFolder)!.files.push(f.name);
            }
            if (i % 100 === 0) await new Promise(r => setTimeout(r, 0));
        }

        const chatEntries = Array.from(chatsMap.entries());
        const processedChats: any[] = [];
        const senderCounts: Record<string, number> = {};

        const BATCH_SIZE = 10;
        for (let i = 0; i < chatEntries.length; i += BATCH_SIZE) {
            const batch = chatEntries.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async ([chatFolder, { files }]) => {
                try {
                    const message1FileName = files.find(name => name.endsWith('message_1.json')) || files[0];
                    const message1File = zipFile.file(message1FileName);
                    if (!message1File) return;
                    
                    const content = await message1File.async('string');
                    const data = JSON.parse(content);

                    const chatParticipants = (data.participants || []).map((p: any) => ({
                        name: p.name ? fixEncoding(p.name) : 'Unknown'
                    }));
                    const chatTitle = data.title ? fixEncoding(data.title) : chatFolder;
                    const lastMessageRaw = data.messages?.[0];

                    let preview = "No messages";
                    let lastTs = Date.now();
                    if (lastMessageRaw) {
                        lastTs = lastMessageRaw.timestamp_ms;
                        if (lastMessageRaw.sender_name) {
                            const sName = fixEncoding(lastMessageRaw.sender_name);
                            senderCounts[sName] = (senderCounts[sName] || 0) + 1;
                        }
                        if (lastMessageRaw.content) preview = fixEncoding(lastMessageRaw.content);
                        else if (lastMessageRaw.is_unsent) preview = "Unsent a message";
                        else if (lastMessageRaw.sticker) preview = "Sent a sticker";
                        else if (lastMessageRaw.share) preview = "Shared a post";
                        else preview = "Attachment";
                    }

                    processedChats.push({
                        id: chatFolder,
                        rawTitle: chatTitle,
                        participants: chatParticipants,
                        messageFileNames: files,
                        preview,
                        lastMessageTimestamp: lastTs,
                        participantCount: chatParticipants.length
                    });
                } catch (e) {
                    // silently ignore metadata parse errors for specific folders
                }
            }));
            
            self.postMessage({ type: 'PROGRESS', progress: Math.floor((i / chatEntries.length) * 100) });
            await new Promise(r => setTimeout(r, 0));
        }

        const frequentSender = Object.keys(senderCounts).reduce((a, b) => senderCounts[a] > senderCounts[b] ? a : b, '');
        
        const finalChats = processedChats.map(chat => {
            let title = chat.rawTitle;
            if (chat.participantCount <= 2) {
                const otherUser = chat.participants.find((p: { name: string }) => p.name !== frequentSender);
                title = otherUser ? otherUser.name : chat.participants[0]?.name || chat.rawTitle;
            }
            return { ...chat, title };
        }).sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

        self.postMessage({ type: 'SUCCESS', chats: finalChats, frequentSender });

    } catch (e: any) {
        self.postMessage({ type: 'ERROR', error: e.message || 'An unexpected error occurred while processing the file in the worker.' });
    }
};
