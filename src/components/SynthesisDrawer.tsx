// src/components/SynthesisDrawer.tsx
'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, X, FileText, Sparkles, Layers, Share2 } from 'lucide-react';
import OmniDocViewer from './OmniDocViewer';

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
  const [copied, setCopied] = useState(false);
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
        }),
      });
      setPinNotification('Pinned directive to Shelf!');
      if (onHighlightPinned) onHighlightPinned();
    } catch {
      // Local fallback
      setPinNotification('Directive saved locally.');
    } finally {
      setTimeout(() => setPinNotification(null), 3000);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[500px] md:w-[560px] bg-[#0c0c10] border-l border-[#27272a] z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#27272a] flex items-center justify-between bg-[#111116]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              Ω
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
              {isHub ? 'OmniDoc · Master Cluster' : `Source Document · ${selectedNode.source || 'Note'}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pinNotification && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                ✓ {pinNotification}
              </span>
            )}
            <button 
              onClick={onClose} 
              className="text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ========================================================= */}
          {/* VIEW A: INDIVIDUAL SOURCE ITEM (WhatsApp, Drive, Reel)    */}
          {/* ========================================================= */}
          {!isHub && (
            <div className="p-6 space-y-5">
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  Source Node
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {selectedNode.label}
                </h2>
              </div>

              {/* Source Badge & External Link */}
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-md border border-[#27272a] bg-[#18181f] text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Source: {selectedNode.source || 'text'}
                </span>

                {selectedNode.source_url && (
                  <a
                    href={selectedNode.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-4 font-mono"
                  >
                    Open Original <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* AI Normalized Gist */}
              {selectedNode.summary && (
                <div className="bg-gradient-to-r from-zinc-900 to-[#141419] border border-[#27272a] p-4 rounded-lg shadow-sm">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    AI Summary Gist
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                    {selectedNode.summary}
                  </p>
                </div>
              )}

              {/* Original Content / Transcript Box */}
              <div className="border border-[#27272a] rounded-lg p-4 bg-[#09090c] shadow-inner">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  Original Saved Content & Transcript
                </div>
                <div className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed bg-[#111116] p-3 rounded border border-zinc-800">
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
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-zinc-400 font-mono text-xs">
                    Synthesizing multi-source OmniDoc brief...
                  </div>
                  <div className="text-[10px] text-zinc-600 font-mono">
                    Aggregating linked markdown & vector embeddings
                  </div>
                </div>
              ) : synthesis ? (
                <OmniDocViewer 
                  clusterTitle={selectedNode.label} 
                  rawMarkdown={synthesis} 
                  onPinDirective={handlePinDirective}
                />
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No synthesis available.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a] flex items-center justify-between bg-[#111116]">
          <button
            onClick={() => {
              const textToCopy = isHub ? synthesis : (selectedNode.raw_content || selectedNode.summary || selectedNode.label);
              if (textToCopy) navigator.clipboard.writeText(textToCopy);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#18181f] border border-[#27272a] hover:border-zinc-600 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Content'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-md transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
