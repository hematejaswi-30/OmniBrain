// src/app/api/graph/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Starter clusters so the canvas is never empty on a fresh install
const SEED_GRAPH = {
  nodes: [
    { id: 'hub_backend', label: 'Backend & Systems', type: 'hub', bookmarked: true, val: 18 },
    { id: 'hub_cooking', label: 'Italian Cooking', type: 'hub', bookmarked: true, val: 18 },
    { id: 'hub_ai', label: 'Graphify & AI', type: 'hub', bookmarked: false, val: 18 },

    { 
      id: 'item_docker', 
      label: 'WhatsApp: Docker Port 6379', 
      type: 'item', 
      source: 'whatsapp', 
      val: 8,
      summary: 'Bind Redis port 6379 strictly to 127.0.0.1 in Docker Compose to prevent unauthorized external access.',
      raw_content: 'WhatsApp Dev Chat #41:\nHey team, make sure we bind Redis port 6379 to 127.0.0.1:6379 in our docker-compose.yml so we don\'t expose the cache server publicly.'
    },
    { 
      id: 'item_pgvector', 
      label: 'Doc: pgvector Indexing', 
      type: 'item', 
      source: 'gdrive', 
      val: 8,
      summary: 'Architecture guide for configuring HNSW vector indexes in PostgreSQL via pgvector extension.',
      raw_content: 'Drive Document (Architecture_Spec.pdf):\nCreate HNSW vector index using cosine distance:\nCREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);'
    },
    { 
      id: 'item_carbonara', 
      label: 'Instagram: Pasta Reel', 
      type: 'item', 
      source: 'instagram', 
      val: 8,
      summary: 'Emulsify carbonara sauce off-heat at ~65°C with starchy pasta water and Pecorino Romano.',
      raw_content: 'Instagram Reel Caption:\nTraditional Roman Carbonara with guanciale, egg yolks, and Pecorino Romano. No cream allowed!',
      source_url: 'https://instagram.com/reel/C8_pasta_carbonara'
    },
    { 
      id: 'item_graphify', 
      label: 'Web: Graphify Codebase', 
      type: 'item', 
      source: 'web', 
      val: 8,
      summary: 'Structural knowledge graph parsing engine for AI agent workspaces and memory planes.',
      raw_content: 'Graphify Repository:\nhttps://github.com/graphify/graphifyy\nPersistent knowledge graph memory plane for Antigravity IDE and Agent Manager.',
      source_url: 'https://github.com/graphify/graphifyy'
    },
  ],
  links: [
    { source: 'item_docker', target: 'hub_backend' },
    { source: 'item_pgvector', target: 'hub_backend' },
    { source: 'item_carbonara', target: 'hub_cooking' },
    { source: 'item_graphify', target: 'hub_ai' },
  ],
};

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If no logged in user or empty database, return the starter graph
    if (!user) {
      return NextResponse.json(SEED_GRAPH);
    }

    const { data: items } = await supabase
      .from('items')
      .select('id, title, source_type, cluster_name, is_bookmarked, summary, raw_content, source_url')
      .eq('user_id', user.id);

    if (!items || items.length === 0) {
      return NextResponse.json(SEED_GRAPH);
    }

    // Construct live graph from user's database items
    const nodesMap = new Map();
    const links: { source: string; target: string }[] = [];

    items.forEach((item) => {
      const hubId = `hub_${item.cluster_name.toLowerCase().replace(/\s+/g, '_')}`;
      if (!nodesMap.has(hubId)) {
        nodesMap.set(hubId, {
          id: hubId,
          label: item.cluster_name,
          type: 'hub',
          val: 18,
          bookmarked: item.is_bookmarked,
        });
      }

      nodesMap.set(item.id, {
        id: item.id,
        label: item.title,
        type: 'item',
        source: item.source_type,
        summary: item.summary,
        raw_content: item.raw_content,
        source_url: item.source_url,
        val: 8,
      });

      links.push({ source: item.id, target: hubId });
    });

    return NextResponse.json({
      nodes: Array.from(nodesMap.values()),
      links,
    });
  } catch (error) {
    // Graceful fallback
    return NextResponse.json(SEED_GRAPH);
  }
}
