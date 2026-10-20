// src/components/ClusterCardsGrid.tsx
'use client';

import { useEffect, useState } from 'react';
import SynthesisDrawer, { SelectedNodeData } from './SynthesisDrawer';
import { Sparkles, ArrowRight, Layers, FileText } from 'lucide-react';

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

interface ClusterCardsGridProps {
  refreshTrigger?: number;
}

export default function ClusterCardsGrid({ refreshTrigger }: ClusterCardsGridProps) {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [selectedNode, setSelectedNode] = useState<SelectedNodeData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClusters = () => {
    setIsLoading(true);
    const isSimulated = typeof window !== 'undefined' && !!localStorage.getItem('omnibrain_simulated_user');
    const url = isSimulated ? '/api/clusters?mode=clean' : '/api/clusters';

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClusters(data);
      })
      .catch(err => console.error('Failed to load clusters', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchClusters();

    const handleAuthChange = () => fetchClusters();
    window.addEventListener('omnibrain_auth_change', handleAuthChange);
    return () => window.removeEventListener('omnibrain_auth_change', handleAuthChange);
  }, [refreshTrigger]);

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
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50';
      case 'gdrive':
      case 'drive':
        return 'bg-blue-950/50 text-blue-300 border-blue-700/50';
      case 'instagram':
      case 'reel':
        return 'bg-rose-950/50 text-rose-300 border-rose-700/50';
      case 'document':
        return 'bg-indigo-950/50 text-indigo-300 border-indigo-700/50';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="text-zinc-500 text-xs font-mono animate-pulse col-span-full py-8 text-center flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Scanning active knowledge clusters...</span>
          </div>
        ) : clusters.length === 0 ? (
          <div className="text-zinc-500 text-xs italic col-span-full py-8 text-center bg-[#101015] border border-zinc-800 rounded-lg p-6">
            No topic clusters discovered yet. Start by pasting a note or link in the Universal Omni Dock above.
          </div>
        ) : (
          clusters.map(c => {
            const itemCount = c.item_count || c.count || c.items?.length || 0;
            return (
              <article 
                key={c.cluster_name} 
                className="group relative bg-gradient-to-b from-[#14141a] to-[#0f0f13] border border-[#27272a] hover:border-indigo-500/50 p-4 rounded-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-[0_4px_20px_rgba(99,102,241,0.12)]"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm text-white group-hover:text-indigo-200 transition-colors flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform" />
                      {c.cluster_name}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400 bg-[#1c1c24] border border-[#27272a] px-2 py-0.5 rounded-full">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-xs text-zinc-400 mb-3.5 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  {c.items && c.items.length > 0 && (
                    <div className="space-y-1.5 border-t border-[#1f1f26] pt-3 mb-3 text-xs">
                      {c.items.slice(0, 3).map(it => (
                        <div key={it.id} className="flex items-center gap-2 truncate">
                          <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded uppercase font-medium ${getBadgeStyle(it.source_type)}`}>
                            {it.source_type === 'whatsapp' ? 'WA' : it.source_type === 'gdrive' ? 'DRIVE' : it.source_type === 'instagram' ? 'REEL' : it.source_type === 'document' ? '.MD' : 'WEB'}
                          </span>
                          <span className="truncate text-zinc-300 group-hover:text-zinc-100 transition-colors">
                            {it.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#1f1f26] pt-3 flex items-center justify-between mt-auto">
                  <div className="flex gap-1 flex-wrap max-w-[65%]">
                    {c.entities && c.entities.length > 0 ? (
                      c.entities.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] font-mono text-zinc-500 bg-[#18181f] border border-[#27272a] px-1.5 py-0.5 rounded truncate max-w-[90px]">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] font-mono text-zinc-500 bg-[#18181f] px-1.5 py-0.5 rounded">
                        #OmniBrain
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => openSynthesis(c.cluster_name)}
                    className="text-xs font-semibold text-white bg-indigo-950/80 hover:bg-indigo-600 border border-indigo-700/60 hover:border-indigo-400 px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-300" />
                    <span>Synthesize</span>
                    <ArrowRight className="w-3 h-3 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
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
        onHighlightPinned={fetchClusters}
      />
    </>
  );
}
