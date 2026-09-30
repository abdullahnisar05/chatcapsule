import { FAQS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} is a free web app, made by Kluvox, for reading Instagram direct messages from an official Instagram data export (ZIP, JSON format). All parsing happens client-side; no files are uploaded to a server. It is not affiliated with Instagram or Meta.

## Pages

- [Home](${SITE_URL}/): Overview, features, and how it works
- [Open the app](${SITE_URL}/app): Upload an Instagram export ZIP and browse conversations

## Features

- 100% local and private processing in the browser
- Familiar chat bubble UI with senders, timestamps, and reactions
- Photos, videos, stickers, shared links, and voice messages
- Search conversations and messages
- Handles large exports with lazy loading

## FAQ

${FAQS.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n')}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
