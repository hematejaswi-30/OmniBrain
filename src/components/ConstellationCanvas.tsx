// src/components/ConstellationCanvas.tsx
'use client';

import dynamic from 'next/dynamic';
import { useRef, useCallback } from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';

// Adhering to Task Directive #3: Dynamically import react-force-graph-2d with ssr: false
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export interface GraphNode {
  id: string;
  label: string;
  type: 'hub' | 'item' | 'entity';
  source?: 'instagram' | 'whatsapp' | 'gdrive' | 'web' | 'text';
  bookmarked?: boolean;
  val: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface ConstellationCanvasProps {
  data: { nodes: GraphNode[]; links: GraphLink[] };
  onNodeClick: (node: GraphNode) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  hub: '#ffffff',
  whatsapp: '#4ade80',
  gdrive: '#60a5fa',
  instagram: '#f472b6',
  web: '#e4e4e7',
  text: '#a1a1aa',
};

export default function ConstellationCanvas({ data, onNodeClick }: ConstellationCanvasProps) {
  // Use any for the ref here to bypass React 18 strict refs complaining about the dynamic component wrapper
  const fgRef = useRef<any>(undefined);

  // Custom node drawing: rendering clean circles, labels, and bookmarked halos
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHub = node.type === 'hub';
    const radius = isHub ? 10 : 5; // Reduced from 16/8 to 10/5 for refined scaling
    const color = SOURCE_COLORS[node.source || node.type] || '#71717a';

    // 1. Draw Bookmarked Gold Halo if active
    if (node.bookmarked) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // 2. Draw Node Body
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Hub border stroke
    if (isHub) {
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // 3. Draw Label
    const fontSize = (isHub ? 12 : 10) / globalScale;
    ctx.font = `${isHub ? 'bold' : 'normal'} ${fontSize}px sans-serif`;
    ctx.fillStyle = isHub ? '#fafafa' : '#a1a1aa';
    ctx.textAlign = 'center';
    ctx.fillText(node.label, node.x, node.y + radius + fontSize + 2);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#09090b]">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, (node.type === 'hub' ? 10 : 5) + 4, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkColor={() => '#27272a'}
        linkWidth={1}
        onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
        cooldownTicks={80}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        minZoom={0.6}
        maxZoom={2.0}
        d3VelocityDecay={0.3}
      />
    </div>
  );
}
