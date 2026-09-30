import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isEmojiOnly = (str: string) => {
  if (!str) return false;
  const strippedStr = str.replace(/\s/g, '');
  if (!strippedStr.length) return false;

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const segments = Array.from(segmenter.segment(strippedStr));
    const EMOJI_TEST = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/u;
    return segments.every(s => EMOJI_TEST.test(s.segment));
  }

  const EMOJI_REGEX = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Emoji_Component}\u200D\uFE0F\s]+$/u;
  return EMOJI_REGEX.test(str);
};

export const fixEncoding = (str: string): string => {
  try {
    // If str contains characters outside the Latin-1 range (e.g. Arabic, emojis),
    // then it's already decoded correctly or is not mojibake.
    for (let c of str) {
      if (c.codePointAt(0)! > 255) return str;
    }
    return new TextDecoder('utf-8').decode(Uint8Array.from(str.split('').map(c => c.charCodeAt(0))));
  } catch (e) {
    return str;
  }
};

const normalizeTimestamp = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value < 1e11 ? value * 1000 : value;
};

export const fixMessageEncoding = (m: any) => {
  if (!m || typeof m !== 'object') return m;

  const normalized = {
    ...m,
    content: typeof m.content === 'string' ? fixEncoding(m.content) : m.content,
    sender_name: typeof m.sender_name === 'string' ? fixEncoding(m.sender_name) : m.sender_name,
    reactions: Array.isArray(m.reactions)
      ? m.reactions.map((r: any) => ({
          ...r,
          reaction: typeof r.reaction === 'string' ? fixEncoding(r.reaction) : r.reaction,
          actor: typeof r.actor === 'string' ? fixEncoding(r.actor) : r.actor,
        }))
      : m.reactions,
    share: m.share
      ? {
          ...m.share,
          share_text: typeof m.share.share_text === 'string'
            ? fixEncoding(m.share.share_text)
            : m.share.share_text,
        }
      : m.share,
    reply: m.reply
      ? {
          ...m.reply,
          message: typeof m.reply.message === 'string' ? fixEncoding(m.reply.message) : m.reply.message,
          sender: typeof m.reply.sender === 'string' ? fixEncoding(m.reply.sender) : m.reply.sender,
          timestamp: normalizeTimestamp(m.reply.timestamp),
        }
      : m.reply,
    timestamp_ms: normalizeTimestamp(
      typeof m.timestamp_ms === 'number' ? m.timestamp_ms : m.timestamp,
    ),
  };

  return normalized;
};

export const isSafeHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value.trim()) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export const escapeRegex = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export function getInitials(name: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p[0]).filter(Boolean).join('').substring(0, 2).toUpperCase();
}
