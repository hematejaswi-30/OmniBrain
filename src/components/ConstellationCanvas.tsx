// src/components/ConstellationCanvas.tsx
'use client';

import dynamic from 'next/dynamic';
import { useRef, useCallback, useEffect, useState, useMemo } from 'react';

// Dynamically import react-force-graph-2d with ssr: false
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export interface GraphNode {
  id: string;
  label: string;
  type: 'hub' | 'item' | 'entity' | 'document';
  source?: 'instagram' | 'whatsapp' | 'gdrive' | 'web' | 'text' | 'document' | 'code';
  bookmarked?: boolean;
  val?: number;
  x?: number;
  y?: number;
  summary?: string;
  raw_content?: string;
  source_url?: string;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  color?: string;
  value?: number;
}

interface ConstellationCanvasProps {
  data: { nodes: GraphNode[]; links: GraphLink[] };
  onNodeClick: (node: GraphNode) => void;
  filterSource?: string | null;
  theme?: 'light' | 'dark';
}

const LIGHT_SOURCE_CONFIG: Record<string, { color: string; border: string; bg: string; badge: string }> = {
  hub: { color: '#ffffff', border: '#4f46e5', bg: '#4338ca', badge: 'HUB' },
  document: { color: '#4338ca', border: '#6366f1', bg: '#e0e7ff', badge: '.MD' },
  whatsapp: { color: '#065f46', border: '#10b981', bg: '#d1fae5', badge: 'WA' },
  gdrive: { color: '#1e40af', border: '#3b82f6', bg: '#dbeafe', badge: 'DOC' },
  instagram: { color: '#9d174d', border: '#ec4899', bg: '#fce7f3', badge: 'REEL' },
  web: { color: '#0e7490', border: '#06b6d4', bg: '#cffafe', badge: 'WEB' },
  text: { color: '#334155', border: '#64748b', bg: '#f1f5f9', badge: 'TXT' },
  code: { color: '#b45309', border: '#f59e0b', bg: '#fef3c7', badge: 'CODE' },
};

