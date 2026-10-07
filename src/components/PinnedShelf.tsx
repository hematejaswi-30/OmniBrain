// src/components/PinnedShelf.tsx
'use client';

import { useEffect, useState } from 'react';

interface Highlight {
  id: string;
  topic_cluster: string;
  highlight_text: string;
  source_badge: string;
  created_at: string;
}

export default function PinnedShelf() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    fetch('/api/highlights')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHighlights(data);
      })
      .catch(err => console.error('Failed to load pinned highlights', err));
  }, []);

  return (
    <div className="bg-[#121215] border border-[#27272a] rounded-md p-4 flex flex-col h-full min-h-[400px]">
      <div className="flex items-center gap-2 mb-4 border-b border-[#27272a] pb-3">
        <span className="text-[#f59e0b] text-lg leading-none">★</span>
        <h2 className="font-semibold text-zinc-100 tracking-tight">Pinned Shelf</h2>
      </div>
      
      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        {highlights.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">No pinned highlights yet.</p>
        ) : (
          highlights.map(h => (
            <div key={h.id} className="text-sm border-l-2 border-[#f59e0b] pl-3 py-1 flex flex-col gap-2">
              <p className="text-zinc-300 leading-relaxed italic line-clamp-4">"{h.highlight_text}"</p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium tracking-wide uppercase">
                <span className="bg-[#18181b] px-1.5 py-0.5 rounded border border-[#27272a]">
                  {h.topic_cluster}
                </span>
                <span>•</span>
                <span>{h.source_badge}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
