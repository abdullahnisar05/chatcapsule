import type { Metadata } from 'next';
import { ChatImporter } from '@/components/chat-importer';

export const metadata: Metadata = {
  title: 'Try the Demo',
  description: 'Explore a fictional ChatCapsule archive without uploading your own data.',
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <ChatImporter demo />;
}
