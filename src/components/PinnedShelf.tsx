// src/components/PinnedShelf.tsx
'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Sparkles, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface Highlight {
  id: string;
  topic_cluster: string;
  highlight_text: string;
  source_badge: string;
  created_at?: string;
}

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  {
    id: 'hl-1',
    topic_cluster: 'Backend & Systems',
    highlight_text: 'Bind Redis port 6379 strictly to 127.0.0.1 in Docker Compose to prevent unauthorized external access.',
    source_badge: 'WA Note',
  },
  {
    id: 'hl-2',
    topic_cluster: 'Graphify & AI',
    highlight_text: 'Dynamic Imports: react-force-graph-2d is isolated with ssr: false to eliminate Canvas hydration mismatches.',
    source_badge: 'OmniDoc Directive',
  },
  {
    id: 'hl-3',
    topic_cluster: 'Italian Cooking',
    highlight_text: 'Emulsify carbonara sauce off-heat at ~65°C using starchy pasta cooking water with Pecorino Romano.',
    source_badge: 'Reel Recipe',
  },
];

export default function PinnedShelf() {
  const [highlights, setHighlights] = useState<Highlight[]>(DEFAULT_HIGHLIGHTS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/highlights')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setHighlights(data);
        }
      })
      .catch(err => console.error('Failed to load pinned highlights', err));
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    fetch(`/api/highlights?id=${id}`, { method: 'DELETE' }).catch(() => {});
  };

  return (
    <section className="bg-gradient-to-b from-[#131318] to-[#0f0f14] border border-[#27272a] hover:border-zinc-700 rounded-lg p-4 mb-6 shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between border-b border-[#27272a]/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs">
            ★
          </div>
          <h2 className="font-semibold text-xs text-white tracking-wide uppercase font-mono">
            Pinned Highlights & Directives
          </h2>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full font-medium">
            {highlights.length} Pinned
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-zinc-500 hover:text-white p-1 rounded transition-colors text-xs flex items-center gap-1 font-mono"
        >
          <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          {highlights.map(h => (
            <div 
              key={h.id} 
              className="group relative bg-[#0a0a0e] border border-[#23232b] hover:border-amber-500/40 rounded-md p-3 flex flex-col justify-between transition-all duration-200 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
                    {h.topic_cluster}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {h.source_badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic line-clamp-3">
                  "{h.highlight_text}"
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-zinc-800/60 flex items-center justify-between">
                <button
                  onClick={() => handleCopy(h.id, h.highlight_text)}
                  className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedId === h.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Directive</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDelete(h.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 p-1 transition-opacity"
                  title="Remove from Shelf"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
