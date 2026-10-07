// src/app/graph/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SynthesisDrawer from '@/components/SynthesisDrawer';
import { GraphNode, GraphLink } from '@/components/ConstellationCanvas';
import { RotateCcw } from 'lucide-react';

// Dynamic import with SSR disabled to prevent Canvas hydration errors
const ConstellationCanvas = dynamic(
  () => import('@/components/ConstellationCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#09090b] text-zinc-500 font-mono text-sm">
        Initializing Constellation Engine...
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

  // Node selection: Clicking any hub or source node passes selected node data directly
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
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col overflow-hidden">
      {/* Top Header Navigation */}
      <Header currentView="graph" />

      <main className="relative flex-1 w-full h-[calc(100vh-56px)]">
        {/* Floating HUD Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="bg-[#121215]/85 backdrop-blur-md border border-[#27272a] p-3 rounded-md shadow-lg">
            <div className="text-xs font-semibold text-zinc-300">Constellation Graph</div>
            <div className="text-[11px] text-zinc-500 mb-2">
              ★ Gold halo indicates bookmarked clusters
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => window.location.reload()}
                className="p-1.5 bg-[#18181b] border border-[#27272a] rounded text-zinc-300 hover:text-white"
                title="Reset Layout"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-[1px] bg-[#27272a] mx-1" />
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#4ade80]" /> WhatsApp
                <span className="w-2 h-2 rounded-full bg-[#60a5fa] ml-1" /> Drive
                <span className="w-2 h-2 rounded-full bg-[#f472b6] ml-1" /> Instagram
              </div>
            </div>
          </div>
        </div>

        {/* Live Canvas View */}
        {!isLoading && (
          <ConstellationCanvas
            data={graphData}
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
