// src/app/api/graph/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Rich starter graph featuring Markdown documents, knowledge clusters, and source notes
const SEED_GRAPH = {
  nodes: [
    // Main Hubs ("in one main md / master cluster")
    { 
      id: 'hub_ai', 
      label: 'Graphify & AI Architecture', 
      type: 'hub', 
      bookmarked: true, 
      val: 22,
      summary: 'Central knowledge architecture uniting localized AST graph parsing and Gemini 1.5 Flash synthesis.'
    },
    { 
      id: 'hub_backend', 
      label: 'Backend & Microservices', 
      type: 'hub', 
      bookmarked: true, 
      val: 20,
      summary: 'PostgreSQL pgvector storage layer, Docker networking rules, and Redis caching infrastructure.'
    },
    { 
      id: 'hub_cooking', 
      label: 'Italian Culinary Techniques', 
      type: 'hub', 
      bookmarked: false, 
      val: 18,
      summary: 'Traditional Roman pasta emulsification secrets and ingredient selection.'
    },

    // Rounded Markdown Files ("rounded md files in one main md")
    { 
      id: 'doc_readme', 
      label: 'README.md', 
      type: 'document', 
      source: 'document', 
      val: 12,
      summary: 'OmniBrain core architecture spec, Graphify memory plane integration, and multi-source routing directives.',
      raw_content: '# OmniBrain Workspace\n\nOmniBrain is an integrated workspace configured with a unified Graphify knowledge graph memory plane for Antigravity IDE and Antigravity 2.0 Agent Manager.\n\n### Core Directives:\n- Universal Omnibox Dock with Regex routing\n- Constellation 2D Force Graph with illuminated links\n- Multi-source provenance synthesis engine'
    },
    { 
      id: 'doc_agents', 
      label: 'AGENTS.md', 
      type: 'document', 
      source: 'document', 
      val: 11,
      summary: 'Antigravity agent behavioral directives, Next.js 16 Turbopack conventions, and graphify knowledge graph rules.',
      raw_content: '# AGENTS.md\n\nAgent Guidelines:\n- Always check graphify knowledge graph at graphify-out/ before answering architecture questions.\n- Use Turbopack with Next.js 16 conventions.\n- Isolate dynamic canvas components with ssr: false.'
    },
    { 
      id: 'doc_arch', 
      label: 'Architecture_Spec.md', 
      type: 'document', 
      source: 'document', 
      val: 11,
      summary: 'HNSW vector indexes in PostgreSQL via pgvector extension, cosine distance metrics, and partition layouts.',
      raw_content: '# Architecture Spec\n\nCREATE EXTENSION IF NOT EXISTS vector;\nCREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);\n\nStrict Network Isolation:\nRedis port 6379 must bind strictly to 127.0.0.1 in docker-compose.'
    },

    // Source Item Nodes
    { 
      id: 'item_docker', 
      label: 'WhatsApp: Docker Port 6379', 
      type: 'item', 
      source: 'whatsapp', 
      val: 9,
      summary: 'Bind Redis port 6379 strictly to 127.0.0.1 in Docker Compose to prevent unauthorized external access.',
      raw_content: 'WhatsApp Dev Chat #41:\nHey team, make sure we bind Redis port 6379 to 127.0.0.1:6379 in our docker-compose.yml so we don\'t expose the cache server publicly.'
    },
    { 
      id: 'item_graphify', 
      label: 'Web: Graphify Codebase', 
      type: 'item', 
      source: 'web', 
      val: 9,
      summary: 'Structural knowledge graph parsing engine for AI agent workspaces and persistent memory planes.',
      raw_content: 'Graphify Repository:\nhttps://github.com/graphify/graphifyy\nPersistent knowledge graph memory plane for Antigravity IDE and Agent Manager.',
      source_url: 'https://github.com/graphify/graphifyy'
    },
    { 
      id: 'item_carbonara', 
      label: 'Instagram: Pasta Reel', 
      type: 'item', 
      source: 'instagram', 
      val: 9,
      summary: 'Emulsify carbonara sauce off-heat at ~65°C with starchy pasta water and Pecorino Romano.',
      raw_content: 'Instagram Reel Caption:\nTraditional Roman Carbonara with guanciale, egg yolks, and Pecorino Romano. No cream allowed!',
      source_url: 'https://instagram.com/reel/C8_pasta_carbonara'
    },
  ],
  links: [
    // Primary Spoke Links to Hubs
    { source: 'doc_readme', target: 'hub_ai' },
    { source: 'doc_agents', target: 'hub_ai' },
    { source: 'item_graphify', target: 'hub_ai' },
    { source: 'doc_arch', target: 'hub_backend' },
    { source: 'item_docker', target: 'hub_backend' },
    { source: 'item_carbonara', target: 'hub_cooking' },

    // Inter-Hub Cosmic Bridges (Graphify Data Web structure)
    { source: 'hub_ai', target: 'hub_backend' },

    // Cross-Source Semantic Spiderweb Filaments
    { source: 'doc_readme', target: 'doc_agents' },
    { source: 'doc_readme', target: 'item_graphify' },
    { source: 'doc_arch', target: 'item_docker' },
    { source: 'doc_arch', target: 'doc_readme' },
  ],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    // If explicit clean user mode requested, return fresh user graph
    if (mode === 'clean') {
      return NextResponse.json({ nodes: [], links: [] });
    }

    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If no logged in user and not clean mode, return rich starter demo graph for guests
    if (!user) {
      return NextResponse.json(SEED_GRAPH);
    }

    const { data: items } = await supabase
      .from('items')
      .select('id, title, source_type, cluster_name, is_bookmarked, summary, raw_content, source_url')
      .eq('user_id', user.id);

    // If user has 0 saved items, start with a clean slate
    if (!items || items.length === 0) {
      return NextResponse.json({ nodes: [], links: [] });
    }

    // Live graph strictly constructed from user's saved items
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

      const isDoc = item.source_type === 'document' || item.title?.toLowerCase().endsWith('.md');

      nodesMap.set(item.id, {
        id: item.id,
        label: item.title,
        type: isDoc ? 'document' : 'item',
        source: isDoc ? 'document' : item.source_type,
        summary: item.summary,
        raw_content: item.raw_content,
        source_url: item.source_url,
        val: 9,
      });

      links.push({ source: item.id, target: hubId });
    });

    return NextResponse.json({
      nodes: Array.from(nodesMap.values()),
      links,
    });
  } catch (error) {
    return NextResponse.json(SEED_GRAPH);
  }
}
