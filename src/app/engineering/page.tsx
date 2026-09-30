import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Code2, Database, Gauge, LockKeyhole, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Engineering',
  description: 'How ChatCapsule handles private browser-local archives, large conversations, search, media, and reliability.',
  alternates: { canonical: '/engineering' },
};

const ARCHITECTURE = [
  ['One archive reader', 'A single JSZip instance is shared by metadata indexing, message loading, and media access.'],
  ['Virtualized timeline', 'Long conversations render as a measured window instead of mounting every message.'],
  ['Worker search', 'Search matching runs away from the UI thread while the core algorithm remains independently testable.'],
  ['Lazy media', 'Images, video, stickers, and audio are loaded only when they approach the viewport.'],
];

const VERIFICATION = [
  'TypeScript typecheck',
  'Archive schema and normalization unit tests',
  'Production build',
  'Production route smoke tests',
  'Deterministic search benchmark',
];

export default function EngineeringPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-[#262626] bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-headline text-lg font-semibold tracking-tight">ChatCapsule</Link>
          <Button asChild size="sm" variant="outline"><Link href="/demo">Try the demo</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300">
            <Code2 className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            Engineering case study
          </div>

          <h1 className="mt-6 font-headline text-4xl font-semibold tracking-tight sm:text-6xl">
            A private archive viewer built for the browser.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            ChatCapsule turns an Instagram data-export ZIP into a readable chat archive without requiring a ChatCapsule backend for the core flow.
          </p>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            [LockKeyhole, 'Local-first', 'Archive processing happens in the browser.'],
            [Gauge, 'Large-chat ready', 'Windowed rendering and worker search protect UI responsiveness.'],
            [ShieldCheck, 'Defensive input', 'Imported JSON is validated and malformed conversations are isolated.'],
          ].map(([Icon, title, text]) => {
            const IconComponent = Icon as typeof LockKeyhole;
            return (
              <div key={title as string} className="rounded-2xl border border-[#262626] bg-zinc-950 p-6">
                <IconComponent className="h-5 w-5 text-blue-400" aria-hidden="true" />
                <h2 className="mt-4 font-semibold">{title as string}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text as string}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" aria-hidden="true" />
              <h2 className="font-headline text-2xl font-semibold">Architecture decisions</h2>
            </div>
            <div className="mt-6 space-y-4">
              {ARCHITECTURE.map(([title, description]) => (
                <article key={title} className="rounded-xl border border-[#262626] bg-zinc-950 p-5">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-[#262626] bg-zinc-950 p-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-400" aria-hidden="true" />
              <h2 className="font-headline text-xl font-semibold">Search benchmark</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              The repository includes a deterministic benchmark for the production search helper at 100k, 250k, and 500k synthetic messages.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Measurements vary by machine. The benchmark is intended to catch regressions, not to promise a fixed browser latency.
            </p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link href="https://github.com/abdullahnisar05/chatcapsule/blob/main/PERFORMANCE.md" target="_blank" rel="noreferrer">
                Read the methodology
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </aside>
        </section>

        <section className="mt-16 rounded-2xl border border-[#262626] bg-zinc-950 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-400" aria-hidden="true" />
            <h2 className="font-headline text-2xl font-semibold">Verification gates</h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {VERIFICATION.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-[#262626] px-4 py-3 text-sm text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg"><Link href="/demo">Explore the product <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/">Back to ChatCapsule</Link></Button>
        </div>
      </main>
    </div>
  );
}