import { Chat, Message } from '../types/chat';
import { fixMessageEncoding } from './utils';
import { chatExportSchema } from './archive-schemas';

export type MessageLoadResult = {
  messages: Message[];
  warnings: string[];
};

export async function loadChatMessages(
  selectedChat: Chat,
  options: { isCancelled?: () => boolean } = {},
): Promise<MessageLoadResult> {
  const chatMessages: Message[] = [];
  const warnings: string[] = [];

  const files = [...selectedChat.messageFiles].sort((a, b) =>
    parseInt(a.name.match(/message_(\d+)\.json/)?.[1] || '0', 10) -
    parseInt(b.name.match(/message_(\d+)\.json/)?.[1] || '0', 10)
  );

  for (const file of files) {
    if (options.isCancelled?.()) return { messages: [], warnings: [] };

    try {
      const content = await file.async('string');
      const parsedExport = chatExportSchema.safeParse(JSON.parse(content));

      if (!parsedExport.success || !Array.isArray(parsedExport.data.messages)) {
        warnings.push(file.name);
        continue;
      }

      parsedExport.data.messages.forEach((rawMessage, index) => {
        const normalized = fixMessageEncoding(rawMessage);
        if (!normalized || typeof normalized !== 'object') return;

        chatMessages.push({
          ...normalized,
          id: selectedChat.id + ':' + file.name + ':' + index,
          type: normalized.type ?? 'Generic',
          is_unsent: normalized.is_unsent ?? false,
        } as Message);
      });
    } catch (error) {
      console.warn('Failed to parse ' + file.name, error);
      warnings.push(file.name);
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  chatMessages.sort((a, b) => {
    if (a.timestamp_ms !== b.timestamp_ms) return a.timestamp_ms - b.timestamp_ms;
    return a.id.localeCompare(b.id);
  });

  return { messages: chatMessages, warnings };
}