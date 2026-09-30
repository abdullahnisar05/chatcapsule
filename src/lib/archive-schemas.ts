import { z } from 'zod';

export const mediaFileSchema = z.object({
  uri: z.string(),
  creation_timestamp: z.number().optional(),
}).passthrough();

export const reactionSchema = z.object({
  reaction: z.string().optional(),
  actor: z.string().optional(),
}).passthrough();

export const replySchema = z.object({
  message: z.string().optional(),
  sender: z.string().optional(),
  timestamp: z.number().optional(),
}).passthrough();

export const shareSchema = z.object({
  link: z.string().optional(),
  share_text: z.string().optional(),
}).passthrough();

export const rawMessageSchema = z.object({
  sender_name: z.string().optional(),
  timestamp_ms: z.number().optional(),
  timestamp: z.number().optional(),
  content: z.string().optional(),
  type: z.enum(['Generic', 'Share', 'Call', 'Subscribe']).optional(),
  is_unsent: z.boolean().optional(),
  photos: z.array(mediaFileSchema).optional(),
  videos: z.array(mediaFileSchema).optional(),
  audio_files: z.array(mediaFileSchema).optional(),
  sticker: mediaFileSchema.optional(),
  share: shareSchema.optional(),
  reactions: z.array(reactionSchema).optional(),
  reply: replySchema.optional(),
  call_duration: z.number().optional(),
}).passthrough();

export const chatExportSchema = z.object({
  title: z.string().optional(),
  participants: z.array(z.object({ name: z.string() }).passthrough()).optional(),
  messages: z.array(rawMessageSchema).optional(),
}).passthrough();

export type RawMessage = z.infer<typeof rawMessageSchema>;
