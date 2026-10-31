// src/components/OnboardingBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
  HelpCircle, 
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
          className="text-[11px] font-mono text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] flex items-center gap-1.5 px-3 py-1 rounded bg-[#F4EFE7] dark:bg-[#242422] border border-[#E4DDD2] dark:border-[#33312E] transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Show Quick Guide</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F4EFE7] dark:bg-[#242422] border border-[#E4DDD2] dark:border-[#33312E] rounded-xl p-5 mb-8 transition-colors">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E4DDD2] dark:border-[#33312E]">
        <div className="flex items-center gap-2.5">
          <div>
            <h3 className="font-serif text-sm font-semibold text-[#2B2B2B] dark:text-[#EDE8DF] tracking-tight flex items-center gap-2">
              OmniBrain Guide
              <span className="text-[10px] font-mono normal-case text-[#6B655C] dark:text-[#9E9990] bg-[#EAE5DC] dark:bg-[#2B2A27] border border-[#D6CEC1] dark:border-[#3B3935] px-2 py-0.5 rounded">
                Step {activeStep} of 3
              </span>
            </h3>
            <p className="text-xs text-[#6B655C] dark:text-[#9E9990] mt-0.5 font-sans">
              How OmniBrain organizes raw fragments into synthesized knowledge clusters.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] p-1 rounded hover:bg-[#EAE5DC] dark:hover:bg-[#2A2927] transition-colors"
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
          className={`cursor-pointer rounded p-4 border transition-colors ${
            activeStep === 1 
              ? 'bg-[#FAF7F2] dark:bg-[#1C1C1C] border-[#2F4A3A] dark:border-[#B08D57]' 
              : 'bg-[#EDE7DE] dark:bg-[#1E1E1D] border-[#E1D9CC] dark:border-[#33312E] hover:border-[#D1C8BA]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#2F4A3A] dark:text-[#B08D57] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#EAE5DC] dark:bg-[#2B2A27] text-[10px] flex items-center justify-center text-[#2B2B2B] dark:text-[#EDE8DF]">1</span>
              Ingest Fragments
            </span>
            <span className="text-[9px] font-mono text-[#6B655C] dark:text-[#9E9990]">Dock</span>
          </div>
          <p className="text-xs text-[#4A453D] dark:text-[#C4BEB3] leading-relaxed mb-3 font-sans">
            Paste WhatsApp dev notes, Instagram reels, Drive specs, or raw markdown into the dock below.
          </p>
          {onSampleClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSampleClick('Architecture_Spec.md: PostgreSQL HNSW vector indexing');
              }}
              className="text-[10px] font-mono text-[#2F4A3A] dark:text-[#B08D57] hover:underline flex items-center gap-1"
            >
              <span>Auto-fill Sample Spec</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Step 2 */}
        <div 
          onClick={() => setActiveStep(2)}
          className={`cursor-pointer rounded p-4 border transition-colors ${
            activeStep === 2 
              ? 'bg-[#FAF7F2] dark:bg-[#1C1C1C] border-[#2F4A3A] dark:border-[#B08D57]' 
              : 'bg-[#EDE7DE] dark:bg-[#1E1E1D] border-[#E1D9CC] dark:border-[#33312E] hover:border-[#D1C8BA]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#2F4A3A] dark:text-[#B08D57] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#EAE5DC] dark:bg-[#2B2A27] text-[10px] flex items-center justify-center text-[#2B2B2B] dark:text-[#EDE8DF]">2</span>
              Explore Clusters
            </span>
            <span className="text-[9px] font-mono text-[#6B655C] dark:text-[#9E9990]">Synthesis</span>
          </div>
          <p className="text-xs text-[#4A453D] dark:text-[#C4BEB3] leading-relaxed mb-3 font-sans">
            OmniBrain clusters related items by semantic proximity. Click Synthesize to review aggregated OmniDocs.
          </p>
          <span className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] flex items-center gap-1">
            <span>Automated Clustering</span>
          </span>
        </div>

        {/* Step 3 */}
        <div 
          onClick={() => setActiveStep(3)}
          className={`cursor-pointer rounded p-4 border transition-colors ${
            activeStep === 3 
              ? 'bg-[#FAF7F2] dark:bg-[#1C1C1C] border-[#2F4A3A] dark:border-[#B08D57]' 
              : 'bg-[#EDE7DE] dark:bg-[#1E1E1D] border-[#E1D9CC] dark:border-[#33312E] hover:border-[#D1C8BA]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#2F4A3A] dark:text-[#B08D57] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#EAE5DC] dark:bg-[#2B2A27] text-[10px] flex items-center justify-center text-[#2B2B2B] dark:text-[#EDE8DF]">3</span>
              Pinned Directives
            </span>
            <span className="text-[9px] font-mono text-[#6B655C] dark:text-[#9E9990]">Shelf</span>
          </div>
          <p className="text-xs text-[#4A453D] dark:text-[#C4BEB3] leading-relaxed mb-3 font-sans">
            Bookmark key directives and verified code recipes directly to your persistent Pinned Shelf.
          </p>
          <span className="text-[10px] font-mono text-[#2F4A3A] dark:text-[#B08D57] flex items-center gap-1">
            <span>Persistent Directive Shelf</span>
          </span>
        </div>
      </div>
    </div>
  );
}
