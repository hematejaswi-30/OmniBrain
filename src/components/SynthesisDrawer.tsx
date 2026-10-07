// src/components/SynthesisDrawer.tsx
'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, X, FileText, ArrowRight } from 'lucide-react';

export interface SelectedNodeData {
  id: string;
  type: 'hub' | 'item' | 'entity';
  label: string;
  source?: 'whatsapp' | 'gdrive' | 'instagram' | 'web' | 'text';
  summary?: string;
  raw_content?: string;
  source_url?: string;
}

interface SynthesisDrawerProps {
  selectedNode: SelectedNodeData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SynthesisDrawer({
  selectedNode,
  isOpen,
  onClose,
}: SynthesisDrawerProps) {
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !selectedNode) return;

    // Only call /api/synthesize if a Cluster Hub is selected
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
      // Individual document: No cluster synthesis needed
      setSynthesis(null);
      setIsLoading(false);
    }
  }, [isOpen, selectedNode]);

  if (!isOpen || !selectedNode) return null;

  const isHub = selectedNode.type === 'hub';

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <aside className="fixed top-0 right-0 h-full w-full md:w-[440px] bg-[#101014] border-l border-[#27272a] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
              {isHub ? 'Cluster Synthesis' : `Source Document · ${selectedNode.source || 'Note'}`}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Header Title */}
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
              {isHub ? 'TARGET CLUSTER' : 'ITEM TITLE'}
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              {selectedNode.label}
            </h2>
          </div>

          {/* ========================================================= */}
          {/* VIEW A: INDIVIDUAL SOURCE ITEM (WhatsApp, Drive, Reel, etc.) */}
          {/* ========================================================= */}
          {!isHub && (
            <div className="space-y-4">
              {/* Source Badge & External Link */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded border border-[#27272a] bg-[#18181b] text-zinc-300">
                  Source: {selectedNode.source}
                </span>

                {selectedNode.source_url && (
                  <a
                    href={selectedNode.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 underline underline-offset-4"
                  >
                    Open Original <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* AI Normalized Gist */}
              {selectedNode.summary && (
                <div className="bg-[#18181c] border border-[#27272a] p-3.5 rounded-md">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                    AI Summary Gist
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {selectedNode.summary}
                  </p>
                </div>
              )}

              {/* Original Content / Transcript Box */}
              <div className="border border-[#27272a] rounded-md p-4 bg-[#09090b]">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  Original Saved Content & Notes
                </div>
                <div className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedNode.raw_content || 'No additional raw content.'}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW B: CLUSTER HUB MASTER SYNTHESIS                      */}
          {/* ========================================================= */}
          {isHub && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                  Synthesizing multi-source brief...
                </div>
              ) : (
                <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {synthesis}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a] flex items-center justify-between bg-[#09090b]">
          <button
            onClick={() => {
              const textToCopy = isHub ? synthesis : (selectedNode.raw_content || selectedNode.summary || selectedNode.label);
              if (textToCopy) navigator.clipboard.writeText(textToCopy);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#18181b] border border-[#27272a] rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Content'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-black bg-white hover:opacity-90 rounded-md transition-opacity"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
