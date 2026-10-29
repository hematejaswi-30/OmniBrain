// src/app/graph/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import SynthesisDrawer from '@/components/SynthesisDrawer';
import { GraphNode, GraphLink } from '@/components/ConstellationCanvas';
import { 
  RotateCcw, 
  Search, 
  Compass, 
  ArrowRight, 
  ExternalLink,
  Layers,
  List,
  Sparkles,
  HelpCircle,
  Minimize2,
  FileText,
  Share2
} from 'lucide-react';

// Dynamic import with SSR disabled to prevent Canvas hydration errors
const ConstellationCanvas = dynamic(
  () => import('@/components/ConstellationCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF7F2] dark:bg-[#181817] text-[#6B655C] dark:text-[#9E9990] font-mono text-xs space-y-3">
        <div className="w-8 h-8 border-2 border-[#2F4A3A] dark:border-[#B08D57] border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-[#2B2B2B] dark:text-[#EDE8DF]">Initializing 40% Constellation Vitrine...</span>
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
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [viewMode, setViewMode] = useState<'vitrine' | 'outline'>('vitrine');
  const [showLegend, setShowLegend] = useState(false);
  const [isCleanUser, setIsCleanUser] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const clusterHubs = graphData.nodes.filter(n => n.type === 'hub');

  // Sync theme
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

  // Keyboard navigation: Esc collapses expanded cluster back to Macro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedClusterId) {
          setExpandedClusterId(null);
          setFocusedNodeId(null);
        } else if (selectedNode) {
          setSelectedNode(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedClusterId, selectedNode]);

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

        // Auto-focus / auto-expand node from URL params: ?focus=<id>&expand=true
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const focusId = params.get('focus');
          const shouldExpand = params.get('expand') === 'true';

          if (focusId && Array.isArray(data.nodes)) {
            const matched = data.nodes.find((n: any) => n.id === focusId);
            if (matched) {
              setSelectedNode(matched);
              setFocusedNodeId(focusId);
              if (shouldExpand || matched.type === 'hub') {
                setExpandedClusterId(matched.id);
              }
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

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setFocusedNodeId(node.id);
    if (node.type === 'hub') {
      setExpandedClusterId(prev => (prev === node.id ? null : node.id));
    }
  };

  const handleOpenOverflow = (clusterName: string, items: GraphNode[]) => {
    // Open right inspector with full cluster items list
    const hub = clusterHubs.find(h => h.cluster_name === clusterName || h.label === clusterName);
    if (hub) {
      setSelectedNode(hub);
    }
  };

  const isLight = theme === 'light';

  // Active cluster info for header bar
  const activeCluster = clusterHubs.find(h => h.id === expandedClusterId);

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#FAF7F2] text-[#2B2B2B]' : 'bg-[#1C1C1C] text-[#EDE8DF]'
    }`}>
      {/* Top Header Navigation */}
      <Header currentView="graph" />

      {/* Main 3-Column Dedicated Layout: Left (28%) | Center 40% Showcase Vitrine (44%) | Right Inspector (28%) */}
      <main className="relative flex-1 w-full h-[calc(100vh-56px)] flex flex-col lg:flex-row overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Controls, Search, Filter, Cluster Dock (~28% Width)          */}
        {/* ========================================================================= */}
        <aside className={`w-full lg:w-[28%] max-w-sm flex flex-col border-b lg:border-b-0 lg:border-r z-10 transition-colors overflow-y-auto ${
          isLight ? 'bg-[#F4EFE7]/90 border-[#E4DDD2]' : 'bg-[#222120]/90 border-[#33312E]'
        }`}>
          <div className="p-4 space-y-3.5">
            {/* Title & View Switcher */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57] animate-pulse" />
                <h1 className="font-serif text-sm font-semibold tracking-tight">Constellation Map</h1>
              </div>

              {/* View Switcher: Canvas Vitrine vs Outline View */}
              <div className="flex items-center gap-1 p-0.5 rounded border border-[#DDD5C7] dark:border-[#383632] bg-[#FAF7F2] dark:bg-[#1C1C1C] text-[11px] font-mono">
                <button
                  onClick={() => setViewMode('vitrine')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                    viewMode === 'vitrine'
                      ? isLight ? 'bg-[#2F4A3A] text-white' : 'bg-[#B08D57] text-[#1C1C1C]'
                      : 'text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B]'
                  }`}
                  title="Showcase 40% Canvas Vitrine"
                >
                  <Layers className="w-3 h-3" />
                  <span>Vitrine</span>
                </button>
                <button
                  onClick={() => setViewMode('outline')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                    viewMode === 'outline'
                      ? isLight ? 'bg-[#2F4A3A] text-white' : 'bg-[#B08D57] text-[#1C1C1C]'
                      : 'text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B]'
                  }`}
                  title="Accessible Outline List View (WCAG)"
                >
                  <List className="w-3 h-3" />
                  <span>Outline</span>
                </button>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8F897F] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search nodes, .md docs & clusters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full border rounded pl-8 pr-3 py-1.5 text-xs outline-none font-sans transition-colors ${
                  isLight 
                    ? 'bg-[#FFFFFF] border-[#DDD5C7] focus:border-[#2F4A3A] text-[#2B2B2B] placeholder-[#948D82]' 
                    : 'bg-[#1C1C1C] border-[#383632] focus:border-[#B08D57] text-[#EDE8DF] placeholder-[#757169]'
                }`}
              />
            </div>

            {/* Provenance Filter Chips */}
            <div className="space-y-1.5">
              <div className={`text-[10px] font-mono uppercase tracking-wider flex items-center justify-between ${isLight ? 'text-[#6B655C]' : 'text-[#9E9990]'}`}>
                <span>Provenance Filter</span>
                <span className="text-[9px] font-mono">{displayedNodes.length} nodes</span>
              </div>
              <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                {[
                  { key: null, label: 'All' },
                  { key: 'document', label: '.MD' },
                  { key: 'whatsapp', label: 'WA' },
                  { key: 'gdrive', label: 'Drive' },
                  { key: 'instagram', label: 'Reel' },
                  { key: 'web', label: 'Web' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => setFilterSource(item.key)}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      filterSource === item.key
                        ? isLight ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A]' : 'bg-[#B08D57] text-[#1C1C1C] border-[#B08D57]'
                        : isLight 
                          ? 'bg-[#FFFFFF] text-[#5C574F] border-[#DCD4C7] hover:text-[#2B2B2B]' 
                          : 'bg-[#1C1C1C] text-[#B5B0A6] border-[#383634] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Master Clusters Dock (Quick Focus & Expand) */}
            <div className={`space-y-1.5 pt-2 border-t ${isLight ? 'border-[#E8E2D8]' : 'border-[#31302D]'}`}>
              <div className={`text-[10px] font-mono uppercase tracking-wider flex items-center justify-between ${isLight ? 'text-[#6B655C]' : 'text-[#9E9990]'}`}>
                <span>Master Clusters</span>
                <span className="text-[9px] text-[#2F4A3A] dark:text-[#B08D57] font-semibold">
                  {expandedClusterId ? '1 Expanded (Esc to reset)' : 'Macro Overview'}
                </span>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {clusterHubs.map(hub => {
                  const isExpanded = expandedClusterId === hub.id;
                  const isSelected = selectedNode?.id === hub.id;
                  const count = graphData.nodes.filter(n => n.type !== 'hub' && (n.cluster_name === hub.cluster_name || n.cluster_name === hub.label)).length;

                  return (
                    <button
                      key={hub.id}
                      onClick={() => {
                        setFocusedNodeId(hub.id);
                        setExpandedClusterId(isExpanded ? null : hub.id);
                        setSelectedNode(hub);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-serif flex items-center justify-between border transition-all cursor-pointer ${
                        isExpanded
                          ? isLight
                            ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A] shadow-xs'
                            : 'bg-[#B08D57] text-[#1C1C1C] border-[#B08D57] shadow-xs'
                          : isSelected
                            ? isLight ? 'bg-[#EDE7DE] border-[#2F4A3A] text-[#2B2B2B]' : 'bg-[#2E2D2A] border-[#B08D57] text-[#EDE8DF]'
                            : isLight
                              ? 'bg-[#FFFFFF] hover:bg-[#EDE7DE] border-[#DDD5C7] text-[#2B2B2B]'
                              : 'bg-[#1C1C1C] hover:bg-[#2E2D2A] border-[#383632] text-[#EDE8DF]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${isExpanded ? 'bg-amber-300' : 'bg-slate-400'}`} />
                        <span className="truncate font-medium">{hub.label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                        <span className="opacity-75">{count} notes</span>
                        <span>{isExpanded ? '▼' : '▶'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Esc Shortcut Notice & Reset */}
            <div className={`pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
              isLight ? 'border-[#E8E2D8] text-[#6B655C]' : 'border-[#31302D] text-[#9E9990]'
            }`}>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-[#DDD5C7] dark:border-[#3A3834] bg-[#EAE5DC] dark:bg-[#282725] text-[9px]">ESC</kbd>
                <span>Collapse Orbit</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className="hover:underline flex items-center gap-1 text-[#2F4A3A] dark:text-[#B08D57] cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>{showLegend ? 'Hide' : 'Legend'}</span>
                </button>
                <button
                  onClick={() => {
                    setFilterSource(null);
                    setSearchQuery('');
                    setExpandedClusterId(null);
                    setSelectedNode(null);
                    setFocusedNodeId(null);
                  }}
                  className="hover:underline flex items-center gap-1 cursor-pointer"
                  title="Reset all filters and view"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Optional Collapsible Legend */}
            {showLegend && (
              <div className={`p-3 rounded-lg border text-[11px] space-y-1.5 font-sans animate-in fade-in ${
                isLight ? 'bg-[#FAF7F2] border-[#DDD5C7]' : 'bg-[#1C1C1C] border-[#383632]'
              }`}>
                <div className="font-semibold text-xs font-serif">Geometry & Touch Rules</div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57] inline-block" />
                  <span><strong>Central Hub:</strong> Macro topic anchor on golden spiral.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-2.5 rounded border border-[#2F4A3A] bg-white dark:bg-[#242321] inline-block" />
                  <span><strong>Satellite Card:</strong> 140×44px card (WCAG 44px touch target).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2F4A3A] dark:text-[#B08D57] font-mono">⚡</span>
                  <span><strong>Filaments:</strong> Verified cross-cluster semantic links.</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: Dedicated 40% Canvas Vitrine (~44% Width, Aspect-Square)    */}
        {/* ========================================================================= */}
        <section className={`flex-1 flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden transition-colors ${
          isLight ? 'bg-[#FAF7F2]' : 'bg-[#181817]'
        }`}>
          {viewMode === 'vitrine' ? (
            /* Dedicated Centered Showcase Vitrine Box */
            <div className={`relative w-full max-w-[620px] aspect-square rounded-2xl border flex flex-col shadow-xl overflow-hidden transition-all duration-300 ${
              isLight 
                ? 'bg-[#FFFFFF] border-[#DCD4C7] shadow-[0_16px_40px_rgba(47,74,58,0.06)] ring-1 ring-[#ECE6DC]' 
                : 'bg-[#181817] border-[#383632] shadow-[0_16px_40px_rgba(0,0,0,0.5)] ring-1 ring-[#282725]'
            }`}>
              {/* Vitrine Top Header Chrome */}
              <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono select-none z-10 ${
                isLight ? 'bg-[#F4EFE7]/90 border-[#E8E2D8] text-[#2B2B2B]' : 'bg-[#222120]/90 border-[#33312E] text-[#EDE8DF]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
                  <span className="font-serif font-semibold text-xs tracking-tight">Constellation Vitrine</span>
                  <span className="text-[10px] text-[#6B655C] dark:text-[#9E9990] hidden sm:inline">
                    · Fixed 40% Showcase Orbit
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  {activeCluster ? (
                    <button
                      onClick={() => setExpandedClusterId(null)}
                      className="px-2 py-0.5 rounded border border-[#2F4A3A] dark:border-[#B08D57] bg-[#EAE5DC] dark:bg-[#2F2D2A] text-[#2F4A3A] dark:text-[#B08D57] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Click to collapse back to Macro Golden Spiral"
                    >
                      <span>Expanded: {activeCluster.label}</span>
                      <Minimize2 className="w-2.5 h-2.5" />
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 rounded border border-[#DDD5C7] dark:border-[#383632] text-[#6B655C] dark:text-[#9E9990]">
                      Macro Spiral (D_min ≥ 500px)
                    </span>
                  )}
                </div>
              </div>

              {/* Inside Canvas Render */}
              <div className="relative flex-1 w-full h-full">
                {!isLoading && (
                  <ConstellationCanvas
                    data={{ nodes: displayedNodes, links: displayedLinks }}
                    onNodeClick={handleNodeClick}
                    filterSource={filterSource}
                    theme={theme}
                    focusedNodeId={focusedNodeId}
                    expandedClusterId={expandedClusterId}
                    onToggleExpandCluster={hubId => {
                      setExpandedClusterId(hubId);
                      setFocusedNodeId(hubId);
                    }}
                    onOpenOverflow={handleOpenOverflow}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Accessible Semantic Outline / Tree View (WCAG Compliance) */
            <div className={`w-full max-w-2xl h-full p-6 rounded-2xl border overflow-y-auto space-y-6 ${
              isLight ? 'bg-[#FFFFFF] border-[#DCD4C7]' : 'bg-[#222120] border-[#383632]'
            }`}>
              <div className="border-b pb-4">
                <h2 className="font-serif text-lg font-bold">Accessible Knowledge Outline View</h2>
                <p className="text-xs text-[#6B655C] dark:text-[#9E9990] mt-1 font-sans">
                  Hierarchical semantic document tree navigable with screen readers and keyboard tab stops.
                </p>
              </div>

              <div className="space-y-6">
                {clusterHubs.map(hub => {
                  const clusterNotes = graphData.nodes.filter(
                    n => n.type !== 'hub' && (n.cluster_name === hub.cluster_name || n.cluster_name === hub.label)
                  );

                  return (
                    <section key={hub.id} className="space-y-2">
                      <div className="flex items-center justify-between border-b pb-1">
                        <h3 className="font-serif font-semibold text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
                          {hub.label}
                        </h3>
                        <span className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990]">
                          {clusterNotes.length} notes
                        </span>
                      </div>

                      <ul className="space-y-2 pl-4">
                        {clusterNotes.map(note => (
                          <li 
                            key={note.id}
                            onClick={() => {
                              setSelectedNode(note);
                              setViewMode('vitrine');
                            }}
                            className={`p-2.5 rounded border text-xs cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                              isLight ? 'bg-[#FAF7F2] hover:bg-[#F4EFE7] border-[#E8E2D8]' : 'bg-[#1C1C1C] hover:bg-[#282725] border-[#33312E]'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="font-medium flex items-center gap-2">
                                <span className="text-[9px] font-mono px-1 py-0.5 rounded border uppercase">
                                  {note.source || 'doc'}
                                </span>
                                <span>{note.label}</span>
                              </div>
                              {note.summary && (
                                <p className="text-[11px] text-[#6B655C] dark:text-[#9E9990] line-clamp-2">
                                  {note.summary}
                                </p>
                              )}
                            </div>
                            <button className="text-[10px] font-mono text-[#2F4A3A] dark:text-[#B08D57] shrink-0 hover:underline">
                              Inspect ➔
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Persistent Inspector & Details Panel (~28% Width)           */}
        {/* ========================================================================= */}
        <aside className={`w-full lg:w-[28%] max-w-md flex flex-col border-t lg:border-t-0 lg:border-l z-10 transition-colors overflow-y-auto ${
          isLight ? 'bg-[#F4EFE7]/90 border-[#E4DDD2]' : 'bg-[#222120]/90 border-[#33312E]'
        }`}>
          {selectedNode ? (
            <div className="p-5 space-y-4">
              {/* Selected Node Header */}
              <div className="space-y-2 border-b pb-3.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
                    selectedNode.type === 'hub'
                      ? isLight ? 'bg-[#2F4A3A] text-white border-[#2F4A3A]' : 'bg-[#B08D57] text-[#1C1C1C] border-[#B08D57]'
                      : isLight ? 'bg-[#FFFFFF] text-[#2F4A3A] border-[#DCD4C7]' : 'bg-[#2B2A27] text-[#B08D57] border-[#3B3935]'
                  }`}>
                    {selectedNode.type === 'hub' ? 'TOPIC HUB' : selectedNode.source || 'NOTE'}
                  </span>

                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-xs text-[#8F897F] hover:text-[#2B2B2B] dark:hover:text-white px-1.5 py-0.5 cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <h2 className="font-serif font-bold text-base leading-snug tracking-tight">
                  {selectedNode.label}
                </h2>

                {selectedNode.cluster_name && selectedNode.type !== 'hub' && (
                  <div className="text-[11px] font-mono text-[#6B655C] dark:text-[#9E9990]">
                    Cluster: <span className="font-semibold text-[#2F4A3A] dark:text-[#B08D57]">{selectedNode.cluster_name}</span>
                  </div>
                )}
              </div>

              {/* Summary Section */}
              {selectedNode.summary && (
                <div className="space-y-1">
                  <div className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#6B655C]' : 'text-[#9E9990]'}`}>
                    Executive Summary
                  </div>
                  <p className="text-xs leading-relaxed font-sans text-[#3D3A35] dark:text-[#D5CEC2]">
                    {selectedNode.summary}
                  </p>
                </div>
              )}

              {/* Raw Content / Excerpt */}
              {selectedNode.raw_content && (
                <div className="space-y-1 pt-2 border-t">
                  <div className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#6B655C]' : 'text-[#9E9990]'}`}>
                    Direct Content Excerpt
                  </div>
                  <div className={`p-3 rounded-lg border font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap ${
                    isLight ? 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2B2B2B]' : 'bg-[#1C1C1C] border-[#383632] text-[#EDE8DF]'
                  }`}>
                    {selectedNode.raw_content}
                  </div>
                </div>
              )}

              {/* Connected Cross-Cluster Filaments */}
              {selectedNode.type !== 'hub' && (
                <div className="space-y-2 pt-2 border-t">
                  <div className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-[#6B655C]' : 'text-[#9E9990]'}`}>
                    <Share2 className="w-3 h-3 text-[#2F4A3A] dark:text-[#B08D57]" />
                    <span>Explainable Filaments</span>
                  </div>

                  {graphData.links
                    .filter(l => {
                      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
                      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
                      return (sId === selectedNode.id || tId === selectedNode.id) && l.type === 'item_link';
                    })
                    .map((link, idx) => {
                      const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
                      const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
                      const otherId = sId === selectedNode.id ? tId : sId;
                      const otherNode = graphData.nodes.find(n => n.id === otherId);

                      return (
                        <div 
                          key={idx}
                          onClick={() => otherNode && setSelectedNode(otherNode)}
                          className={`p-2.5 rounded border text-xs cursor-pointer transition-colors space-y-1 ${
                            isLight ? 'bg-[#FFFFFF] hover:bg-[#EDE7DE] border-[#DDD5C7]' : 'bg-[#1C1C1C] hover:bg-[#282725] border-[#383632]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-medium text-[11px] truncate max-w-[180px]">
                              ➔ {otherNode?.label || otherId}
                            </span>
                            {link.similarity_score && (
                              <span className="text-[10px] font-mono text-[#2F4A3A] dark:text-[#B08D57] font-semibold">
                                {Math.round(link.similarity_score * 100)}% Match
                              </span>
                            )}
                          </div>
                          {link.match_reason && (
                            <p className="text-[10px] text-[#6B655C] dark:text-[#9E9990] line-clamp-2">
                              {link.match_reason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t flex flex-col gap-2">
                {selectedNode.type === 'hub' ? (
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="w-full py-2 bg-[#2F4A3A] hover:bg-[#243B2E] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] text-white dark:text-[#1C1C1C] rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
                  >
                    <span>Synthesize Multi-Source OmniDoc</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <>
                    {selectedNode.source_url && (
                      <a
                        href={selectedNode.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 border border-[#DDD5C7] dark:border-[#383632] hover:bg-[#EDE7DE] dark:hover:bg-[#282725] rounded text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Open Source URL</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="w-full py-2 bg-[#2F4A3A] hover:bg-[#243B2E] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] text-white dark:text-[#1C1C1C] rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Full Reading View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Inspector Empty / Overview State */
            <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-12 h-12 rounded-full border border-[#DDD5C7] dark:border-[#383632] bg-[#FFFFFF] dark:bg-[#1C1C1C] text-[#2F4A3A] dark:text-[#B08D57] flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-semibold text-sm">Constellation Inspector</h3>
                <p className="text-xs text-[#6B655C] dark:text-[#9E9990] max-w-xs font-sans leading-relaxed">
                  Click any Central Hub to expand its satellites on the 200px ring, or select any card to inspect semantic filaments.
                </p>
              </div>

              <div className="w-full pt-4 border-t space-y-2 text-left">
                <div className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#6B655C]' : 'text-[#9E9990]'}`}>
                  Network Statistics
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className={`p-2.5 rounded border ${isLight ? 'bg-white border-[#DDD5C7]' : 'bg-[#1C1C1C] border-[#383632]'}`}>
                    <div className="text-[10px] text-[#6B655C] dark:text-[#9E9990]">Hubs</div>
                    <div className="text-base font-bold font-serif">{clusterHubs.length}</div>
                  </div>
                  <div className={`p-2.5 rounded border ${isLight ? 'bg-white border-[#DDD5C7]' : 'bg-[#1C1C1C] border-[#383632]'}`}>
                    <div className="text-[10px] text-[#6B655C] dark:text-[#9E9990]">Items</div>
                    <div className="text-base font-bold font-serif">{graphData.nodes.filter(n => n.type !== 'hub').length}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Clean User Empty State Notice */}
        {isCleanUser && graphData.nodes.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 p-6 pointer-events-none bg-black/20 backdrop-blur-xs">
            <div className={`pointer-events-auto max-w-md p-6 rounded-2xl border text-center space-y-3 shadow-2xl ${
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

        {/* Synthesis Drawer (for full reading mode) */}
        <SynthesisDrawer
          selectedNode={selectedNode}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      </main>
    </div>
  );
}
