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

export const fixMessageEncoding = (m: any) => {
  if (m.content) m.content = fixEncoding(m.content);
  if (m.sender_name) m.sender_name = fixEncoding(m.sender_name);
  if (m.reactions && Array.isArray(m.reactions)) {
    m.reactions.forEach((r: any) => {
      if (r.reaction) r.reaction = fixEncoding(r.reaction);
      if (r.actor) r.actor = fixEncoding(r.actor);
    });
  }
  if (m.share && m.share.share_text) {
    m.share.share_text = fixEncoding(m.share.share_text);
  }
  if (m.reply) {
    if (m.reply.message) m.reply.message = fixEncoding(m.reply.message);
    if (m.reply.sender) m.reply.sender = fixEncoding(m.reply.sender);
    // Normalize reply timestamp to milliseconds when present
    if (m.reply.timestamp && typeof m.reply.timestamp === 'number') {
      // If timestamp looks like seconds (<= 1e11), convert to ms
      if (m.reply.timestamp < 1e11) m.reply.timestamp = m.reply.timestamp * 1000;
    }
  }
  // Normalize message timestamp_ms to milliseconds if needed
  if (m.timestamp_ms && typeof m.timestamp_ms === 'number') {
    if (m.timestamp_ms < 1e11) m.timestamp_ms = m.timestamp_ms * 1000;
  } else if (m.timestamp && typeof m.timestamp === 'number') {
    // Some exports use `timestamp` (seconds) instead of `timestamp_ms`
    m.timestamp_ms = m.timestamp < 1e11 ? m.timestamp * 1000 : m.timestamp;
  }

  return m;
};

export const escapeRegex = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export function getInitials(name: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p[0]).filter(Boolean).join('').substring(0, 2).toUpperCase();
}
