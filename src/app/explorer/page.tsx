// src/app/explorer/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import SynthesisDrawer, { SelectedNodeData } from '@/components/SynthesisDrawer';
import { 
  Search, 
  Layers, 
  Sparkles, 
  FileText, 
  Bookmark, 
  ArrowRight, 
  Check, 
  Copy, 
  Compass, 
  Tag, 
  ChevronRight,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface NoteItem {
  id: string;
  title: string;
  source_type: string;
  summary?: string;
  cluster_name: string;
  is_bookmarked?: boolean;
}

interface ClusterData {
  cluster_name: string;
  count: number;
  item_count?: number;
  description?: string;
  items?: NoteItem[];
  entities?: string[];
}

const SOURCE_LABELS: Record<string, { label: string; badge: string; pillColor: string }> = {
  document: { label: '.MD Document', badge: '.MD', pillColor: 'bg-[#EAE5DC] text-[#2B2B2B] dark:bg-[#2F2D2A] dark:text-[#EDE8DF]' },
  whatsapp: { label: 'WhatsApp Chat', badge: 'WA', pillColor: 'bg-[#E1EBE2] text-[#1E4028] dark:bg-[#1E2E22] dark:text-[#A7D4B0]' },
  gdrive: { label: 'Google Drive', badge: 'DRIVE', pillColor: 'bg-[#E2E8F0] text-[#1E293B] dark:bg-[#202936] dark:text-[#BFDBFE]' },
  instagram: { label: 'Instagram Reel', badge: 'REEL', pillColor: 'bg-[#F5E6E8] text-[#4C1D24] dark:bg-[#331C20] dark:text-[#FECDD3]' },
  web: { label: 'Public Web', badge: 'WEB', pillColor: 'bg-[#E0E7FF] text-[#312E81] dark:bg-[#1E2042] dark:text-[#C7D2FE]' },
  text: { label: 'Quick Note', badge: 'NOTE', pillColor: 'bg-[#EAE5DC] text-[#2B2B2B] dark:bg-[#2F2D2A] dark:text-[#EDE8DF]' },
};

export default function ExplorerPage() {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [selectedClusterName, setSelectedClusterName] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerNode, setDrawerNode] = useState<SelectedNodeData | null>(null);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Fetch live clusters and items from /api/clusters
  const loadData = () => {
    setIsLoading(true);
    const hasSimUser = typeof window !== 'undefined' && !!localStorage.getItem('omnibrain_simulated_user');
    const url = hasSimUser ? '/api/clusters?mode=clean' : '/api/clusters';

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Normalize cluster data and items
          const normalized = data.map((c: any) => ({
            ...c,
            items: (c.items || []).map((it: any) => ({
              ...it,
              cluster_name: c.cluster_name,
            })),
          }));
          setClusters(normalized);

          // Auto-select first note if available and none selected
          if (!selectedNote && normalized.length > 0 && normalized[0].items?.length > 0) {
            setSelectedNote(normalized[0].items[0]);
          }
        }
      })
      .catch(err => console.error('Failed to load explorer data:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();

    // Check URL parameters for pre-selected cluster: ?cluster=...
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const clusterParam = params.get('cluster');
      if (clusterParam) {
        setSelectedClusterName(clusterParam);
      }
    }
  }, []);

  // All flattened notes across clusters
  const allNotes: NoteItem[] = useMemo(() => {
    return clusters.flatMap(c => c.items || []);
  }, [clusters]);

  // Filtered notes based on selected cluster, provenance filter, and search query
  const displayedNotes = useMemo(() => {
    return allNotes.filter(note => {
      const matchesCluster = !selectedClusterName || note.cluster_name === selectedClusterName;
      const matchesSource = !filterSource || note.source_type === filterSource;
      const matchesSearch = !searchQuery.trim() || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.summary && note.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        note.cluster_name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCluster && matchesSource && matchesSearch;
    });
  }, [allNotes, selectedClusterName, filterSource, searchQuery]);

  const activeCluster = clusters.find(c => c.cluster_name === selectedClusterName);

  const handleCopyNote = (note: NoteItem) => {
    const text = `${note.title}\n\nCluster: ${note.cluster_name}\nSource: ${note.source_type}\n\nSummary:\n${note.summary || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const openSynthesisForCluster = (clusterName: string) => {
    setDrawerNode({
      id: `hub_${clusterName.toLowerCase().replace(/\s+/g, '_')}`,
      type: 'hub',
      label: clusterName,
      summary: activeCluster?.description || `Consolidated briefing for ${clusterName}`,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-[#181817] text-[#2B2B2B] dark:text-[#EDE8DF] font-sans antialiased transition-colors">
      {/* Header with Navigation */}
      <Header currentView="explorer" />

      {/* Main 3-Column Dedicated Layout:
          Left (26%): Search, Filters & Master Clusters Dock
          Center (44%): Semantic Document & Note Cards Explorer
          Right (30%): Persistent Inspector & Details Panel
      */}
      <main className="relative flex-1 w-full h-[calc(100vh-56px)] flex flex-col lg:flex-row overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Controls, Search, Filter, Cluster Dock (~26% Width)          */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-[26%] max-w-xs flex flex-col border-b lg:border-b-0 lg:border-r border-[#E4DDD2] dark:border-[#33312E] bg-[#F4EFE7]/80 dark:bg-[#20201F]/80 backdrop-blur-md z-10 transition-colors overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* Title & Quick Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
                <h1 className="font-serif text-sm font-semibold tracking-tight">Knowledge Explorer</h1>
              </div>
              <span className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990] bg-[#EAE5DC] dark:bg-[#2A2927] border border-[#DCD4C7] dark:border-[#383632] px-2 py-0.5 rounded">
                {allNotes.length} notes
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8F897F] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search notes, .md docs & topics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#FFFFFF] dark:bg-[#1C1C1C] border border-[#DDD5C7] dark:border-[#383632] focus:border-[#2F4A3A] dark:focus:border-[#B08D57] rounded pl-8 pr-3 py-1.5 text-xs text-[#2B2B2B] dark:text-[#EDE8DF] placeholder-[#948D82] dark:placeholder-[#757169] outline-none font-sans transition-colors"
              />
            </div>

            {/* Provenance Filter Chips */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990] flex items-center justify-between">
                <span>Provenance Filter</span>
                {filterSource && (
                  <button 
                    onClick={() => setFilterSource(null)}
                    className="text-[9px] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
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
                    className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
                      filterSource === item.key
                        ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A] dark:bg-[#B08D57] dark:text-[#1C1C1C] dark:border-[#B08D57] font-semibold'
                        : 'bg-[#FFFFFF] text-[#5C574F] border-[#DCD4C7] hover:text-[#2B2B2B] dark:bg-[#1C1C1C] dark:text-[#B5B0A6] dark:border-[#383634] dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Master Clusters Directory */}
            <div className="space-y-1.5 pt-3 border-t border-[#E8E2D8] dark:border-[#31302D]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990] flex items-center justify-between">
                <span>Master Clusters</span>
                <span className="text-[9px] font-mono">{clusters.length} total</span>
              </div>

              {/* View All Clusters Option */}
              <button
                onClick={() => setSelectedClusterName(null)}
                className={`w-full text-left px-3 py-2 rounded text-xs font-serif flex items-center justify-between border transition-all cursor-pointer ${
                  selectedClusterName === null
                    ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A] dark:bg-[#B08D57] dark:text-[#1C1C1C] dark:border-[#B08D57] shadow-xs font-semibold'
                    : 'bg-[#FFFFFF] dark:bg-[#1C1C1C] hover:bg-[#EDE7DE] dark:hover:bg-[#282725] border-[#DDD5C7] dark:border-[#383632] text-[#2B2B2B] dark:text-[#EDE8DF]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Topic Clusters</span>
                </div>
                <span className="text-[10px] font-mono">{allNotes.length}</span>
              </button>

              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {clusters.map(cluster => {
                  const isSelected = selectedClusterName === cluster.cluster_name;
                  const count = cluster.items?.length || 0;

                  return (
                    <button
                      key={cluster.cluster_name}
                      onClick={() => setSelectedClusterName(isSelected ? null : cluster.cluster_name)}
                      className={`w-full text-left px-3 py-2 rounded text-xs font-serif flex items-center justify-between border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2F4A3A] text-[#FAF7F2] border-[#2F4A3A] dark:bg-[#B08D57] dark:text-[#1C1C1C] dark:border-[#B08D57] shadow-xs font-semibold'
                          : 'bg-[#FFFFFF] dark:bg-[#1C1C1C] hover:bg-[#EDE7DE] dark:hover:bg-[#282725] border-[#DDD5C7] dark:border-[#383632] text-[#2B2B2B] dark:text-[#EDE8DF]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-slate-400'}`} />
                        <span className="truncate">{cluster.cluster_name}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isSelected 
                          ? 'bg-black/20 text-white dark:text-black' 
                          : 'text-[#6B655C] dark:text-[#9E9990] bg-[#EAE5DC] dark:bg-[#282725]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </aside>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: Semantic Notes Explorer (~44% Width)                       */}
        {/* ========================================================================= */}
        <section className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF7F2] dark:bg-[#181817] border-b lg:border-b-0 lg:border-r border-[#E4DDD2] dark:border-[#33312E] transition-colors">
          
          {/* Center Column Header */}
          <div className="px-5 py-3 border-b border-[#E8E2D8] dark:border-[#31302D] bg-[#F4EFE7]/90 dark:bg-[#222120]/90 backdrop-blur-md flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
              <span className="font-serif font-semibold text-xs tracking-tight">
                {selectedClusterName || 'All Topic Clusters'}
              </span>
              <span className="text-[10px] text-[#6B655C] dark:text-[#9E9990]">
                · {displayedNotes.length} {displayedNotes.length === 1 ? 'note' : 'notes'} found
              </span>
            </div>

            {selectedClusterName && (
              <button
                onClick={() => openSynthesisForCluster(selectedClusterName)}
                className="px-2.5 py-1 rounded bg-[#2F4A3A] hover:bg-[#243B2E] text-[#FAF7F2] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] dark:text-[#1C1C1C] font-semibold text-[11px] font-sans flex items-center gap-1 cursor-pointer transition-colors"
                title="Synthesize OmniDoc brief for this cluster"
              >
                <Sparkles className="w-3 h-3" />
                <span>Synthesize Brief</span>
              </button>
            )}
          </div>

          {/* Notes Scrollable Cards Grid */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-xs font-mono text-[#6B655C] dark:text-[#9E9990] space-y-2">
                <div className="w-6 h-6 border-2 border-[#2F4A3A] dark:border-[#B08D57] border-t-transparent rounded-full animate-spin" />
                <span>Loading notes and research fragments...</span>
              </div>
            ) : displayedNotes.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-[#DDD5C7] dark:border-[#383632] text-center space-y-2">
                <BookOpen className="w-8 h-8 text-[#948D82] dark:text-[#757169]" />
                <h3 className="font-serif text-sm font-semibold">No notes match current filters</h3>
                <p className="text-xs text-[#6B655C] dark:text-[#9E9990] max-w-sm">
                  Try clearing your search query or switching provenance filters in the left sidebar.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterSource(null); setSelectedClusterName(null); }}
                  className="mt-2 text-xs font-mono text-[#2F4A3A] dark:text-[#B08D57] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              displayedNotes.map(note => {
                const isSelected = selectedNote?.id === note.id;
                const sourceMeta = SOURCE_LABELS[note.source_type] || SOURCE_LABELS.document;

                return (
                  <article
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#FFFFFF] dark:bg-[#242321] border-[#2F4A3A] dark:border-[#B08D57] shadow-sm ring-1 ring-[#2F4A3A]/20 dark:ring-[#B08D57]/30'
                        : 'bg-[#FFFFFF] dark:bg-[#1E1E1D] hover:bg-[#FAF7F2] dark:hover:bg-[#242321] border-[#DDD5C7] dark:border-[#383632]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold tracking-wide uppercase ${sourceMeta.pillColor}`}>
                          {sourceMeta.badge}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B655C] dark:text-[#9E9990]">
                          {note.cluster_name}
                        </span>
                      </div>

                      {note.is_bookmarked && (
                        <span className="text-amber-500 text-xs" title="Pinned to Shelf">★</span>
                      )}
                    </div>

                    <h3 className="font-serif text-sm font-semibold text-[#2B2B2B] dark:text-[#EDE8DF] leading-snug mb-1.5">
                      {note.title}
                    </h3>

                    {note.summary && (
                      <p className="text-xs text-[#6B655C] dark:text-[#9E9990] leading-relaxed line-clamp-2 font-sans">
                        {note.summary}
                      </p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-[#E8E2D8] dark:border-[#31302D] flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#8F897F] dark:text-[#7A756D]">
                        ID: {note.id.slice(0, 10)}
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${
                        isSelected 
                          ? 'text-[#2F4A3A] dark:text-[#B08D57]' 
                          : 'text-[#6B655C] dark:text-[#9E9990]'
                      }`}>
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Persistent Inspector & Details Panel (~30% Width)           */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-[30%] max-w-md flex flex-col bg-[#F4EFE7]/80 dark:bg-[#20201F]/80 backdrop-blur-md z-10 transition-colors overflow-y-auto">
          {selectedNote ? (
            <div className="p-5 space-y-5">
              
              {/* Note Header Details */}
              <div className="space-y-2 border-b border-[#E8E2D8] dark:border-[#31302D] pb-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold tracking-wide uppercase ${
                    (SOURCE_LABELS[selectedNote.source_type] || SOURCE_LABELS.document).pillColor
                  }`}>
                    {(SOURCE_LABELS[selectedNote.source_type] || SOURCE_LABELS.document).label}
                  </span>

                  <button
                    onClick={() => handleCopyNote(selectedNote)}
                    className="text-xs text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                    title="Copy note summary to clipboard"
                  >
                    {copiedNoteId === selectedNote.id ? (
                      <>
                        <Check className="w-3 h-3 text-[#2F4A3A] dark:text-[#B08D57]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <h2 className="font-serif font-bold text-lg leading-snug tracking-tight text-[#2B2B2B] dark:text-[#EDE8DF]">
                  {selectedNote.title}
                </h2>

                <div className="text-xs font-mono text-[#6B655C] dark:text-[#9E9990] flex items-center gap-1.5">
                  <span>Cluster:</span>
                  <span className="font-semibold text-[#2F4A3A] dark:text-[#B08D57]">
                    {selectedNote.cluster_name}
                  </span>
                </div>
              </div>

              {/* Verified Summary */}
              {selectedNote.summary && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990]">
                    Verified Knowledge Summary
                  </div>
                  <div className="p-4 bg-[#FFFFFF] dark:bg-[#1E1E1D] border border-[#DDD5C7] dark:border-[#383632] rounded-lg text-xs leading-relaxed text-[#2B2B2B] dark:text-[#EDE8DF] font-sans">
                    {selectedNote.summary}
                  </div>
                </div>
              )}

              {/* Synthesis Drawer Action */}
              <div className="space-y-2 pt-2 border-t border-[#E8E2D8] dark:border-[#31302D]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990]">
                  Deep Knowledge Synthesis
                </div>
                <button
                  onClick={() => openSynthesisForCluster(selectedNote.cluster_name)}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#2F4A3A] hover:bg-[#243B2E] text-[#FAF7F2] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] dark:text-[#1C1C1C] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-none font-sans"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Cluster Brief (OmniDoc)</span>
                </button>
                <p className="text-[10px] text-[#6B655C] dark:text-[#9E9990] text-center font-mono">
                  Generates multi-source executive overview with actionable directives
                </p>
              </div>

            </div>
          ) : activeCluster ? (
            /* Cluster Selected Overview */
            <div className="p-5 space-y-4">
              <div className="space-y-1.5 border-b border-[#E8E2D8] dark:border-[#31302D] pb-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAE5DC] dark:bg-[#2F2D2A] text-[#2B2B2B] dark:text-[#EDE8DF] uppercase font-semibold">
                  TOPIC CLUSTER OVERVIEW
                </span>
                <h2 className="font-serif font-bold text-lg leading-snug">
                  {activeCluster.cluster_name}
                </h2>
                <p className="text-xs text-[#6B655C] dark:text-[#9E9990] font-sans leading-relaxed">
                  {activeCluster.description || 'Consolidated research topic.'}
                </p>
              </div>

              {activeCluster.entities && activeCluster.entities.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990]">
                    Indexed Entities
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCluster.entities.map(e => (
                      <span key={e} className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#DDD5C7] dark:border-[#383632] bg-[#FFFFFF] dark:bg-[#1E1E1D] text-[#4A453D] dark:text-[#C4BEB3]">
                        #{e}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => openSynthesisForCluster(activeCluster.cluster_name)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#2F4A3A] hover:bg-[#243B2E] text-[#FAF7F2] dark:bg-[#B08D57] dark:hover:bg-[#9E7C48] dark:text-[#1C1C1C] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors font-sans"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesize OmniDoc Brief</span>
              </button>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 text-[#6B655C] dark:text-[#9E9990]">
              <FileText className="w-8 h-8 text-[#948D82] dark:text-[#757169]" />
              <h3 className="font-serif text-sm font-semibold text-[#2B2B2B] dark:text-[#EDE8DF]">
                Select a Note to Inspect
              </h3>
              <p className="text-xs font-sans max-w-xs leading-relaxed">
                Click any note from the center cards list to inspect its verified knowledge summary, provenance metadata, and synthesis briefs.
              </p>
            </div>
          )}
        </aside>

      </main>

      {/* Synthesis Drawer for cluster briefs */}
      <SynthesisDrawer
        selectedNode={drawerNode}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onHighlightPinned={loadData}
      />
    </div>
  );
}
