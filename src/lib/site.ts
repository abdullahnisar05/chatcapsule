export const SITE_NAME = 'InstaChat Browser';

export const SITE_URL = (
  process.env.URL || 'https://instachatbrowser.netlify.app'
).replace(/\/$/, '');

export const SITE_DESCRIPTION =
  'Free, private Instagram chat viewer. Upload your Instagram data export ZIP and browse your DMs, photos, videos, and voice messages in a familiar chat UI — processed 100% locally in your browser.';

export const FAQS = [
  {
    question: 'What is InstaChat Browser?',
    answer:
      'InstaChat Browser is a free, browser-based viewer for Instagram data exports. It turns the ZIP file you download from Instagram into a familiar chat interface so you can read old direct messages, photos, videos, and voice notes.',
  },
  {
    question: 'How do I view my Instagram DMs from a data export?',
    answer:
      'In Instagram, go to Accounts Center, choose "Your information and permissions", then "Download your information", and request your messages in JSON format. When the ZIP is ready, download it and upload it to InstaChat Browser to browse every conversation.',
  },
  {
    question: 'Is it safe to upload my Instagram ZIP file?',
    answer:
      'Yes. The ZIP is never uploaded to any server. InstaChat Browser reads and renders the archive entirely inside your browser, so your messages and media stay on your device.',
  },
  {
    question: 'Does InstaChat Browser support photos, videos, and voice messages?',
    answer:
      'Yes. Photos, videos, stickers, shared links, reactions, and voice messages from the export are displayed inline, and voice notes can be played back with the built-in audio player.',
  },
  {
    question: 'Do I need an account or to install anything?',
    answer:
      'No. InstaChat Browser runs in any modern web browser with no sign-up, no login, and no software to install.',
  },
  {
    question: 'Is InstaChat Browser affiliated with Instagram or Meta?',
    answer:
      'No. InstaChat Browser is an independent tool made by Kluvox and is not affiliated with, endorsed by, or connected to Instagram or Meta.',
  },
];
