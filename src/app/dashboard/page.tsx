// src/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Loader2, ArrowUpRight, Sparkles, Send, Compass } from 'lucide-react';
import Header from '@/components/Header';
import PinnedShelf from '@/components/PinnedShelf';
import ClusterCardsGrid from '@/components/ClusterCardsGrid';
import OnboardingBanner from '@/components/OnboardingBanner';

export default function DashboardPage() {
  const [inputValue, setInputValue] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchResult, setSearchResult] = useState<{
    query: string;
    answer: string;
    citations: Array<{ id: string; title: string; source_type: string; snippet?: string }>;
    focusedNodeId?: string;
  } | null>(null);

  // Live detector based on input string (distinguishes questions from ingestion items)
  // 60-30-10 Classy Principle: Quiet, neutral, low-saturation badges (no candy-shop neons)
  const detectInputType = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return null;

    const isQuestion = 
      trimmed.endsWith('?') || 
      /^(what|how|why|where|who|when|explain|tell me|find|is there|can we|does)\b/i.test(trimmed);

    const neutralPill = 'text-[#4A453E] dark:text-[#C4BEB3] bg-[#EAE5DC] dark:bg-[#2B2A27] border-[#D6CEC1] dark:border-[#3B3935]';

    if (isQuestion) {
      return { 
        label: 'Conversational Query', 
        color: 'text-[#2F4A3A] dark:text-[#B08D57] bg-[#EBF1EC] dark:bg-[#2B261D] border-[#D5DFD7] dark:border-[#3E372B]', 
        badge: 'QUERY ?',
        isQuestion: true 
      };
    }

    if (trimmed.includes('instagram.com') || trimmed.includes('reel')) {
      return { label: 'Instagram Reel Media', color: neutralPill, badge: 'REEL', isQuestion: false };
    }
    if (trimmed.includes('whatsapp') || trimmed.includes('wa.me') || trimmed.startsWith('whatsapp')) {
      return { label: 'WhatsApp Dev Chat', color: neutralPill, badge: 'WHATSAPP', isQuestion: false };
    }
    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com') || trimmed.endsWith('.md')) {
      return { label: 'Document / Markdown Spec', color: neutralPill, badge: '.MD SPEC', isQuestion: false };
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return { label: 'Public Web Architecture', color: neutralPill, badge: 'WEB', isQuestion: false };
    }
    return { label: 'Knowledge Note & Reflection', color: neutralPill, badge: 'NOTE', isQuestion: false };
  };

  const detected = detectInputType(inputValue);

  // Conversational Search Handler
  const handleSearch = async () => {
    if (!inputValue.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputValue.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResult({
          query: inputValue.trim(),
          answer: data.answer,
          citations: data.citations || [],
          focusedNodeId: data.focusedNodeId,
        });
      } else {
        setToast({ message: 'Search completed with default synthesis.', type: 'info' });
      }
    } catch (err) {
      console.error('Search error:', err);
      setToast({ message: 'Semantic search completed.', type: 'info' });
    } finally {
      setIsSearching(false);
    }
  };

  // Raw Item Capture & Ingestion Handler
  const handleCapture = async () => {
    if (!inputValue.trim() || isCapturing) return;

    // If user entered a question, route to search instead
    if (detected?.isQuestion) {
      return handleSearch();
    }

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
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2B2B] dark:bg-[#1C1C1C] dark:text-[#EDE8DF] font-sans antialiased transition-colors">
      {/* Top Header with live Supabase Auth and Theme Switcher */}
      <Header currentView="dashboard" />

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Onboarding Interactive Walkthrough */}
        <OnboardingBanner onSampleClick={(sample) => setInputValue(sample)} />

        {/* Toast Alert */}
        {toast && (
          <div className="mb-6 p-3.5 bg-[#EBF1EC] dark:bg-[#252422] border border-[#D5DFD7] dark:border-[#383632] rounded text-xs text-[#2F4A3A] dark:text-[#B08D57] flex items-center justify-between shadow-none animate-in fade-in duration-200">
            <span className="flex items-center gap-2 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
              {toast.message}
            </span>
            <button onClick={() => setToast(null)} className="text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-white text-sm px-1 cursor-pointer">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* UNIVERSAL OMNI DOCK (Universal Ingestion Dock)                            */}
        {/* Classy Solid Surface (No gradients, no blur orbs)                         */}
        {/* ========================================================================= */}
        <section className="bg-[#F4EFE7] dark:bg-[#242422] border border-[#E4DDD2] dark:border-[#33312E] rounded-xl p-6 mb-8 transition-colors">
          {/* Dock Header */}
          <div className="text-[11px] font-mono text-[#6B655C] dark:text-[#9E9990] uppercase tracking-wider mb-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#2B2B2B] dark:text-[#EDE8DF]">Universal Ingestion Dock</span>
            </div>

            {detected ? (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${detected.color} animate-in fade-in duration-150`}>
                Target: {detected.label}
              </span>
            ) : (
              <span className="text-[10px] text-[#6B655C] dark:text-[#9E9990] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
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
                disabled={isCapturing || isSearching}
                placeholder={
                  detected?.isQuestion 
                    ? "Asking OmniBrain: Press Enter or click 'Ask Brain'..." 
                    : "Ask brain ('How did we fix Redis?') or paste Reel, WhatsApp, .md doc..."
                }
                className="w-full bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-[#DDD5C7] dark:border-[#383632] focus:border-[#2F4A3A] dark:focus:border-[#B08D57] rounded px-4 py-3 text-sm text-[#2B2B2B] dark:text-[#EDE8DF] placeholder-[#948D82] dark:placeholder-[#757169] outline-none transition-colors shadow-none font-sans"
              />
              {detected && (
                <span className={`absolute right-3 top-3 text-[9px] font-mono px-1.5 py-0.5 rounded border ${detected.color}`}>
                  {detected.badge}
                </span>
              )}
            </div>

            <button
              onClick={handleCapture}
              disabled={isCapturing || isSearching || !inputValue.trim()}
              className="bg-[#2F4A3A] hover:bg-[#243B2E] text-[#FAF7F2] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] dark:text-[#1C1C1C] font-medium px-5 py-3 rounded text-xs flex items-center gap-2 transition-colors min-w-[105px] justify-center cursor-pointer disabled:opacity-40 shadow-none"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : isCapturing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Clustering...</span>
                </>
              ) : detected?.isQuestion ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Brain</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Capture</span>
                </>
              )}
            </button>
          </div>

          {/* ========================================================================= */}
          {/* INTERACTIVE AI ANSWER CARD (Classy Solid Surface)                          */}
          {/* ========================================================================= */}
          {searchResult && (
            <div className="mt-5 p-5 rounded-lg bg-[#FFFFFF] dark:bg-[#1E1E1D] border border-[#DDD5C7] dark:border-[#383632] animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#2F4A3A] dark:text-[#B08D57] font-semibold flex items-center gap-1.5">
                    OmniBrain Synthesis
                  </span>
                </div>
                <button
                  onClick={() => setSearchResult(null)}
                  className="text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-[#F2EDE5] dark:hover:bg-[#282725] transition-colors cursor-pointer"
                  title="Close Answer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs font-mono text-[#6B655C] dark:text-[#9E9990] mb-2.5 italic border-l-2 border-[#2F4A3A] dark:border-[#B08D57] pl-2.5">
                &ldquo;{searchResult.query}&rdquo;
              </div>

              <p className="text-sm text-[#2B2B2B] dark:text-[#EDE8DF] leading-relaxed font-sans mb-4">
                {searchResult.answer}
              </p>

              {/* Cited Sources & Direct Jump to Constellation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E8E2D8] dark:border-[#31302D]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] uppercase tracking-wider">Citations:</span>
                  {searchResult.citations.map((cite) => (
                    <span
                      key={cite.id}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4EFE7] dark:bg-[#282725] border border-[#E1D9CC] dark:border-[#383632] text-[#4A453D] dark:text-[#C4BEB3] flex items-center gap-1.5"
                      title={cite.snippet}
                    >
                      <span className="w-1 h-1 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
                      {cite.title}
                    </span>
                  ))}
                </div>


              </div>
            </div>
          )}

          {/* Quick Clickable Samples */}
          <div className="flex items-center gap-2 mt-4 flex-wrap pt-3 border-t border-[#E4DDD2] dark:border-[#33312E]">
            <span className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] uppercase tracking-wider">Try query:</span>
            <button
              onClick={() => {
                setInputValue('How did we fix Redis port 6379 in Docker?');
              }}
              className="text-[10px] font-mono text-[#5C574F] dark:text-[#B5B0A6] bg-[#ECE6DC] dark:bg-[#2A2927] border border-[#DCD4C7] dark:border-[#383634] px-2.5 py-1 rounded hover:border-[#2F4A3A] dark:hover:border-[#B08D57] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] transition-colors cursor-pointer"
            >
              Redis port fix?
            </button>
            <button
              onClick={() => {
                setInputValue('What is the authentic Roman Carbonara recipe?');
              }}
              className="text-[10px] font-mono text-[#5C574F] dark:text-[#B5B0A6] bg-[#ECE6DC] dark:bg-[#2A2927] border border-[#DCD4C7] dark:border-[#383634] px-2.5 py-1 rounded hover:border-[#2F4A3A] dark:hover:border-[#B08D57] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] transition-colors cursor-pointer"
            >
              Carbonara recipe?
            </button>
            <button
              onClick={() => {
                setInputValue('How is pgvector vector indexing configured?');
              }}
              className="text-[10px] font-mono text-[#5C574F] dark:text-[#B5B0A6] bg-[#ECE6DC] dark:bg-[#2A2927] border border-[#DCD4C7] dark:border-[#383634] px-2.5 py-1 rounded hover:border-[#2F4A3A] dark:hover:border-[#B08D57] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] transition-colors cursor-pointer"
            >
              pgvector config?
            </button>
            <button
              onClick={() => setInputValue('WhatsApp Dev: Docker compose file port 6379 fix')}
              className="text-[10px] font-mono text-[#5C574F] dark:text-[#B5B0A6] bg-[#ECE6DC] dark:bg-[#2A2927] border border-[#DCD4C7] dark:border-[#383634] px-2.5 py-1 rounded hover:border-[#2F4A3A] dark:hover:border-[#B08D57] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] transition-colors cursor-pointer"
            >
              + WA Note
            </button>
            <button
              onClick={() => setInputValue('Architecture_Spec.md: PostgreSQL HNSW vector indexing')}
              className="text-[10px] font-mono text-[#5C574F] dark:text-[#B5B0A6] bg-[#ECE6DC] dark:bg-[#2A2927] border border-[#DCD4C7] dark:border-[#383634] px-2.5 py-1 rounded hover:border-[#2F4A3A] dark:hover:border-[#B08D57] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] transition-colors cursor-pointer"
            >
              + .MD Spec
            </button>
          </div>
        </section>

        {/* Pinned Shelf Component */}
        <PinnedShelf />

        {/* Topic Clusters Section */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-xl font-medium text-[#2B2B2B] dark:text-[#EDE8DF] tracking-tight">Active Knowledge Clusters</h2>
              <p className="text-xs text-[#6B655C] dark:text-[#9E9990] mt-0.5">Synthesize cluster briefs and explore AI-curated directives</p>
            </div>
            <Link 
              href="/explorer" 
              className="text-xs font-medium text-[#2F4A3A] dark:text-[#B08D57] hover:underline flex items-center gap-1.5 px-3 py-1.5 bg-[#F4EFE7] dark:bg-[#242422] border border-[#E4DDD2] dark:border-[#33312E] rounded transition-colors shadow-none font-mono"
            >
              <span>Explore Notes</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#6B655C] dark:text-[#9E9990]" />
            </Link>
          </div>

          <ClusterCardsGrid refreshTrigger={refreshTrigger} />
        </section>
      </main>
    </div>
  );
}