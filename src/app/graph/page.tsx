// src/app/graph/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SynthesisDrawer from '@/components/SynthesisDrawer';
import { GraphNode, GraphLink } from '@/components/ConstellationCanvas';
import { RotateCcw, Search, Sparkles, Filter, FileText, Layers } from 'lucide-react';

// Dynamic import with SSR disabled to prevent Canvas hydration errors
const ConstellationCanvas = dynamic(
  () => import('@/components/ConstellationCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] text-zinc-400 font-mono text-sm space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Initializing Cosmic Constellation Engine...</span>
      </div>
    ),
  }
);

export default function GraphPage() {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch live network data from /api/graph
  useEffect(() => {
    async function loadGraph() {
      try {
        const res = await fetch('/api/graph');
        if (res.ok) {
          const data = await res.json();
          setGraphData(data);
        }
      } catch (err) {
        console.error('Failed to load graph data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGraph();
  }, []);

  // Filter nodes based on search and source filter
  const displayedNodes = graphData.nodes.filter(n => {
    const matchesFilter = !filterSource || n.type === 'hub' || n.source === filterSource;
    const matchesSearch = !searchQuery.trim() || n.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const displayedLinks = graphData.links.filter(l => {
    const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
    const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
    return displayedNodes.some(n => n.id === sId) && displayedNodes.some(n => n.id === tId);
  });

  const handleNodeClick = (node: any) => {
    setSelectedNode({
      id: node.id,
      type: node.type,
      label: node.label,
      source: node.source,
      summary: node.summary,
      raw_content: node.raw_content,
      source_url: node.source_url,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-[#fafafa] flex flex-col overflow-hidden">
      {/* Top Header Navigation */}
      <Header currentView="graph" />

      <main className="relative flex-1 w-full h-[calc(100vh-56px)]">
        {/* Floating HUD Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
          <div className="bg-[#0f0f15]/90 backdrop-blur-md border border-[#27272a] p-3.5 rounded-lg shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-xs font-semibold text-white tracking-tight">Constellation Graph</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                {displayedNodes.length} Nodes · {displayedLinks.length} Lines
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Luminous lines connect rounded <span className="text-indigo-300 font-mono font-medium">.md</span> files and source notes directly into central knowledge clusters.
            </p>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search nodes & .md files..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#161620] border border-[#27272a] focus:border-indigo-500 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none font-mono"
              />
            </div>

            {/* Source Type Filter Chips */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-800">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Filter Provenance:
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => setFilterSource(null)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    filterSource === null 
                      ? 'bg-indigo-600 text-white border-indigo-500' 
                      : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  All Sources
                </button>
                <button
                  onClick={() => setFilterSource('document')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                    filterSource === 'document' 
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-500 font-semibold' 
                      : 'bg-zinc-800/60 text-indigo-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]" /> .MD Files
                </button>
                <button
                  onClick={() => setFilterSource('whatsapp')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                    filterSource === 'whatsapp' 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-semibold' 
                      : 'bg-zinc-800/60 text-emerald-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" /> WhatsApp
                </button>
                <button
                  onClick={() => setFilterSource('gdrive')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                    filterSource === 'gdrive' 
                      ? 'bg-blue-950 text-blue-300 border-blue-500 font-semibold' 
                      : 'bg-zinc-800/60 text-blue-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" /> Drive
                </button>
                <button
                  onClick={() => setFilterSource('instagram')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                    filterSource === 'instagram' 
                      ? 'bg-rose-950 text-rose-300 border-rose-500 font-semibold' 
                      : 'bg-zinc-800/60 text-rose-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f472b6]" /> Reels
                </button>
              </div>
            </div>

            {/* Reset / Legend */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="text-amber-400">★</span> Gold halo = Bookmarked
              </span>
              <button
                onClick={() => {
                  setFilterSource(null);
                  setSearchQuery('');
                }}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors flex items-center gap-1"
                title="Reset View"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Canvas View */}
        {!isLoading && (
          <ConstellationCanvas
            data={{ nodes: displayedNodes, links: displayedLinks }}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* Sliding Dual-Mode Drawer (Cluster Summary vs Individual Document) */}
        <SynthesisDrawer
          selectedNode={selectedNode}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      </main>
    </div>
  );
}
