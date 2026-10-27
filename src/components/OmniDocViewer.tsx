// src/components/OmniDocViewer.tsx
'use client';

import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Bookmark, 
  Download, 
  ExternalLink,
  ChevronRight,
  GitBranch
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

  // 60-30-10 Classy Principle: Quiet, neutral badges (no neon rainbow)
  const getSourceBadgeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'whatsapp':
        return 'WhatsApp Note';
      case 'gdrive':
      case 'drive':
        return 'Spec / .md';
      case 'instagram':
      case 'reel':
        return 'Reel Media';
      case 'web':
        return 'Web Architecture';
      default:
        return 'Document';
    }
  };

  // Helper to parse markdown lines with editorial styling
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
          <div key={`h3-${index}`} className="pt-3 pb-1 border-b border-[#E8E2D8] dark:border-[#31302D] mb-3">
            <h3 className="font-serif text-base font-semibold tracking-tight text-[#2B2B2B] dark:text-[#EDE8DF] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
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
          <div key={`sec-ov-${index}`} className="mt-5 mb-2 flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#2F4A3A] dark:text-[#B08D57] font-semibold">
              EXECUTIVE OVERVIEW
            </span>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('**Key Architectural Directives**') || trimmed.startsWith('**Key Directives**')) {
        currentSection = 'directives';
        elements.push(
          <div key={`sec-dir-${index}`} className="mt-5 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#2F4A3A] dark:text-[#B08D57] font-semibold flex items-center gap-1.5">
              KEY DIRECTIVES & ACTION ITEMS
            </span>
            <span className="text-[9px] font-mono text-[#8F897F]">Click bookmark to pin</span>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('**Primary Sources Cited**') || trimmed.startsWith('**Sources Cited**')) {
        currentSection = 'sources';
        elements.push(
          <div key={`sec-src-${index}`} className="mt-5 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6B655C] dark:text-[#9E9990] font-semibold">
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
            className="group relative bg-[#FAF7F2] dark:bg-[#232321] border border-[#E1D9CC] dark:border-[#383632] hover:border-[#2F4A3A] dark:hover:border-[#B08D57] rounded p-3.5 my-2 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 text-xs text-[#2B2B2B] dark:text-[#EDE8DF] leading-relaxed font-sans">
                {boldMatch ? (
                  <>
                    <span className="font-semibold text-[#2B2B2B] dark:text-[#EDE8DF] bg-[#EAE5DC] dark:bg-[#2B2A27] px-1.5 py-0.5 rounded border border-[#D6CEC1] dark:border-[#3B3935] mr-1.5 text-[11px] font-mono">
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
                className="opacity-0 group-hover:opacity-100 text-[#8F897F] hover:text-[#2F4A3A] dark:hover:text-[#B08D57] p-1 transition-opacity rounded cursor-pointer"
                title="Pin this directive to Pinned Shelf"
              >
                {pinnedId === `item-${index}` ? (
                  <Check className="w-3.5 h-3.5 text-[#2F4A3A] dark:text-[#B08D57]" />
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
              className="bg-[#F4EFE7] dark:bg-[#232321] border-l-2 border-[#2F4A3A] dark:border-[#B08D57] rounded-r p-3.5 my-2 text-xs text-[#2B2B2B] dark:text-[#EDE8DF] leading-relaxed font-sans"
            >
              {renderInlineCode(trimmed)}
            </div>
          );
        } else {
          elements.push(
            <p key={`p-${index}`} className="text-xs text-[#4A453D] dark:text-[#C4BEB3] leading-relaxed my-2 font-sans">
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
            className="font-mono text-[11px] bg-[#ECE6DC] dark:bg-[#2A2927] text-[#2F4A3A] dark:text-[#B08D57] border border-[#DCD4C7] dark:border-[#383634] px-1.5 py-0.5 rounded mx-0.5"
          >
            {code}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] dark:bg-[#1C1C1C] text-[#2B2B2B] dark:text-[#EDE8DF]">
      {/* OmniDoc Sub-Header */}
      <div className="px-6 py-3 border-b border-[#E4DDD2] dark:border-[#33312E] bg-[#F4EFE7] dark:bg-[#232321] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990] font-medium">
            OmniDoc · <span className="text-[#2B2B2B] dark:text-[#EDE8DF] font-semibold">{clusterTitle}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#4A453D] dark:text-[#C4BEB3] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] bg-[#FAF7F2] dark:bg-[#2A2927] border border-[#DDD5C7] dark:border-[#383632] rounded transition-colors cursor-pointer"
            title="Copy Raw Markdown"
          >
            {copied ? <Check className="w-3 h-3 text-[#2F4A3A] dark:text-[#B08D57]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy .md'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-[#6B655C] dark:text-[#9E9990] hover:text-[#2B2B2B] dark:hover:text-[#EDE8DF] bg-[#FAF7F2] dark:bg-[#2A2927] border border-[#DDD5C7] dark:border-[#383632] rounded transition-colors cursor-pointer"
            title="Download OmniDoc .md"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* ========================================================================= */}
        {/* CONSTITUENT SOURCES NETWORK                                               */}
        {/* ========================================================================= */}
        <div className="bg-[#F4EFE7] dark:bg-[#232321] border border-[#E4DDD2] dark:border-[#33312E] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990]">
              <GitBranch className="w-3 h-3 text-[#2F4A3A] dark:text-[#B08D57]" />
              <span>Multi-Source Provenance</span>
            </div>
            <span className="text-[9px] font-mono text-[#6B655C] dark:text-[#9E9990] bg-[#EAE5DC] dark:bg-[#2B2A27] px-1.5 py-0.5 rounded">
              {parsedSources.length} Sources
            </span>
          </div>

          <p className="text-xs text-[#6B655C] dark:text-[#9E9990] mb-3.5 font-sans">
            Synthesized from {parsedSources.length} constituent sources into this master brief:
          </p>

          {/* Master Doc Tree Visualization */}
          <div className="relative pl-3 border-l-2 border-[#2F4A3A] dark:border-[#B08D57] space-y-2 py-1">
            {/* Main MD Node badge */}
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#2B2B2B] dark:text-[#EDE8DF] bg-[#FAF7F2] dark:bg-[#1E1E1D] border border-[#DDD5C7] dark:border-[#383632] px-2.5 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
              <span>{clusterTitle.toLowerCase().replace(/\s+/g, '_')}_master.md</span>
            </div>

            {/* Connecting lines to child md/source files */}
            <div className="pl-4 space-y-2">
              {parsedSources.map((src) => {
                const label = getSourceBadgeLabel(src.source_type);
                const isSelected = selectedSource?.id === src.id;

                return (
                  <div key={src.id} className="relative flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-[1px] bg-[#D6CEC1] dark:bg-[#3B3935]" />
                      <button
                        onClick={() => setSelectedSource(isSelected ? null : src)}
                        className="flex items-center gap-2 text-[11px] font-mono px-2.5 py-1 rounded border border-[#E1D9CC] dark:border-[#383632] bg-[#FAF7F2] dark:bg-[#1E1E1D] text-[#4A453D] dark:text-[#C4BEB3] hover:border-[#2F4A3A] dark:hover:border-[#B08D57] cursor-pointer transition-colors"
                      >
                        <span className="w-1 h-1 rounded-full bg-[#2F4A3A] dark:bg-[#B08D57]" />
                        <span className="font-semibold text-[#2B2B2B] dark:text-[#EDE8DF]">[{label}]</span>
                        <span className="truncate max-w-[200px] text-[#6B655C] dark:text-[#9E9990]">{src.title}</span>
                        <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90 text-[#2B2B2B] dark:text-white' : 'text-[#8F897F]'}`} />
                      </button>
                    </div>

                    {/* Expandable Snippet Preview */}
                    {isSelected && (
                      <div className="ml-5 mt-2 p-3 bg-[#FAF7F2] dark:bg-[#1C1C1C] border border-[#DDD5C7] dark:border-[#383632] rounded text-xs text-[#4A453D] dark:text-[#C4BEB3] font-mono">
                        <div className="text-[9px] uppercase tracking-wider text-[#6B655C] dark:text-[#9E9990] mb-1 flex justify-between">
                          <span>Verified Source Excerpt</span>
                          {src.url && (
                            <a href={src.url} target="_blank" rel="noreferrer" className="text-[#2F4A3A] dark:text-[#B08D57] hover:underline flex items-center gap-0.5">
                              Link <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{src.snippet || 'No raw preview available.'}</p>
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
