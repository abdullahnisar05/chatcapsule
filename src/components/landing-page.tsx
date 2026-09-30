import Link from 'next/link';
import {
  ShieldCheck, Search, Image as ImageIcon, Mic, MessagesSquare,
  Upload, FolderDown, MousePointerClick, ArrowRight, Instagram,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FAQS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#chatcapsule`,
      name: 'ChatCapsule',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': `${SITE_URL}/#chatcapsule` },
    },
    {
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: `${SITE_URL}/app`,
      description: SITE_DESCRIPTION,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires a modern web browser with JavaScript enabled',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      creator: { '@id': `${SITE_URL}/#chatcapsule` },
      featureList: [
        'View Instagram chat history from a data export ZIP',
        'Search conversations and messages',
        'Photos, videos, stickers, and voice messages',
        '100% local processing — nothing is uploaded',
      ],
    },
    {
      '@type': 'HowTo',
      name: 'How to view your Instagram DMs from a data export',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Request your data', text: 'From Instagram, request a download of your data in JSON format and wait for the ZIP export.' },
        { '@type': 'HowToStep', position: 2, name: 'Upload the ZIP', text: 'Open ChatCapsule and select the exported .zip file. It is processed entirely on your device.' },
        { '@type': 'HowToStep', position: 3, name: 'Browse instantly', text: 'Pick any conversation from the list and scroll through it just like the original app.' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
};

const FEATURES = [
  {
    icon: ShieldCheck,
    title: '100% local & private',
    description: "Your ZIP never leaves your device. Everything is parsed and rendered right in your browser — nothing is uploaded to any server.",
  },
  {
    icon: MessagesSquare,
    title: 'Familiar chat UI',
    description: 'Browse every conversation in a clean, familiar bubble layout with senders, timestamps, and reactions intact.',
  },
  {
    icon: ImageIcon,
    title: 'Rich media support',
    description: 'View photos, videos, stickers, and shared links inline, exactly as they appeared in the original chat.',
  },
  {
    icon: Mic,
    title: 'Voice messages',
    description: 'Play back voice notes directly in the viewer with a built-in audio player.',
  },
  {
    icon: Search,
    title: 'Powerful search',
    description: 'Instantly filter conversations by name or search inside a chat to jump straight to the message you need.',
  },
  {
    icon: FolderDown,
    title: 'Handles large exports',
    description: 'Uses windowed rendering and lazy media loading to keep long chat histories responsive.',
  },
];

const STEPS = [
  {
    icon: Instagram,
    title: 'Request your data',
    description: 'From Instagram, request a download of your data in JSON format and wait for the ZIP export.',
  },
  {
    icon: Upload,
    title: 'Upload the ZIP',
    description: 'Select the exported .zip file here. It is processed entirely on your device.',
  },
  {
    icon: MousePointerClick,
    title: 'Browse instantly',
    description: 'Pick any conversation from the list and scroll through it just like the original app.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-on-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <header className="sticky top-0 z-20 border-b border-[#262626] bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <MessagesSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-headline text-lg font-semibold tracking-tight">ChatCapsule</span>
          </div>
          <Button asChild size="sm">
            <Link href="/app">Try ChatCapsule</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(60% 60% at 50% 0%, #2563EB 0%, #7C3AED 45%, transparent 80%)' }}
          />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#262626] bg-surface-container px-4 py-1.5 text-xs font-medium text-on-surface-variant">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              Nothing you upload ever leaves your browser
            </div>
            <h1 className="font-headline text-4xl font-semibold tracking-tight sm:text-6xl">
              Revisit your Instagram
              <span className="block bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                DMs, beautifully.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-on-surface-variant">
              Upload your Instagram data export and browse every conversation, photo, video, and voice
              message in a familiar chat viewer &mdash; entirely in your browser.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/app">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload your chat ZIP
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full border-outline-variant/20 bg-transparent sm:w-auto">
                <Link href="/demo">
                  Explore the demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[#262626] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything you loved about your chats
              </h2>
              <p className="mt-4 text-on-surface-variant">
                No account, no server, no waiting. Just your data export and a browser tab.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-[#262626] bg-surface-container-low p-6 transition-colors hover:border-outline-variant/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                    <feature.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="mt-4 font-headline text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-[#262626] px-4 py-20 sm:px-6 scroll-mt-16">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-semibold tracking-tight sm:text-4xl">
                Three steps to relive it
              </h2>
            </div>
            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title} className="relative text-center sm:text-left">
                  <div className="flex items-center justify-center gap-3 sm:justify-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-headline text-sm font-semibold text-blue-400">
                      {index + 1}
                    </div>
                    <step.icon className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <h3 className="mt-4 font-headline text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-[#262626] px-4 py-20 sm:px-6 scroll-mt-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-headline text-3xl font-semibold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="mt-10">
              {FAQS.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`} className="border-[#262626]">
                  <AccordionTrigger className="text-left font-headline text-base">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-on-surface-variant">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[#262626] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-[#262626] bg-surface-container-low p-10 text-center sm:p-14">
            <h2 className="font-headline text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to browse your conversations?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-on-surface-variant">
              Grab your Instagram data export and open it here &mdash; it only takes a moment.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/app">
                <Upload className="mr-2 h-4 w-4" />
                Upload your chat ZIP
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#262626] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-on-surface-variant sm:flex-row">
          <span>ChatCapsule &mdash; not affiliated with Instagram or Meta.</span>
          <span>All processing happens locally in your browser.</span>
        </div>
        <div className="mx-auto mt-6 flex max-w-6xl items-center justify-center gap-1 border-t border-[#262626] pt-6 text-sm text-on-surface-variant">
          Made with{' '}
          <span aria-label="love" role="img" className="text-red-500">&hearts;</span> by{' '}
          <span className="inline-flex items-center gap-1.5 font-semibold text-on-surface">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-[10px] font-bold text-white">C</span>
            ChatCapsule
          </span>
        </div>
      </footer>
    </div>
  );
}
