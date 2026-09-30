import { Chat, Message } from '../types/chat';
import { fixMessageEncoding } from './utils';
import { chatExportSchema } from './archive-schemas';
import { throwIfAborted } from './abort';

export type MessageLoadOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

export type MessageLoadResult = {
  messages: Message[];
  warnings: string[];
};

export async function loadChatMessages(
  selectedChat: Chat,
  options: MessageLoadOptions = {},
): Promise<MessageLoadResult> {
  const chatMessages: Message[] = [];
  const warnings: string[] = [];

  throwIfAborted(options.signal);

  const files = [...selectedChat.messageFiles].sort((a, b) =>
    parseInt(a.name.match(/message_(\d+)\.json/)?.[1] || '0', 10) -
    parseInt(b.name.match(/message_(\d+)\.json/)?.[1] || '0', 10)
  );

  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const file = files[fileIndex];
    throwIfAborted(options.signal);

    try {
      const content = await file.async('string');
      const parsedExport = chatExportSchema.safeParse(JSON.parse(content));

      if (!parsedExport.success || !Array.isArray(parsedExport.data.messages)) {
        warnings.push(file.name);
        continue;
      }

      const rawMessages = parsedExport.data.messages;
      for (let messageIndex = 0; messageIndex < rawMessages.length; messageIndex += 1) {
        if (messageIndex % 250 === 0) {
          throwIfAborted(options.signal);
          const fileProgress = rawMessages.length
            ? messageIndex / rawMessages.length
            : 1;
          options.onProgress?.(
            Math.floor(((fileIndex + fileProgress) / files.length) * 100),
          );
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const rawMessage = rawMessages[messageIndex];
        const normalized = fixMessageEncoding(rawMessage);
        if (!normalized || typeof normalized !== 'object') continue;

        chatMessages.push({
          ...normalized,
          id: selectedChat.id + ':' + file.name + ':' + messageIndex,
          type: normalized.type ?? 'Generic',
          is_unsent: normalized.is_unsent ?? false,
        } as Message);
      }
    } catch (error) {
      console.warn('Failed to parse ' + file.name, error);
      warnings.push(file.name);
    }

    options.onProgress?.(Math.floor(((fileIndex + 1) / files.length) * 100));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throwIfAborted(options.signal);
  chatMessages.sort((a, b) => {
    if (a.timestamp_ms !== b.timestamp_ms) return a.timestamp_ms - b.timestamp_ms;
    return a.id.localeCompare(b.id);
  });

  return { messages: chatMessages, warnings };
}