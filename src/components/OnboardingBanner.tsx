// src/components/OnboardingBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  X, 
  HelpCircle, 
  CheckCircle, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface OnboardingBannerProps {
  onSampleClick?: (sampleText: string) => void;
}

export default function OnboardingBanner({ onSampleClick }: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('omnibrain_onboarding_dismissed');
      if (stored === 'true') {
        setIsDismissed(true);
      }
    } catch {}
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('omnibrain_onboarding_dismissed', 'true');
    } catch {}
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem('omnibrain_onboarding_dismissed');
    } catch {}
  };

  if (isDismissed) {
    return (
      <div className="flex justify-end mb-4">
        <button
          onClick={handleRestore}
          className="text-[11px] font-mono text-zinc-400 hover:text-indigo-300 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#121217] border border-[#27272a] hover:border-indigo-500/40 transition-colors shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Show 3-Step Quick Start Guide</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#12121c] via-[#101018] to-[#0c0c12] border border-indigo-900/40 rounded-xl p-5 mb-7 shadow-xl">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              OmniBrain Quick-Start Walkthrough
              <span className="text-[10px] font-mono normal-case text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-full">
                Step {activeStep} of 3
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Learn how OmniBrain transforms raw fragments into unified knowledge briefs & constellation graphs.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800/60 transition-colors"
          title="Dismiss Guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4">
        {/* Step 1 */}
        <div 
          onClick={() => setActiveStep(1)}
          className={`cursor-pointer rounded-lg p-3.5 border transition-all duration-200 ${
            activeStep === 1 
              ? 'bg-indigo-950/30 border-indigo-500/70 shadow-md shadow-indigo-950/30' 
              : 'bg-[#0a0a0f] border-zinc-800/70 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-900 border border-indigo-600 text-[10px] flex items-center justify-center text-white">1</span>
              Ingest Fragments
            </span>
            <span className="text-[9px] font-mono text-zinc-500">Universal Dock</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed mb-3">
            Paste WhatsApp dev notes, Instagram reels, Drive specs, or raw markdown notes into the dock below.
          </p>
          {onSampleClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSampleClick('Architecture_Spec.md: PostgreSQL HNSW vector indexing');
              }}
              className="text-[10px] font-mono text-indigo-300 hover:text-white flex items-center gap-1 underline underline-offset-2"
            >
              <span>Auto-fill Sample Spec</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Step 2 */}
        <div 
          onClick={() => setActiveStep(2)}
          className={`cursor-pointer rounded-lg p-3.5 border transition-all duration-200 ${
            activeStep === 2 
              ? 'bg-indigo-950/30 border-indigo-500/70 shadow-md shadow-indigo-950/30' 
              : 'bg-[#0a0a0f] border-zinc-800/70 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-600 text-[10px] flex items-center justify-center text-white">2</span>
              Explore Clusters
            </span>
            <span className="text-[9px] font-mono text-zinc-500">OmniDoc Synthesis</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed mb-3">
            OmniBrain clusters related items by semantic proximity. Click <strong>Synthesize</strong> to review aggregated OmniDocs and pin directives.
          </p>
          <div className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>Cross-source clustering</span>
          </div>
        </div>

        {/* Step 3 */}
        <div 
          onClick={() => setActiveStep(3)}
          className={`cursor-pointer rounded-lg p-3.5 border transition-all duration-200 ${
            activeStep === 3 
              ? 'bg-indigo-950/30 border-indigo-500/70 shadow-md shadow-indigo-950/30' 
              : 'bg-[#0a0a0f] border-zinc-800/70 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-950 border border-amber-600 text-[10px] flex items-center justify-center text-white">3</span>
              Constellation Map
            </span>
            <span className="text-[9px] font-mono text-zinc-500">2D Spatial View</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed mb-3">
            Open the Constellation Graph to view interconnected rounded <span className="font-mono text-indigo-300">.md</span> cards and live flow lines.
          </p>
          <Link
            href="/graph"
            className="text-[10px] font-mono text-amber-300 hover:text-white flex items-center gap-1 underline underline-offset-2"
          >
            <span>Open Constellation Graph</span>
            <Compass className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
