import type { Metadata } from 'next';
import { ChatImporter } from '@/components/chat-importer';
import { ChatErrorBoundary } from '@/components/chat/chat-error-boundary';

export const metadata: Metadata = {
  title: 'Try the Demo',
  description: 'Explore a fictional ChatCapsule archive without uploading your own data.',
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <ChatErrorBoundary title="The demo viewer hit an error"><ChatImporter demo /></ChatErrorBoundary>;
}
