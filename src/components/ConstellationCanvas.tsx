// src/components/ConstellationCanvas.tsx
'use client';

import dynamic from 'next/dynamic';
import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Minus, Compass, Globe } from 'lucide-react';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  HUB_RADIUS,
  HUB_RADAR_RADIUS,
  UNIFORM_ORBIT_RADIUS,
  getClusterAnchor,
  getSatelliteSlot,
  getClusterDisplaySlots,
  Point,
} from '@/lib/cluster-layout';

// Dynamically import react-force-graph-2d with ssr: false
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export interface GraphNode {
  id: string;
  label: string;
  type: 'hub' | 'item' | 'entity' | 'document' | 'overflow';
  source?: 'instagram' | 'whatsapp' | 'gdrive' | 'web' | 'text' | 'document' | 'code';
  cluster_name?: string;
  bookmarked?: boolean;
  val?: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  summary?: string;
  raw_content?: string;
  source_url?: string;
  isOverflow?: boolean;
  overflowCount?: number;
  overflowItems?: any[];
  slotIndex?: number;
  similarity_score?: number;
}

export interface GraphLink {
  id?: string;
  source: string | GraphNode;
  target: string | GraphNode;
  color?: string;
  value?: number;
  type?: 'hub_spoke' | 'cross_cluster' | 'item_link' | 'macro_bridge';
  similarity_score?: number;
  match_reason?: string;
  macroCount?: number;
}

interface ConstellationCanvasProps {
  data: { nodes: GraphNode[]; links: GraphLink[] };
  onNodeClick: (node: GraphNode) => void;
  filterSource?: string | null;
  theme?: 'light' | 'dark';
  focusedNodeId?: string | null;
  expandedClusterId?: string | null;
  onToggleExpandCluster?: (hubId: string | null) => void;
  onOpenOverflow?: (hubId: string, items: GraphNode[]) => void;
}

