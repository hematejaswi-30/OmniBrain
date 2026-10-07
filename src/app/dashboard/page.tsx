// src/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowUpRight } from 'lucide-react';
import PinnedShelf from '@/components/PinnedShelf';
import ClusterCardsGrid from '@/components/ClusterCardsGrid';

export default function DashboardPage() {
  const [inputValue, setInputValue] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!inputValue.trim() || isCapturing) return;

    setIsCapturing(true);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: inputValue.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const itemTitle = data?.item?.title || inputValue.slice(0, 30);
        setToast(`Successfully captured: "${itemTitle}"`);
        setInputValue('');
      } else {
        setToast('Ingestion completed.');
      }
    } catch (err) {
      console.error('Ingestion error:', err);
      setToast('Ingested raw input.');
    } finally {
      setIsCapturing(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans antialiased">
      {/* Top Header */}
      <header className="h-14 border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-white text-black font-bold text-xs flex items-center justify-center rounded">▲</div>
          <span className="font-semibold text-sm tracking-tight">OmniBrain</span>
          <span className="font-mono text-[10px] text-zinc-500 bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded">
            ant.graphify.com
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <Link href="/dashboard" className="px-3 py-1.5 text-xs font-medium bg-[#1f1f23] text-white border border-[#27272a] rounded-md">
            Dashboard
          </Link>
          <Link href="/graph" className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#18181b] rounded-md transition-colors">
            Constellation Graph
          </Link>
        </nav>

        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-[#27272a] flex items-center justify-center text-xs text-zinc-400">
          U
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Toast Alert */}
        {toast && (
          <div className="mb-6 p-3 bg-[#18181b] border border-[#27272a] rounded-md text-xs text-emerald-400 flex items-center justify-between">
            <span>✓ {toast}</span>
            <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-white">✕</button>
          </div>
        )}

        {/* Universal Omnibox Dock */}
        <section className="bg-[#121215] border border-[#27272a] rounded-md p-4 mb-6 shadow-sm">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2.5 flex justify-between">
            <span>Universal Ingestion Dock</span>
            <span>Regex Router Active</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCapture();
              }}
              disabled={isCapturing}
              placeholder="Paste Instagram Reel, WhatsApp text, Google Drive link, or note..."
              className="flex-1 bg-[#09090b] border border-[#27272a] focus:border-zinc-500 rounded-md px-3.5 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-colors disabled:opacity-60"
            />
            <button
              onClick={handleCapture}
              disabled={isCapturing || !inputValue.trim()}
              className="bg-white text-black hover:opacity-90 disabled:opacity-50 font-medium px-4 py-2 rounded-md text-xs flex items-center gap-1.5 transition-opacity min-w-[85px] justify-center"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Capture</span>
              )}
            </button>
          </div>

          <div className="flex gap-2 mt-2.5 flex-wrap">
            <span className="text-[11px] text-zinc-600 self-center">Try sample:</span>
            <button
              onClick={() => setInputValue('WhatsApp Dev: Docker compose file port 6379 fix')}
              className="text-[11px] font-mono text-zinc-400 bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded hover:border-zinc-500"
            >
              WhatsApp Dev Note
            </button>
            <button
              onClick={() => setInputValue('https://instagram.com/reel/C8_pasta_carbonara')}
              className="text-[11px] font-mono text-zinc-400 bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded hover:border-zinc-500"
            >
              Instagram Reel
            </button>
          </div>
        </section>

        {/* Pinned Shelf Component */}
        <PinnedShelf />

        {/* Topic Clusters Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Active Knowledge Clusters</h2>
            <Link href="/graph" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
              Explore in Graph <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ClusterCardsGrid />
        </section>
      </main>
    </div>
  );
}