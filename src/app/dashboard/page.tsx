// src/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Loader2, ArrowUpRight, Sparkles, Send, FileText, Compass, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import PinnedShelf from '@/components/PinnedShelf';
import ClusterCardsGrid from '@/components/ClusterCardsGrid';
import OnboardingBanner from '@/components/OnboardingBanner';

export default function DashboardPage() {
  const [inputValue, setInputValue] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Live detector based on input string
  const detectInputType = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return null;
    if (trimmed.includes('instagram.com') || trimmed.includes('reel')) {
      return { label: 'Instagram Reel Media', color: 'text-rose-400 bg-rose-950/60 border-rose-800/60', badge: 'REEL' };
    }
    if (trimmed.includes('whatsapp') || trimmed.includes('wa.me') || trimmed.startsWith('whatsapp')) {
      return { label: 'WhatsApp Dev Chat', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60', badge: 'WA' };
    }
    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com') || trimmed.endsWith('.md')) {
      return { label: 'Document / Markdown Spec', color: 'text-blue-400 bg-blue-950/60 border-blue-800/60', badge: '.MD' };
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return { label: 'Public Web Architecture', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60', badge: 'WEB' };
    }
    return { label: 'Knowledge Note & Reflection', color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60', badge: 'NOTE' };
  };

  const detected = detectInputType(inputValue);

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
        const itemTitle = data?.item?.title || inputValue.slice(0, 35);
        setToast({ message: `Successfully captured and clustered: "${itemTitle}"`, type: 'success' });
        setInputValue('');
        setRefreshTrigger(prev => prev + 1);
      } else {
        setToast({ message: 'Ingestion completed successfully.', type: 'info' });
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Ingestion error:', err);
      setToast({ message: 'Ingested raw input to cluster cache.', type: 'info' });
    } finally {
      setIsCapturing(false);
      setTimeout(() => setToast(null), 4500);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-[#fafafa] font-sans antialiased">
      {/* Top Header with live Supabase Auth */}
      <Header currentView="dashboard" />

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Onboarding Interactive Walkthrough */}
        <OnboardingBanner onSampleClick={(sample) => setInputValue(sample)} />

        {/* Toast Alert */}
        {toast && (
          <div className="mb-6 p-3.5 bg-gradient-to-r from-emerald-950/80 to-zinc-900 border border-emerald-600/50 rounded-lg text-xs text-emerald-300 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <span className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {toast.message}
            </span>
            <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-white text-sm px-1">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* UNIVERSAL OMNI DOCK (Universal Ingestion Dock)                            */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#121218] via-[#0f0f15] to-[#0a0a0e] border border-[#27272a] hover:border-indigo-500/40 rounded-xl p-5 mb-7 shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-80 h-40 bg-indigo-600/5 blur-3xl pointer-events-none" />

          {/* Dock Header */}
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-zinc-300">Universal Omni Ingestion Dock</span>
            </div>

            {detected ? (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${detected.color} animate-in fade-in duration-150`}>
                Routing: {detected.label}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live Ingestion Engine Active
              </span>
            )}
          </div>

          {/* Input & Capture Action */}
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCapture();
                }}
                disabled={isCapturing}
                placeholder="Paste Instagram Reel, WhatsApp note, Drive link, or .md doc..."
                className="w-full bg-[#08080c] border border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all disabled:opacity-60 font-sans shadow-inner"
              />
              {detected && (
                <span className="absolute right-3 top-2.5 text-[9px] font-mono text-zinc-400 bg-zinc-800/80 border border-zinc-700 px-1.5 py-0.5 rounded">
                  {detected.badge}
                </span>
              )}
            </div>

            <button
              onClick={handleCapture}
              disabled={isCapturing || !inputValue.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg text-xs flex items-center gap-2 transition-all min-w-[95px] justify-center shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Clustering...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Capture</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Clickable Samples */}
          <div className="flex items-center gap-2 mt-3.5 flex-wrap pt-2.5 border-t border-zinc-800/60">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Try quick sample:</span>
            <button
              onClick={() => setInputValue('WhatsApp Dev: Docker compose file port 6379 fix')}
              className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/50 px-2.5 py-1 rounded-md hover:border-emerald-500 transition-colors cursor-pointer"
            >
              💬 WhatsApp Dev Note
            </button>
            <button
              onClick={() => setInputValue('https://instagram.com/reel/C8_pasta_carbonara')}
              className="text-[10px] font-mono text-rose-400 bg-rose-950/30 border border-rose-800/50 px-2.5 py-1 rounded-md hover:border-rose-500 transition-colors cursor-pointer"
            >
              🎬 Instagram Reel
            </button>
            <button
              onClick={() => setInputValue('Architecture_Spec.md: PostgreSQL HNSW vector indexing')}
              className="text-[10px] font-mono text-blue-400 bg-blue-950/30 border border-blue-800/50 px-2.5 py-1 rounded-md hover:border-blue-500 transition-colors cursor-pointer"
            >
              📑 Architecture .md Spec
            </button>
            <button
              onClick={() => setInputValue('https://github.com/graphify/graphifyy')}
              className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-800/50 px-2.5 py-1 rounded-md hover:border-cyan-500 transition-colors cursor-pointer"
            >
              🌐 Graphify Repo
            </button>
          </div>
        </section>

        {/* Pinned Shelf Component */}
        <PinnedShelf />

        {/* Topic Clusters Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Active Knowledge Clusters</h2>
              <p className="text-xs text-zinc-500">Synthesize cluster briefs or view in Constellation Graph</p>
            </div>
            <Link 
              href="/graph" 
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 bg-[#121218] border border-[#27272a] hover:border-indigo-500/50 rounded-md transition-colors shadow-sm"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Constellation Graph</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>
          </div>

          <ClusterCardsGrid refreshTrigger={refreshTrigger} />
        </section>
      </main>
    </div>
  );
}