// Low-saturation editorial neutral styling tokens
const SOURCE_TAGS: Record<string, { badge: string; bg: string; text: string }> = {
  document: { badge: '.MD', bg: '#EAE5DC', text: '#2B2B2B' },
  whatsapp: { badge: 'WA', bg: '#E1EBE2', text: '#1E4028' },
  gdrive: { badge: 'DOC', bg: '#E2E8F0', text: '#1E293B' },
  instagram: { badge: 'REEL', bg: '#F5E6E8', text: '#4C1D24' },
  web: { badge: 'WEB', bg: '#E0E7FF', text: '#312E81' },
  text: { badge: 'NOTE', bg: '#EAE5DC', text: '#2B2B2B' },
  code: { badge: 'CODE', bg: '#E4DDD2', text: '#2B2B2B' },
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

function truncateText(text: string, maxLen: number = 24): string {
  if (!text) return '';
  const cleaned = text.replace(/^(WhatsApp:\s*|Doc:\s*|Web:\s*|Instagram:\s*)/i, '').trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 1)}…` : cleaned;
}

export default function ConstellationCanvas({
  data,
  onNodeClick,
  filterSource,
  theme = 'light',
  focusedNodeId,
  expandedClusterId,
  onToggleExpandCluster,
  onOpenOverflow,
}: ConstellationCanvasProps) {
  const fgRef = useRef<any>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [hoverLink, setHoverLink] = useState<GraphLink | null>(null);
  const hasCenteredInitialRef = useRef(false);

  const isLight = theme === 'light';

  // 1. Group nodes by cluster and deterministic golden spiral anchors
  const layoutGraph = useMemo(() => {
    const rawNodes = data.nodes || [];
    const rawLinks = data.links || [];

    // Filter by provenance if active (Hubs always remain visible)
    const filteredNodes = rawNodes.filter(n => {
      if (n.type === 'hub') return true;
      if (!filterSource) return true;
      return n.source === filterSource;
    });

    const hubs = filteredNodes.filter(n => n.type === 'hub');
    const items = filteredNodes.filter(n => n.type !== 'hub');

    // Group items by cluster name
    const clusterMap = new Map<string, GraphNode[]>();
    items.forEach(it => {
      const cName = it.cluster_name || 'General';
      if (!clusterMap.has(cName)) clusterMap.set(cName, []);
      clusterMap.get(cName)!.push(it);
    });

    const computedNodes: GraphNode[] = [];
    const computedLinks: GraphLink[] = [];
    const hubAnchorMap = new Map<string, Point>();

    // Position each Hub deterministically with Fermat phyllotaxis spiral
    hubs.forEach((hub, slotIdx) => {
      const anchor = getClusterAnchor(slotIdx);
      hubAnchorMap.set(hub.id, anchor);
      if (hub.cluster_name) hubAnchorMap.set(hub.cluster_name, anchor);

      const clusterItems = clusterMap.get(hub.label) || clusterMap.get(hub.cluster_name || '') || [];
      const isExpanded = expandedClusterId === hub.id || hubs.length === 1;

      computedNodes.push({
        ...hub,
        x: anchor.x,
        y: anchor.y,
        fx: anchor.x,
        fy: anchor.y,
        val: clusterItems.length,
      });

      // If cluster is expanded: display satellite items on the uniform R=200 ring
      if (isExpanded) {
        const { visibleItems, overflowCount, overflowItems, hasOverflow } = getClusterDisplaySlots(clusterItems);

        visibleItems.forEach(({ item, slotIndex }) => {
          const slotPos = getSatelliteSlot(slotIndex, anchor);
          computedNodes.push({
            ...item,
            x: slotPos.x,
            y: slotPos.y,
            fx: slotPos.x,
            fy: slotPos.y,
            slotIndex,
          });

          // Spoke link from hub to satellite card
          computedLinks.push({
            id: `spoke_${hub.id}_${item.id}`,
            source: hub.id,
            target: item.id,
            type: 'hub_spoke',
          });
        });

        // Overflow card in Slot 7 if N > 8
        if (hasOverflow) {
          const slot7Pos = getSatelliteSlot(7, anchor);
          const overflowId = `overflow_${hub.id}`;
          computedNodes.push({
            id: overflowId,
            label: `+${overflowCount} more notes`,
            type: 'overflow',
            cluster_name: hub.cluster_name,
            x: slot7Pos.x,
            y: slot7Pos.y,
            fx: slot7Pos.x,
            fy: slot7Pos.y,
            slotIndex: 7,
            overflowCount,
            overflowItems,
          });

          computedLinks.push({
            id: `spoke_${hub.id}_${overflowId}`,
            source: hub.id,
            target: overflowId,
            type: 'hub_spoke',
          });
        }
      }
    });

    // Handle cross-item links
    const visibleNodeIds = new Set(computedNodes.map(n => n.id));
    rawLinks.forEach(link => {
      const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;

      if (link.type === 'item_link') {
        if (visibleNodeIds.has(sId) && visibleNodeIds.has(tId)) {
          computedLinks.push(link);
        } else {
          // If nodes are collapsed in macro mode, aggregate into inter-hub bridge
          const sNode = rawNodes.find(n => n.id === sId);
          const tNode = rawNodes.find(n => n.id === tId);
          if (sNode && tNode && sNode.cluster_name && tNode.cluster_name && sNode.cluster_name !== tNode.cluster_name) {
            const sHub = hubs.find(h => h.cluster_name === sNode.cluster_name || h.label === sNode.cluster_name);
            const tHub = hubs.find(h => h.cluster_name === tNode.cluster_name || h.label === tNode.cluster_name);
            if (sHub && tHub && sHub.id !== tHub.id) {
              const bridgeKey = sHub.id < tHub.id ? `${sHub.id}->${tHub.id}` : `${tHub.id}->${sHub.id}`;
              const existing = computedLinks.find(l => (l as any)._bridgeKey === bridgeKey);
              if (existing) {
                existing.macroCount = (existing.macroCount || 1) + 1;
              } else {
                computedLinks.push({
                  id: `bridge_${bridgeKey}`,
                  source: sHub.id < tHub.id ? sHub.id : tHub.id,
                  target: sHub.id < tHub.id ? tHub.id : sHub.id,
                  type: 'macro_bridge',
                  macroCount: 1,
                  match_reason: `Cross-cluster semantic bridges between ${sHub.label} and ${tHub.label}`,
                  ...({ _bridgeKey: bridgeKey } as any),
                });
              }
            }
          }
        }
      }
    });

    return { nodes: computedNodes, links: computedLinks };
  }, [data, filterSource, expandedClusterId]);

  // Measure container dimensions using ResizeObserver with sub-pixel rounding
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    measure();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Programmatic camera focus when dimensions, focusedNodeId, or expandedClusterId change
  useEffect(() => {
    if (!fgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const timer = setTimeout(() => {
      if (!fgRef.current) return;
      const targetId = focusedNodeId || expandedClusterId;
      if (targetId) {
        const target = layoutGraph.nodes.find(n => n.id === targetId);
        if (target && typeof target.x === 'number' && typeof target.y === 'number') {
          fgRef.current.centerAt(target.x, target.y, hasCenteredInitialRef.current ? 500 : 0);
          fgRef.current.zoom(0.85, hasCenteredInitialRef.current ? 500 : 0);
          hasCenteredInitialRef.current = true;
          return;
        }
      }
      // If no target focused, center exactly at geometric origin (0, 0)
      fgRef.current.centerAt(0, 0, hasCenteredInitialRef.current ? 400 : 0);
      fgRef.current.zoom(0.78, hasCenteredInitialRef.current ? 400 : 0);
      hasCenteredInitialRef.current = true;
    }, 40);

    return () => clearTimeout(timer);
  }, [dimensions.width, dimensions.height, focusedNodeId, expandedClusterId, layoutGraph.nodes]);

  const handleFitAll = useCallback(() => {
    if (!fgRef.current) return;
    if (onToggleExpandCluster && expandedClusterId) {
      onToggleExpandCluster(null);
    }
    fgRef.current.zoomToFit(500, 40);
  }, [onToggleExpandCluster, expandedClusterId]);

  const handleRecenter = useCallback(() => {
    if (!fgRef.current) return;
    if (onToggleExpandCluster && expandedClusterId) {
      onToggleExpandCluster(null);
    }
    fgRef.current.centerAt(0, 0, 400);
    fgRef.current.zoom(0.78, 400);
  }, [onToggleExpandCluster, expandedClusterId]);

  const handleZoomIn = useCallback(() => {
    if (!fgRef.current) return;
    const currentZoom = fgRef.current.zoom() || 0.78;
    const nextZoom = Math.min(Number((currentZoom * 1.35).toFixed(3)), 3.0);
    fgRef.current.zoom(nextZoom, 200);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!fgRef.current) return;
    const currentZoom = fgRef.current.zoom() || 0.78;
    const nextZoom = Math.max(Number((currentZoom * 0.75).toFixed(3)), 0.08);
    fgRef.current.zoom(nextZoom, 200);
  }, []);

  // Handle clicking on nodes (Hub toggle, Satellite card inspect, Overflow open)
  const handleInternalNodeClick = useCallback((node: any) => {
    if (node.type === 'hub') {
      if (onToggleExpandCluster) {
        const next = expandedClusterId === node.id ? null : node.id;
        onToggleExpandCluster(next);
      }
      onNodeClick(node as GraphNode);
      if (fgRef.current && typeof node.x === 'number' && typeof node.y === 'number') {
        fgRef.current.centerAt(node.x, node.y, 500);
        fgRef.current.zoom(0.85, 500);
      }
      return;
    }

    if (node.type === 'overflow') {
      if (onOpenOverflow && node.cluster_name) {
        onOpenOverflow(node.cluster_name, node.overflowItems || []);
      }
      return;
    }

    // Standard Satellite item card click
    onNodeClick(node as GraphNode);
  }, [onNodeClick, onToggleExpandCluster, expandedClusterId, onOpenOverflow]);

  // Background visual boundary: Origin crosshairs and orbital radar rings
  const renderBackgroundArea = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();

    // Origin crosshair
    ctx.strokeStyle = isLight ? 'rgba(216, 209, 197, 0.45)' : 'rgba(70, 68, 64, 0.5)';
    ctx.lineWidth = 1 / globalScale;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.stroke();

    // 40% Bounded Vitrine focal circle (Radius 280)
    ctx.beginPath();
    ctx.arc(0, 0, 280, 0, 2 * Math.PI);
    ctx.setLineDash([4 / globalScale, 6 / globalScale]);
    ctx.strokeStyle = isLight ? 'rgba(216, 209, 197, 0.55)' : 'rgba(65, 63, 59, 0.55)';
    ctx.stroke();

    // Outer perimeter circle (Radius 450)
    ctx.beginPath();
    ctx.arc(0, 0, 450, 0, 2 * Math.PI);
    ctx.setLineDash([6 / globalScale, 8 / globalScale]);
    ctx.strokeStyle = isLight ? 'rgba(47, 74, 58, 0.2)' : 'rgba(176, 141, 87, 0.22)';
    ctx.lineWidth = 1.2 / globalScale;
    ctx.stroke();

    ctx.restore();
  }, [isLight]);

  // Custom node rendering: Adaptive typography across all zoom levels
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHovered = hoverNode && hoverNode.id === node.id;
    ctx.save();

    // =========================================================================
    // CASE A: CLUSTER HUB MASTER ORB
    // =========================================================================
    if (node.type === 'hub') {
      const isExpanded = expandedClusterId === node.id;
      // Adapt hub sphere radius so it stays prominent across both macro and close-up views
      const radius = globalScale < 0.45
        ? Math.min(46, HUB_RADIUS / Math.pow(globalScale, 0.45))
        : HUB_RADIUS;

      // 1. Radar Perimeter Circle (clears satellite cards at R=200px)
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, HUB_RADAR_RADIUS, 0, 2 * Math.PI);
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = isLight ? 'rgba(47, 74, 58, 0.22)' : 'rgba(176, 141, 87, 0.28)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();

      // 2. Hub Sphere
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isLight ? (isExpanded ? '#243B2E' : '#2F4A3A') : (isExpanded ? '#C49E63' : '#B08D57');
      ctx.fill();
      ctx.strokeStyle = isLight ? '#FFFFFF' : '#1C1C1C';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // 3. Central Inner Dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 0.35, 0, 2 * Math.PI);
      ctx.fillStyle = isLight ? '#FAF7F2' : '#1C1C1C';
      ctx.fill();

      // 4. Adaptive Cluster Label Pill: Scales font so cluster names stay crisp and readable at all zoom scales
      const screenTargetFont = globalScale < 0.35 ? 13 : (globalScale < 0.7 ? 12 : 11);
      const fontSize = Math.max(11, screenTargetFont / Math.pow(globalScale, 0.72));
      ctx.font = `600 ${fontSize}px Georgia, Newsreader, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const labelText = node.label || 'Cluster';
      const textWidth = ctx.measureText(labelText).width;
      const pillHeight = fontSize * 1.65;
      const pillPaddingX = fontSize * 0.75;
      const pillWidth = Math.max(textWidth + pillPaddingX * 2, 74);
      const pillY = node.y + radius + fontSize * 0.45;

      ctx.fillStyle = isLight ? '#FAF7F2' : '#242321';
      drawRoundedRect(ctx, node.x - pillWidth / 2, pillY, pillWidth, pillHeight, Math.max(4, fontSize * 0.28));
      ctx.fill();
      ctx.strokeStyle = isExpanded ? (isLight ? '#2F4A3A' : '#B08D57') : (isLight ? '#DDD5C8' : '#3A3834');
      ctx.lineWidth = isExpanded ? 1.8 : 1.0;
      ctx.stroke();

      ctx.fillStyle = isLight ? '#2B2B2B' : '#EDE8DF';
      ctx.fillText(labelText, node.x, pillY + pillHeight / 2);

      // Micro status badge below pill (shown when zoomed in enough)
      if (globalScale >= 0.22) {
        const subFontSize = Math.max(8, 8.5 / Math.pow(globalScale, 0.65));
        ctx.font = `500 ${subFontSize}px JetBrains Mono, monospace`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = isLight ? '#6B655C' : '#9E9990';
        const statusText = isExpanded ? 'EXPANDED · ESC TO CLOSE' : `${node.val || 0} NOTES · CLICK`;
        ctx.fillText(statusText, node.x, pillY + pillHeight + 3);
      }

      ctx.restore();
      return;
    }

    // =========================================================================
    // CASE B: OVERFLOW CARD (+N MORE NOTES)
    // =========================================================================
    if (node.type === 'overflow') {
      const halfW = CARD_WIDTH / 2;
      const halfH = CARD_HEIGHT / 2;
      const x = node.x - halfW;
      const y = node.y - halfH;

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.fillStyle = isLight ? '#F4EFE7' : '#232220';
      drawRoundedRect(ctx, x, y, CARD_WIDTH, CARD_HEIGHT, 8);
      ctx.fill();

      ctx.strokeStyle = isHovered ? (isLight ? '#2F4A3A' : '#B08D57') : (isLight ? '#B8AEA0' : '#4C4842');
      ctx.lineWidth = isHovered ? 1.8 : 1.2;
      ctx.stroke();

      ctx.font = `600 11px Plus Jakarta Sans, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLight ? '#2F4A3A' : '#D6B27C';
      ctx.fillText(`📂 ${node.label}`, node.x, node.y - 4);

      ctx.font = `500 8.5px JetBrains Mono, monospace`;
      ctx.fillStyle = isLight ? '#6B655C' : '#9E9990';
      ctx.fillText(`Click to view all`, node.x, node.y + 11);

      ctx.restore();
      return;
    }

    // =========================================================================
    // CASE C: SATELLITE CARD RECTANGLE (140px x 44px, WCAG Compliant)
    // =========================================================================
    const halfW = CARD_WIDTH / 2;
    const halfH = CARD_HEIGHT / 2;
    const x = node.x - halfW;
    const y = node.y - halfH;

    // Card background
    ctx.fillStyle = isLight ? '#FFFFFF' : '#242321';
    drawRoundedRect(ctx, x, y, CARD_WIDTH, CARD_HEIGHT, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = isHovered
      ? (isLight ? '#2F4A3A' : '#B08D57')
      : (isLight ? '#E4DDD2' : '#383632');
    ctx.lineWidth = isHovered ? 2.0 : 1.0;
    ctx.stroke();

    // Top Row: Source provenance badge + bookmark
    const tagInfo = SOURCE_TAGS[node.source || 'document'] || SOURCE_TAGS.document;
    const badgeW = 28;
    const badgeH = 13;
    const badgeX = x + 8;
    const badgeY = y + 6;

    ctx.fillStyle = isLight ? tagInfo.bg : '#2F2D2A';
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 3);
    ctx.fill();

    ctx.font = `600 8px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isLight ? tagInfo.text : '#C4BEB3';
    ctx.fillText(tagInfo.badge, badgeX + badgeW / 2, badgeY + badgeH / 2);

    // Optional bookmark icon
    if (node.bookmarked) {
      ctx.font = `10px sans-serif`;
      ctx.fillStyle = isLight ? '#B08D57' : '#D6B27C';
      ctx.textAlign = 'right';
      ctx.fillText('★', x + CARD_WIDTH - 8, badgeY + badgeH / 2);
    }

    // Dynamic Title Adjustment: expands detail at close zoom, stays legible at normal zoom
    const maxChars = globalScale >= 1.3 ? 28 : (globalScale >= 0.85 ? 22 : 18);
    const titleFontSize = globalScale < 0.6 ? 11 : 10;
    ctx.font = `500 ${titleFontSize}px Plus Jakarta Sans, system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isLight ? '#2B2B2B' : '#EDE8DF';

    const cleanTitle = truncateText(node.label || 'Note', maxChars);
    ctx.fillText(cleanTitle, x + 8, y + 29);

    ctx.restore();
  }, [hoverNode, isLight, expandedClusterId]);

  // Clickable interactive hit box (WCAG 44px minimum touch target)
  const drawPointerArea = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = color;
    if (node.type === 'hub') {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 44, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Full 140x44 rectangle
      ctx.fillRect(node.x - CARD_WIDTH / 2, node.y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden select-none ${isLight ? 'bg-[#FAF7F2]' : 'bg-[#181817]'}`}
    >
      {dimensions.width > 0 && dimensions.height > 0 ? (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={layoutGraph}
          backgroundColor={isLight ? '#FAF7F2' : '#181817'}
          onRenderFramePre={renderBackgroundArea}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={drawPointerArea}
          // Deterministic static positions: ZERO force physics drift!
          cooldownTicks={0}
          enableNodeDrag={false}
          enableZoomInteraction={true}
          minZoom={0.05}
          maxZoom={3.0}
        // Clean links styling
        linkColor={(link: any) => {
          if (link.type === 'macro_bridge') {
            return isLight ? 'rgba(47, 74, 58, 0.45)' : 'rgba(176, 141, 87, 0.5)';
          }
          if (link.type === 'item_link') {
            return isLight ? '#2F4A3A' : '#D6B27C';
          }
          return isLight ? 'rgba(216, 209, 197, 0.65)' : 'rgba(60, 58, 54, 0.65)';
        }}
        linkWidth={(link: any) => {
          if (link.type === 'macro_bridge') return 3.0;
          if (link.type === 'item_link') return 1.8;
          return 0.8;
        }}
        // Particle streams only on active hover or cross-cluster links
        linkDirectionalParticles={(link: any) => {
          if (link.type === 'item_link') return 2;
          if (link.type === 'macro_bridge') return 1;
          return 0;
        }}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={(link: any) => {
          return isLight ? '#2F4A3A' : '#D6B27C';
        }}
        onNodeHover={(node: any) => setHoverNode(node ? (node as GraphNode) : null)}
        onLinkHover={(link: any) => setHoverLink(link ? (link as GraphLink) : null)}
        onNodeClick={handleInternalNodeClick}
      />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-xs font-mono opacity-60">
          <div className="w-6 h-6 border-2 border-[#2F4A3A] dark:border-[#B08D57] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Floating Link Tooltip Badge (Explains match_reason) */}
      {hoverLink && hoverLink.match_reason && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full border text-[11px] font-mono shadow-md backdrop-blur-md flex items-center gap-2 pointer-events-none transition-all ${
          isLight ? 'bg-[#FAF7F2]/95 border-[#2F4A3A]/30 text-[#2B2B2B]' : 'bg-[#242422]/95 border-[#B08D57]/40 text-[#EDE8DF]'
        }`}>
          <span className="text-[#2F4A3A] dark:text-[#B08D57]">⚡</span>
          <span>{hoverLink.match_reason}</span>
          {hoverLink.similarity_score && (
            <span className="px-1.5 py-0.2 bg-[#EAE5DC] dark:bg-[#33312E] rounded text-[10px] font-semibold">
              {Math.round(hoverLink.similarity_score * 100)}% Match
            </span>
          )}
        </div>
      )}

      {/* Floating Canvas Navigation Dock */}
      <div
        role="toolbar"
        aria-label="Constellation navigation controls"
        className="absolute bottom-3 right-3 z-20 flex items-center gap-1 p-1 rounded-xl border border-[#DDD5C7] dark:border-[#383632] bg-[#FAF7F2]/95 dark:bg-[#20201F]/95 backdrop-blur-md shadow-md text-xs font-mono select-none"
      >
        <button
          type="button"
          onClick={handleFitAll}
          aria-label="View overall constellation branches"
          className="h-8 px-2.5 rounded-lg hover:bg-[#EDE7DE] dark:hover:bg-[#282725] active:scale-95 text-[#2F4A3A] dark:text-[#B08D57] font-semibold transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4A3A] dark:focus-visible:ring-[#B08D57]"
          title="Fit All: View Overall Constellation Branches"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-[11px] font-sans">All</span>
        </button>

        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Focus on central deck"
          className="h-8 px-2.5 rounded-lg hover:bg-[#EDE7DE] dark:hover:bg-[#282725] active:scale-95 text-[#2B2B2B] dark:text-[#EDE8DF] transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4A3A] dark:focus-visible:ring-[#B08D57]"
          title="Focus Central Deck"
        >
          <Compass className="w-3.5 h-3.5 text-[#2F4A3A] dark:text-[#B08D57]" />
          <span className="text-[11px] font-medium font-sans">Deck</span>
        </button>

        <div className="w-[1px] h-4 bg-[#DDD5C7] dark:bg-[#383632] mx-0.5" />

        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="w-8 h-8 rounded-lg hover:bg-[#EDE7DE] dark:hover:bg-[#282725] active:scale-95 text-[#2B2B2B] dark:text-[#EDE8DF] transition-all cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4A3A] dark:focus-visible:ring-[#B08D57]"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="w-8 h-8 rounded-lg hover:bg-[#EDE7DE] dark:hover:bg-[#282725] active:scale-95 text-[#2B2B2B] dark:text-[#EDE8DF] transition-all cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4A3A] dark:focus-visible:ring-[#B08D57]"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
