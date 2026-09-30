import { Chat, Message } from '@/types/chat';

const makeMessage = (
  id: string,
  sender_name: string,
  timestamp_ms: number,
  content: string,
): Message => ({
  id,
  sender_name,
  timestamp_ms,
  content,
  type: 'Generic',
  is_unsent: false,
});

export const DEMO_USER = 'Maya Chen';
export const DEMO_CONTACT = 'Alex Rivera';

export const DEMO_CHAT: Chat = {
  id: 'demo-chat',
  title: DEMO_CONTACT,
  participants: [{ name: DEMO_USER }, { name: DEMO_CONTACT }],
  messageFiles: [],
  preview: 'The archive looks great. Nice work!',
  lastMessageTimestamp: Date.UTC(2026, 8, 30, 13, 42),
  participantCount: 2,
};

const day1 = Date.UTC(2026, 8, 28);
const day2 = Date.UTC(2026, 8, 29);
const day3 = Date.UTC(2026, 8, 30);

export const DEMO_MESSAGES: Message[] = [
  makeMessage('demo-001', 'Alex Rivera', day1 + 9 * 3600000, 'Hey! I finally exported the old DMs.'),
  makeMessage('demo-002', 'Maya Chen', day1 + 9 * 3600000 + 90000, 'Nice. I wanted to see how the archive viewer handles them.'),
  makeMessage('demo-003', 'Alex Rivera', day1 + 9 * 3600000 + 210000, 'It is surprisingly fast.'),
  makeMessage('demo-004', 'Maya Chen', day1 + 9 * 3600000 + 390000, 'The important part is keeping the ZIP local.'),
  makeMessage('demo-005', 'Alex Rivera', day1 + 10 * 3600000, 'Exactly. I would never upload all of that to a random server.'),
  makeMessage('demo-006', 'Maya Chen', day1 + 10 * 3600000 + 240000, 'Same. Privacy should be the default here.'),
  makeMessage('demo-007', 'Alex Rivera', day1 + 11 * 3600000, 'I searched for “roadmap” and found our old plans.'),
  makeMessage('demo-008', 'Maya Chen', day1 + 11 * 3600000 + 120000, 'That search flow is the part I use most.'),
  makeMessage('demo-009', 'Alex Rivera', day1 + 13 * 3600000, 'Can we keep the viewer read-only?'),
  makeMessage('demo-010', 'Maya Chen', day1 + 13 * 3600000 + 90000, 'Definitely. It is an archive, not a new messaging client.'),

  makeMessage('demo-011', 'Alex Rivera', day2 + 8 * 3600000, 'Morning!'),
  makeMessage('demo-012', 'Maya Chen', day2 + 8 * 3600000 + 60000, 'Morning ☕'),
  makeMessage('demo-013', 'Alex Rivera', day2 + 9 * 3600000, 'The conversation list looks clean on mobile too.'),
  makeMessage('demo-014', 'Maya Chen', day2 + 9 * 3600000 + 180000, 'Good. That was one of the annoying parts to get right.'),
  makeMessage('demo-015', 'Alex Rivera', day2 + 10 * 3600000, 'The jump-to-result interaction feels much better now.'),
  makeMessage('demo-016', 'Maya Chen', day2 + 10 * 3600000 + 90000, 'And the large history should not mount thousands of DOM nodes.'),
  makeMessage('demo-017', 'Alex Rivera', day2 + 12 * 3600000, 'Virtualized timelines for the win.'),
  makeMessage('demo-018', 'Maya Chen', day2 + 12 * 3600000 + 90000, 'We should show that in the portfolio case study.'),
  makeMessage('demo-019', 'Alex Rivera', day2 + 15 * 3600000, 'Agreed.'),
  makeMessage('demo-020', 'Maya Chen', day2 + 15 * 3600000 + 180000, 'The architecture story is stronger than just screenshots.'),

  makeMessage('demo-021', 'Alex Rivera', day3 + 8 * 3600000, 'I like the new import progress state.'),
  makeMessage('demo-022', 'Maya Chen', day3 + 8 * 3600000 + 120000, 'It gives people confidence during a big import.'),
  makeMessage('demo-023', 'Alex Rivera', day3 + 9 * 3600000, 'The app feels less like a demo and more like a real tool.'),
  makeMessage('demo-024', 'Maya Chen', day3 + 9 * 3600000 + 120000, 'That is the goal.'),
  makeMessage('demo-025', 'Alex Rivera', day3 + 10 * 3600000, 'Could we add archive statistics next?'),
  makeMessage('demo-026', 'Maya Chen', day3 + 10 * 3600000 + 60000, 'Already planned. Messages, media, participants, date range.'),
  makeMessage('demo-027', 'Alex Rivera', day3 + 11 * 3600000, 'Perfect.'),
  makeMessage('demo-028', 'Maya Chen', day3 + 11 * 3600000 + 120000, 'It also makes a great portfolio detail page.'),
  makeMessage('demo-029', 'Alex Rivera', day3 + 13 * 3600000, 'The archive looks great. Nice work!'),
  makeMessage('demo-030', 'Maya Chen', day3 + 13 * 3600000 + 60000, 'Thanks — next step is making the whole pipeline even more robust.'),
];

export const DEMO_ARCHIVE_STATS = {
  messageCount: DEMO_MESSAGES.length,
  participantCount: 2,
  photoCount: 0,
  videoCount: 0,
  voiceCount: 0,
  firstMessageAt: DEMO_MESSAGES[0].timestamp_ms,
  lastMessageAt: DEMO_MESSAGES[DEMO_MESSAGES.length - 1].timestamp_ms,
};
