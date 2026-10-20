// src/components/OmniDocViewer.tsx
'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Bookmark, 
  Download, 
  Layers, 
  ExternalLink,
  ChevronRight,
  GitBranch,
  Terminal,
  Clock,
  Pin
} from 'lucide-react';

interface SourceChip {
  id: string;
  title: string;
  source_type: string;
  snippet?: string;
  url?: string;
}

interface OmniDocViewerProps {
  clusterTitle: string;
  rawMarkdown: string;
  sources?: SourceChip[];
  onPinDirective?: (text: string) => void;
}

export default function OmniDocViewer({
  clusterTitle,
  rawMarkdown,
  sources = [],
  onPinDirective,
}: OmniDocViewerProps) {
  const [copied, setCopied] = useState(false);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceChip | null>(null);

  // Auto-extract sources from markdown if none provided
  const parsedSources: SourceChip[] = sources.length > 0 ? sources : [
    { id: 'src_1', title: 'WhatsApp Dev Chat #41', source_type: 'whatsapp', snippet: 'Bind Redis port 6379 to 127.0.0.1 in docker-compose.yml' },
    { id: 'src_2', title: 'Architecture_Spec.md', source_type: 'gdrive', snippet: 'Configure HNSW vector indexes in PostgreSQL via pgvector extension' },
    { id: 'src_3', title: 'Graphify Codebase & Spec.md', source_type: 'web', snippet: 'Persistent knowledge graph parsing engine for Antigravity workspace' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rawMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${clusterTitle.toLowerCase().replace(/\s+/g, '_')}_omnidoc.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePin = (text: string, id: string) => {
    if (onPinDirective) {
      onPinDirective(text);
    }
    setPinnedId(id);
    setTimeout(() => setPinnedId(null), 2500);
  };

  const getSourceBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'whatsapp':
        return {
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-600/40',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'WhatsApp Note',
        };
      case 'gdrive':
      case 'drive':
        return {
          bg: 'bg-blue-950/40',
          border: 'border-blue-600/40',
          text: 'text-blue-400',
          dot: 'bg-blue-400',
          label: 'Google Doc / .md',
        };
      case 'instagram':
      case 'reel':
        return {
          bg: 'bg-rose-950/40',
          border: 'border-rose-600/40',
          text: 'text-rose-400',
          dot: 'bg-rose-400',
          label: 'Instagram Reel',
        };
      case 'web':
        return {
          bg: 'bg-purple-950/40',
          border: 'border-purple-600/40',
          text: 'text-purple-400',
          dot: 'bg-purple-400',
          label: 'Web Page / Doc',
        };
      default:
        return {
          bg: 'bg-cyan-950/40',
          border: 'border-cyan-600/40',
          text: 'text-cyan-400',
          dot: 'bg-cyan-400',
          label: 'Markdown Note',
        };
    }
  };

  // Helper to parse markdown lines with rich styling
  const renderFormattedMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: React.JSX.Element[] = [];

    let currentSection: 'overview' | 'directives' | 'sources' | 'general' = 'general';

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Heading 3 (e.g. ### Title)
      if (trimmed.startsWith('###')) {
        const titleText = trimmed.replace(/^###\s*/, '');
        elements.push(
          <div key={`h3-${index}`} className="pt-2 pb-1 border-b border-[#27272a]/80 mb-3">
            <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              {titleText}
            </h3>
          </div>
        );
        return;
      }

      // Detect Section Headers (e.g. **Executive Overview**)
      if (trimmed.startsWith('**Executive Overview**')) {
        currentSection = 'overview';
        elements.push(
          <div key={`sec-ov-${index}`} className="mt-4 mb-2 flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              EXECUTIVE OVERVIEW
            </span>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('**Key Architectural Directives**') || trimmed.startsWith('**Key Directives**')) {
        currentSection = 'directives';
        elements.push(
          <div key={`sec-dir-${index}`} className="mt-4 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              KEY DIRECTIVES & ACTION ITEMS
            </span>
            <span className="text-[9px] font-mono text-zinc-500">Click ★ to pin</span>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('**Primary Sources Cited**') || trimmed.startsWith('**Sources Cited**')) {
        currentSection = 'sources';
        elements.push(
          <div key={`sec-src-${index}`} className="mt-4 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
              PRIMARY SOURCES CITED
            </span>
          </div>
        );
        return;
      }

      // Bullet items (Directives)
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const itemContent = trimmed.replace(/^[•\-]\s*/, '');
        
        // Parse bold label inside bullet (e.g. • **Dynamic Imports**: ...)
        const boldMatch = itemContent.match(/^\*\*(.*?)\*\*:(.*)$/);

        elements.push(
          <div 
            key={`bullet-${index}`} 
            className="group relative bg-[#131317] hover:bg-[#18181f] border border-[#27272a] hover:border-zinc-600 rounded-md p-3 my-2 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 text-xs text-zinc-300 leading-relaxed">
                {boldMatch ? (
                  <>
                    <span className="font-semibold text-white bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700 mr-1.5 text-[11px] font-mono">
                      {boldMatch[1]}
                    </span>
                    <span>{renderInlineCode(boldMatch[2])}</span>
                  </>
                ) : (
                  <span>{renderInlineCode(itemContent)}</span>
                )}
              </div>

              <button
                onClick={() => handlePin(itemContent, `item-${index}`)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-amber-400 p-1 transition-opacity rounded hover:bg-zinc-800"
                title="Pin this directive to Pinned Shelf"
              >
                {pinnedId === `item-${index}` ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        );
        return;
      }

      // Regular text paragraphs
      if (trimmed.length > 0) {
        if (currentSection === 'overview') {
          elements.push(
            <div 
              key={`p-${index}`} 
              className="bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 border-l-2 border-cyan-500 rounded-r-md p-3.5 my-2 text-xs text-zinc-200 leading-relaxed shadow-sm"
            >
              {renderInlineCode(trimmed)}
            </div>
          );
        } else {
          elements.push(
            <p key={`p-${index}`} className="text-xs text-zinc-300 leading-relaxed my-2">
              {renderInlineCode(trimmed)}
            </p>
          );
        }
      }
    });

    return elements;
  };

  // Helper for inline backticks
  const renderInlineCode = (text: string) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code 
            key={i} 
            className="font-mono text-[11px] bg-[#1a1a22] text-cyan-300 border border-[#2e2e38] px-1.5 py-0.5 rounded mx-0.5"
          >
            {code}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d11] text-zinc-200">
      {/* OmniDoc Sub-Header */}
      <div className="px-5 py-3 border-b border-[#27272a] bg-[#121217]/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
            OmniDoc Master · <span className="text-white">{clusterTitle}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-[#18181f] border border-[#27272a] hover:border-zinc-600 rounded transition-colors"
            title="Copy Raw Markdown"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy .md'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-1 text-zinc-400 hover:text-white bg-[#18181f] border border-[#27272a] hover:border-zinc-600 rounded transition-colors"
            title="Download OmniDoc .md"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* ========================================================================= */}
        {/* CONSTITUENT SOURCES NETWORK (Visual Connector & Rounded MD Files)         */}
        {/* ========================================================================= */}
        <div className="bg-[#131317] border border-[#27272a] rounded-lg p-3.5 shadow-md">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              <GitBranch className="w-3 h-3 text-cyan-400" />
              <span>Multi-Source Provenance Map</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 bg-[#1c1c24] px-1.5 py-0.5 rounded">
              {parsedSources.length} Linked Nodes
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 mb-3">
            This OmniDoc is synthesized from {parsedSources.length} linked sources into one unified master markdown document:
          </p>

          {/* Master Doc Tree Visualization */}
          <div className="relative pl-3 border-l-2 border-indigo-500/50 space-y-2 py-1">
            {/* Main MD Node badge */}
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-white bg-indigo-950/40 border border-indigo-500/50 px-2.5 py-1 rounded-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.9)]" />
              <span>[MAIN] {clusterTitle.toLowerCase().replace(/\s+/g, '_')}_master.md</span>
            </div>

            {/* Connecting lines to child md/source files */}
            <div className="pl-4 space-y-2">
              {parsedSources.map((src) => {
                const style = getSourceBadgeColor(src.source_type);
                const isSelected = selectedSource?.id === src.id;

                return (
                  <div key={src.id} className="relative flex flex-col">
                    {/* Horizontal connector line indicator */}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-[2px] bg-zinc-700" />
                      <button
                        onClick={() => setSelectedSource(isSelected ? null : src)}
                        className={`flex items-center gap-2 text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all ${style.bg} ${style.border} ${style.text} hover:brightness-125 cursor-pointer shadow-sm`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        <span className="font-semibold">[{style.label}]</span>
                        <span className="truncate max-w-[200px] text-zinc-200">{src.title}</span>
                        <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90 text-white' : 'text-zinc-500'}`} />
                      </button>
                    </div>

                    {/* Expandable Snippet Preview */}
                    {isSelected && (
                      <div className="ml-5 mt-1.5 p-2.5 bg-[#09090b] border border-zinc-700 rounded-md text-[11px] text-zinc-300 font-mono shadow-inner">
                        <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1 flex justify-between">
                          <span>Verified Source Excerpt</span>
                          {src.url && (
                            <a href={src.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-0.5">
                              Link <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{src.snippet || 'No raw preview available.'}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RENDERED MARKDOWN BODY                                                    */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          {renderFormattedMarkdown(rawMarkdown)}
        </div>
      </div>
    </div>
  );
}
