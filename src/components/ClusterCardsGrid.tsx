// src/components/ClusterCardsGrid.tsx
'use client';

import { useEffect, useState } from 'react';
import SynthesisDrawer, { SelectedNodeData } from './SynthesisDrawer';

export interface ClusterItem {
  id: string;
  title: string;
  source_type: string;
  summary?: string;
}

export interface ClusterData {
  cluster_name: string;
  item_count?: number;
  count?: number;
  description?: string;
  items?: ClusterItem[];
  entities?: string[];
}

export default function ClusterCardsGrid() {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [selectedNode, setSelectedNode] = useState<SelectedNodeData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clusters')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClusters(data);
      })
      .catch(err => console.error('Failed to load clusters', err))
      .finally(() => setIsLoading(false));
  }, []);

  const openSynthesis = (name: string) => {
    setSelectedNode({
      id: `hub_${name.toLowerCase().replace(/\s+/g, '_')}`,
      type: 'hub',
      label: name,
    });
    setIsDrawerOpen(true);
  };

  const getBadgeStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'whatsapp':
        return 'bg-[#121c17] text-emerald-400 border-[#1e3827]';
      case 'gdrive':
        return 'bg-[#141b24] text-blue-400 border-[#1c2b3d]';
      case 'instagram':
      case 'reel':
        return 'bg-[#1a1518] text-rose-400 border-[#381e28]';
      default:
        return 'bg-[#18181b] text-zinc-300 border-[#27272a]';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="text-zinc-500 text-sm animate-pulse col-span-full py-8">Scanning active knowledge clusters...</div>
        ) : clusters.length === 0 ? (
          <div className="text-zinc-500 text-sm italic col-span-full py-8">No topic clusters discovered yet. Start by pasting a link in the Omnibox.</div>
        ) : (
          clusters.map(c => {
            const itemCount = c.item_count || c.count || c.items?.length || 0;
            return (
              <article 
                key={c.cluster_name} 
                className="bg-[#121215] border border-[#27272a] hover:border-zinc-700 p-4 rounded-md flex flex-col justify-between transition-colors group"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm text-white">{c.cluster_name}</h3>
                    <span className="text-[10px] font-mono text-zinc-400 bg-[#1c1c21] border border-[#27272a] px-1.5 py-0.5 rounded">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-xs text-zinc-400 mb-3">{c.description}</p>
                  )}

                  {c.items && c.items.length > 0 && (
                    <div className="space-y-1.5 border-t border-[#1c1c21] pt-2.5 mb-3 text-xs text-zinc-500">
                      {c.items.slice(0, 3).map(it => (
                        <div key={it.id} className="flex items-center gap-2 truncate">
                          <span className={`text-[10px] font-mono border px-1 py-0.2 rounded uppercase ${getBadgeStyle(it.source_type)}`}>
                            {it.source_type === 'whatsapp' ? 'WA' : it.source_type === 'gdrive' ? 'DRIVE' : it.source_type === 'instagram' ? 'REEL' : 'WEB'}
                          </span>
                          <span className="truncate text-zinc-300">{it.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#1c1c21] pt-3 flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {c.entities && c.entities.length > 0 ? (
                      c.entities.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-mono text-zinc-500 bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500 bg-[#18181b] px-1.5 py-0.5 rounded">
                        OmniBrain
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => openSynthesis(c.cluster_name)}
                    className="text-xs font-medium text-white bg-[#1f1f23] hover:bg-white hover:text-black border border-[#27272a] px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                  >
                    Synthesize <span>→</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <SynthesisDrawer 
        selectedNode={selectedNode} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
}