const DARK_SOURCE_CONFIG: Record<string, { color: string; border: string; bg: string; badge: string }> = {
  hub: { color: '#ffffff', border: '#818cf8', bg: '#1e1b4b', badge: 'HUB' },
  document: { color: '#818cf8', border: '#6366f1', bg: 'rgba(49, 46, 129, 0.7)', badge: '.MD' },
  whatsapp: { color: '#4ade80', border: '#22c55e', bg: 'rgba(20, 83, 45, 0.7)', badge: 'WA' },
  gdrive: { color: '#60a5fa', border: '#3b82f6', bg: 'rgba(30, 58, 138, 0.7)', badge: 'DOC' },
  instagram: { color: '#f472b6', border: '#ec4899', bg: 'rgba(131, 24, 67, 0.7)', badge: 'REEL' },
  web: { color: '#38bdf8', border: '#06b6d4', bg: 'rgba(8, 51, 68, 0.7)', badge: 'WEB' },
  text: { color: '#cbd5e1', border: '#64748b', bg: 'rgba(30, 41, 59, 0.7)', badge: 'TXT' },
  code: { color: '#f59e0b', border: '#d97706', bg: 'rgba(120, 53, 15, 0.7)', badge: 'CODE' },
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function truncateLabel(text: string, maxLen: number = 20): string {
  if (!text) return '';
  // Clean source prefixes if any
  const cleaned = text.replace(/^(WhatsApp:\s*|Doc:\s*|Web:\s*|Instagram:\s*)/i, '').trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 1)}…` : cleaned;
}

export default function ConstellationCanvas({ 
  data, 
  onNodeClick, 
  filterSource,
  theme = 'light' 
}: ConstellationCanvasProps) {
  const fgRef = useRef<any>(undefined);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  const isLight = theme === 'light';
  const sourceConfig = isLight ? LIGHT_SOURCE_CONFIG : DARK_SOURCE_CONFIG;

  // Filter nodes if requested
  const filteredData = useMemo(() => {
    if (!filterSource) return data;
    const nodes = data.nodes.filter(n => n.type === 'hub' || n.source === filterSource);
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = data.links.filter(l => {
      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return nodeIds.has(sId) && nodeIds.has(tId);
    });
    return { nodes, links };
  }, [data, filterSource]);

  // Compute connected neighbor set for spiderweb hover highlighting
  const { highlightNodes, highlightLinks } = useMemo(() => {
    const hNodes = new Set<string>();
    const hLinks = new Set<string>();

    if (hoverNode) {
      hNodes.add(hoverNode.id);
      filteredData.links.forEach((l: any) => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        if (sId === hoverNode.id || tId === hoverNode.id) {
          hNodes.add(sId);
          hNodes.add(tId);
          hLinks.add(`${sId}->${tId}`);
          hLinks.add(`${tId}->${sId}`);
        }
      });
    }

    return { highlightNodes: hNodes, highlightLinks: hLinks };
  }, [hoverNode, filteredData.links]);

  // Configure spacious d3 physics so nodes never collide
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-580);
      fgRef.current.d3Force('link')?.distance(155);

      const timer = setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(500, 80);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [filteredData]);

  // Custom node drawing: Graphify-style orbs with concentric orbital rings and sleek compact pills
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHub = node.type === 'hub';
    const isMdDoc = node.type === 'document' || node.source === 'document' || (node.label && node.label.toLowerCase().includes('.md'));
    const sourceKey = isHub ? 'hub' : isMdDoc ? 'document' : (node.source || 'text');
    const cfg = sourceConfig[sourceKey] || sourceConfig.text;

    // Check hover focus state
    const isHovered = hoverNode && hoverNode.id === node.id;
    const isConnected = hoverNode && highlightNodes.has(node.id);
    const isDimmed = hoverNode && !isConnected;

    ctx.save();
    if (isDimmed) {
      ctx.globalAlpha = 0.22;
    }

    // =========================================================================
    // CASE A: CLUSTER HUB MASTER (Central Gravitational Anchor with Orbital Rings)
    // =========================================================================
    if (isHub) {
      const radius = 17 / Math.sqrt(globalScale);

      // 1. Concentric Orbital Radar/Spiderweb Rings (Graphify Data Web signature)
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.22)';
      ctx.lineWidth = 1 / globalScale;
      ctx.setLineDash([4 / globalScale, 6 / globalScale]);

      // Inner orbital ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 32 / globalScale, 0, 2 * Math.PI);
      ctx.stroke();

      // Outer orbital ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 64 / globalScale, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();

      // 2. Soft Outer Ambient Glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + (isHovered ? 8 : 4) / globalScale, 0, 2 * Math.PI);
      ctx.fillStyle = node.bookmarked 
        ? (isLight ? 'rgba(217, 119, 6, 0.25)' : 'rgba(245, 158, 11, 0.35)')
        : (isLight ? 'rgba(79, 70, 229, 0.2)' : 'rgba(99, 102, 241, 0.3)');
      ctx.fill();

      // 3. Gold Halo if bookmarked
      if (node.bookmarked) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4.5 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = isLight ? '#d97706' : '#f59e0b';
        ctx.lineWidth = 2.2 / globalScale;
        ctx.stroke();
      }

      // 4. Central Hub Sphere
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isLight ? '#312e81' : '#1e1b4b'; // Deep royal navy
      ctx.fill();
      ctx.strokeStyle = isLight ? '#6366f1' : '#818cf8';
      ctx.lineWidth = 2.5 / globalScale;
      ctx.stroke();

      // 5. White Core Dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 0.42, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // 6. Crisp Hub Typography Pill Below
      const hubFontSize = Math.max(10, 11.5 / Math.sqrt(globalScale));
      ctx.font = `bold ${hubFontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const hubTitle = `◆ ${node.label}`;
      const textWidth = ctx.measureText(hubTitle).width;
      const pillY = node.y + radius + 4 / globalScale;
      const pillHeight = hubFontSize * 1.5;
      const pillWidth = textWidth + 12 / globalScale;

      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 15, 23, 0.9)';
      drawRoundedRect(ctx, node.x - pillWidth / 2, pillY, pillWidth, pillHeight, 4 / globalScale);
      ctx.fill();
      ctx.strokeStyle = isLight ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();

      ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
      ctx.fillText(hubTitle, node.x, pillY + 2 / globalScale);

      ctx.restore();
      return;
    }

    // =========================================================================
    // CASE B: SLEEK ORB + COMPACT FLOATING LABEL (Documents & Sources)
    // =========================================================================
    const orbRadius = (isMdDoc ? 11.5 : 9.5) / Math.sqrt(globalScale);

    // 1. Orb Glow on hover or active connection
    if (isHovered || isConnected) {
      ctx.save();
      ctx.shadowColor = cfg.border;
      ctx.shadowBlur = 10 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, orbRadius + 3 / globalScale, 0, 2 * Math.PI);
      ctx.fillStyle = cfg.bg;
      ctx.fill();
      ctx.restore();
    }

    // 2. Orb Body
    ctx.beginPath();
    ctx.arc(node.x, node.y, orbRadius, 0, 2 * Math.PI);
    ctx.fillStyle = isLight ? '#ffffff' : '#14141d';
    ctx.fill();
    ctx.strokeStyle = cfg.border;
    ctx.lineWidth = (isHovered ? 2.2 : 1.8) / globalScale;
    ctx.stroke();

    // 3. Mini Glyphs / Badge inside Orb
    ctx.font = `bold ${Math.max(7, orbRadius * 0.8)}px ui-monospace, monospace`;
    ctx.fillStyle = cfg.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.badge, node.x, node.y);

    // 4. Compact Label Pill Placed Underneath Orb
    const labelText = isHovered ? node.label : truncateLabel(node.label, 18);
    const fontSize = Math.max(9, 10 / Math.sqrt(globalScale));
    ctx.font = `500 ${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    const labelWidth = ctx.measureText(labelText).width;
    const paddingX = 6 / globalScale;
    const pillWidth = labelWidth + (paddingX * 2);
    const pillHeight = fontSize * 1.5;
    const pillX = node.x - pillWidth / 2;
    const pillY = node.y + orbRadius + 3.5 / globalScale;

    // Pill background
    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 15, 22, 0.9)';
    drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 3.5 / globalScale);
    ctx.fill();
    ctx.strokeStyle = isHovered 
      ? cfg.border 
      : isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(39, 39, 42, 0.8)';
    ctx.lineWidth = (isHovered ? 1.2 : 0.8) / globalScale;
    ctx.stroke();

    // Text in pill
    ctx.fillStyle = isLight ? '#0f172a' : '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, node.x, pillY + pillHeight / 2);

    ctx.restore();
  }, [isLight, sourceConfig, hoverNode, highlightNodes]);

  return (
    <div className={`relative w-full h-full overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#f8fafc]' : 'bg-[#07070a]'
    }`}>
      {/* Background radial gradient glow & technical dot grid */}
      {isLight ? (
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.12)_0%,transparent_75%)] pointer-events-none" />
      )}

      <ForceGraph2D
        ref={fgRef}
        graphData={filteredData}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI);
          ctx.fill();
        }}
        // SPIDERWEB LATTICE LINK STYLING:
        linkColor={(link: any) => {
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const isHighlighted = hoverNode && (highlightLinks.has(`${sId}->${tId}`) || highlightLinks.has(`${tId}->${sId}`));
          const isDimmed = hoverNode && !isHighlighted;

          if (isDimmed) return isLight ? 'rgba(203, 213, 225, 0.18)' : 'rgba(39, 39, 42, 0.15)';
          if (isHighlighted) return isLight ? '#2563eb' : '#38bdf8';
          return isLight ? 'rgba(79, 70, 229, 0.42)' : 'rgba(99, 102, 241, 0.5)';
        }}
        linkWidth={(link: any) => {
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const isHighlighted = hoverNode && (highlightLinks.has(`${sId}->${tId}`) || highlightLinks.has(`${tId}->${sId}`));
          return isHighlighted ? 2.4 : isLight ? 1.4 : 1.6;
        }}
        // Flowing Directional Particles:
        linkDirectionalParticles={(link: any) => {
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const isHighlighted = hoverNode && (highlightLinks.has(`${sId}->${tId}`) || highlightLinks.has(`${tId}->${sId}`));
          return isHighlighted ? 5 : 2;
        }}
        linkDirectionalParticleWidth={2.2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={(link: any) => {
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const isHighlighted = hoverNode && (highlightLinks.has(`${sId}->${tId}`) || highlightLinks.has(`${tId}->${sId}`));
          if (isHighlighted) return isLight ? '#1d4ed8' : '#38bdf8';
          return isLight ? '#2563eb' : '#818cf8';
        }}
        onNodeHover={(node: any) => setHoverNode(node ? (node as GraphNode) : null)}
        onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
        cooldownTicks={140}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        minZoom={0.5}
        maxZoom={3.0}
        d3VelocityDecay={0.25}
      />
    </div>
  );
}
