// src/components/ConstellationCanvas.tsx
'use client';

import dynamic from 'next/dynamic';
import { useRef, useCallback, useEffect } from 'react';

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
}

const SOURCE_CONFIG: Record<string, { color: string; border: string; bg: string; badge: string }> = {
  hub: { color: '#ffffff', border: '#a855f7', bg: 'rgba(88, 28, 135, 0.4)', badge: 'HUB' },
  document: { color: '#818cf8', border: '#6366f1', bg: 'rgba(49, 46, 129, 0.6)', badge: '.MD' },
  whatsapp: { color: '#4ade80', border: '#22c55e', bg: 'rgba(20, 83, 45, 0.5)', badge: 'WA' },
  gdrive: { color: '#60a5fa', border: '#3b82f6', bg: 'rgba(30, 58, 138, 0.5)', badge: 'DOC' },
  instagram: { color: '#f472b6', border: '#ec4899', bg: 'rgba(131, 24, 67, 0.5)', badge: 'REEL' },
  web: { color: '#38bdf8', border: '#06b6d4', bg: 'rgba(8, 51, 68, 0.5)', badge: 'WEB' },
  text: { color: '#cbd5e1', border: '#64748b', bg: 'rgba(30, 41, 59, 0.5)', badge: 'TXT' },
  code: { color: '#f59e0b', border: '#d97706', bg: 'rgba(120, 53, 15, 0.5)', badge: 'CODE' },
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

export default function ConstellationCanvas({ data, onNodeClick, filterSource }: ConstellationCanvasProps) {
  const fgRef = useRef<any>(undefined);

  // Apply repulsion forces to prevent overlapping labels and auto-center viewport
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-350);
      fgRef.current.d3Force('link')?.distance(120);
      const timer = setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(500, 70);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [data]);

  // Filter nodes if requested
  const filteredData = filterSource
    ? {
        nodes: data.nodes.filter(n => n.type === 'hub' || n.source === filterSource),
        links: data.links,
      }
    : data;

  // Custom node drawing: rendering rounded pill cards for MD files, glowing circles for hubs
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHub = node.type === 'hub';
    const isMdDoc = node.type === 'document' || node.source === 'document' || (node.label && node.label.toLowerCase().includes('.md'));
    const sourceKey = isHub ? 'hub' : isMdDoc ? 'document' : (node.source || 'text');
    const cfg = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.text;

    // Scale-aware dimensions
    const fontSize = Math.max(10, Math.min(13, 11 / Math.sqrt(globalScale)));
    ctx.font = `${isHub ? 'bold' : '500'} ${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;

    // =========================================================================
    // CASE A: ROUNDED MD FILE / DOCUMENT NODE ("rounded md files in one main md")
    // =========================================================================
    if (isMdDoc || (!isHub && node.label)) {
      const textWidth = ctx.measureText(node.label).width;
      const paddingX = 8 / globalScale;
      const paddingY = 4 / globalScale;
      const badgeWidth = 24 / globalScale;
      const cardWidth = textWidth + badgeWidth + (paddingX * 2.5);
      const cardHeight = fontSize * 1.8 + (paddingY * 1.2);
      const cardX = node.x - cardWidth / 2;
      const cardY = node.y - cardHeight / 2;
      const cornerRadius = 5 / globalScale;

      // 1. Glow shadow on hover/selection
      ctx.save();
      ctx.shadowColor = cfg.border;
      ctx.shadowBlur = 8 / globalScale;

      // 2. Card Background
      drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, cornerRadius);
      ctx.fillStyle = '#111118';
      ctx.fill();

      // 3. Card Border (Luminous border for .md files)
      ctx.strokeStyle = cfg.border;
      ctx.lineWidth = 1.6 / globalScale;
      ctx.stroke();
      ctx.restore();

      // 4. Source Badge (e.g. [.MD], [WA], [DOC])
      const badgeX = cardX + 3 / globalScale;
      const badgeY = cardY + 3 / globalScale;
      const bWidth = badgeWidth - 2 / globalScale;
      const bHeight = cardHeight - 6 / globalScale;

      drawRoundedRect(ctx, badgeX, badgeY, bWidth, bHeight, 3 / globalScale);
      ctx.fillStyle = cfg.bg;
      ctx.fill();
      ctx.strokeStyle = cfg.border;
      ctx.lineWidth = 0.8 / globalScale;
      ctx.stroke();

      // Badge Text
      ctx.font = `bold ${Math.max(7, fontSize * 0.75)}px ui-monospace, monospace`;
      ctx.fillStyle = cfg.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cfg.badge, badgeX + bWidth / 2, badgeY + bHeight / 2);

      // 5. Label Text
      ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = '#f1f5f9';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const labelX = cardX + badgeWidth + 5 / globalScale;
      ctx.fillText(node.label, labelX, cardY + cardHeight / 2);

      return;
    }

    // =========================================================================
    // CASE B: CLUSTER HUB NODE ("in one main md / master hub")
    // =========================================================================
    const radius = 14 / Math.sqrt(globalScale);

    // 1. Glowing outer halo
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + (node.bookmarked ? 7 : 4) / globalScale, 0, 2 * Math.PI);
    ctx.fillStyle = node.bookmarked ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.25)';
    ctx.fill();

    // 2. Gold Halo if bookmarked
    if (node.bookmarked) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 5 / globalScale, 0, 2 * Math.PI);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // 3. Central Hub Body
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e1b4b'; // Deep royal indigo
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5 / globalScale;
    ctx.stroke();

    // 4. Hub Center Core Icon / Dot
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // 5. Grand Hub Label
    const hubFontSize = Math.max(11, 13 / Math.sqrt(globalScale));
    ctx.font = `bold ${hubFontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Label background pill for crystal clarity against canvas
    const hubText = `◆ ${node.label}`;
    const hubWidth = ctx.measureText(hubText).width;
    const pillY = node.y + radius + 4 / globalScale;
    const pillHeight = hubFontSize * 1.5;

    ctx.fillStyle = 'rgba(15, 15, 23, 0.85)';
    drawRoundedRect(ctx, node.x - hubWidth / 2 - 6, pillY, hubWidth + 12, pillHeight, 4 / globalScale);
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(hubText, node.x, pillY + 2 / globalScale);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#07070a] overflow-hidden">
      {/* Background radial gradient glow for celestial depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.12)_0%,transparent_75%)] pointer-events-none" />

      <ForceGraph2D
        ref={fgRef}
        graphData={filteredData}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 22, 0, 2 * Math.PI);
          ctx.fill();
        }}
        // HIGH-CONTRAST LUMINOUS CONNECTING LINES:
        linkColor={() => 'rgba(99, 102, 241, 0.55)'} // Vibrant indigo lines clearly visible on dark background
        linkWidth={1.8}
        // Animated directional particles along lines:
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={2.4}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={() => '#38bdf8'} // Glowing electric cyan particles flowing to main MD
        onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
        cooldownTicks={120}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        minZoom={0.5}
        maxZoom={3.0}
        d3VelocityDecay={0.25}
      />
    </div>
  );
}
