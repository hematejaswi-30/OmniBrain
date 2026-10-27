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
  focusedNodeId?: string | null;
}

// 60-30-10 Classy Principle: Cohesive editorial low-saturation neutrals with single accent
const LIGHT_SOURCE_CONFIG: Record<string, { color: string; border: string; bg: string; badge: string }> = {
  hub: { color: '#FAF7F2', border: '#243B2E', bg: '#2F4A3A', badge: 'HUB' },
  document: { color: '#2B2B2B', border: '#D5CEC2', bg: '#FFFFFF', badge: '.MD' },
  whatsapp: { color: '#2B2B2B', border: '#D5CEC2', bg: '#FFFFFF', badge: 'WA' },
  gdrive: { color: '#2B2B2B', border: '#D5CEC2', bg: '#FFFFFF', badge: 'DOC' },
  instagram: { color: '#2B2B2B', border: '#D5CEC2', bg: '#FFFFFF', badge: 'REEL' },
  web: { color: '#2B2B2B', border: '#D5CEC2', bg: '#FFFFFF', badge: 'WEB' },
  text: { color: '#2B2B2B', border: '#D5CEC2', bg: '#FFFFFF', badge: 'NOTE' },
  code: { color: '#2B2B2B', border: '#D5CEC2', bg: '#FFFFFF', badge: 'CODE' },
};

