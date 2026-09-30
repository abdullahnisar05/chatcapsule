import type { Metadata } from 'next';
import { ChatImporter } from '@/components/chat-importer';
import { ChatErrorBoundary } from '@/components/chat/chat-error-boundary';

export const metadata: Metadata = {
  title: 'Open Your Chats',
  description: 'Upload your Instagram data export ZIP and browse your conversations privately in your browser.',
  alternates: { canonical: '/app' },
};

export default function AppPage() {
  return <ChatErrorBoundary><ChatImporter /></ChatErrorBoundary>;
}
