// src/components/ClusterCardsGrid.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SynthesisDrawer, { SelectedNodeData } from './SynthesisDrawer';
import { ArrowRight, Compass } from 'lucide-react';

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

  // 60-30-10 Classy Principle: Quiet, neutral badges (no neon rainbow)
  const getBadgeStyle = () => {
    return 'bg-[#EAE5DC] dark:bg-[#2B2A27] text-[#4A453E] dark:text-[#C4BEB3] border-[#D6CEC1] dark:border-[#3B3935]';
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="text-[#6B655C] dark:text-[#9E9990] text-xs font-mono animate-pulse col-span-full py-8 text-center flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-[#2F4A3A] dark:border-[#B08D57] border-t-transparent rounded-full animate-spin" />
            <span>Scanning active knowledge clusters...</span>
          </div>
        ) : clusters.length === 0 ? (
          <div className="text-[#6B655C] dark:text-[#9E9990] text-xs italic col-span-full py-8 text-center bg-[#F4EFE7] dark:bg-[#232321] border border-[#E4DDD2] dark:border-[#33312E] rounded p-6">
            No topic clusters discovered yet. Start by pasting a note or link in the Universal Ingestion Dock above.
          </div>
        ) : (
          clusters.map(c => {
            const itemCount = c.item_count || c.count || c.items?.length || 0;
            return (
              <article 
                key={c.cluster_name} 
                className="group relative bg-[#F4EFE7] dark:bg-[#232321] border border-[#E4DDD2] dark:border-[#33312E] hover:border-[#2F4A3A] dark:hover:border-[#B08D57] p-5 rounded-lg flex flex-col justify-between transition-colors shadow-none"
              >
                <div>
                  <div className="flex items-start justify-between mb-2.5">
                    <h3 className="font-serif font-semibold text-base text-[#2B2B2B] dark:text-[#EDE8DF] tracking-tight flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
                      {c.cluster_name}
                    </h3>
                    <span className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] bg-[#EAE5DC] dark:bg-[#2B2A27] border border-[#D6CEC1] dark:border-[#3B3935] px-2 py-0.5 rounded">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-xs text-[#6B655C] dark:text-[#9E9990] mb-4 line-clamp-2 leading-relaxed font-sans">
                      {c.description}
                    </p>
                  )}

                  {c.items && c.items.length > 0 && (
                    <div className="space-y-2 border-t border-[#E8E2D8] dark:border-[#31302D] pt-3.5 mb-4 text-xs font-sans">
                      {c.items.slice(0, 3).map(it => (
                        <div key={it.id} className="flex items-center gap-2 truncate">
                          <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded uppercase font-medium shrink-0 ${getBadgeStyle()}`}>
                            {it.source_type === 'whatsapp' ? 'WA' : it.source_type === 'gdrive' ? 'DOC' : it.source_type === 'instagram' ? 'REEL' : it.source_type === 'document' ? '.MD' : 'WEB'}
                          </span>
                          <span className="truncate text-[#4A453D] dark:text-[#C4BEB3]">
                            {it.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E8E2D8] dark:border-[#31302D] pt-3.5 flex items-center justify-between mt-auto">
                  <div className="flex gap-1.5 flex-wrap max-w-[65%]">
                    {c.entities && c.entities.length > 0 ? (
                      c.entities.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] font-mono text-[#6B655C] dark:text-[#9E9990] bg-[#EAE5DC] dark:bg-[#2B2A27] border border-[#D6CEC1] dark:border-[#3B3935] px-1.5 py-0.5 rounded truncate max-w-[95px]">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] font-mono text-[#6B655C] dark:text-[#9E9990] bg-[#EAE5DC] dark:bg-[#2B2A27] border border-[#D6CEC1] dark:border-[#3B3935] px-1.5 py-0.5 rounded">
                        #OmniBrain
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => openSynthesis(c.cluster_name)}
                      className="text-xs font-medium text-[#FAF7F2] dark:text-[#1C1C1C] bg-[#2F4A3A] hover:bg-[#243B2E] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-none font-sans"
                    >
                      <span>Synthesize</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
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
