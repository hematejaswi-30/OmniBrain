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
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCleanUser, setIsCleanUser] = useState(false);

  const syncHighlights = () => {
    const hasSimUser = typeof window !== 'undefined' && !!localStorage.getItem('omnibrain_simulated_user');
    setIsCleanUser(hasSimUser);

    if (hasSimUser) {
      // In clean user mode, start with clean empty shelf
      setHighlights([]);
      return;
    }

    // In guest mode, load from localStorage or default highlights
    try {
      const stored = localStorage.getItem('omnibrain_guest_highlights');
      if (stored) {
        setHighlights(JSON.parse(stored));
        return;
      }
    } catch {}

    // Fallback to default sample highlights for demo guests
    setHighlights(DEFAULT_HIGHLIGHTS);
  };

  useEffect(() => {
    syncHighlights();

    const handleAuthChange = () => syncHighlights();
    window.addEventListener('omnibrain_auth_change', handleAuthChange);
    return () => window.removeEventListener('omnibrain_auth_change', handleAuthChange);
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    setHighlights(prev => {
      const updated = prev.filter(h => h.id !== id);
      try {
        if (!isCleanUser) {
          localStorage.setItem('omnibrain_guest_highlights', JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });
  };

  return (
    <section className="bg-[#F4EFE7] dark:bg-[#242422] border border-[#E4DDD2] dark:border-[#33312E] rounded-xl p-5 mb-8 transition-colors">
      <div className="flex items-center justify-between border-b border-[#E4DDD2] dark:border-[#33312E] pb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
          <h2 className="font-serif text-sm font-semibold text-[#2B2B2B] dark:text-[#EDE8DF] tracking-tight">
            Pinned Highlights & Directives
          </h2>
          <span className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] bg-[#EAE5DC] dark:bg-[#2B2A27] border border-[#D6CEC1] dark:border-[#3B3935] px-2 py-0.5 rounded font-medium">
            {highlights.length} Pinned
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] p-1 rounded transition-colors text-xs flex items-center gap-1 font-mono cursor-pointer"
        >
          <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        highlights.length === 0 ? (
          <div className="pt-4 pb-2 text-center text-xs text-[#6B655C] dark:text-[#9E9990] font-sans">
            No pinned directives yet. Open a cluster <strong className="text-[#2B2B2B] dark:text-[#EDE8DF]">OmniDoc</strong> below and click the pin icon to save directives to this shelf.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4">
            {highlights.map(h => (
              <div 
                key={h.id} 
                className="group relative bg-[#FAF7F2] dark:bg-[#1E1E1D] border border-[#E1D9CC] dark:border-[#33312E] rounded p-4 flex flex-col justify-between transition-colors shadow-none"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#4A453E] dark:text-[#C4BEB3] bg-[#EAE5DC] dark:bg-[#2B2A27] border border-[#D6CEC1] dark:border-[#3B3935] px-1.5 py-0.5 rounded">
                      {h.topic_cluster}
                    </span>
                    <span className="text-[9px] font-mono text-[#6B655C] dark:text-[#9E9990]">
                      {h.source_badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A453D] dark:text-[#C4BEB3] leading-relaxed italic line-clamp-3 font-serif">
                    &ldquo;{h.highlight_text}&rdquo;
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E8E2D8] dark:border-[#31302D] flex items-center justify-between">
                  <button
                    onClick={() => handleCopy(h.id, h.highlight_text)}
                    className="text-[10px] font-mono text-[#2F4A3A] dark:text-[#B08D57] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === h.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
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
                    className="opacity-0 group-hover:opacity-100 text-[#8F897F] hover:text-[#8A4A4A] p-1 transition-opacity cursor-pointer"
                    title="Remove from Shelf"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </section>
  );
}