const DARK_SOURCE_CONFIG: Record<string, { color: string; border: string; bg: string; badge: string }> = {
  hub: { color: '#1C1C1C', border: '#9E7C48', bg: '#B08D57', badge: 'HUB' },
  document: { color: '#EDE8DF', border: '#3A3834', bg: '#242321', badge: '.MD' },
  whatsapp: { color: '#EDE8DF', border: '#3A3834', bg: '#242321', badge: 'WA' },
  gdrive: { color: '#EDE8DF', border: '#3A3834', bg: '#242321', badge: 'DOC' },
  instagram: { color: '#EDE8DF', border: '#3A3834', bg: '#242321', badge: 'REEL' },
  web: { color: '#EDE8DF', border: '#3A3834', bg: '#242321', badge: 'WEB' },
  text: { color: '#EDE8DF', border: '#3A3834', bg: '#242321', badge: 'NOTE' },
  code: { color: '#EDE8DF', border: '#3A3834', bg: '#242321', badge: 'CODE' },
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

function truncateLabel(text: string, maxLen: number = 22): string {
  if (!text) return '';
  const cleaned = text.replace(/^(WhatsApp:\s*|Doc:\s*|Web:\s*|Instagram:\s*)/i, '').trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 1)}…` : cleaned;
}

export default function ConstellationCanvas({ 
  data, 
  onNodeClick, 
  filterSource,
  theme = 'light',
  focusedNodeId
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

  // Compute connected neighbor set for hover focus
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

  // Constrained Physics settings with centering force
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-350);
      fgRef.current.d3Force('link')?.distance(120);

      // Add gentle centering force to pull nodes towards center origin
      const centerForce = fgRef.current.d3Force('center');
      if (centerForce) {
        centerForce.strength(0.65);
      }

      const timer = setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(500, 75);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [filteredData]);

  // Programmatic smooth auto-centering on focusedNodeId
  useEffect(() => {
    if (focusedNodeId && fgRef.current) {
      const target = data.nodes.find(n => n.id === focusedNodeId);
      if (target && typeof target.x === 'number' && typeof target.y === 'number') {
        fgRef.current.centerAt(target.x, target.y, 650);
        fgRef.current.zoom(1.4, 650);
      }
    }
  }, [focusedNodeId, data.nodes]);

  // Auto-centering when clicking any node
  const handleInternalNodeClick = useCallback((node: any) => {
    if (fgRef.current && typeof node.x === 'number' && typeof node.y === 'number') {
      fgRef.current.centerAt(node.x, node.y, 600);
      fgRef.current.zoom(1.35, 600);
    }
    onNodeClick(node as GraphNode);
  }, [onNodeClick]);

  // Constrain dragged nodes within visible boundary
  const handleNodeDragEnd = useCallback((node: any) => {
    if (typeof node.x === 'number' && typeof node.y === 'number') {
      const dist = Math.sqrt(node.x * node.x + node.y * node.y);
      const maxDist = 380;
      if (dist > maxDist) {
        node.x = (node.x / dist) * maxDist;
        node.y = (node.y / dist) * maxDist;
      }
    }
  }, []);

  // Visual Bounded Graph Area Rendering: Frame, concentric rings, and coordinate crosshairs
  const renderBackgroundArea = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();

    // Subtle origin crosshair (0, 0)
    ctx.strokeStyle = isLight ? 'rgba(216, 209, 197, 0.45)' : 'rgba(60, 58, 54, 0.5)';
    ctx.lineWidth = 1 / globalScale;
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(25, 0);
    ctx.moveTo(0, -25);
    ctx.lineTo(0, 25);
    ctx.stroke();

    // Inner focal area ring (radius 190)
    ctx.beginPath();
    ctx.arc(0, 0, 190, 0, 2 * Math.PI);
    ctx.setLineDash([3 / globalScale, 5 / globalScale]);
    ctx.strokeStyle = isLight ? 'rgba(216, 209, 197, 0.5)' : 'rgba(60, 58, 54, 0.5)';
    ctx.stroke();

    // Outer constellation field boundary (radius 360)
    ctx.beginPath();
    ctx.arc(0, 0, 360, 0, 2 * Math.PI);
    ctx.setLineDash([6 / globalScale, 6 / globalScale]);
    ctx.strokeStyle = isLight ? 'rgba(47, 74, 58, 0.22)' : 'rgba(176, 141, 87, 0.25)';
    ctx.lineWidth = 1.2 / globalScale;
    ctx.stroke();

    // Subtle area label
    const fontSize = 8 / Math.sqrt(globalScale);
    ctx.font = `500 ${fontSize}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = isLight ? 'rgba(107, 101, 92, 0.5)' : 'rgba(158, 153, 144, 0.5)';
    ctx.fillText('CONSTELLATION BOUNDARY (360px)', 0, -366);

    ctx.restore();
  }, [isLight]);

  // Custom node drawing: Restrained editorial geometry
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
      ctx.globalAlpha = 0.25;
    }

    // =========================================================================
    // CASE A: CLUSTER HUB MASTER
    // =========================================================================
    if (isHub) {
      const radius = 16 / Math.sqrt(globalScale);

      // 1. Subtle, hair-thin radar rings (no glow)
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(47, 74, 58, 0.15)' : 'rgba(176, 141, 87, 0.2)';
      ctx.lineWidth = 0.8 / globalScale;
      ctx.setLineDash([3 / globalScale, 5 / globalScale]);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 28 / globalScale, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 56 / globalScale, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();

      // 2. Central Hub Sphere (Solid, no gradient)
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isLight ? '#2F4A3A' : '#2A2927';
      ctx.fill();
      ctx.strokeStyle = isLight ? '#243B2E' : '#B08D57';
      ctx.lineWidth = 1.8 / globalScale;
      ctx.stroke();

      // 3. Center dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 0.38, 0, 2 * Math.PI);
      ctx.fillStyle = isLight ? '#FAF7F2' : '#EDE8DF';
      ctx.fill();

      // 4. Hub Typography Label Below
      const hubFontSize = Math.max(10, 11 / Math.sqrt(globalScale));
      ctx.font = `600 ${hubFontSize}px Georgia, Newsreader, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const hubTitle = `${node.label}`;
      const textWidth = ctx.measureText(hubTitle).width;
      const pillY = node.y + radius + 5 / globalScale;
      const pillHeight = hubFontSize * 1.5;
      const pillWidth = textWidth + 14 / globalScale;

      ctx.fillStyle = isLight ? '#FAF7F2' : '#20201F';
      drawRoundedRect(ctx, node.x - pillWidth / 2, pillY, pillWidth, pillHeight, 3 / globalScale);
      ctx.fill();
      ctx.strokeStyle = isLight ? '#DDD5C8' : '#383632';
      ctx.lineWidth = 0.8 / globalScale;
      ctx.stroke();

      ctx.fillStyle = isLight ? '#2B2B2B' : '#EDE8DF';
      ctx.fillText(hubTitle, node.x, pillY + 2.5 / globalScale);

      ctx.restore();
      return;
    }

    // =========================================================================
    // CASE B: SOURCE ITEM ORB & COMPACT LABEL
    // =========================================================================
    const orbRadius = (isMdDoc ? 10.5 : 8.5) / Math.sqrt(globalScale);

    // Orb Body
    ctx.beginPath();
    ctx.arc(node.x, node.y, orbRadius, 0, 2 * Math.PI);
    ctx.fillStyle = cfg.bg;
    ctx.fill();
    ctx.strokeStyle = isHovered ? (isLight ? '#2F4A3A' : '#B08D57') : cfg.border;
    ctx.lineWidth = (isHovered ? 1.8 : 1) / globalScale;
    ctx.stroke();

    // Source Badge text inside orb
    const badgeFontSize = Math.max(7, 7.5 / Math.sqrt(globalScale));
    ctx.font = `500 ${badgeFontSize}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHovered ? (isLight ? '#2F4A3A' : '#B08D57') : (isLight ? '#6B655C' : '#9E9990');
    ctx.fillText(cfg.badge, node.x, node.y);

    // Label Pill Below
    const fontSize = Math.max(8.5, 9 / Math.sqrt(globalScale));
    ctx.font = `400 ${fontSize}px Plus Jakarta Sans, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const cleanLabel = truncateLabel(node.label, 20);
    const textWidth = ctx.measureText(cleanLabel).width;
    const pillY = node.y + orbRadius + 4 / globalScale;
    const pillHeight = fontSize * 1.5;
    const pillWidth = textWidth + 10 / globalScale;

    ctx.fillStyle = isLight ? '#FFFFFF' : '#242321';
    drawRoundedRect(ctx, node.x - pillWidth / 2, pillY, pillWidth, pillHeight, 3 / globalScale);
    ctx.fill();
    ctx.strokeStyle = isHovered ? (isLight ? '#2F4A3A' : '#B08D57') : (isLight ? '#E4DDD2' : '#353330');
    ctx.lineWidth = 0.8 / globalScale;
    ctx.stroke();

    ctx.fillStyle = isHovered ? (isLight ? '#2F4A3A' : '#B08D57') : cfg.color;
    ctx.fillText(cleanLabel, node.x, pillY + 2 / globalScale);

    ctx.restore();
  }, [hoverNode, highlightNodes, isLight, sourceConfig]);

  return (
    <div className={`w-full h-full relative ${isLight ? 'bg-[#FAF7F2]' : 'bg-[#1C1C1C]'}`}>
      <ForceGraph2D
        ref={fgRef}
        graphData={filteredData}
        backgroundColor={isLight ? '#FAF7F2' : '#1C1C1C'}
        onRenderFramePre={renderBackgroundArea}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const radius = (node.type === 'hub' ? 24 : 16) / Math.sqrt(globalScale);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
          ctx.fill();
        }}
        // Clean, quiet links
        linkColor={(link: any) => {
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const isHighlighted = hoverNode && (highlightLinks.has(`${sId}->${tId}`) || highlightLinks.has(`${tId}->${sId}`));
          const isDimmed = hoverNode && !isHighlighted;

          if (isDimmed) return isLight ? 'rgba(216, 209, 197, 0.2)' : 'rgba(56, 54, 50, 0.2)';
          if (isHighlighted) return isLight ? '#2F4A3A' : '#B08D57';
          return isLight ? '#DCD4C7' : '#383632';
        }}
        linkWidth={(link: any) => {
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const isHighlighted = hoverNode && (highlightLinks.has(`${sId}->${tId}`) || highlightLinks.has(`${tId}->${sId}`));
          return isHighlighted ? 1.6 : 0.9;
        }}
        // Directional Particles: Single Accent
        linkDirectionalParticles={(link: any) => {
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const isHighlighted = hoverNode && (highlightLinks.has(`${sId}->${tId}`) || highlightLinks.has(`${tId}->${sId}`));
          return isHighlighted ? 3 : 1;
        }}
        linkDirectionalParticleWidth={1.8}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={(link: any) => {
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const isHighlighted = hoverNode && (highlightLinks.has(`${sId}->${tId}`) || highlightLinks.has(`${tId}->${sId}`));
          if (isHighlighted) return isLight ? '#243B2E' : '#D6B27C';
          return isLight ? '#2F4A3A' : '#B08D57';
        }}
        onNodeHover={(node: any) => setHoverNode(node ? (node as GraphNode) : null)}
        onNodeClick={handleInternalNodeClick}
        onNodeDragEnd={handleNodeDragEnd}
        cooldownTicks={140}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        minZoom={0.4}
        maxZoom={3.5}
        d3VelocityDecay={0.35}
      />

      {/* Floating Canvas Navigation Dock */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 p-1 rounded-lg border border-[#DDD5C7] dark:border-[#383632] bg-[#FAF7F2]/95 dark:bg-[#20201F]/95 backdrop-blur-md shadow-md text-xs font-mono">
        <button
          onClick={() => {
            if (fgRef.current) {
              fgRef.current.centerAt(0, 0, 500);
              fgRef.current.zoom(1.0, 500);
            }
          }}
          className="px-2 py-1 rounded hover:bg-[#EDE7DE] dark:hover:bg-[#282725] text-[#2B2B2B] dark:text-[#EDE8DF] transition-colors flex items-center gap-1 cursor-pointer"
          title="Recenter Camera to Origin"
        >
          <span>🎯</span>
          <span className="hidden sm:inline text-[11px]">Recenter</span>
        </button>
        <div className="w-[1px] h-3.5 bg-[#DDD5C7] dark:bg-[#383632]" />
        <button
          onClick={() => {
            if (fgRef.current) {
              fgRef.current.zoomToFit(450, 75);
            }
          }}
          className="px-2 py-1 rounded hover:bg-[#EDE7DE] dark:hover:bg-[#282725] text-[#2B2B2B] dark:text-[#EDE8DF] transition-colors flex items-center gap-1 cursor-pointer"
          title="Fit All Clusters on Screen"
        >
          <span>⛶</span>
          <span className="hidden sm:inline text-[11px]">Fit View</span>
        </button>
        <div className="w-[1px] h-3.5 bg-[#DDD5C7] dark:bg-[#383632]" />
        <button
          onClick={() => {
            if (fgRef.current) {
              const currentZoom = fgRef.current.zoom();
              fgRef.current.zoom(Math.min(currentZoom * 1.3, 3.5), 300);
            }
          }}
          className="p-1 rounded hover:bg-[#EDE7DE] dark:hover:bg-[#282725] text-[#2B2B2B] dark:text-[#EDE8DF] transition-colors cursor-pointer w-6 h-6 flex items-center justify-center font-bold"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => {
            if (fgRef.current) {
              const currentZoom = fgRef.current.zoom();
              fgRef.current.zoom(Math.max(currentZoom * 0.75, 0.4), 300);
            }
          }}
          className="p-1 rounded hover:bg-[#EDE7DE] dark:hover:bg-[#282725] text-[#2B2B2B] dark:text-[#EDE8DF] transition-colors cursor-pointer w-6 h-6 flex items-center justify-center font-bold"
          title="Zoom Out"
        >
          −
        </button>
      </div>
    </div>
  );

}
