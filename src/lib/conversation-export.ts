import { Message } from '../types/chat';

const sanitizeFilename = (value: string) => {
  const normalized = value
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return (normalized || 'conversation').slice(0, 80);
};

const formatTimestamp = (timestampMs: number) => {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return 'Unknown time';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestampMs));
};

export type ConversationExportInput = {
  title: string;
  participants: string[];
  messages: Message[];
};

export function formatConversationText({
  title,
  participants,
  messages,
}: ConversationExportInput): string {
  const lines: string[] = [
    title,
    '='.repeat(Math.max(8, Math.min(80, title.length))),
    '',
    'Participants: ' + (participants.length > 0 ? participants.join(', ') : 'Unknown'),
    'Messages: ' + messages.length.toLocaleString(),
    '',
    'This archive was exported locally from ChatCapsule.',
    'Replies are read-only and media attachments are referenced by type.',
    '',
  ];

  for (const message of messages) {
    lines.push('[' + formatTimestamp(message.timestamp_ms) + '] ' + message.sender_name);

    if (message.is_unsent) {
      lines.push('Message unsent');
    } else if (message.content) {
      lines.push(message.content);
    } else if (message.photos?.length) {
      lines.push('[Photo' + (message.photos.length > 1 ? ' × ' + message.photos.length : '') + ']');
    } else if (message.videos?.length) {
      lines.push('[Video' + (message.videos.length > 1 ? ' × ' + message.videos.length : '') + ']');
    } else if (message.audio_files?.length) {
      lines.push('[Voice message]');
    } else if (message.sticker) {
      lines.push('[Sticker]');
    } else if (message.share) {
      lines.push('[Shared post]');
      if (message.share.share_text) lines.push(message.share.share_text);
      if (message.share.link) lines.push(message.share.link);
    } else {
      lines.push('[Attachment]');
    }

    if (message.reply?.message) {
      lines.push('↳ Reply: ' + message.reply.message);
    }

    if (message.reactions?.length) {
      lines.push(
        'Reactions: ' +
          message.reactions.map((reaction) => reaction.actor + ' → ' + reaction.reaction).join(', '),
      );
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

export function getConversationExportFilename(title: string): string {
  return sanitizeFilename(title) + '-chatcapsule.txt';
}

export function downloadConversationText(
  title: string,
  participants: string[],
  messages: Message[],
): void {
  const content = formatConversationText({ title, participants, messages });
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = getConversationExportFilename(title);
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
