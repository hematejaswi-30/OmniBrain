// src/components/SynthesisDrawer.tsx
'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, X, FileText } from 'lucide-react';
import OmniDocViewer from './OmniDocViewer';

export interface SelectedNodeData {
  id: string;
  type: 'hub' | 'item' | 'entity' | 'document';
  label: string;
  source?: 'whatsapp' | 'gdrive' | 'instagram' | 'web' | 'text' | 'document';
  summary?: string;
  raw_content?: string;
  source_url?: string;
}

interface SynthesisDrawerProps {
  selectedNode: SelectedNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onHighlightPinned?: () => void;
}

export default function SynthesisDrawer({
  selectedNode,
  isOpen,
  onClose,
  onHighlightPinned,
}: SynthesisDrawerProps) {
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinNotification, setPinNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !selectedNode) return;

    if (selectedNode.type === 'hub') {
      setIsLoading(true);
      fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusterName: selectedNode.label }),
      })
        .then((res) => res.json())
        .then((data) => setSynthesis(data.synthesis))
        .catch(() => setSynthesis('Failed to generate synthesis.'))
        .finally(() => setIsLoading(false));
    } else {
      setSynthesis(null);
      setIsLoading(false);
    }
  }, [isOpen, selectedNode]);

  if (!isOpen || !selectedNode) return null;

  const isHub = selectedNode.type === 'hub';

  const handlePinDirective = async (directiveText: string) => {
    try {
      await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_cluster: selectedNode.label,
          highlight_text: directiveText,
          source_badge: 'OmniDoc Directive',
          item_id: selectedNode.id,
        }),
      });
    } catch {}

    try {
      const stored = localStorage.getItem('omnibrain_guest_highlights');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift({
        id: `hl-${Date.now()}`,
        topic_cluster: selectedNode.label,
        highlight_text: directiveText,
        source_badge: 'OmniDoc Directive',
      });
      localStorage.setItem('omnibrain_guest_highlights', JSON.stringify(list.slice(0, 10)));
    } catch {}

    setPinNotification('Pinned to Shelf');
    setTimeout(() => setPinNotification(null), 2500);

    if (onHighlightPinned) {
      onHighlightPinned();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 dark:bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer (60-30-10 Classy Principle: Solid surfaces, thin borders) */}
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[500px] md:w-[560px] bg-[#FAF7F2] dark:bg-[#1C1C1C] border-l border-[#E4DDD2] dark:border-[#33312E] z-50 flex flex-col shadow-xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#E4DDD2] dark:border-[#33312E] flex items-center justify-between bg-[#F4EFE7] dark:bg-[#232321]">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-[#2F4A3A] dark:bg-[#B08D57] flex items-center justify-center text-[10px] font-bold text-[#FAF7F2] dark:text-[#1C1C1C]">
              Ω
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990] font-medium">
              {isHub ? 'Master Cluster' : `Source Note · ${selectedNode.source || 'Note'}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pinNotification && (
              <span className="text-[11px] font-mono text-[#2F4A3A] dark:text-[#B08D57] bg-[#EBF1EC] dark:bg-[#2B261D] border border-[#D5DFD7] dark:border-[#3E372B] px-2 py-0.5 rounded">
                ✓ {pinNotification}
              </span>
            )}
            <button 
              onClick={onClose} 
              className="text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] p-1.5 rounded hover:bg-[#EAE5DC] dark:hover:bg-[#2A2927] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ========================================================= */}
          {/* VIEW A: INDIVIDUAL SOURCE ITEM                            */}
          {/* ========================================================= */}
          {!isHub && (
            <div className="p-6 space-y-6">
              <div>
                <div className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] uppercase tracking-wider mb-1">
                  Provenance Node
                </div>
                <h2 className="font-serif text-xl font-semibold text-[#2B2B2B] dark:text-[#EDE8DF] tracking-tight">
                  {selectedNode.label}
                </h2>
              </div>

              {/* Source Badge & External Link */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D8] dark:border-[#31302D]">
                <span className="text-xs font-mono uppercase px-2.5 py-1 rounded border border-[#DCD4C7] dark:border-[#383632] bg-[#F4EFE7] dark:bg-[#232321] text-[#4A453D] dark:text-[#C4BEB3] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
                  Source: {selectedNode.source || 'text'}
                </span>

                {selectedNode.source_url && (
                  <a
                    href={selectedNode.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#2F4A3A] dark:text-[#B08D57] hover:underline flex items-center gap-1 font-mono"
                  >
                    Open Original <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* AI Normalized Gist (Solid surface, no gradient) */}
              {selectedNode.summary && (
                <div className="bg-[#FAF7F2] dark:bg-[#232321] border border-[#E1D9CC] dark:border-[#383632] p-4 rounded">
                  <div className="text-[10px] font-mono text-[#2F4A3A] dark:text-[#B08D57] uppercase tracking-wider mb-2 font-semibold">
                    Executive Summary
                  </div>
                  <p className="text-xs text-[#2B2B2B] dark:text-[#EDE8DF] leading-relaxed font-sans">
                    {selectedNode.summary}
                  </p>
                </div>
              )}

              {/* Original Content / Transcript Box */}
              <div className="border border-[#E1D9CC] dark:border-[#383632] rounded p-4 bg-[#F4EFE7] dark:bg-[#232321]">
                <div className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] uppercase tracking-wider mb-2.5">
                  Original Saved Content
                </div>
                <div className="text-xs text-[#3B3731] dark:text-[#C4BEB3] font-mono whitespace-pre-wrap leading-relaxed bg-[#FAF7F2] dark:bg-[#1C1C1C] p-3.5 rounded border border-[#E1D9CC] dark:border-[#383632]">
                  {selectedNode.raw_content || 'No additional raw content.'}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW B: CLUSTER HUB MASTER SYNTHESIS (OmniDoc)            */}
          {/* ========================================================= */}
          {isHub && (
            <div className="h-full">
              {isLoading ? (
                <div className="py-24 text-center space-y-3">
                  <div className="w-6 h-6 border-2 border-[#2F4A3A] dark:border-[#B08D57] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-[#6B655C] dark:text-[#9E9990] font-mono text-xs">
                    Synthesizing multi-source brief...
                  </div>
                </div>
              ) : synthesis ? (
                <OmniDocViewer 
                  clusterTitle={selectedNode.label} 
                  rawMarkdown={synthesis} 
                  onPinDirective={handlePinDirective}
                />
              ) : (
                <div className="p-8 text-center text-[#6B655C] dark:text-[#9E9990] text-xs font-sans">
                  No synthesis available.
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
