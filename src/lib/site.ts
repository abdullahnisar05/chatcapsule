export const SITE_NAME = 'ChatCapsule';

export const SITE_URL = (
  process.env.URL || 'https://chatcapsule.netlify.app'
).replace(/\/$/, '');

export const SITE_DESCRIPTION =
  'Private Instagram DM archive viewer. Open your Instagram data export in your browser, search conversations, and revisit messages and media without uploading your archive.';

export const FAQS = [
  {
    question: 'What is ChatCapsule?',
    answer:
      'ChatCapsule is a free, browser-based viewer for Instagram data exports. It turns the ZIP file you download from Instagram into a searchable chat archive for messages, photos, videos, and voice notes.',
  },
  {
    question: 'How do I view my Instagram DMs from a data export?',
    answer:
      'Request your information from Instagram in JSON format, download the resulting ZIP, then open it in ChatCapsule. The archive is processed locally in your browser.',
  },
  {
    question: 'Does ChatCapsule upload my Instagram ZIP?',
    answer:
      'No. ChatCapsule is designed as a local-first viewer: the archive is read and rendered in your browser rather than uploaded to a ChatCapsule server.',
  },
  {
    question: 'Does ChatCapsule support photos, videos, and voice messages?',
    answer:
      'Yes. Supported exports can include photos, videos, stickers, shared posts, reactions, and voice messages, which ChatCapsule renders in the archive viewer.',
  },
  {
    question: 'Do I need an account or an installation?',
    answer:
      'No. ChatCapsule runs in a modern web browser with no sign-up and no software installation.',
  },
  {
    question: 'Is ChatCapsule affiliated with Instagram or Meta?',
    answer:
      'No. ChatCapsule is an independent project and is not affiliated with, endorsed by, or connected to Instagram or Meta.',
  },
];
