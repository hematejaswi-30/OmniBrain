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
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const clusterHubs = graphData.nodes.filter(n => n.type === 'hub');

  // Initialize theme from documentElement and listen for global theme changes
  useEffect(() => {
    const syncTheme = () => {
      try {
        const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('omnibrain_theme') === 'dark';
        setTheme(isDark ? 'dark' : 'light');
      } catch {}
    };
    syncTheme();

    window.addEventListener('omnibrain_theme_change', syncTheme);
    return () => window.removeEventListener('omnibrain_theme_change', syncTheme);
  }, []);

  const handleToggleTheme = () => {
    const isCurrentDark = document.documentElement.classList.contains('dark');
    const nextTheme = isCurrentDark ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('omnibrain_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      window.dispatchEvent(new Event('omnibrain_theme_change'));
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

        // Auto-focus node from ?focus=<nodeId> query parameter
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const focusId = params.get('focus');
          if (focusId && Array.isArray(data.nodes)) {
            const matched = data.nodes.find((n: any) => n.id === focusId);
            if (matched) {
              setSelectedNode({
                id: matched.id,
                type: matched.type,
                label: matched.label,
                source: matched.source,
                summary: matched.summary,
                raw_content: matched.raw_content,
                source_url: matched.source_url,
              });
              setIsDrawerOpen(true);
            }
          }
        }
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
      isLight ? 'bg-[#FAF7F2] text-[#2B2B2B]' : 'bg-[#1C1C1C] text-[#EDE8DF]'
    }`}>
      {/* Top Header Navigation */}
      <Header currentView="graph" />

      <main className="relative flex-1 w-full h-[calc(100vh-56px)]">
        {/* Floating HUD Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
          {/* Main Controls Card */}
          <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
            isLight 
              ? 'bg-[#F4EFE7]/95 border-[#E4DDD2] text-[#2B2B2B] shadow-sm' 
              : 'bg-[#242422]/95 border-[#33312E] text-[#EDE8DF] shadow-none'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
                <span className="font-serif text-sm font-semibold tracking-tight">Constellation Map</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                  isLight ? 'bg-[#EBF1EC] text-[#2F4A3A] border border-[#D5DFD7]' : 'bg-[#2B261D] text-[#B08D57] border border-[#3E372B]'
                }`}>
                  {isLight ? 'Editorial Paper' : 'Dark Luxury'}
                </span>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={handleToggleTheme}
                className={`p-1.5 rounded border flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer ${
                  isLight 
                    ? 'bg-[#EDE7DE] hover:bg-[#E2DDD3] border-[#DCD4C7] text-[#4A453D]' 
                    : 'bg-[#2E2D2A] hover:bg-[#383632] border-[#3F3D38] text-[#C4BEB3]'
                }`}
                title={`Switch to ${isLight ? 'Dark Luxury' : 'Editorial Paper'} Mode`}
              >
                <span>{isLight ? '🌙' : '☀️'}</span>
                <span>{isLight ? 'Dark' : 'Light'}</span>
              </button>
            </div>

            <p className={`text-[11px] leading-relaxed font-sans ${isLight ? 'text-[#6B655C]' : 'text-[#9E9990]'}`}>
              Interconnected <span className="font-mono font-medium text-[#2F4A3A] dark:text-[#B08D57]">.md</span> files and source notes mapped around core topic clusters.
            </p>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8F897F] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search nodes & .md files..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full border rounded pl-8 pr-3 py-1.5 text-xs outline-none font-sans transition-colors ${
                  isLight 
                    ? 'bg-[#FFFFFF] border-[#DDD5C7] focus:border-[#2F4A3A] text-[#2B2B2B] placeholder-[#948D82]' 
                    : 'bg-[#1C1C1C] border-[#383632] focus:border-[#B08D57] text-[#EDE8DF] placeholder-[#757169]'
                }`}
              />
            </div>

            {/* Source Type Filter Chips */}
            <div className={`space-y-1.5 pt-1 border-t ${isLight ? 'border-[#E8E2D8]' : 'border-[#31302D]'}`}>
              <div className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#6B655C]' : 'text-[#9E9990]'}`}>
                Filter Provenance:
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => setFilterSource(null)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === null 
                      ? isLight ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A]' : 'bg-[#B08D57] text-[#1C1C1C] border-[#B08D57]'
                      : isLight 
                        ? 'bg-[#ECE6DC] text-[#5C574F] border-[#DCD4C7] hover:text-[#2B2B2B]' 
                        : 'bg-[#2A2927] text-[#B5B0A6] border-[#383634] hover:text-white'
                  }`}
                >
                  All ({displayedNodes.length})
                </button>
                <button
                  onClick={() => setFilterSource('document')}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === 'document' 
                      ? isLight ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A]' : 'bg-[#B08D57] text-[#1C1C1C] border-[#B08D57]'
                      : isLight 
                        ? 'bg-[#ECE6DC] text-[#5C574F] border-[#DCD4C7]' 
                        : 'bg-[#2A2927] text-[#B5B0A6] border-[#383634]'
                  }`}
                >
                  .MD Docs
                </button>
                <button
                  onClick={() => setFilterSource('whatsapp')}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === 'whatsapp' 
                      ? isLight ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A]' : 'bg-[#B08D57] text-[#1C1C1C] border-[#B08D57]'
                      : isLight 
                        ? 'bg-[#ECE6DC] text-[#5C574F] border-[#DCD4C7]' 
                        : 'bg-[#2A2927] text-[#B5B0A6] border-[#383634]'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setFilterSource('gdrive')}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === 'gdrive' 
                      ? isLight ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A]' : 'bg-[#B08D57] text-[#1C1C1C] border-[#B08D57]'
                      : isLight 
                        ? 'bg-[#ECE6DC] text-[#5C574F] border-[#DCD4C7]' 
                        : 'bg-[#2A2927] text-[#B5B0A6] border-[#383634]'
                  }`}
                >
                  Drive
                </button>
                <button
                  onClick={() => setFilterSource('instagram')}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    filterSource === 'instagram' 
                      ? isLight ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A]' : 'bg-[#B08D57] text-[#1C1C1C] border-[#B08D57]'
                      : isLight 
                        ? 'bg-[#ECE6DC] text-[#5C574F] border-[#DCD4C7]' 
                        : 'bg-[#2A2927] text-[#B5B0A6] border-[#383634]'
                  }`}
                >
                  Reels
                </button>
              </div>
            </div>

            {/* Master Clusters Quick-Jump Bar (Auto-Center on click) */}
            {clusterHubs.length > 0 && (
              <div className={`space-y-1.5 pt-2 border-t ${isLight ? 'border-[#E8E2D8]' : 'border-[#31302D]'}`}>
                <div className={`text-[10px] font-mono uppercase tracking-wider flex items-center justify-between ${isLight ? 'text-[#6B655C]' : 'text-[#9E9990]'}`}>
                  <span>Center Master Cluster:</span>
                  <span className="text-[9px] text-[#2F4A3A] dark:text-[#B08D57] font-semibold">Click to Center 🎯</span>
                </div>
                <div className="flex flex-col gap-1">
                  {clusterHubs.map(hub => {
                    const isSelected = selectedNode?.id === hub.id;
                    return (
                      <button
                        key={hub.id}
                        onClick={() => {
                          setFocusedNodeId(hub.id);
                          handleNodeClick(hub);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-serif flex items-center justify-between border transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A] shadow-xs'
                              : 'bg-[#B08D57] text-[#1C1C1C] border-[#B08D57] shadow-xs'
                            : isLight
                              ? 'bg-[#FFFFFF] hover:bg-[#EDE7DE] border-[#DDD5C7] text-[#2B2B2B]'
                              : 'bg-[#1C1C1C] hover:bg-[#2E2D2A] border-[#383632] text-[#EDE8DF]'
                        }`}
                        title={`Click to smoothly center camera on ${hub.label}`}
                      >
                        <span className="truncate font-medium">{hub.label}</span>
                        <span className="text-[10px] font-mono opacity-80 ml-2">🎯 Center</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reset / Status */}
            <div className={`flex items-center justify-between pt-2 border-t text-[10px] ${
              isLight ? 'border-[#E8E2D8] text-[#6B655C]' : 'border-[#31302D] text-[#9E9990]'
            }`}>
              <span className="flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" /> Bounded Physics Active
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="hover:underline flex items-center gap-1 text-[#2F4A3A] dark:text-[#B08D57] cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>{showGuide ? 'Hide' : 'Legend'}</span>
                </button>
                <button
                  onClick={() => {
                    setFilterSource(null);
                    setSearchQuery('');
                    setFocusedNodeId(null);
                  }}
                  className={`p-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    isLight ? 'hover:bg-[#EDE7DE] text-[#6B655C]' : 'hover:bg-[#2E2D2A] text-[#9E9990]'
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
            <div className={`p-4 rounded-xl border space-y-2 text-xs animate-in fade-in duration-150 ${
              isLight ? 'bg-[#F4EFE7]/95 border-[#E4DDD2] text-[#2B2B2B]' : 'bg-[#242422]/95 border-[#33312E] text-[#EDE8DF]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-serif font-semibold text-xs text-[#2B2B2B] dark:text-[#EDE8DF] flex items-center gap-1.5">
                  How to Read the Map
                </span>
                <button 
                  onClick={() => setShowGuide(false)}
                  className="text-[#8F897F] hover:text-[#2B2B2B] dark:hover:text-white text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed font-sans text-[#4A453D] dark:text-[#C4BEB3]">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#2F4A3A] dark:text-[#B08D57] font-bold">📄</span>
                  <span><strong>Source Cards:</strong> Ingested <code className="font-mono text-[10px] bg-[#EAE5DC] dark:bg-[#2B2A27] px-1 py-0.5 rounded">.md</code> files, WhatsApp chats, and reels.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#2F4A3A] dark:text-[#B08D57] font-bold">◆</span>
                  <span><strong>Central Hubs:</strong> Topic clusters. Click a hub to synthesize a multi-source <strong>OmniDoc</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#2F4A3A] dark:text-[#B08D57] font-bold">⚡</span>
                  <span><strong>Filaments:</strong> Directional particles show provenance linking sources to their master clusters.</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Clean User Empty State Notice */}
        {isCleanUser && graphData.nodes.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6 pointer-events-none">
            <div className={`pointer-events-auto max-w-md p-6 rounded-xl border text-center space-y-3 ${
              isLight ? 'bg-[#F4EFE7] border-[#E4DDD2] text-[#2B2B2B]' : 'bg-[#242422] border-[#33312E] text-[#EDE8DF]'
            }`}>
              <div className="w-10 h-10 rounded bg-[#EAE5DC] dark:bg-[#2B2A27] border border-[#D6CEC1] dark:border-[#3B3935] text-[#2F4A3A] dark:text-[#B08D57] flex items-center justify-center mx-auto">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-semibold">Your Personal Constellation is Ready</h3>
              <p className="text-xs text-[#6B655C] dark:text-[#9E9990] leading-relaxed font-sans">
                You are currently in Clean User Mode with 0 saved items. Ingest your first document or note on the Dashboard to watch your knowledge graph grow!
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-[#2F4A3A] hover:bg-[#243B2E] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] text-[#FAF7F2] dark:text-[#1C1C1C] text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 shadow-none"
                >
                  <span>Go to Ingestion Dock</span>
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
            focusedNodeId={focusedNodeId}
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
