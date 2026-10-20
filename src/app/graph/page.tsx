'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import SynthesisDrawer from '@/components/SynthesisDrawer';
import { GraphNode, GraphLink } from '@/components/ConstellationCanvas';
import { 
  RotateCcw, 
  Search, 
  Sparkles, 
  Filter, 
  FileText, 
  Layers, 
  Sun, 
  Moon, 
  HelpCircle, 
  Info,
  Compass,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

// Dynamic import with SSR disabled to prevent Canvas hydration errors
const ConstellationCanvas = dynamic(
  () => import('@/components/ConstellationCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#f8fafc] text-zinc-600 font-mono text-sm space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-slate-700">Rendering Light Paper Studio Constellation...</span>
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showGuide, setShowGuide] = useState(true);
  const [isCleanUser, setIsCleanUser] = useState(false);

  // Initialize theme from localStorage (default 'light')
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('omnibrain_graph_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
      }
    } catch {}
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('omnibrain_graph_theme', nextTheme);
    } catch {}
  };

  // Fetch live network data from /api/graph
  const loadGraph = async () => {
    setIsLoading(true);
    const hasSimUser = typeof window !== 'undefined' && !!localStorage.getItem('omnibrain_simulated_user');
    setIsCleanUser(hasSimUser);
    const url = hasSimUser ? '/api/graph?mode=clean' : '/api/graph';

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (err) {
      console.error('Failed to load graph data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();

    const handleAuthChange = () => loadGraph();
    window.addEventListener('omnibrain_auth_change', handleAuthChange);
    return () => window.removeEventListener('omnibrain_auth_change', handleAuthChange);
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

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#07070a] text-[#fafafa]'
    }`}>
      {/* Top Header Navigation */}
      <Header currentView="graph" />

      <main className="relative flex-1 w-full h-[calc(100vh-56px)]">
        {/* Floating HUD Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
          {/* Main Controls Card */}
          <div className={`backdrop-blur-md p-3.5 rounded-xl border shadow-xl space-y-3 transition-colors ${
            isLight 
              ? 'bg-white/95 border-slate-200 shadow-slate-200/50 text-slate-800' 
              : 'bg-[#0f0f15]/90 border-[#27272a] shadow-2xl text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                <span className="text-xs font-bold tracking-tight">Constellation Map</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                  isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-950 text-indigo-300'
                }`}>
                  {isLight ? 'Paper Studio' : 'Cosmic Nebula'}
                </span>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={handleToggleTheme}
                className={`p-1.5 rounded-md border flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                }`}
                title={`Switch to ${isLight ? 'Dark Nebula' : 'Light Paper'} Mode`}
              >
                {isLight ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                )}
              </button>
            </div>

            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
              Luminous links connect rounded <span className="font-mono font-medium text-indigo-600 dark:text-indigo-300">.md</span> files and source notes directly into central knowledge clusters.
            </p>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search nodes & .md files..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none font-mono transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400' 
                    : 'bg-[#161620] border-[#27272a] focus:border-indigo-500 text-zinc-200 placeholder-zinc-500'
                }`}
              />
            </div>

            {/* Source Type Filter Chips */}
            <div className={`space-y-1.5 pt-1 border-t ${isLight ? 'border-slate-100' : 'border-zinc-800'}`}>
              <div className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                Filter Provenance:
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => setFilterSource(null)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === null 
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-sm' 
                      : isLight 
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900' 
                        : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  All Sources ({displayedNodes.length})
                </button>
                <button
                  onClick={() => setFilterSource('document')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === 'document' 
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' 
                      : isLight 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : 'bg-zinc-800/60 text-indigo-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> .MD Files
                </button>
                <button
                  onClick={() => setFilterSource('whatsapp')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === 'whatsapp' 
                      ? 'bg-emerald-600 text-white border-emerald-600 font-semibold' 
                      : isLight 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-zinc-800/60 text-emerald-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> WhatsApp
                </button>
                <button
                  onClick={() => setFilterSource('gdrive')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === 'gdrive' 
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold' 
                      : isLight 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-zinc-800/60 text-blue-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Drive
                </button>
                <button
                  onClick={() => setFilterSource('instagram')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === 'instagram' 
                      ? 'bg-rose-600 text-white border-rose-600 font-semibold' 
                      : isLight 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-zinc-800/60 text-rose-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Reels
                </button>
              </div>
            </div>

            {/* Reset / Status */}
            <div className={`flex items-center justify-between pt-2 border-t text-[10px] ${
              isLight ? 'border-slate-100 text-slate-500' : 'border-zinc-800 text-zinc-400'
            }`}>
              <span className="flex items-center gap-1">
                <span className="text-amber-500 font-bold">★</span> Gold halo = Bookmarked
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="hover:underline flex items-center gap-1 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>{showGuide ? 'Hide Guide' : 'Legend'}</span>
                </button>
                <button
                  onClick={() => {
                    setFilterSource(null);
                    setSearchQuery('');
                  }}
                  className={`p-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                  title="Reset View"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Guide Card */}
          {showGuide && (
            <div className={`backdrop-blur-md p-3 rounded-lg border shadow-lg space-y-2 text-xs animate-in fade-in duration-150 ${
              isLight ? 'bg-white/95 border-slate-200 text-slate-700' : 'bg-[#0f0f15]/90 border-[#27272a] text-zinc-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  How to Read the Constellation
                </span>
                <button 
                  onClick={() => setShowGuide(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">📄</span>
                  <span><strong>Rounded Cards:</strong> Ingested <code className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">.md</code> files, WhatsApp chats, and reels.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">◆</span>
                  <span><strong>Central Hubs:</strong> Topic clusters. Click a hub to synthesize a full multi-source <strong>OmniDoc</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold">⚡</span>
                  <span><strong>Flowing Lines:</strong> Directional particles show provenance linking sources to their master clusters.</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Clean User Empty State Notice */}
        {isCleanUser && graphData.nodes.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6 pointer-events-none">
            <div className={`pointer-events-auto max-w-md p-6 rounded-xl border shadow-2xl text-center space-y-3 ${
              isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#121218]/95 border-zinc-800 text-white'
            }`}>
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 text-indigo-600 flex items-center justify-center mx-auto">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold">Your Personal Constellation is Ready</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                You are currently in Clean User Mode with 0 saved items. Ingest your first document or note on the Dashboard to watch your knowledge graph grow!
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Go to Universal Ingestion Dock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Live Canvas View */}
        {!isLoading && (
          <ConstellationCanvas
            data={{ nodes: displayedNodes, links: displayedLinks }}
            onNodeClick={handleNodeClick}
            theme={theme}
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
