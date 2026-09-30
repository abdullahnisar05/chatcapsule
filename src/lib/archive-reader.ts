import JSZip from 'jszip';
import { chatExportSchema } from './archive-schemas';
import { fixEncoding } from './utils';
import { Chat } from '@/types/chat';

type ProgressCallback = (progress: number) => void;

export async function buildChatIndex(
  zip: JSZip,
  onProgress?: ProgressCallback,
): Promise<{ chats: Chat[]; frequentSender: string }> {
  const jsonFiles = Object.values(zip.files).filter(
    (file) => /message_\d+\.json$/.test(file.name) && file.name.includes('/inbox/'),
  );

  if (jsonFiles.length === 0) {
    throw new Error(
      'No chat files found. Ensure you are uploading the complete Instagram data export ZIP.',
    );
  }

  const chatsMap = new Map<string, string[]>();

  for (const file of jsonFiles) {
    const pathParts = file.name.split('/');
    const inboxIndex = pathParts.lastIndexOf('inbox');

    if (inboxIndex === -1 || !pathParts[inboxIndex + 1]) continue;

    const chatFolder = pathParts[inboxIndex + 1];
    const files = chatsMap.get(chatFolder) ?? [];
    files.push(file.name);
    chatsMap.set(chatFolder, files);
  }

  const entries = Array.from(chatsMap.entries());
  const processedChats: Array<Omit<Chat, 'messageFiles' | 'title'> & {
    rawTitle: string;
    messageFileNames: string[];
  }> = [];
  const senderCounts: Record<string, number> = {};

  for (let i = 0; i < entries.length; i += 10) {
    const batch = entries.slice(i, i + 10);

    for (const [chatFolder, files] of batch) {
      try {
        const message1FileName =
          files.find((name) => name.endsWith('message_1.json')) ?? files[0];
        const message1File = zip.file(message1FileName);

        if (!message1File) continue;

        const content = await message1File.async('string');
        const parsed = chatExportSchema.safeParse(JSON.parse(content));

        if (!parsed.success) continue;

        const data = parsed.data;
        const participants = (data.participants ?? []).map((participant) => ({
          name: fixEncoding(participant.name),
        }));
        const rawTitle = data.title ? fixEncoding(data.title) : chatFolder;
        const latestMessage = data.messages?.[0];

        let preview = 'No messages';
        let lastMessageTimestamp = Date.now();

        if (latestMessage) {
          lastMessageTimestamp =
            typeof latestMessage.timestamp_ms === 'number'
              ? latestMessage.timestamp_ms
              : Date.now();

          if (latestMessage.sender_name) {
            const sender = fixEncoding(latestMessage.sender_name);
            senderCounts[sender] = (senderCounts[sender] ?? 0) + 1;
          }

          if (latestMessage.content) preview = fixEncoding(latestMessage.content);
          else if (latestMessage.is_unsent) preview = 'Unsent a message';
          else if (latestMessage.sticker) preview = 'Sent a sticker';
          else if (latestMessage.share) preview = 'Shared a post';
          else preview = 'Attachment';
        }

        processedChats.push({
          id: chatFolder,
          rawTitle,
          participants,
          messageFileNames: files,
          preview,
          lastMessageTimestamp,
          participantCount: participants.length,
        });
      } catch {
        // A single broken conversation should not abort the whole archive.
      }
    }

    onProgress?.(Math.min(100, Math.floor(((i + batch.length) / entries.length) * 100)));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const frequentSender = Object.keys(senderCounts).reduce(
    (current, candidate) =>
      senderCounts[candidate] > senderCounts[current] ? candidate : current,
    '',
  );

  const chats: Chat[] = processedChats
    .map((chat) => {
      let title = chat.rawTitle;

      if (chat.participantCount <= 2) {
        const otherUser = chat.participants.find(
          (participant) => participant.name !== frequentSender,
        );
        title = otherUser?.name ?? chat.participants[0]?.name ?? chat.rawTitle;
      }

      return {
        id: chat.id,
        title,
        participants: chat.participants,
        messageFiles: chat.messageFileNames
          .map((name) => zip.file(name))
          .filter((file): file is JSZip.JSZipObject => !!file),
        preview: chat.preview,
        lastMessageTimestamp: chat.lastMessageTimestamp,
        participantCount: chat.participantCount,
      };
    })
    .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

  return { chats, frequentSender };
}
